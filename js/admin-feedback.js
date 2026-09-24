let toastTimer;

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
