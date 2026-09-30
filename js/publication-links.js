export function publicationHash(id, type = 'modal') {
    if (!/^publication-[0-9]{6}$/.test(id)) throw Error('制作物IDが正しくありません。');
    return `#${type === 'library' ? 'pdf' : 'publication'}/${id}`;
}

export function publicationUrl(id, type = 'modal') {
    publicationHash(id, type);
    const base = new URL('../', import.meta.url);
    return new URL(`share/${id}/${type === 'library' ? 'library/' : ''}`, base).href;
}
