/**
 * 制作物データを管理者画面で検証する。公開画面では呼び出さない。
 */
export function validateAdminPublications(publications) {
    if (!Array.isArray(publications)) {
        return {errors: [{種別: "エラー", 固有番号: "ID未設定", 確認箇所: "publication", 内容: "制作物データは配列で指定してください。", 現在値: String(publications)}], warnings: [], notices: [], total: 0};
    }

    const VALID_CATEGORIES = ["会誌", "検定本", "リーフレット", "その他", "グッズ・特典"];
    const VALID_BRANDS = [
        "THE IDOLM@STER",
        "シンデレラガールズ",
        "ミリオンライブ！",
        "SideM",
        "シャイニーカラーズ",
        "学園アイドルマスター",
        "その他"
    ];
    const VALID_SITE_STATUSES = ["電子版公開中", "電子版販売中","非公開"];

    const errors = [];
    const warnings = [];
    const notices = [];

    const normalize = value =>
        String(value ?? "").normalize("NFKC").trim();

    const getId = item =>
        normalize(item?.id) || "ID未設定";

    function addIssue(type, item, index, field, message, value) {
        const labels = {
            error: "エラー",
            warning: "警告",
            notice: "確認"
        };

        const issue = {
            種別: labels[type] ?? type,
            固有番号: getId(item),
            確認箇所: field,
            内容: message,
            現在値:
                value === undefined
                    ? "undefined"
                    : typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)
        };

        if (type === "error") {
            errors.push(issue);
        } else if (type === "warning") {
            warnings.push(issue);
        } else if (type === "notice") {
            notices.push(issue);
        }
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
            addIssue(
                "error",
                item,
                index,
                field,
                `${field} が未設定です。`,
                value
            );
            return;
        }

        if (!isEmpty(value) && typeof value !== "string") {
            addIssue(
                "error",
                item,
                index,
                field,
                `${field} は文字列で指定してください。`,
                value
            );
        }
    }

    function checkOptionalField(item, index, field, label) {
        const value = item[field];

        if (isEmpty(value)) {
            addIssue(
                "notice",
                item,
                index,
                field,
                `${label}が未入力です。`,
                value
            );
            return;
        }

        if (typeof value !== "string") {
            addIssue(
                "error",
                item,
                index,
                field,
                `${field} は文字列で指定してください。`,
                value
            );
        }
    }

    function checkArray(item, index, field, required = false) {
        const value = item[field];

        if (!Array.isArray(value)) {
            addIssue(
                "error",
                item,
                index,
                field,
                `${field} は配列で指定してください。`,
                value
            );
            return;
        }

        if (required && value.length === 0) {
            addIssue(
                "warning",
                item,
                index,
                field,
                `${field} が空の配列です。`,
                value
            );
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
            normalized.filter((v, i, arr) =>
                v && arr.indexOf(v) !== i
            )
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

    function isAllowedValue(value, allowed) {
        const normalizedValue = normalize(value);

        return allowed.some(
            allowedValue =>
                normalize(allowedValue) === normalizedValue
        );
    }

    function checkAllowedValue(item, index, field, allowed) {
        const value = normalize(item[field]);

        if (value && !isAllowedValue(item[field], allowed)) {
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

            if (value && !isAllowedValue(entry, allowed)) {
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

        ["id", "category", "publishDate"].forEach(
            field => checkString(item, index, field, true)
        );

        checkOptionalField(
            item,
            index,
            "title",
            "タイトル欄"
        );

        checkOptionalField(
            item,
            index,
            "description",
            "説明欄"
        );

        checkOptionalField(
            item,
            index,
            "coverImage",
            "イメージ欄"
        );

        checkOptionalField(
            item,
            index,
            "detailUrl",
            "URL欄"
        );

        checkArray(item, index, "brands", true);
        checkArray(item, index, "siteStatuses", true);
        checkArray(item, index, "keywords");

        if (
            typeof item.publishDate === "string" &&
            !isEmpty(item.publishDate) &&
            !isValidDate(item.publishDate)
        ) {
            addIssue(
                "error",
                item,
                index,
                "publishDate",
                "publishDate は YYYY-MM-DD 形式の実在する日付で指定してください。",
                item.publishDate
            );
        }

        if (
            "hasInterview" in item &&
            typeof item.hasInterview !== "boolean"
        ) {
            addIssue(
                "error",
                item,
                index,
                "hasInterview",
                "hasInterview は true または false で指定してください。",
                item.hasInterview
            );
        }

        checkAllowedValue(
            item,
            index,
            "category",
            VALID_CATEGORIES
        );

        checkAllowedArray(
            item,
            index,
            "brands",
            VALID_BRANDS
        );

        checkAllowedArray(
            item,
            index,
            "siteStatuses",
            VALID_SITE_STATUSES
        );

        Object.keys(item).forEach(key => {
            if (
                typeof item[key] === "string" &&
                item[key] !== item[key].trim()
            ) {
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

            if (!map.has(id)) {
                map.set(id, []);
            }

            map.get(id).push(index);
        });

        map.forEach((indexes, id) => {
            if (indexes.length < 2) return;

            const duplicateIds = indexes
                .map(index => getId(data[index]))
                .join(", ");

            indexes.forEach(index => {
                addIssue(
                    "error",
                    data[index],
                    index,
                    "id",
                    `固有番号「${id}」が重複しています。該当固有番号: ${duplicateIds}`,
                    data[index].id
                );
            });
        });
    }

    publications.forEach(validateItem);
    checkDuplicateIds(publications);
    return {errors, warnings, notices, total: publications.length};
}
