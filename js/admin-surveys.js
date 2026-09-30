import { publicationUrl } from './publication-links.js';
import { publicPdfUrl } from './pdf-viewer.js';
import { showAdminToast } from './admin-feedback.js';

let dialog;
let selectedItem;
let generation = 0;

function ensureDialog() {
  if (dialog) return;
  dialog = document.createElement('dialog');
  dialog.className = 'admin-share-dialog';
  dialog.setAttribute('aria-labelledby', 'adminShareTitle');
  dialog.innerHTML = `
    <h2 id="adminShareTitle">URLをコピー</h2>
    <p class="admin-share-name"></p>
    <p class="admin-share-note">コピーするURLを選択してください。</p>
    <button class="admin-share-option" type="button" data-share="modal"><strong>制作物モーダルURL</strong><span class="admin-share-modal-url"></span></button>
    <button class="admin-share-option" type="button" data-share="library" hidden><strong>電子版ライブラリーURL</strong><span class="admin-share-library-url"></span></button>
    <p class="admin-share-check" role="status"></p>
    <p class="admin-share-release" hidden>公開保留中・公開予定の制作物は、公開後にURLから閲覧できます。</p>
    <div class="actions"><button class="admin-button admin-button--secondary" type="button" data-share-close>キャンセル</button></div>`;
  document.querySelector('#archiveAdminRoot .admin-shell').append(dialog);
  dialog.querySelector('[data-share-close]').onclick = () => dialog.close();
  dialog.querySelectorAll('[data-share]').forEach(button => {
    button.onclick = async () => {
      const url = publicationUrl(selectedItem.id, button.dataset.share);
      try {
        await copyText(url);
        dialog.close();
        showAdminToast('コピーされました', 'create');
      } catch {
        showAdminToast('コピーできませんでした。ブラウザーの設定をご確認ください。', 'error');
      }
    };
  });
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return; } catch {}
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
  dialog.append(input);
  input.focus();
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw Error('コピーできませんでした。');
}

export function showPublicationLinkDialog(item) {
  ensureDialog();
  selectedItem = item;
  const current = ++generation;
  dialog.querySelector('.admin-share-name').textContent = `${item.title}（${item.id}）`;
  dialog.querySelector('.admin-share-modal-url').textContent = publicationUrl(item.id);
  const library = dialog.querySelector('[data-share="library"]');
  library.hidden = true;
  dialog.querySelector('.admin-share-library-url').textContent = publicationUrl(item.id, 'library');
  const note = dialog.querySelector('.admin-share-check');
  note.textContent = '';
  dialog.querySelector('.admin-share-release').hidden = item.publicationPermission === true && (!item.releaseAt || Date.parse(item.releaseAt) <= Date.now());
  dialog.showModal();
  const pdfUrl = item.siteStatuses?.includes('電子版公開中') && publicPdfUrl(item.pdfPath);
  if (!pdfUrl) return;
  note.textContent = '電子版PDFを確認中…';
  fetch(pdfUrl, { method: 'HEAD' }).then(response => {
    if (current !== generation || !dialog.open) return;
    library.hidden = !response.ok;
    note.textContent = response.ok ? '' : 'PDFファイルが見つからないため、ライブラリーURLは選択できません。';
  }).catch(() => {
    if (current === generation && dialog.open) note.textContent = 'PDFを確認できないため、ライブラリーURLは選択できません。';
  });
}
