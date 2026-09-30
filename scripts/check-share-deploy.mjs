import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.SHARE_BASE_URL || 'https://hoseimaster.github.io/works/';
const directory = process.env.SHARE_DIRECTORY || 'share';
const commit = process.env.GITHUB_SHA;
if (!commit) throw new Error('GITHUB_SHAが設定されていません。');
const hash = createHash('sha256');
hash.update('archive-share-deploy-v1\0');
hash.update(commit);
hash.update('\0');

async function digestDirectory(directoryPath, relative = '') {
    const entries = await readdir(directoryPath, { withFileTypes: true });
    entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const entry of entries) {
        const name = relative ? `${relative}/${entry.name}` : entry.name;
        const full = path.join(directoryPath, entry.name);
        if (entry.isDirectory()) await digestDirectory(full, name);
        else if (entry.isFile()) {
            const content = await readFile(full);
            hash.update(`${name}\0${content.length}\0`);
            hash.update(content);
            hash.update('\0');
        }
    }
}

await digestDirectory(directory);
const fingerprint = hash.digest('hex');
let same = false;
if (process.env.FORCE_DEPLOY !== 'true') {
    try {
        const url = new URL('share-build.json', base.endsWith('/') ? base : `${base}/`);
        url.searchParams.set('check', String(Date.now()));
        const response = await fetch(url, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
            signal: AbortSignal.timeout(20000)
        });
        if (response.ok) {
            const previous = await response.json();
            same = previous.version === 1 && previous.fingerprint === fingerprint;
        }
    } catch {
        console.log('公開済み状態を確認できないため、配信を実行します。');
    }
}
await writeFile('share-build.json', JSON.stringify({ version: 1, fingerprint }), 'utf8');
const changed = !same;
if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\n`, 'utf8');
}
console.log(changed ? '変更あり：配信します。' : '変更なし：アップロードと配信を省略します。');
