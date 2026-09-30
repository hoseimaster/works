import { api } from './supabase-api.js';
import { showAdminToast } from './admin-feedback.js';
import { AGE_OPTIONS, GENDER_OPTIONS, RATING_OPTIONS } from './feedback.js';

let entries = [];
let mode = 'all';
let bookId = '';
let panel;
let authorized;
let screen;
let generation = 0;
let loading = false;
let badgeLoading = false;
const marking = new Set();

function node(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
}
function button(label, callback, className = '') {
    const item = node('button', className, label);
    item.type = 'button'; item.onclick = callback;
    return item;
}
function label(options, value) {
    return options.find(option => option[0] === String(value))?.[1] || '回答なし';
}
function updateBadge(count) {
    const badge = document.getElementById('feedbackUnreadBadge');
    badge.hidden = !count;
    badge.textContent = `未読 ${count}件`;
}

export function initAdminSurveys({ isAuthorized, showScreen }) {
    authorized = isAuthorized;
    screen = showScreen;
    panel = document.getElementById('feedbackManagement');
    document.getElementById('openFeedback').onclick = () => void openAdminSurveys();
    window.setInterval(() => {
        if (authorized() && !document.hidden && location.hash.startsWith('#admin')) void refreshSurveyBadge();
    }, 60000);
    document.addEventListener('visibilitychange', () => {
        if (authorized() && !document.hidden && location.hash.startsWith('#admin')) void refreshSurveyBadge();
    });
}

export function clearAdminSurveys() {
    generation++;
    entries = [];
    marking.clear();
    panel?.replaceChildren();
    updateBadge(0);
}

export async function refreshSurveyBadge() {
    if (!authorized?.() || badgeLoading) return;
    badgeLoading = true;
    const current = generation;
    try {
        const count = await api('/rest/v1/rpc/archive_feedback_unread_count', { method: 'POST', body: {}, auth: true });
        if (authorized() && current === generation) updateBadge(count);
    } catch {
        if (authorized() && current === generation) {
            const badge = document.getElementById('feedbackUnreadBadge');
            badge.hidden = false;
            badge.textContent = '感想の確認未完了';
        }
    } finally { badgeLoading = false; }
}

async function openAdminSurveys() {
    if (!authorized() || loading) return;
    loading = true;
    const current = generation;
    screen('feedbackManagement');
    panel.replaceChildren(node('p', '', '感想を読み込み中…'));
    try {
        const rows = await api('/rest/v1/rpc/get_archive_feedback', { method: 'POST', body: {}, auth: true });
        if (current !== generation || !authorized()) return;
        entries = rows;
        updateBadge(entries.filter(entry => !entry.readAt).length);
        draw();
    } catch (error) {
        if (current !== generation || !authorized()) return;
        panel.replaceChildren(node('p', 'feedback-error', error.message),
            button('制作物一覧に戻る', () => screen('management'), 'admin-button admin-button--secondary'));
    } finally { loading = false; }
}

function ratingSummary(rows, key, title) {
    const section = node('section', 'feedback-rating-summary');
    section.append(node('h3', '', title));
    const ratings = rows.map(entry => Number(entry.answers[key])).filter(value => value >= 1 && value <= 5);
    const average = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : '—';
    section.append(node('p', '', `平均 ${average} / 5（回答 ${ratings.length}件）`));
    RATING_OPTIONS.forEach(([value, text]) => {
        const count = ratings.filter(rating => rating === Number(value)).length;
        const row = node('div', 'feedback-rating-row');
        const meter = document.createElement('meter');
        meter.min = 0; meter.max = Math.max(ratings.length, 1); meter.value = count;
        meter.setAttribute('aria-label', text);
        row.append(node('span', '', text), meter, node('span', '', `${count}件`));
        section.append(row);
    });
    return section;
}

async function mark(entry, read) {
    if (!authorized() || marking.has(entry.id)) return;
    marking.add(entry.id);
    const current = generation;
    try {
        await api('/rest/v1/rpc/mark_archive_feedback', { method: 'POST', auth: true,
            body: { p_id: entry.id, p_read: read } });
        if (!authorized() || current !== generation) return;
        entry.readAt = read ? new Date().toISOString() : null;
        panel.querySelectorAll('[data-entry-id]').forEach(item => {
            if (item.dataset.entryId !== entry.id) return;
            const status = item.querySelector('.feedback-read-state');
            status.textContent = read ? '既読' : '未読';
            item.classList.toggle('is-unread', !read);
            item.querySelector('.feedback-mark-button').textContent = read ? '未読に戻す' : '既読にする';
        });
        await refreshSurveyBadge();
    } catch (error) {
        if (authorized() && current === generation) showAdminToast(error.message, 'error');
    } finally { marking.delete(entry.id); }
}

function entryCard(entry, archiveOnly = false) {
    const card = node('details', 'feedback-entry');
    card.dataset.entryId = entry.id;
    card.classList.toggle('is-unread', !entry.readAt);
    const summary = node('summary');
    summary.append(node('span', 'feedback-read-state', entry.readAt ? '既読' : '未読'),
        node('strong', '', entry.answers.title),
        node('span', 'feedback-entry-date', new Date(entry.createdAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })));
    card.append(summary);
    const body = node('div', 'feedback-entry-body');
    const fields = archiveOnly ? [
        ['制作物アーカイブスの評価', label(RATING_OPTIONS, entry.answers.archiveRating)],
        ['5について、その評価の理由', entry.answers.archiveReason || '記入なし']
    ] : [
        ['制作物ID', entry.publicationId], ['年齢', label(AGE_OPTIONS, entry.answers.age)],
        ['性別', label(GENDER_OPTIONS, entry.answers.gender)],
        ['制作物の評価', label(RATING_OPTIONS, entry.answers.publicationRating)],
        ['感想やご意見', entry.answers.comment || '記入なし'],
        ['今後の活動に期待すること', entry.answers.expectations || '記入なし']
    ];
    for (const [title, text] of fields) {
        const item = node('div', 'feedback-review-field');
        item.append(node('h4', '', title), node('p', '', text));
        body.append(item);
    }
    const readButton = button(entry.readAt ? '未読に戻す' : '既読にする', () => void mark(entry, !entry.readAt),
        'admin-button admin-button--secondary feedback-mark-button');
    body.append(readButton); card.append(body);
    card.addEventListener('toggle', () => { if (card.open && !entry.readAt) void mark(entry, true); });
    return card;
}

function draw() {
    panel.replaceChildren();
    const header = node('div', 'admin-panel-header');
    const title = node('div');
    title.append(node('span', 'admin-step', '感想・集計'), node('h2', '', '読者からの感想'),
        node('p', '', `全制作物を合わせた最新${entries.length}件を表示しています。保存上限は100件です。`));
    const actions = node('div', 'admin-row-actions');
    actions.append(button('更新する', () => void openAdminSurveys(), 'admin-button admin-button--secondary'),
        button('制作物一覧に戻る', () => screen('management'), 'admin-button admin-button--secondary'));
    header.append(title, actions); panel.append(header);
    const tabs = node('div', 'feedback-tabs');
    tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', '感想の表示区分');
    for (const [value, text] of [['all','一覧'],['book','制作物別'],['archive','アーカイブスの評価・理由']]) {
        const tab = button(text, () => { mode = value; draw(); });
        tab.setAttribute('aria-pressed', String(mode === value));
        tabs.append(tab);
    }
    panel.append(tabs);
    let rows = entries;
    if (mode === 'book') {
        const books = new Map();
        entries.forEach(entry => books.set(entry.publicationId, entry.answers.title));
        const field = node('label', 'feedback-book-select', '制作物を選択');
        const select = document.createElement('select');
        select.append(new Option('選択してください', ''));
        books.forEach((title, id) => select.append(new Option(`${title}（${id}）`, id)));
        if (!books.has(bookId)) bookId = '';
        select.value = bookId;
        select.onchange = () => { bookId = select.value; draw(); };
        field.append(select); panel.append(field);
        rows = entries.filter(entry => entry.publicationId === bookId);
    }
    const grid = node('div', 'feedback-stats-grid');
    if (mode !== 'archive') grid.append(ratingSummary(rows, 'publicationRating', '制作物の評価'));
    grid.append(ratingSummary(rows, 'archiveRating', '制作物アーカイブスの評価'));
    panel.append(grid);
    if (mode !== 'archive') {
        const demographics = node('details', 'feedback-demographics');
        demographics.append(node('summary', '', '年齢・性別の集計'));
        for (const [key, title, options] of [['age','年齢',AGE_OPTIONS],['gender','性別',GENDER_OPTIONS]]) {
            demographics.append(node('h3', '', title));
            options.forEach(([value, text]) => demographics.append(node('p', '', `${text}：${rows.filter(entry => entry.answers[key] === value).length}件`)));
        }
        panel.append(demographics);
    }
    panel.append(node('h3', '', mode === 'archive' ? 'アーカイブスの評価理由' : `感想一覧（${rows.length}件）`));
    if (!rows.length) panel.append(node('p', '', mode === 'book' && !bookId ? '制作物を選択してください。' : '感想はまだありません。'));
    rows.forEach(entry => panel.append(entryCard(entry, mode === 'archive')));
}
