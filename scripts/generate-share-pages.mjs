import { readFile, writeFile, mkdir, rm, rename } from 'node:fs/promises';
import path from 'node:path';

function option(name, fallback) {
    const index = process.argv.indexOf(name);
    if (index < 0) return fallback;
    if (!process.argv[index + 1] || process.argv[index + 1].startsWith('--')) {
        throw new Error(`${name} の値を指定してください。`);
    }
    return process.argv[index + 1];
}

const output = path.resolve(option('--output', 'share'));
const base = option('--base-url', 'https://hoseimaster.github.io/works/').replace(/\/+$/, '') + '/';
const input = option('--input-json', '');
const parsedBase = new URL(base);
if (!['http:', 'https:'].includes(parsedBase.protocol) || parsedBase.username || parsedBase.password) {
    throw new Error('公開URLを確認してください。');
}
if (output === process.cwd() || output === path.parse(output).root) {
    throw new Error('共有ページ専用の出力フォルダーを指定してください。');
}

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;'
})[character]);

function imageUrl(value) {
    if (!value) return '';
    try {
        const url = new URL(value, base);
        return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
    } catch { return ''; }
}

function render(row, library = false) {
    const title = `${library ? '電子版ｰ' : ''}${row.title || ''}`;
    const description = `${library ? '電子版が閲覧できます。' : ''}${row.description || ''}`;
    const url = `${base}share/${row.id}/${library ? 'library/' : ''}`;
    const target = `${base}#${library ? 'pdf' : 'publication'}/${row.id}`;
    const image = imageUrl(row.cover_path ?? `./cover/${row.id}.png`);
    const imageTags = image ? `<meta property="og:image" content="${escape(image)}">\n<meta property="og:image:alt" content="${escape(`${row.title || ''}の表紙`)}">\n<meta name="twitter:image" content="${escape(image)}">` : '';
    const redirect = JSON.stringify(target).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    return `<!DOCTYPE html>
<html lang="ja" prefix="og: https://ogp.me/ns#">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<link rel="canonical" href="${escape(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="制作物アーカイブス">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${escape(url)}">
${imageTags}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(description)}">
<style>
    html, body { min-height: 100%; margin: 0; }
    body {
        display: grid;
        min-height: 100vh;
        min-height: 100dvh;
        place-items: center;
        background: linear-gradient(135deg, #fffaf5, #fff0e2);
        color: #9b7254;
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    }
    .share-loading { padding: 24px; text-align: center; }
    .share-loading p { margin: 0; font-size: 14px; letter-spacing: .06em; }
    .share-fallback { font-size: 14px; line-height: 1.8; }
    .share-fallback a { color: #a65e31; text-underline-offset: 4px; }
</style>
</head>
<body>
<div class="share-loading" role="status" aria-live="polite"><p>読み込み中…</p></div>
<noscript>
    <style>.share-loading { display: none; }</style>
    <div class="share-fallback"><a href="${escape(target)}">${library ? '電子版を閲覧する' : '制作物を表示する'}</a></div>
</noscript>
<script>location.replace(${redirect});</script>
</body>
</html>
`;
}

async function loadRows() {
    if (input) return JSON.parse(await readFile(input, 'utf8'));
    const api = (process.env.SUPABASE_URL || 'https://guewvrivkucbhhlihwfk.supabase.co').replace(/\/+$/, '');
    const key = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_1AnJ604R9CIGZC_xY9DBeQ_BIZeD64L';
    const rows = [];
    for (let offset = 0; ; offset += 500) {
        const url = new URL(`${api}/rest/v1/archive_publications`);
        url.search = new URLSearchParams({
            select: 'id,title,description,cover_path,pdf_path,site_statuses,publication_permission,release_at',
            publication_permission: 'eq.true', order: 'id.asc', limit: '500', offset: String(offset)
        }).toString();
        const response = await fetch(url, { headers: { apikey: key }, signal: AbortSignal.timeout(40000) });
        if (!response.ok) throw new Error(`公開データの取得に失敗しました（HTTP ${response.status}）。`);
        const batch = await response.json();
        if (!Array.isArray(batch)) throw new Error('公開データの形式を確認してください。');
        rows.push(...batch);
        if (batch.length < 500) return rows;
    }
}

const rows = await loadRows();
if (!Array.isArray(rows)) throw new Error('制作物データは配列で指定してください。');
const staging = `${output}-generated`;
await rm(staging, { recursive: true, force: true });
await mkdir(staging, { recursive: true });
const now = Date.now();
let count = 0;
for (const row of rows) {
    if (!row || !/^publication-[0-9]{6}$/.test(row.id) || row.publication_permission !== true) continue;
    if (row.release_at != null && (!Number.isFinite(Date.parse(row.release_at)) || Date.parse(row.release_at) > now)) continue;
    const directory = path.join(staging, row.id);
    await mkdir(directory);
    await writeFile(path.join(directory, 'index.html'), render(row), 'utf8');
    count++;
    if (Array.isArray(row.site_statuses) && row.site_statuses.includes('電子版公開中') && /^\.\/pdf\/[a-zA-Z0-9_/-]+\.pdf$/i.test(row.pdf_path || '') && !row.pdf_path.includes('..')) {
        await mkdir(path.join(directory, 'library'));
        await writeFile(path.join(directory, 'library/index.html'), render(row, true), 'utf8');
        count++;
    }
}
await rm(output, { recursive: true, force: true });
await rename(staging, output);
console.log(`Generated ${count} share pages`);
