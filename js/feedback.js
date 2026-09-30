import { api } from './supabase-api.js';
import { loadPublications, getPublicationById } from './publications.js';
import { publicationHash, publicationUrl } from './publication-links.js';

export const AGE_OPTIONS = [
    ['under18', '18歳未満'], ['18to24', '18〜24歳'], ['25to34', '25〜34歳'],
    ['35to44', '35〜44歳'], ['45to54', '45〜54歳'], ['55to64', '55〜64歳'],
    ['65plus', '65歳以上'], ['no_answer', '回答しない']
];
export const GENDER_OPTIONS = [
    ['female', '女性'], ['male', '男性'], ['other', 'その他の性別'], ['no_answer', '回答しない']
];
export const RATING_OPTIONS = [
    ['5', '非常に良い'], ['4', '良い'], ['3', 'どちらともいえない'], ['2', '悪い'], ['1', '非常に悪い']
];

let root;
let generation = 0;
let publication;
let pending;
let requestId;
let sending = false;
let completionDialog;
let toastTimer;

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

export function publicToast(text) {
    let toast = document.getElementById('archivePublicToast');
    if (!toast) {
        toast = element('div', 'archive-public-toast');
        toast.id = 'archivePublicToast';
        toast.setAttribute('role', 'status');
        document.body.append(toast);
    }
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2000);
}

export async function shareLibrary(book) {
    const url = publicationUrl(book.id, 'library');
    if (navigator.share) {
        try { await navigator.share({ title: book.title, url }); return; }
        catch (error) { if (error.name === 'AbortError') return; }
    }
    try {
        await navigator.clipboard.writeText(url);
        publicToast('ライブラリーのURLをコピーしました。');
    } catch {
        publicToast('コピーできませんでした。ブラウザーの共有機能をご利用ください。');
    }
}

export function showReadCompletion(book, onContinue) {
    if (!completionDialog) {
        completionDialog = element('dialog', 'reader-completion');
        completionDialog.innerHTML = `<button class="reader-completion__close" type="button" aria-label="閉じる">✕</button>
            <span class="feedback-eyebrow">THANK YOU FOR READING</span><h2>ご覧いただきありがとうございます</h2>
            <p class="reader-completion__title"></p><p>よろしければ、感想をお聞かせください。</p>
            <div class="feedback-actions"><button type="button" class="feedback-primary" data-action="feedback">感想はこちらから</button>
            <button type="button" data-action="share">シェアする</button></div>
            <button type="button" class="feedback-text-button" data-action="continue">読書を続ける</button>`;
        document.body.append(completionDialog);
    }
    completionDialog.querySelector('.reader-completion__title').textContent = book.title;
    const button = completionDialog.querySelector('[data-action=feedback]');
    button.textContent = "感想はこちらから";
    const close = () => completionDialog.close();
    completionDialog.querySelector('.reader-completion__close').onclick = close;
    completionDialog.querySelector('[data-action=continue]').onclick = () => {
        close();
        onContinue?.();
    };
    completionDialog.querySelector('[data-action=share]').onclick = () => void shareLibrary(book);
    button.onclick = () => {
        close();
        location.hash = `#feedback/${book.id}`;
    };
    if (!completionDialog.open) completionDialog.showModal();
}

export function closeReadCompletion() {
    if (completionDialog?.open) completionDialog.close();
}

function selectField(name, label, options, required) {
    const box = element('div', 'feedback-field');
    const labelNode = element('label', '', label + (required ? '（必須）' : '（任意）'));
    const select = document.createElement('select');
    select.name = name;
    select.id = `feedback-${name}`;
    select.required = required;
    labelNode.htmlFor = select.id;
    select.append(new Option('選択してください', ''));
    options.forEach(([value, text]) => select.append(new Option(text, value)));
    box.append(labelNode, select);
    return box;
}

function textField(name, label) {
    const box = element('div', 'feedback-field');
    const labelNode = element('label', '', label + '（任意・2000文字以内）');
    const input = document.createElement('textarea');
    input.name = name;
    input.id = `feedback-${name}`;
    input.rows = 5;
    input.maxLength = 2000;
    labelNode.htmlFor = input.id;
    box.append(labelNode, input);
    return box;
}

function build() {
    if (root) return;
    root = element('section', 'feedback-page');
    root.hidden = true;
    root.setAttribute('aria-label', '制作物への感想');
    root.innerHTML = `<div class="feedback-shell"><header class="feedback-header">
        <span class="feedback-eyebrow">WORKS ARCHIVE / FEEDBACK</span><h1>感想をお聞かせください</h1>
        <p class="feedback-book-title"></p></header><div class="feedback-content"></div></div>`;
    document.body.append(root);
}

function content() { return root.querySelector('.feedback-content'); }
function focusHeading() {
    const heading = root.querySelector('h1');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    root.scrollTop = 0;
}

function questionLabels() {
    const title = publication.title;
    return {
        age: '1. ご年齢をお聞かせください',
        gender: '2. 性別をご選択ください',
        publicationRating: `3. 「${title}」の評価をお聞かせください`,
        comment: `4. 「${title}」の感想やご意見をお聞かせください`,
        archiveRating: '5. 制作物アーカイブス（制作物総合検索機能）の評価をお聞かせください',
        archiveReason: '6. 5について、その評価をお選びになった理由をお聞かせください',
        expectations: '7. 今後の活動に期待されることをお聞かせください'
    };
}

function showForm() {
    const labels = questionLabels();
    content().replaceChildren();
    const form = element('form', 'feedback-form');
    form.noValidate = true;
    form.autocomplete = 'off';
    const notice = element('div', 'feedback-notice');
    notice.innerHTML = `<h2>ご回答前にご確認ください</h2><ul>
        <li>氏名・住所・メールアドレス・SNSアカウントなど、個人を特定できる情報は書かないでください。他の方の個人情報も記入しないでください。</li>
        <li>ご回答いただいた内容は、今後の制作活動・サイト改善の参考として使わせていただく場合があります。</li>
        </ul>`;
    const consentBox = element('div', 'feedback-field feedback-consent');
    const consentLabel = element('label');
    const consent = document.createElement('input');
    consent.type = 'checkbox'; consent.name = 'consent'; consent.required = true;
    consentLabel.append(consent, document.createTextNode('注意事項を確認しました（必須）'));
    consentBox.append(consentLabel);
    form.append(notice, consentBox,
        selectField('age', labels.age, AGE_OPTIONS, true),
        selectField('gender', labels.gender, GENDER_OPTIONS, true),
        selectField('publicationRating', labels.publicationRating, RATING_OPTIONS, true),
        textField('comment', labels.comment),
        selectField('archiveRating', labels.archiveRating, RATING_OPTIONS, true),
        textField('archiveReason', labels.archiveReason),
        textField('expectations', labels.expectations));
    const error = element('p', 'feedback-error');
    error.setAttribute('role', 'alert');
    const actions = element('div', 'feedback-actions');
    const back = element('button', '', 'ライブラリーに戻る');
    back.type = 'button';
    back.onclick = returnToLibrary;
    const review = element('button', 'feedback-primary', '感想を確認する');
    review.type = 'submit';
    actions.append(back, review);
    form.append(error, actions);
    content().append(form);
    if (pending) {
        for (const [name, value] of Object.entries(pending)) {
            const input = form.elements.namedItem(name);
            if (input?.type === 'checkbox') input.checked = Boolean(value);
            else if (input) input.value = value ?? '';
        }
    }
    form.addEventListener('input', event => {
        if (event.target.checkValidity()) {
            const box = event.target.closest('.feedback-field');
            box?.classList.remove('is-invalid');
            event.target.removeAttribute('aria-invalid');
            box?.querySelector('.feedback-field-error')?.remove();
        }
    });
    form.onsubmit = event => {
        event.preventDefault();
        let firstInvalid;
        form.querySelectorAll('.feedback-field').forEach(box => {
            const input = box.querySelector('input, select, textarea');
            const valid = input.checkValidity();
            box.classList.toggle('is-invalid', !valid);
            box.querySelector('.feedback-field-error')?.remove();
            if (!valid) {
                input.setAttribute('aria-invalid', 'true');
                box.append(element('p', 'feedback-field-error', 'こちらの記入をお願いします。'));
                firstInvalid ||= input;
            } else input.removeAttribute('aria-invalid');
        });
        if (firstInvalid) {
            error.textContent = '赤枠の項目をご確認ください。';
            firstInvalid.focus();
            return;
        }
        const data = Object.fromEntries(new FormData(form));
        pending = { ...data, consent: consent.checked };
        showReview();
    };
    focusHeading();
}

function answerLabel(name, value) {
    const options = name === 'age' ? AGE_OPTIONS : name === 'gender' ? GENDER_OPTIONS : RATING_OPTIONS;
    return options.find(option => option[0] === String(value))?.[1] || '回答なし';
}

function showReview() {
    content().replaceChildren();
    const box = element('div', 'feedback-review');
    box.append(element('h2', '', '送信内容の確認'));
    const labels = questionLabels();
    for (const [name, label] of Object.entries(labels)) {
        const field = element('div', 'feedback-review-field');
        const value = ['age','gender','publicationRating','archiveRating'].includes(name)
            ? answerLabel(name, pending[name]) : pending[name] || '回答なし';
        field.append(element('h3', '', label), element('p', '', value));
        box.append(field);
    }
    const error = element('p', 'feedback-error');
    error.setAttribute('role', 'alert');
    const actions = element('div', 'feedback-actions');
    const back = element('button', '', '入力内容を修正');
    back.type = 'button'; back.onclick = showForm;
    const send = element('button', 'feedback-primary', '感想を送る');
    send.type = 'button';
    send.onclick = async () => {
        if (sending) return;
        sending = true;
        const current = generation;
        const bookId = publication.id;
        send.disabled = back.disabled = true;
        send.textContent = '送信中…';
        error.textContent = '';
        try {
            await api('/rest/v1/rpc/submit_archive_feedback', { method: 'POST', body: {
                p_publication_id: bookId, p_request_id: requestId, p_answers: pending
            } });
            if (current === generation) {
                pending = null;
                showThanks();
            }
        } catch (failure) {
            if (current === generation) error.textContent = failure.message || '送信できませんでした。再度お試しください。';
        } finally {
            sending = false;
            send.disabled = back.disabled = false;
            send.textContent = '感想を送る';
        }
    };
    actions.append(back, send); box.append(error, actions); content().append(box);
    focusHeading();
}

function returnToLibrary() { location.hash = publicationHash(publication.id, 'library'); }
function showThanks() {
    const thanks = element('div', 'feedback-thanks');
    thanks.append(element('span', 'feedback-eyebrow', 'THANK YOU'), element('h2', '', '感想をお寄せいただき、ありがとうございます。'),
        element('p', '', 'いただいたご意見を、今後の制作や活動、サイト改善の参考にさせていただきます。'));
    const actions = element('div', 'feedback-actions');
    const home = element('button', 'feedback-primary', '制作物アーカイブストップに戻る');
    home.type = 'button'; home.onclick = () => { location.hash = ''; };
    const library = element('button', '', 'ライブラリーに戻る');
    library.type = 'button'; library.onclick = returnToLibrary;
    actions.append(home, library); thanks.append(actions);
    content().replaceChildren(thanks);
    focusHeading();
}

async function route() {
    const current = ++generation;
    const match = /^#feedback\/(publication-[0-9]{6})$/.exec(location.hash);
    if (!match) {
        if (root) root.hidden = true;
        document.body.classList.remove('is-feedback-open');
        pending = null;
        return;
    }
    build(); root.hidden = false;
    document.body.classList.add('is-feedback-open');
    content().replaceChildren(element('p', '', '制作物を読み込み中…'));
    try {
        await loadPublications();
        if (current !== generation) return;
        publication = getPublicationById(match[1]);
        if (!publication?.siteStatuses?.includes('電子版公開中') || !publication.pdfPath) {
            throw Error('この制作物への感想は現在受け付けていません。');
        }
        requestId = crypto.randomUUID();
        pending = null;
        root.querySelector('.feedback-book-title').textContent = publication.title;
        showForm();
    } catch (error) {
        if (current !== generation) return;
        const back = element('button', '', '制作物アーカイブストップに戻る');
        back.type = 'button'; back.onclick = () => { location.hash = ''; };
        content().replaceChildren(element('p', 'feedback-error', error.message), back);
    }
}
window.addEventListener('hashchange', route);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route);
else void route();
