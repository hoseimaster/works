import { getPublicationById, loadPublications } from './publications.js';
import { publicationHash } from './publication-links.js';

const PDF_BASE = new URL('../pdf/', import.meta.url);
const MAX_ZOOM = 4;
let root;
let documentHandle;
let loadingTask;
let renderTask;
let pageNumber = 1;
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
      <button class="pdf-viewer__back" type="button" aria-label="制作物一覧へ戻る"><span aria-hidden="true">←</span><span>戻る</span></button>
      <div class="pdf-viewer__heading">
        <span class="pdf-viewer__eyebrow">電子版ライブラリー</span>
        <h2 class="pdf-viewer__title"></h2>
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
      <div class="pdf-viewer__surface"><div class="pdf-viewer__paper"><canvas class="pdf-viewer__canvas" aria-label="PDFのページ"></canvas></div></div>
      <div class="pdf-viewer__message" role="status" aria-live="polite"></div>
      <nav class="pdf-viewer__mobile-controls" aria-label="ページ送り"><button class="pdf-viewer__side-previous" type="button" aria-label="前のページ">←</button><button class="pdf-viewer__side-next" type="button" aria-label="次のページ">→</button></nav>
      <p class="pdf-viewer__hint"><span class="pdf-viewer__hint-desktop">拡大後はドラッグで移動</span><span class="pdf-viewer__hint-mobile">ピンチで拡大・縮小 ／ 2本指で移動</span></p>
    </div>
    <nav class="pdf-viewer__controls" aria-label="ページ送り"><button class="pdf-viewer__previous" type="button"><span aria-hidden="true">←</span> 前のページ</button><span class="pdf-viewer__counter" aria-live="polite"></span><button class="pdf-viewer__next" type="button">次のページ <span aria-hidden="true">→</span></button></nav>`;
  document.body.append(root);
  root.querySelector('.pdf-viewer__back').onclick = close;
  root.querySelectorAll('.pdf-viewer__previous, .pdf-viewer__side-previous').forEach(button => {
    button.onclick = () => void showPage(pageNumber - 1);
  });
  root.querySelectorAll('.pdf-viewer__next, .pdf-viewer__side-next').forEach(button => {
    button.onclick = () => void showPage(pageNumber + 1);
  });
  root.querySelector('.pdf-viewer__zoom-out').onclick = () => changeZoom(zoom / 1.25);
  root.querySelector('.pdf-viewer__zoom-in').onclick = () => changeZoom(zoom * 1.25);
  root.querySelectorAll('.pdf-viewer__reset, .pdf-viewer__mobile-reset').forEach(button => {
    button.onclick = resetView;
  });
  const surface = root.querySelector('.pdf-viewer__surface');
  initializeGestures(surface);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleResize).observe(surface);
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
  root.querySelector('.pdf-viewer__zoom-out').disabled = !documentHandle || zoom <= 1;
  root.querySelector('.pdf-viewer__zoom-in').disabled = !documentHandle || zoom >= MAX_ZOOM;
  root.querySelectorAll('.pdf-viewer__reset, .pdf-viewer__mobile-reset').forEach(button => { button.disabled = !documentHandle || zoom <= 1; });
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
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) void showPage(pageNumber + (dx < 0 ? 1 : -1));
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

function updatePageControls() {
  root.querySelectorAll('.pdf-viewer__counter, .pdf-viewer__mobile-counter').forEach(counter => { counter.textContent = `${pageNumber} / ${documentHandle.numPages}`; });
  root.querySelectorAll('.pdf-viewer__previous, .pdf-viewer__side-previous').forEach(button => { button.disabled = pageNumber <= 1; });
  root.querySelectorAll('.pdf-viewer__next, .pdf-viewer__side-next').forEach(button => { button.disabled = pageNumber >= documentHandle.numPages; });
}

async function showPage(number) {
  if (!documentHandle || number < 1 || number > documentHandle.numPages) return;
  clearTimeout(qualityTimer);
  pageNumber = number;
  zoom = 1;
  pan = { x: 0, y: 0 };
  updatePageControls();
  applyTransform();
  await renderPage(true);
}

async function renderPage(showLoading = false) {
  if (!documentHandle || !root || root.hidden) return;
  const current = ++renderGeneration;
  const pdf = documentHandle;
  const oldTask = renderTask;
  oldTask?.cancel();
  if (showLoading) message('ページを読み込み中…');
  try {
    if (oldTask) await oldTask.promise.catch(() => {});
    const page = await pdf.getPage(pageNumber);
    if (current !== renderGeneration || pdf !== documentHandle) return;
    const surface = root.querySelector('.pdf-viewer__surface');
    const initial = page.getViewport({ scale: 1 });
    const width = surface.clientWidth - 2;
    const height = surface.clientHeight - 2;
    if (width <= 0 || height <= 0) return;
    const fitScale = Math.min(width / initial.width, height / initial.height);
    paperSize = { width: initial.width * fitScale, height: initial.height * fitScale };
    const paper = root.querySelector('.pdf-viewer__paper');
    paper.style.width = `${paperSize.width}px`;
    paper.style.height = `${paperSize.height}px`;
    applyTransform();
    const renderingZoom = zoom;
    const viewport = page.getViewport({ scale: fitScale * renderingZoom });
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(16000000 / (viewport.width * viewport.height)));
    const canvas = root.querySelector('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width * pixelRatio));
    canvas.height = Math.max(1, Math.floor(viewport.height * pixelRatio));
    renderTask = page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport, transform: [pixelRatio, 0, 0, pixelRatio, 0, 0] });
    await renderTask.promise;
    if (current === renderGeneration) {
      renderedZoom = renderingZoom;
      message('');
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
    if (root) root.hidden = true;
    document.body.classList.remove('is-pdf-viewer-open');
    return;
  }
  build();
  root.hidden = false;
  root.classList.remove('is-dragging');
  document.body.classList.add('is-pdf-viewer-open');
  zoom = 1;
  pan = { x: 0, y: 0 };
  paperSize = { width: 0, height: 0 };
  renderedZoom = 1;
  root.querySelector('canvas').hidden = true;
  root.querySelector('.pdf-viewer__title').textContent = '電子版を読み込み中';
  root.querySelectorAll('.pdf-viewer__counter, .pdf-viewer__mobile-counter').forEach(counter => { counter.textContent = ''; });
  root.querySelectorAll('button:not(.pdf-viewer__back)').forEach(button => { button.disabled = true; });
  applyTransform();
  message('電子版を読み込み中…');
  try {
    await loadPublications();
    if (current !== routeGeneration) return;
    const publication = getPublicationById(match[1]);
    const url = publication?.siteStatuses?.includes('電子版公開中') && publicPdfUrl(publication.pdfPath);
    if (!url) throw Error('この電子版は公開されていません。');
    root.querySelector('.pdf-viewer__title').textContent = publication.title;
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) throw Error('PDFファイルが見つかりません。');
    const pdfjs = await import('./pdf.min.mjs');
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
    if (current === routeGeneration) message(error.message || 'PDFを表示できませんでした。');
  }
}

document.addEventListener('keydown', event => {
  if (!root || root.hidden || event.target.closest('input, textarea, select')) return;
  if (event.key === 'Escape') { event.preventDefault(); close(); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); void showPage(pageNumber - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); void showPage(pageNumber + 1); }
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
