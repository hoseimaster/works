import { validateAdminPublications } from './validate.js';

export function updateAdminValidation(records) {
  if (!document.getElementById('adminValidation')) return;
  const result = validateAdminPublications(records);
  const groups = [
    [result.notices, 'validationNoticeCount', 'validationNotices'],
    [result.warnings, 'validationWarningCount', 'validationWarnings'],
    [result.errors, 'validationErrorCount', 'validationErrors']
  ];

  for (const [issues, countId, listId] of groups) {
    document.getElementById(countId).textContent = String(issues.length);
    const list = document.getElementById(listId);
    list.replaceChildren();
    if (!issues.length) {
      const empty = document.createElement('li');
      empty.textContent = '該当する項目はありません。';
      list.append(empty);
      continue;
    }

    for (const issue of issues) {
      const item = document.createElement('li');
      const title = document.createElement('strong');
      const content = document.createElement('span');
      const value = document.createElement('small');
      title.textContent = `${issue.固有番号} · ${issue.確認箇所}`;
      content.textContent = issue.内容;
      value.textContent = `現在値：${issue.現在値}`;
      item.append(title, content, value);
      list.append(item);
    }
  }
}
