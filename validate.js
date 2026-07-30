/**
 * validate.js
 * publications.js のデータ検証
 */

(() => {
    "use strict";

    const VALID_CATEGORIES = ["会誌", "検定本", "リーフレット", "その他"];
    const VALID_BRANDS = [
        "THE IDOLM@STER",
        "シンデレラガールズ",
        "ミリオンライブ！",
        "SideM",
        "シャイニーカラーズ",
        "学園アイドルマスター",
        "その他"
    ];
    const VALID_SITE_STATUSES = ["電子版公開中", "非公開"];

    const errors = [];
    const warnings = [];

    const normalize = value =>
        String(value ?? "").normalize("NFKC").trim();

    const getId = (item, index) =>
        normalize(item?.id) || `未設定（配列番号: ${index}）`;

    function addIssue(type, item, index, field, message, value) {
        const issue = {
            種別: type === "error" ? "エラー" : "警告",
            固有番号: getId(item, index),
            配列番号: index,
            エラー箇所: field,
            内容: message,
            現在値:
                value === undefined
                    ? "undefined"
                    : typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)
        };

        (type === "error" ? errors : warnings).push(issue);
    }

    function isEmpty(value) {
        return value === undefined ||
            value === null ||
            (typeof value === "string" && value.trim() === "");
    }

    function isValidDate(value) {
        if (typeof value !== "string") return false;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return false;

        const [y, m, d] = value.split("-").map(Number);
        const date = new Date(Date.UTC(y, m - 1, d));

        return date.getUTCFullYear() === y &&
            date.getUTCMonth() === m - 1 &&
            date.getUTCDate() === d;
    }

    function checkString(item, index, field, required = false) {
        const value = item[field];

        if (required && isEmpty(value)) {
            addIssue("error", item, index, field, `${field} が未設定です。`, value);
            return;
        }

        if (!isEmpty(value) && typeof value !== "string") {
            addIssue("error", item, index, field, `${field} は文字列で指定してください。`, value);
        }
    }

    function checkArray(item, index, field, required = false) {
        const value = item[field];

        if (!Array.isArray(value)) {
            addIssue("error", item, index, field, `${field} は配列で指定してください。`, value);
            return;
        }

        if (required && value.length === 0) {
            addIssue("warning", item, index, field, `${field} が空の配列です。`, value);
        }

        value.forEach((entry, i) => {
            if (typeof entry !== "string") {
                addIssue(
                    "error",
                    item,
                    index,
                    `${field}[${i}]`,
                    `${field} の各要素は文字列で指定してください。`,
                    entry
                );
            } else if (entry.trim() === "") {
                addIssue(
                    "warning",
                    item,
                    index,
                    `${field}[${i}]`,
                    `${field} に空文字が含まれています。`,
                    entry
                );
            }
        });

        const normalized = value.map(normalize);
        [...new Set(
            normalized.filter((v, i, arr) => v && arr.indexOf(v) !== i)
        )].forEach(v => {
            addIssue(
                "warning",
                item,
                index,
                field,
                `${field} 内で「${v}」が重複しています。`,
                value
            );
        });
    }

    function checkAllowedValue(item, index, field, allowed) {
        const value = normalize(item[field]);
        if (value && !allowed.includes(value)) {
            addIssue(
                "error",
                item,
                index,
                field,
                `定義されていない値「${value}」が使用されています。`,
                item[field]
            );
        }
    }

    function checkAllowedArray(item, index, field, allowed) {
        if (!Array.isArray(item[field])) return;

        item[field].forEach((entry, i) => {
            const value = normalize(entry);

            if (value && !allowed.includes(value)) {
                addIssue(
                    "error",
                    item,
                    index,
                    `${field}[${i}]`,
                    `定義されていない値「${value}」が使用されています。`,
                    entry
                );
            }
        });
    }

    function validateItem(item, index) {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            addIssue(
                "error",
                item,
                index,
                "publication",
                "制作物データはオブジェクトで指定してください。",
                item
            );
            return;
        }

        ["id", "title", "category", "publishDate", "description"].forEach(field =>
            checkString(item, index, field, true)
        );

        checkArray(item, index, "brands", true);
        checkArray(item, index, "siteStatuses", true);
        checkArray(item, index, "keywords");

        if (typeof item.publishDate === "string" &&
            !isEmpty(item.publishDate) &&
            !isValidDate(item.publishDate)) {
            addIssue(
                "error",
                item,
                index,
                "publishDate",
                "publishDate は YYYY-MM-DD 形式の実在する日付で指定してください。",
                item.publishDate
            );
        }

        if ("interview" in item && typeof item.interview !== "boolean") {
            addIssue(
                "error",
                item,
                index,
                "interview",
                "interview は true または false で指定してください。",
                item.interview
            );
        }

        checkAllowedValue(item, index, "category", VALID_CATEGORIES);
        checkAllowedArray(item, index, "brands", VALID_BRANDS);
        checkAllowedArray(item, index, "siteStatuses", VALID_SITE_STATUSES);

        Object.keys(item).forEach(key => {
            if (typeof item[key] === "string" && item[key] !== item[key].trim()) {
                addIssue(
                    "warning",
                    item,
                    index,
                    key,
                    "文字列の先頭または末尾に不要な空白があります。",
                    item[key]
                );
            }
        });
    }

    function checkDuplicateIds(data) {
        const map = new Map();

        data.forEach((item, index) => {
            const id = normalize(item?.id);
            if (!id) return;

            if (!map.has(id)) map.set(id, []);
            map.get(id).push(index);
        });

        map.forEach((indexes, id) => {
            if (indexes.length < 2) return;

            indexes.forEach(index => {
                addIssue(
                    "error",
                    data[index],
                    index,
                    "id",
                    `固有番号「${id}」が重複しています。重複位置: ${indexes.join(", ")}`,
                    data[index].id
                );
            });
        });
    }

    function printResults(data) {
        console.group("%cpublications.js 検証結果", "font-size:16px;font-weight:bold;");
        console.log(`制作物件数: ${data.length}`);
        console.log(`エラー件数: ${errors.length}`);
        console.log(`警告件数: ${warnings.length}`);

        if (errors.length) {
            console.groupCollapsed(`%c❌ エラー ${errors.length}件`, "color:#c62828;font-weight:bold;");
            console.table(errors);
            console.groupEnd();
        } else {
            console.log("%c✅ エラーはありません。", "color:#2e7d32;font-weight:bold;");
        }

        if (warnings.length) {
            console.groupCollapsed(`%c⚠️ 警告 ${warnings.length}件`, "color:#ed6c02;font-weight:bold;");
            console.table(warnings);
            console.groupEnd();
        } else {
            console.log("%c✅ 警告はありません。", "color:#2e7d32;font-weight:bold;");
        }

        console.log("詳細確認用:", { errors, warnings });
        console.groupEnd();

        window.publicationValidationResults = { errors, warnings };
    }

    if (typeof publications === "undefined" || !Array.isArray(publications)) {
        console.error(
            "❌ publications が見つからないか、配列ではありません。publications.js を validate.js より先に読み込んでください。"
        );
        return;
    }

    publications.forEach(validateItem);
    checkDuplicateIds(publications);
    printResults(publications);
})();
