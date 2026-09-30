import { getPublicationById, loadPublications } from './publications.js';
import { publicationHash } from './publication-links.js';
import { showReadCompletion, closeReadCompletion } from './feedback.js';

const PDF_BASE = new URL('../pdf/', import.meta.url);
const MAX_ZOOM = 4;
let root;
let documentHandle;
let loadingTask;
let renderTask;
let pageNumber = 1;
let lastReadingPage = 1;
let routeGeneration = 0;
let renderGeneration = 0;
let previousHash = '';
let resizeTimer;
let qualityTimer;
let zoom = 1;
let pan = { x: 0, y: 0 };
let paperSize = { width: 0, height: 0 };
let activeGesture = false;
let renderedZoom = 1;
let currentBook = null;
let spread = false;
let binding = 'left';
let completed = false;
const readPages = new Set();
const pointers = new Map();

export function publicPdfUrl(path) {
  if (!/^\.\/pdf\/[a-zA-Z0-9_/-]+\.pdf$/i.test(path || '') || path.includes('..')) return '';
  const url = new URL(path, new URL('../', import.meta.url));
  return url.origin === location.origin && url.pathname.startsWith(PDF_BASE.pathname) ? url.href : '';
}

export function openPdfViewer(id) {
  previousHash = location.hash.startsWith('#pdf/') ? '' : location.hash;
  location.hash = publicationHash(id, 'library');
}

function build() {
  if (root) return;
  root = document.createElement('section');
  root.className = 'pdf-viewer';
  root.hidden = true;
  root.setAttribute('aria-label', '電子版閲覧');
  root.innerHTML = `
    <header class="pdf-viewer__header">
      <button class="pdf-viewer__back" type="button" aria-label="ライブラリーを閉じる"><span aria-hidden="true">✖</span></button>
      <div class="pdf-viewer__heading">
        <span class="pdf-viewer__eyebrow">電子版ライブラリー</span>
        <h2 class="pdf-viewer__title"></h2>
        <button type="button" class="pdf-viewer__layout" aria-pressed="false" disabled>見開きに切り替え</button>
        <button type="button" class="pdf-viewer__reader-actions" hidden>感想・シェア</button>
        <div class="pdf-viewer__mobile-meta"><span class="pdf-viewer__mobile-counter" aria-live="polite"></span><button class="pdf-viewer__mobile-reset" type="button">全体表示</button></div>
      </div>
      <div class="pdf-viewer__zoom-tools" role="group" aria-label="拡大縮小">
        <button class="pdf-viewer__zoom-out" type="button" aria-label="縮小">−</button>
        <output class="pdf-viewer__zoom-value" aria-live="polite">100%</output>
        <button class="pdf-viewer__zoom-in" type="button" aria-label="拡大">＋</button>
        <button class="pdf-viewer__reset" type="button">全体表示</button>
      </div>
    </header>
    <div class="pdf-viewer__stage">
      <div class="pdf-viewer__surface"><div class="pdf-viewer__paper"><canvas class="pdf-viewer__canvas" aria-label="PDFのページ"></canvas><canvas class="pdf-viewer__canvas" aria-label="PDFのページ" hidden></canvas></div></div>
      <div class="pdf-viewer__message" role="status" aria-live="polite"></div>
      <nav class="pdf-viewer__mobile-controls" aria-label="ページ送り"><button class="pdf-viewer__side-previous" type="button" aria-label="前のページ">←</button><button class="pdf-viewer__side-next" type="button" aria-label="次のページ">→</button></nav>
      <p class="pdf-viewer__hint"><span class="pdf-viewer__hint-desktop">拡大後はドラッグで移動</span><span class="pdf-viewer__hint-mobile">ピンチで拡大・縮小 ／ 2本指で移動</span></p>
    </div>
    <nav class="pdf-viewer__controls" aria-label="ページ送り"><button class="pdf-viewer__previous" type="button"><span aria-hidden="true">←</span> 前のページ</button><span class="pdf-viewer__counter" aria-live="polite"></span><button class="pdf-viewer__next" type="button">次のページ <span aria-hidden="true">→</span></button></nav>`;
  document.body.append(root);
  root.querySelector('.pdf-viewer__back').onclick = close;
  root.querySelectorAll('.pdf-viewer__previous, .pdf-viewer__side-previous').forEach(button => {
    button.onclick = () => void turnPage(-1);
  });
  root.querySelectorAll('.pdf-viewer__next, .pdf-viewer__side-next').forEach(button => {
    button.onclick = () => void turnPage(1);
  });
  root.querySelector('.pdf-viewer__reader-actions').onclick = () => {
    if (!documentHandle) return;
    if (pageNumber > documentHandle.numPages) openCompletion();
    else void showPage(documentHandle.numPages + 1);
  };
  root.querySelector('.pdf-viewer__layout').onclick = () => {
    if (!documentHandle || binding === 'none') return;
    spread = !spread;
    void showPage(pageNumber);
  };
  root.querySelector('.pdf-viewer__zoom-out').onclick = () => changeZoom(zoom / 1.25);
  root.querySelector('.pdf-viewer__zoom-in').onclick = () => changeZoom(zoom * 1.25);
  root.querySelectorAll('.pdf-viewer__reset, .pdf-viewer__mobile-reset').forEach(button => {
    button.onclick = resetView;
  });
  const surface = root.querySelector('.pdf-viewer__surface');
  initializeGestures(surface);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleResize).observe(surface);
}

function openCompletion() {
  showReadCompletion(currentBook, () => {
    if (documentHandle && location.hash.startsWith('#pdf/')) void showPage(lastReadingPage);
  });
}

function message(value) { root.querySelector('.pdf-viewer__message').textContent = value; }
function close() {
  const match = /^#pdf\/(publication-[0-9]{6})$/.exec(location.hash);
  location.hash = match ? publicationHash(match[1]) : previousHash || '';
}
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

function constrainPan() {
  if (!root) return;
  const surface = root.querySelector('.pdf-viewer__surface');
  const maxX = Math.max(0, (paperSize.width * zoom - surface.clientWidth) / 2);
  const maxY = Math.max(0, (paperSize.height * zoom - surface.clientHeight) / 2);
  pan.x = clamp(pan.x, -maxX, maxX);
  pan.y = clamp(pan.y, -maxY, maxY);
}

function applyTransform() {
  if (!root) return;
  constrainPan();
  root.querySelector('.pdf-viewer__paper').style.transform = `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  root.querySelector('.pdf-viewer__zoom-value').textContent = `${Math.round(zoom * 100)}%`;
  root.querySelector('.pdf-viewer__zoom-out').disabled = !documentHandle || !paperSize.width || zoom <= 1;
  root.querySelector('.pdf-viewer__zoom-in').disabled = !documentHandle || !paperSize.width || zoom >= MAX_ZOOM;
  root.querySelectorAll('.pdf-viewer__reset, .pdf-viewer__mobile-reset').forEach(button => { button.disabled = !documentHandle || !paperSize.width || zoom <= 1; });
  root.classList.toggle('is-zoomed', zoom > 1.001);
}

function changeZoom(value, anchor = { x: 0, y: 0 }) {
  if (!documentHandle || !paperSize.width) return;
  const next = clamp(value, 1, MAX_ZOOM);
  const ratio = next / zoom;
  pan = { x: anchor.x - (anchor.x - pan.x) * ratio, y: anchor.y - (anchor.y - pan.y) * ratio };
  zoom = next;
  applyTransform();
  scheduleQualityRender();
}

function resetView() {
  zoom = 1;
  pan = { x: 0, y: 0 };
  applyTransform();
  scheduleQualityRender();
}

function initializeGestures(surface) {
  let pinch = null;
  let singleStart = null;
  let usedTwoFingers = false;
  const midpoint = () => {
    const [a, b] = [...pointers.values()];
    const rect = surface.getBoundingClientRect();
    return { x: (a.x + b.x) / 2 - rect.left - rect.width / 2, y: (a.y + b.y) / 2 - rect.top - rect.height / 2, distance: Math.hypot(a.x - b.x, a.y - b.y) };
  };
  surface.addEventListener('pointerdown', event => {
    if (!documentHandle || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    surface.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    activeGesture = true;
    clearTimeout(qualityTimer);
    if (pointers.size === 1) {
      singleStart = { x: event.clientX, y: event.clientY, pan: { ...pan }, type: event.pointerType };
      usedTwoFingers = false;
    } else if (pointers.size === 2) {
      usedTwoFingers = true;
      pinch = { ...midpoint(), zoom, pan: { ...pan } };
    }
    root.classList.add('is-dragging');
  });
  surface.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2 && pinch) {
      const center = midpoint();
      zoom = clamp(pinch.zoom * center.distance / Math.max(pinch.distance, 1), 1, MAX_ZOOM);
      const ratio = zoom / pinch.zoom;
      pan = { x: center.x - (pinch.x - pinch.pan.x) * ratio, y: center.y - (pinch.y - pinch.pan.y) * ratio };
      applyTransform();
    } else if (singleStart && zoom > 1.001) {
      pan = { x: singleStart.pan.x + event.clientX - singleStart.x, y: singleStart.pan.y + event.clientY - singleStart.y };
      applyTransform();
    }
  });
  const finish = (event, cancelled = false) => {
    if (!pointers.has(event.pointerId)) return;
    const wasSingle = pointers.size === 1;
    pointers.delete(event.pointerId);
    if (!cancelled && wasSingle && singleStart?.type === 'touch' && !usedTwoFingers && zoom <= 1.001) {
      const dx = event.clientX - singleStart.x;
      const dy = event.clientY - singleStart.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) void turnPage((dx < 0 ? 1 : -1) * (binding === 'right' ? -1 : 1));
    }
    pinch = null;
    if (pointers.size === 1) {
      const point = [...pointers.values()][0];
      singleStart = { x: point.x, y: point.y, pan: { ...pan }, type: 'touch' };
    } else if (!pointers.size) {
      activeGesture = false;
      singleStart = null;
      usedTwoFingers = false;
      root.classList.remove('is-dragging');
      scheduleQualityRender();
    }
  };
  surface.addEventListener('pointerup', event => finish(event));
  surface.addEventListener('pointercancel', event => finish(event, true));
  surface.addEventListener('lostpointercapture', event => finish(event, true));
}

function displayedPageNumbers(number = pageNumber) {
  if (number > documentHandle.numPages) return [];
  if (!spread || number === 1) return [number];
  return number < documentHandle.numPages ? [number, number + 1] : [number];
}

function turnPage(direction) {
  if (!documentHandle) return;
  if (pageNumber > documentHandle.numPages) {
    if (direction > 0) return;
    const lastPage = spread && documentHandle.numPages > 1
      ? 2 + Math.floor((documentHandle.numPages - 2) / 2) * 2 : documentHandle.numPages;
    return showPage(lastPage);
  }
  if (direction > 0 && displayedPageNumbers().at(-1) >= documentHandle.numPages) {
    return showPage(documentHandle.numPages + 1);
  }
  const step = spread && pageNumber !== 1 ? 2 : 1;
  const next = direction > 0 ? pageNumber + step : spread && pageNumber === 2 ? 1 : pageNumber - step;
  return showPage(next);
}

function updatePageControls() {
  const pages = displayedPageNumbers();
  const ending = pageNumber > documentHandle.numPages;
  const text = ending ? `読了 / ${documentHandle.numPages}ページ` : `${pages.join('–')} / ${documentHandle.numPages}`;
  root.querySelectorAll('.pdf-viewer__counter, .pdf-viewer__mobile-counter').forEach(counter => { counter.textContent = text; });
  const right = binding === 'right';
  root.classList.toggle('is-right-bound', right);
  root.querySelectorAll('.pdf-viewer__previous, .pdf-viewer__side-previous').forEach(button => {
    button.disabled = pageNumber <= 1;
    button.textContent = button.classList.contains('pdf-viewer__previous') ? right ? '前のページ →' : '← 前のページ' : right ? '→' : '←';
  });
  root.querySelectorAll('.pdf-viewer__next, .pdf-viewer__side-next').forEach(button => {
    button.disabled = ending;
    button.textContent = button.classList.contains('pdf-viewer__next') ? right ? '← 次のページ' : '次のページ →' : right ? '←' : '→';
  });
  const toggle = root.querySelector('.pdf-viewer__layout');
  toggle.disabled = binding === 'none';
  toggle.textContent = binding === 'none' ? '見開き不可' : spread ? '単頁表示にする' : '見開き表示にする';
  toggle.setAttribute('aria-pressed', String(spread));
}

async function showPage(number) {
  if (!documentHandle || number < 1 || number > documentHandle.numPages + 1) return;
  const pdf = documentHandle;
  const enteringEnding = number === pdf.numPages + 1 && pageNumber !== number;
  clearTimeout(qualityTimer);
  pageNumber = number === pdf.numPages + 1 ? number : spread && number > 1 ? 2 + Math.floor((number - 2) / 2) * 2 : number;
  if (pageNumber <= pdf.numPages) lastReadingPage = pageNumber;
  zoom = 1;
  pan = { x: 0, y: 0 };
  updatePageControls();
  applyTransform();
  await renderPage(true);
  if (enteringEnding && pdf === documentHandle && pageNumber === pdf.numPages + 1 && !root.hidden && location.hash.startsWith('#pdf/')) {
    openCompletion();
  }
}

async function renderPage(showLoading = false) {
  if (!documentHandle || !root || root.hidden) return;
  const current = ++renderGeneration;
  const pdf = documentHandle;
  const oldTask = renderTask;
  oldTask?.cancel();
  const pageNumbers = displayedPageNumbers();
  if (showLoading) message('ページを読み込み中…');
  try {
    if (oldTask) await oldTask.promise.catch(() => {});
    if (!pageNumbers.length) {
      if (current !== renderGeneration || pdf !== documentHandle) return;
      renderTask = null;
      root.querySelectorAll('canvas').forEach(canvas => { canvas.hidden = true; });
      root.querySelector('.pdf-viewer__paper').hidden = true;
      paperSize = { width: 0, height: 0 };
      renderedZoom = zoom;
      completed = true;
      root.querySelector('.pdf-viewer__reader-actions').hidden = false;
      root.querySelector('.pdf-viewer__reader-actions').disabled = false;
      applyTransform();
      message('');
      return;
    }
    root.querySelector('.pdf-viewer__paper').hidden = false;
    const pages = await Promise.all(pageNumbers.map(number => pdf.getPage(number)));
    if (current !== renderGeneration || pdf !== documentHandle) return;
    const surface = root.querySelector('.pdf-viewer__surface');
    const initial = pages.map(page => page.getViewport({ scale: 1 }));
    const totalWidth = initial.reduce((sum, viewport) => sum + viewport.width, 0);
    const totalHeight = Math.max(...initial.map(viewport => viewport.height));
    const width = surface.clientWidth - 2;
    const height = surface.clientHeight - 2;
    if (width <= 0 || height <= 0) return;
    const fitScale = Math.min(width / totalWidth, height / totalHeight);
    paperSize = { width: totalWidth * fitScale, height: totalHeight * fitScale };
    const paper = root.querySelector('.pdf-viewer__paper');
    paper.style.width = `${paperSize.width}px`;
    paper.style.height = `${paperSize.height}px`;
    applyTransform();
    const renderingZoom = zoom;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5, Math.sqrt(16000000 / (paperSize.width * paperSize.height * renderingZoom ** 2)));
    const canvases = [...root.querySelectorAll('canvas')];
    canvases.forEach(canvas => { canvas.hidden = true; });
    const orderedPages = binding === 'right' && pages.length === 2 ? [...pages].reverse() : pages;
    const tasks = orderedPages.map((page, index) => {
      const viewport = page.getViewport({ scale: fitScale * renderingZoom });
      const canvas = canvases[index];
      canvas.width = Math.max(1, Math.floor(viewport.width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(viewport.height * pixelRatio));
      canvas.style.width = `${viewport.width / renderingZoom}px`;
      canvas.style.height = `${viewport.height / renderingZoom}px`;
      canvas.setAttribute('aria-label', `PDF ${page.pageNumber}ページ`);
      canvas.hidden = false;
      return page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport, transform: [pixelRatio, 0, 0, pixelRatio, 0, 0] });
    });
    renderTask = { cancel: () => tasks.forEach(task => task.cancel()), promise: Promise.allSettled(tasks.map(task => task.promise)).then(results => {
      const failed = results.find(result => result.status === 'rejected');
      if (failed) throw failed.reason;
    }) };
    await renderTask.promise;
    if (current === renderGeneration && pdf === documentHandle) {
      renderedZoom = renderingZoom;
      message('');
      pageNumbers.forEach(number => readPages.add(number));

    }
  } catch (error) {
    if (current === renderGeneration && error?.name !== 'RenderingCancelledException') message('ページを表示できませんでした。');
  }
}

function scheduleQualityRender() {
  clearTimeout(qualityTimer);
  if (documentHandle && !activeGesture && Math.abs(renderedZoom - zoom) > .01) {
    qualityTimer = setTimeout(() => void renderPage(), 160);
  }
}

async function route() {
  const feedbackMatch = /^#feedback\/(publication-[0-9]{6})$/.exec(location.hash);
  const libraryMatch = /^#pdf\/(publication-[0-9]{6})$/.exec(location.hash);
  if (feedbackMatch && currentBook?.id === feedbackMatch[1] && documentHandle) {
    ++routeGeneration;
    closeReadCompletion();
    root.inert = true;
    root.setAttribute('aria-hidden', 'true');
    return;
  }
  if (libraryMatch && currentBook?.id === libraryMatch[1] && documentHandle && root?.inert) {
    root.inert = false;
    root.removeAttribute('aria-hidden');
    if (pageNumber > documentHandle.numPages) await showPage(lastReadingPage);
    root.querySelector('.pdf-viewer__back').focus({ preventScroll: true });
    return;
  }
  closeReadCompletion();
  const current = ++routeGeneration;
  ++renderGeneration;
  clearTimeout(qualityTimer);
  clearTimeout(resizeTimer);
  renderTask?.cancel();
  renderTask = null;
  const oldLoadingTask = loadingTask;
  loadingTask = null;
  documentHandle = null;
  oldLoadingTask?.destroy().catch(() => {});
  pointers.clear();
  activeGesture = false;
  const match = /^#pdf\/(publication-[0-9]{6})$/.exec(location.hash);
  if (!match) {
    if (root) { root.hidden = true; root.inert = false; root.removeAttribute('aria-hidden'); }
    currentBook = null;
    document.body.classList.remove('is-pdf-viewer-open');
    return;
  }
  build();
  root.hidden = false;
  root.inert = false;
  root.removeAttribute('aria-hidden');
  root.querySelector('.pdf-viewer__back').focus({ preventScroll: true });
  root.classList.remove('is-dragging');
  document.body.classList.add('is-pdf-viewer-open');
  spread = false;
  lastReadingPage = 1;
  completed = false;
  readPages.clear();
  zoom = 1;
  pan = { x: 0, y: 0 };
  paperSize = { width: 0, height: 0 };
  renderedZoom = 1;
  root.querySelectorAll('canvas').forEach(canvas => { canvas.hidden = true; });
  root.querySelector('.pdf-viewer__reader-actions').hidden = true;
  root.querySelector('.pdf-viewer__title').textContent = '電子版を読み込み中';
  root.querySelectorAll('.pdf-viewer__counter, .pdf-viewer__mobile-counter').forEach(counter => { counter.textContent = ''; });
  root.querySelectorAll('button:not(.pdf-viewer__back)').forEach(button => { button.disabled = true; });
  applyTransform();
  message('電子版を読み込み中…');
  try {
    const [, pdfjs] = await Promise.all([loadPublications(), import('./pdf.min.mjs')]);
    if (current !== routeGeneration) return;
    const publication = getPublicationById(match[1]);
    const url = publication?.siteStatuses?.includes('電子版公開中') && publicPdfUrl(publication.pdfPath);
    if (!url) throw Error('この電子版は公開されていません。');
    currentBook = publication;
    binding = ['right', 'left', 'none'].includes(publication.pdfBinding) ? publication.pdfBinding : 'left';
    root.querySelector('.pdf-viewer__title').textContent = publication.title;
    if (current !== routeGeneration) return;
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('./pdf.worker.min.mjs', import.meta.url).href;
    const task = pdfjs.getDocument({ url, useSystemFonts: true, useWasm: false, useWorkerFetch: true, wasmUrl: new URL('./', import.meta.url).href });
    loadingTask = task;
    const pdf = await task.promise;
    if (current !== routeGeneration) return;
    documentHandle = pdf;
    root.querySelector('canvas').hidden = false;
    await showPage(1);
  } catch (error) {
    if (current === routeGeneration) message(error?.name === 'MissingPDFException' ? 'PDFファイルが見つかりません。' : error.message || 'PDFを表示できませんでした。');
  }
}

document.addEventListener('keydown', event => {
  if (!root || root.hidden || root.inert || !location.hash.startsWith('#pdf/') || document.querySelector('.reader-completion[open]') || event.target.closest('input, textarea, select')) return;
  if (event.key === 'Escape') { event.preventDefault(); close(); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); void turnPage(binding === 'right' ? 1 : -1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); void turnPage(binding === 'right' ? -1 : 1); }
  if (event.key === '+' || event.key === '=') { event.preventDefault(); changeZoom(zoom * 1.25); }
  if (event.key === '-') { event.preventDefault(); changeZoom(zoom / 1.25); }
  if (event.key === '0') { event.preventDefault(); resetView(); }
});
function scheduleResize() {
  clearTimeout(resizeTimer);
  if (root && !root.hidden && documentHandle) resizeTimer = setTimeout(() => void renderPage(), 160);
}
window.addEventListener('resize', scheduleResize);
window.addEventListener('hashchange', route);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route);
else void route();
