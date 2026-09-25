export async function findMissingCovers(records) {
  const checks = records.map(item => new Promise(resolve => {
    if (!item.coverImage) {
      resolve(item);
      return;
    }
    const image = new Image();
    let finished = false;
    const timer = window.setTimeout(() => finish(false), 10000);
    function finish(found) {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      resolve(found ? null : item);
    }
    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    image.src = item.coverImage;
  }));
  return (await Promise.all(checks)).filter(Boolean);
}
