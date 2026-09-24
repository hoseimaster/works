let toastTimer;

export function ensureAdminFeedback(root) {
  const shell = root.querySelector('.admin-shell');
  let dialog = document.getElementById('deleteDialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'deleteDialog';
    shell.append(dialog);
  }
  if (!document.getElementById('cancelDelete') ||
      !document.getElementById('confirmDelete') ||
      !document.getElementById('deleteDialogDetails')) {
    dialog.className = 'admin-delete-dialog';
    dialog.setAttribute('aria-labelledby', 'deleteDialogTitle');
    dialog.setAttribute('aria-describedby', 'deleteDialogDescription');
    dialog.innerHTML = `
      <h2 id="deleteDialogTitle">制作物を削除</h2>
      <p id="deleteDialogDescription">以下の制作物を削除します。この操作は元に戻せません。制作物IDも再利用できません。</p>
      <dl id="deleteDialogDetails" class="admin-delete-details"></dl>
      <div class="actions admin-delete-actions">
        <button id="cancelDelete" type="button" class="admin-button admin-button--secondary">キャンセル</button>
        <button id="confirmDelete" type="button" class="admin-button admin-button--danger">削除する</button>
      </div>`;
  }

  if (!document.getElementById('adminToast')) {
    const toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.className = 'admin-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.hidden = true;
    shell.append(toast);
  }
  if (!document.getElementById('loginError')) {
    const error = document.createElement('p');
    error.id = 'loginError';
    error.className = 'admin-login-error';
    error.setAttribute('role', 'alert');
    error.hidden = true;
    document.getElementById('loginForm').append(error);
  }
}

export function showAdminToast(text, kind = 'edit') {
  const toast = document.getElementById('adminToast');
  clearTimeout(toastTimer);
  toast.className = `admin-toast admin-toast--${kind}`;
  toast.textContent = text;
  toast.hidden = false;
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2000);
}

export function showDeleteDialog(item) {
  const dialog = document.getElementById('deleteDialog');
  const details = document.getElementById('deleteDialogDetails');
  details.replaceChildren();

  const releaseState = !item.publicationPermission ? '公開保留' :
    item.releaseAt && Date.parse(item.releaseAt) > Date.now() ? '公開予定' : '公開中';
  const entries = [
    ['制作物ID', item.id],
    ['タイトル', item.title],
    ['発行日', item.publishDate || '未設定'],
    ['カテゴリー', item.category || '未設定'],
    ['公開状態', releaseState],
    ['表紙画像パス', item.coverImage || '未設定']
  ];
  for (const [label, value] of entries) {
    const term = document.createElement('dt');
    const definition = document.createElement('dd');
    term.textContent = label;
    definition.textContent = value;
    details.append(term, definition);
  }
  dialog.showModal();
}
