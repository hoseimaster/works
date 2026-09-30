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
  $('generatePdfPath').addEventListener('click', () => {
    const id = form.elements.namedItem('id').value;
    if (form.elements.namedItem('pdfPath').disabled || !/^publication-[0-9]{6}$/.test(id)) return;
    form.elements.namedItem('pdfPath').value = `./pdf/${id}.pdf`;
  });
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
  $('generatePdfPath').disabled = !enabled;
  const selling = status === '電子版販売中';
  $('salesUrlField').hidden = !selling;
  form.elements.namedItem('salesUrl').disabled = !selling;
  form.elements.namedItem('salesUrl').required = selling;
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
  form.elements.namedItem('coverImage').value = x.coverImage ?? '';
  form.elements.namedItem('pdfPath').value = x.pdfPath ?? '';
  form.elements.namedItem('id').readOnly = true;
  form.querySelectorAll('input[name=brands]').forEach(input => {
    input.checked = (x.brands || []).includes(input.value);
  });
  form.elements.namedItem('siteStatuses').value = x.siteStatuses?.[0] || '';
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
  const pdfPath = get('pdfPath');
  if (!/^publication-[0-9]{6}$/.test(id)) {
    throw Error('制作物IDを取得できません。一覧から操作し直してください。');
  }
  if (!coverImage) throw Error('表紙画像のパスを入力してください。');
  if (pdfPath && (!/^\.\/pdf\/[a-zA-Z0-9_/-]+\.pdf$/i.test(pdfPath) || pdfPath.includes('..'))) {
    throw Error('PDFのパスは ./pdf/ から始まるリポジトリ内の .pdf ファイルを指定してください。');
  }

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
    pdfPath,
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
    ['電子版PDF', x.pdfPath || 'なし'],
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
