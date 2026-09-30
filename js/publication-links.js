export function publicationHash(id, type = 'modal') {
  if (!/^publication-[0-9]{6}$/.test(id)) throw Error('制作物IDが正しくありません。');
  return `#${type === 'library' ? 'pdf' : 'publication'}/${id}`;
}

export function publicationUrl(id, type = 'modal') {
  const url = new URL(location.href);
  url.pathname = url.pathname.replace(/index\.html$/i, '');
  url.search = '';
  url.hash = publicationHash(id, type);
  return url.href;
}
