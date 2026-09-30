import { showAdminToast } from './admin-feedback.js';

const states = new WeakMap();
const field = (form, name) => form.elements.namedItem(name);
const partPath = (id, number) => `./pdf/${id}-${String(number).padStart(2, '0')}.pdf`;

export function initPdfParts(form) {
    states.set(form, { paths: [] });
    document.getElementById('splitPdf').onclick = () => {
        const state = states.get(form);
        const id = field(form, 'id').value;
        if (field(form, 'pdfPath').disabled || !/^publication-[0-9]{6}$/.test(id)) return;
        state.paths = state.paths.length ? [] : [partPath(id, 1)];
        field(form, 'pdfPath').value = state.paths[0] || `./pdf/${id}.pdf`;
        field(form, 'pdfPath').readOnly = true;
        render(form);
    };
    document.getElementById('addPdfPart').onclick = () => {
        const state = states.get(form);
        if (!state.paths.length || state.paths.length >= 99 || field(form, 'pdfPath').disabled) return;
        state.paths.push(partPath(field(form, 'id').value, state.paths.length + 1));
        render(form);
    };
    render(form);
}

export function fillPdfParts(form, item) {
    states.get(form).paths = Array.isArray(item?.pdfParts) ? [...item.pdfParts] : [];
    if (states.get(form).paths.length) field(form, 'pdfPath').value = states.get(form).paths[0];
    render(form);
}

export function syncPdfParts(form) {
    if (states.has(form)) render(form);
}

export function readPdfParts(form, id) {
    const paths = states.get(form)?.paths || [];
    if (field(form, 'siteStatuses').value !== '電子版公開中') return [];
    if (paths.length > 99 || paths.some((value, index) => value !== partPath(id, index + 1))) {
        throw Error('分割PDFのパスが制作物IDの連番になっていません。分割設定を確認してください。');
    }
    return [...paths];
}

function render(form) {
    const state = states.get(form);
    const enabled = !field(form, 'pdfPath').disabled;
    const split = state.paths.length > 0;
    document.getElementById('splitPdf').disabled = !enabled;
    document.getElementById('splitPdf').textContent = split ? '1つのPDFに戻す' : '25MBを超える場合：分割して登録';
    document.getElementById('pdfPartsField').hidden = !split;
    document.getElementById('pdfSingleFile').hidden = split;
    document.getElementById('pdfModeLabel').textContent = split ? '複数のPDFをつなげて登録' : '1つのPDFで登録';
    document.getElementById('pdfModeDescription').textContent = split ? '分割したPDFを、読み進める順番に登録してください。' : '25MB未満のPDFを1ファイルで配置します。';
    document.getElementById('pdfPartsCount').textContent = `${state.paths.length}ファイル / 最大99`;
    document.getElementById('addPdfPart').textContent = state.paths.length >= 99 ? '登録上限に達しました' : '＋ 次のPDFを追加';
    document.getElementById('changePdfPath').disabled = !enabled || split;
    field(form, 'pdfPath').readOnly = split || field(form, 'pdfPath').readOnly;
    if (split) field(form, 'pdfPath').value = state.paths[0];
    const list = document.getElementById('pdfPartsList');
    list.replaceChildren();
    state.paths.forEach((value, index) => {
        const row = document.createElement('div');
        row.className = 'admin-pdf-part-card';
        const heading = document.createElement('div');
        heading.className = 'admin-pdf-part-heading';
        const number = document.createElement('span');
        number.className = 'admin-pdf-part-number';
        number.textContent = String(index + 1).padStart(2, '0');
        const filename = document.createElement('strong');
        filename.textContent = value.split('/').pop();
        heading.append(number, filename);
        const controls = document.createElement('div');
        controls.className = 'admin-file-name';
        const input = document.createElement('input');
        input.value = value;
        input.readOnly = true;
        input.setAttribute('aria-label', `分割PDF ${index + 1}のパス`);
        const copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'admin-button admin-button--secondary';
        copy.textContent = 'パスをコピー';
        copy.disabled = !enabled;
        copy.onclick = async () => {
            try { await navigator.clipboard.writeText(value); showAdminToast('パスをコピーしました。', 'edit'); }
            catch { showAdminToast('コピーできませんでした。パスを選択してコピーしてください。', 'error'); }
        };
        controls.append(input, copy);
        if (index === state.paths.length - 1) {
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'admin-button admin-button--danger';
            remove.textContent = state.paths.length === 1 ? '分割登録を解除' : '最後のPDFを外す';
            remove.setAttribute('aria-label', `${index + 1}番目のPDFの登録を外す`);
            remove.disabled = !enabled;
            remove.onclick = () => {
                state.paths.pop();
                if (!state.paths.length) field(form, 'pdfPath').value = `./pdf/${field(form, 'id').value}.pdf`;
                render(form);
            };
            controls.append(remove);
        }
        row.append(heading, controls);
        list.append(row);
    });
    document.getElementById('addPdfPart').disabled = !enabled || state.paths.length >= 99;
}
