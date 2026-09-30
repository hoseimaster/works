import { initPdfParts, fillPdfParts, syncPdfParts, readPdfParts } from './admin-pdf-parts.js';
import { showAdminToast } from './admin-feedback.js';
export const $ = id => document.getElementById(id);

export const brands = [
  'THE IDOLM@STER',
  'シンデレラガールズ',
  'ミリオンライブ！',
  'SideM',
  'シャイニーカラーズ',
  '学園アイドルマスター',
  'その他'
];

export function initForm(form) {
  const options = $('brandOptions');
  brands.forEach(value => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    label.className = 'check';
    input.type = 'checkbox';
    input.name = 'brands';
    input.value = value;
    label.append(input, document.createTextNode(value));
    options.append(label);
  });

  form.elements.namedItem('id').readOnly = true;
  form.elements.namedItem('siteStatuses').addEventListener('change', () => syncPdfInput(form));
  for (const [buttonId, name] of [['copyPublicationId', 'id'], ['copyCoverPath', 'coverImage'], ['copyPdfPath', 'pdfPath']]) {
    $(buttonId).addEventListener('click', async () => {
      const input = form.elements.namedItem(name);
      if (input.disabled || !input.value) return;
      try {
        await navigator.clipboard.writeText(input.value);
        showAdminToast(name === 'id' ? '制作物IDをコピーしました。' : 'パスをコピーしました。', 'edit');
      } catch {
        showAdminToast('コピーできませんでした。表示内容を選択してコピーしてください。', 'error');
      }
    });
  }
  initPathChangeDialog(form);
  initPdfParts(form);
  syncPdfInput(form);
  const releaseAt = form.elements.namedItem('releaseAt');
  releaseAt.addEventListener('input', () => {
    if (releaseAt.value) {
      form.querySelector('input[name=releaseMode][value=scheduled]').checked = true;
    }
  });
  form.querySelectorAll('input[name=releaseMode]').forEach(input =>
    input.addEventListener('change', () => {
      if (input.checked && input.value !== 'scheduled') releaseAt.value = '';
    })
  );
}

function syncPdfInput(form) {
  const status = form.elements.namedItem('siteStatuses').value;
  const enabled = status === '電子版公開中';
  $('pdfPathField').hidden = !enabled;
  form.elements.namedItem('pdfPath').disabled = !enabled;
  form.elements.namedItem('pdfPath').required = enabled;
  $('copyPdfPath').disabled = !enabled;
  $('changePdfPath').disabled = !enabled;
  const id = form.elements.namedItem('id').value;
  if (enabled && !form.elements.namedItem('pdfPath').value && /^publication-[0-9]{6}$/.test(id)) form.elements.namedItem('pdfPath').value = `./pdf/${id}.pdf`;
  form.elements.namedItem('pdfBinding').disabled = !enabled;
  form.elements.namedItem('pdfBinding').required = enabled;
  const selling = status === '電子版販売中';
  $('salesUrlField').hidden = !selling;
  form.elements.namedItem('salesUrl').disabled = !selling;
  form.elements.namedItem('salesUrl').required = selling;
  syncPdfParts(form);
}

export function fillForm(form, item) {
  form.reset();
  const x = item || {};
  for (const key of [
    'id', 'title', 'publishDate', 'category', 'keywords',
    'salesUrl', 'description', 'previewDescription'
  ]) {
    form.elements.namedItem(key).value =
      Array.isArray(x[key]) ? x[key].join('\n') : x[key] || '';
  }
  const validId = /^publication-[0-9]{6}$/.test(x.id || '');
  form.elements.namedItem('coverImage').value = x.coverImage || (validId ? `./cover/${x.id}.png` : '');
  form.elements.namedItem('pdfPath').value = x.pdfPath || (validId ? `./pdf/${x.id}.pdf` : '');
  for (const name of ['coverImage', 'pdfPath']) form.elements.namedItem(name).readOnly = true;
  form.elements.namedItem('pdfBinding').value = x.pdfBinding || 'left';
  form.elements.namedItem('id').readOnly = true;
  form.querySelectorAll('input[name=brands]').forEach(input => {
    input.checked = (x.brands || []).includes(input.value);
  });
  form.elements.namedItem('siteStatuses').value = x.siteStatuses?.[0] || '';
  fillPdfParts(form, item);
  syncPdfInput(form);
  form.querySelectorAll('input[name=hasInterview]').forEach(input => {
    input.checked = Boolean(item) && input.value === (x.hasInterview ? 'yes' : 'no');
  });

  const mode = !x.publicationPermission ? 'hold' :
    x.releaseAt && Date.parse(x.releaseAt) > Date.now() ? 'scheduled' : 'now';
  form.querySelector(`input[name=releaseMode][value=${mode}]`).checked = true;
  form.elements.namedItem('releaseAt').value = mode === 'scheduled' ?
    new Date(x.releaseAt).toLocaleString('sv-SE', {
      timeZone: 'Asia/Tokyo', hour12: false
    }).replace(' ', 'T').slice(0, 16) : '';
}

export function readForm(form, { id }) {
  const get = name => form.elements.namedItem(name).value.trim();
  const coverImage = get('coverImage');
  const pdfPath = get('siteStatuses') === '電子版公開中' ? get('pdfPath') : '';
  if (!/^publication-[0-9]{6}$/.test(id)) throw Error('制作物IDを取得できません。一覧から操作し直してください。');
  if (!coverImage) throw Error('表紙画像のパスを入力してください。');
  if (pdfPath && (!/^\.\/pdf\/[a-zA-Z0-9_/-]+\.pdf$/i.test(pdfPath) || pdfPath.includes('..'))) {
    throw Error('PDFのパスは ./pdf/ から始まるリポジトリ内の .pdf ファイルを指定してください。');
  }

  const pdfParts = readPdfParts(form, id);
  if (pdfParts.length && pdfPath !== pdfParts[0]) throw Error('先頭PDFのパスが一致しません。');
  const pdfBinding = get('pdfBinding');
  if (!['right', 'left', 'none'].includes(pdfBinding)) throw Error('PDFの綴じ方を選択してください。');
  const title = get('title');
  const publishDate = get('publishDate');
  const category = get('category');
  const selectedBrands = [...form.querySelectorAll('input[name=brands]:checked')]
    .map(input => input.value);
  const siteStatus = get('siteStatuses');
  if (siteStatus === '電子版公開中' && !pdfPath) {
    throw Error('電子版公開中の場合はPDFのパスを入力してください。');
  }
  const salesUrl = get('salesUrl');
  if (siteStatus === '電子版販売中' && !/^https:\/\/[^\s/]+/i.test(salesUrl)) {
    throw Error('電子版販売中の場合は、https:// で始まる販売ページURLを入力してください。');
  }
  const description = get('description');
  const interview = form.querySelector('input[name=hasInterview]:checked');
  if (
    !title || !publishDate || !category || !selectedBrands.length ||
    !siteStatus || !description || !interview
  ) {
    throw Error(
      'タイトル・発行日・カテゴリー・ブランド・サイト状況・簡単な説明・インタビューの有無を入力してください。'
    );
  }

  const mode = form.querySelector('input[name=releaseMode]:checked').value;
  const local = get('releaseAt');
  let releaseAt = null;
  if (local && mode !== 'scheduled') {
    throw Error('公開日時が入力されています。「日時を指定して公開」を選択してください。');
  }
  if (mode === 'scheduled') {
    if (!local) throw Error('公開日時を指定してください。');
    const parsed = new Date(local + ':00+09:00');
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
      throw Error('公開予定には未来の日時を指定してください。');
    }
    releaseAt = parsed.toISOString();
  }

  return {
    id, title, publishDate, category,
    brands: selectedBrands,
    keywords: get('keywords').split(/\r?\n/).map(value => value.trim()).filter(Boolean),
    salesUrl,
    siteStatuses: [siteStatus],
    description,
    previewDescription: get('previewDescription'),
    coverImage,
    pdfPath, pdfParts, pdfBinding,
    hasInterview: interview.value === 'yes',
    publicationPermission: mode !== 'hold',
    releaseAt, mode
  };
}

export function toDb(x) {
  return {
    id: x.id,
    title: x.title,
    publish_date: x.publishDate,
    category: x.category,
    brands: x.brands,
    keywords: x.keywords,
    sales_url: x.salesUrl || null,
    site_statuses: x.siteStatuses,
    description: x.description,
    preview_description: x.previewDescription,
    cover_path: x.coverImage,
    pdf_path: x.pdfPath || null,
    pdf_parts: x.pdfParts || [],
    pdf_binding: x.pdfBinding || 'left',
    has_interview: x.hasInterview,
    publication_permission: x.publicationPermission,
    release_at: x.releaseAt
  };
}

export function fromDb(row) {
  return {
    id: row.id,
    title: row.title,
    publishDate: row.publish_date || '',
    category: row.category,
    brands: row.brands || [],
    keywords: row.keywords || [],
    salesUrl: row.sales_url || '',
    siteStatuses: row.site_statuses || [],
    description: row.description || '',
    previewDescription: row.preview_description || '',
    coverImage: row.cover_path ?? '',
    pdfPath: row.pdf_path ?? '',
    pdfParts: row.pdf_parts || [],
    pdfBinding: row.pdf_binding || 'left',
    hasInterview: row.has_interview,
    publicationPermission: row.publication_permission,
    releaseAt: row.release_at
  };
}

export function showReview(x) {
  const box = $('reviewContent');
  box.replaceChildren();
  const release = x.mode === 'hold' ? '公開保留' :
    x.mode === 'now' ? '保存後すぐ公開' :
    new Date(x.releaseAt).toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo', dateStyle: 'long', timeStyle: 'short'
    }) + 'に公開';
  const details = [
    ['制作物ID', x.id],
    ['タイトル', x.title],
    ['発行日', x.publishDate],
    ['カテゴリー', x.category],
    ['ブランド', x.brands.join('、')],
    ['キーワード', x.keywords.join('、') || 'なし'],
    ['表紙画像', x.coverImage],
    ['電子版PDF', x.pdfParts?.length ? x.pdfParts.join('\n') : x.pdfPath || 'なし'],
    ['PDFの綴じ方', ({right: '右綴じ', left: '左綴じ', none: '見開き不可'})[x.pdfBinding] || '左綴じ'],
    ['電子版販売ページURL', x.salesUrl || 'なし'],
    ['サイト状況', x.siteStatuses.join('、')],
    ['インタビュー', x.hasInterview ? 'あり' : 'なし'],
    ['簡単な説明', x.description],
    ['詳細説明', x.previewDescription || 'なし'],
    ['公開設定', release]
  ];
  for (const [label, value] of details) {
    const paragraph = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = label + '：';
    paragraph.append(strong, document.createTextNode(value));
    box.append(paragraph);
  }
}

export async function verifyAdmin(api) {
  return (await api('/rest/v1/rpc/is_archive_admin', {
    method: 'POST', body: {}, auth: true
  })) === true;
}

function initPathChangeDialog(form) {
  const dialog = document.createElement('dialog');
  dialog.className = 'admin-path-dialog';
  dialog.setAttribute('aria-labelledby', 'pathChangeTitle');
  dialog.innerHTML = `<h2 id="pathChangeTitle">パスを変更しますか？</h2>
    <p>変更後のパスにファイルがない場合、画像や電子版を表示できなくなります。変更内容は制作物の保存時に反映されます。</p>
    <p class="admin-path-current"></p>
    <div class="admin-path-dialog-actions"><button type="button" data-action="cancel" class="admin-button admin-button--secondary">キャンセル</button><button type="button" data-action="confirm" class="admin-button admin-button--primary">変更する</button></div>`;
  document.querySelector('#archiveAdminRoot .admin-shell').append(dialog);
  let input = null;
  for (const [buttonId, name] of [['changeCoverPath', 'coverImage'], ['changePdfPath', 'pdfPath']]) {
    document.getElementById(buttonId).addEventListener('click', () => {
      input = form.elements.namedItem(name);
      if (input.disabled) return;
      dialog.querySelector('.admin-path-current').textContent = `現在のパス：${input.value}`;
      dialog.showModal();
      dialog.querySelector('[data-action=cancel]').focus({ preventScroll: true });
    });
  }
  dialog.querySelector('[data-action=cancel]').onclick = () => { input = null; dialog.close(); };
  dialog.addEventListener('cancel', () => { input = null; });
  dialog.querySelector('[data-action=confirm]').onclick = () => {
    const target = input;
    input = null;
    dialog.close();
    if (!target || target.disabled) return;
    target.readOnly = false;
    target.focus({ preventScroll: true });
    target.select();
  };
}
