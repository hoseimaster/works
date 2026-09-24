import { api, signIn, signOut, signedIn, refreshSession } from './supabase-api.js';
import { $, initForm, fillForm, readForm, toDb, fromDb, showReview, verifyAdmin } from './admin-form.js';
import { ensureAdminFeedback, showAdminToast, showDeleteDialog } from './admin-feedback.js';
import { updateAdminValidation } from './admin-validation.js';
import { findMissingCovers } from './admin-cover-check.js';

const root = $('archiveAdminRoot');
const form = $('editForm');
ensureAdminFeedback(root);
initForm(form);

let records = [];
let editing = null;
let pending = null;
let authorized = false;
let assignedId = null;
let coverCheckGeneration = 0;
let missingCoverIds = new Set();

function message(value) {
  $('message').textContent = value;
}

function screen(name) {
  for (const id of ['login', 'management', 'editor', 'review']) {
    $(id).hidden = id !== name;
  }
  $('logout').hidden = name === 'login';
  if ($('adminValidation')) $('adminValidation').hidden = name === 'login';
  for (const input of $('loginForm').elements) {
    input.disabled = name !== 'login';
  }
  window.scrollTo(0, 0);
}

async function guarded(callback) {
  try {
    message('');
    await callback();
  } catch (error) {
    message(error.message);
    showAdminToast(error.message, 'error');
  }
}

function isAdminRoute() {
  return location.hash === '#admin' || location.hash.startsWith('#admin/');
}

async function route() {
  const open = isAdminRoute();
  root.hidden = !open;
  document.body.classList.toggle('archive-admin-mode', open);
  if (!open) return;

  if (authorized) {
    if (!records.length) await guarded(load);
    else screen('management');
    return;
  }

  screen('login');
  if (signedIn()) {
    await guarded(async () => {
      if (await refreshSession() && await verifyAdmin(api)) {
        authorized = true;
        await load();
      } else {
        signOut();
      }
    });
  }
}

async function load() {
  const rows = await api(
    '/rest/v1/archive_publications?select=*&order=publish_date.desc.nullslast,id.desc',
    { auth: true }
  );
  records = rows.map(fromDb).sort((a, b) =>
    b.publishDate.localeCompare(a.publishDate) ||
    Number(b.id.split('-')[1]) - Number(a.id.split('-')[1])
  );
  const generation = ++coverCheckGeneration;
  missingCoverIds = new Set();
  updateAdminValidation(records);
  draw();
  screen('management');
  findMissingCovers(records).then(missing => {
    if (generation !== coverCheckGeneration || !authorized) return;
    missingCoverIds = new Set(missing.map(item => item.id));
    updateAdminValidation(records, missing);
    draw();
  });
}

function status(item) {
  if (!item.publicationPermission) return '公開保留中';
  if (item.releaseAt && Date.parse(item.releaseAt) > Date.now()) {
    return `公開予定：${new Date(item.releaseAt).toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo'
    })}`;
  }
  return '公開中';
}

function drawRows(target, items) {
  target.replaceChildren();
  for (const item of items) {
    const row = document.createElement('div');
    row.className = 'item';
    const info = document.createElement('div');
    const name = document.createElement('strong');
    const sub = document.createElement('p');
    const button = document.createElement('button');

    name.textContent = item.title || '（タイトル未設定）';
    sub.textContent = `${item.id} · ${item.publishDate || '発行日未設定'} · ${status(item)}`;
    info.append(name, sub);
    if (missingCoverIds.has(item.id)) {
      const warning = document.createElement('p');
      warning.textContent = '⚠ 表紙画像が見つかりません';
      warning.style.color = '#a64b19';
      info.append(warning);
    }
    button.type = 'button';
    button.textContent = '編集';
    button.onclick = () => edit(item);
    row.append(info, button);
    target.append(row);
  }
}

function draw() {
  const term = $('search').value.trim().toLowerCase();
  const holds = records.filter(item => !item.publicationPermission);
  const planned = records.filter(item =>
    item.publicationPermission && item.releaseAt &&
    Date.parse(item.releaseAt) > Date.now()
  );
  $('holdCount').textContent = holds.length;
  $('scheduledCount').textContent = planned.length;
  drawRows($('holdList'), holds);
  drawRows($('scheduledList'), planned);
  drawRows($('list'), records.filter(item =>
    `${item.id} ${item.title}`.toLowerCase().includes(term)
  ));
}

function edit(item) {
  editing = item.id;
  assignedId = item.id;
  fillForm(form, item);
  if (!item.coverImage) {
    form.elements.namedItem('coverImage').value = `./cover/${item.id}.png`;
  }
  $('editorTitle').textContent = `${item.id} を編集`;
  $('delete').hidden = false;
  screen('editor');
}

$('loginForm').onsubmit = event => {
  event.preventDefault();
  const errorBox = $('loginError');
  errorBox.hidden = true;
  errorBox.textContent = '';

  guarded(async () => {
    const fields = new FormData(event.target);
    try {
      await signIn(fields.get('email'), fields.get('password'));
    } catch (error) {
      if (
        error.status === 400 || error.status === 401 ||
        /invalid.login.credentials/i.test(`${error.code} ${error.message}`)
      ) {
        errorBox.textContent =
          'パスワードが違います。メールアドレスもご確認ください。この先は管理者のみの専用ページです。';
        errorBox.hidden = false;
        return;
      }
      throw error;
    }

    event.target.reset();
    if (!await verifyAdmin(api)) {
      signOut();
      errorBox.textContent =
        'この先は管理者のみの専用ページです。管理者権限のあるアカウントでログインしてください。';
      errorBox.hidden = false;
      return;
    }
    authorized = true;
    await load();
  });
};

$('logout').onclick = () => {
  signOut();
  authorized = false;
  coverCheckGeneration++;
  missingCoverIds = new Set();
  records = [];
  screen('login');
  message('ログアウトしました。');
};

$('search').oninput = draw;
$('back').onclick = () => screen('management');

$('new').onclick = () => guarded(async () => {
  if (!authorized || !await verifyAdmin(api)) {
    throw Error('管理者権限がありません。');
  }
  const id = await api('/rest/v1/rpc/next_archive_publication_id', {
    method: 'POST', body: {}, auth: true
  });
  editing = null;
  assignedId = id;
  fillForm(form, null);
  form.elements.namedItem('id').value = assignedId;
  form.elements.namedItem('coverImage').value = `./cover/${id}.png`;
  $('editorTitle').textContent = '制作物を新規登録';
  $('delete').hidden = true;
  screen('editor');
});

form.onsubmit = event => {
  event.preventDefault();
  guarded(async () => {
    pending = readForm(form, { id: assignedId });
    showReview(pending);
    $('confirmSave').textContent = editing ? 'この内容で保存' : 'この内容で登録';
    screen('review');
  });
};

$('reviewBack').onclick = () => screen('editor');

$('confirmSave').onclick = () => guarded(async () => {
  if (!pending || !authorized || !await verifyAdmin(api)) {
    throw Error('管理者権限がありません。');
  }
  const isEdit = Boolean(editing);
  const title = pending.title;
  const options = {
    body: toDb(pending), auth: true, headers: { Prefer: 'return=minimal' }
  };
  if (isEdit) {
    await api(`/rest/v1/archive_publications?id=eq.${encodeURIComponent(editing)}`, {
      ...options, method: 'PATCH'
    });
  } else {
    try {
      await api('/rest/v1/archive_publications', { ...options, method: 'POST' });
    } catch (error) {
      if (error.status === 409 || error.code === '23505') {
        throw Error('同じ制作物IDが先に登録されました。一覧に戻って新規登録し直してください。');
      }
      throw error;
    }
  }
  pending = null;
  await load();
  showAdminToast(`「${title}」を${isEdit ? '更新' : '登録'}しました。`,
    isEdit ? 'edit' : 'create');
});

$('delete').onclick = () => {
  const item = records.find(row => row.id === editing);
  if (item) showDeleteDialog(item);
};
$('cancelDelete').onclick = () => $('deleteDialog').close();

$('confirmDelete').onclick = () => guarded(async () => {
  const item = records.find(row => row.id === editing);
  if (!item || !authorized || !await verifyAdmin(api)) {
    throw Error('管理者権限がありません。');
  }
  const button = $('confirmDelete');
  button.disabled = true;
  try {
    await api(`/rest/v1/archive_publications?id=eq.${encodeURIComponent(item.id)}`, {
      method: 'DELETE', auth: true
    });
    $('deleteDialog').close();
    await load();
    showAdminToast(`「${item.title}」を削除しました。`, 'delete');
  } finally {
    button.disabled = false;
  }
});

window.addEventListener('hashchange', route);
route();
