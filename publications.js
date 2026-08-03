/**
 * 制作物アーカイブ
 * 制作物の選択肢・取得・検証管理
 */


import {
    PUBLICATIONS
} from "./publications-data.js";


/* ========================================
   フィルター選択肢
======================================== */

/**
 * 制作物の分類
 *
 * 制作物データのcategoryと
 * 完全に同じ表記にしてください。
 */
export const PUBLICATION_CATEGORIES = [
    {
        value: "リーフレット",
        label: "リーフレット"
    },
    {
        value: "会誌",
        label: "会誌"
    },
    {
        value: "検定本",
        label: "検定本"
    },
    {
        value: "その他",
        label: "その他"
    },
    {
        value: "グッズ・特典",
        label: "グッズ・特典"
    },
];


/**
 * THE IDOLM@STERシリーズのブランド
 *
 * 制作物データのbrandsと
 * 完全に同じ表記にしてください。
 */
export const BRAND_OPTIONS = [
    {
        value: "THE IDOLM@STER",
        label: "THE IDOLM@STER"
    },
    {
        value: "シンデレラガールズ",
        label: "シンデレラガールズ"
    },
    {
        value: "ミリオンライブ！",
        label: "ミリオンライブ！"
    },
    {
        value: "SideM",
        label: "SideM"
    },
    {
        value: "シャイニーカラーズ",
        label: "シャイニーカラーズ"
    },
    {
        value: "学園アイドルマスター",
        label: "学園アイドルマスター"
    },
    {
        value: "その他",
        label: "その他"
    }
];


/**
 * Webサイトへの掲載状況
 *
 * 必要に応じて項目を追加・削除できます。
 */
export const SITE_STATUS_OPTIONS = [
    {
        value: "電子版公開中",
        label: "電子版公開中"
    },
     {
        value: "電子版販売中",
        label: "電子版販売中"
    }
];



/* ========================================
   制作物取得
======================================== */

/**
 * 制作物一覧を取得します。
 *
 * 外部から元データを直接変更されないよう、
 * 複製した配列を返します。
 *
 * @returns {Array<object>}
 */
export function getPublications() {
    return PUBLICATIONS
        .filter((publication) => {
            return (
                publication
                    .publicationPermission ===
                true
            );
        })
        .map(
            clonePublication
        );
}


/**
 * 制作物件数を取得します。
 *
 * @returns {number}
 */
export function getPublicationCount() {
    return PUBLICATIONS.length;
}


/**
 * IDを指定して制作物を取得します。
 *
 * @param {*} publicationId
 * @returns {object|null}
 */
export function getPublicationById(
    publicationId
) {
    const normalizedId =
        String(
            publicationId ?? ""
        ).trim();

    if (!normalizedId) {
        return null;
    }

    const publication =
        PUBLICATIONS.find(
            (item) => {
                return (
                    String(item.id) ===
                    normalizedId
                );
            }
        );

    return publication
        ? clonePublication(
            publication
        )
        : null;
}


/* ========================================
   発行年取得
======================================== */

/**
 * 制作物データから発行年を取得します。
 *
 * 新しい年から古い年の順で返します。
 *
 * @param {Array<object>} publications
 * @returns {Array<number>}
 */
export function getPublicationYears(
    publications = PUBLICATIONS
) {
    if (
        !Array.isArray(
            publications
        )
    ) {
        return [];
    }

    const years =
        publications
            .map((publication) => {
                return getPublicationYear(
                    publication?.publishDate
                );
            })
            .filter(
                Number.isInteger
            );

    return [
        ...new Set(years)
    ].sort(
        (yearA, yearB) => {
            return yearB - yearA;
        }
    );
}


/**
 * 発行日から年を取得します。
 *
 * @param {*} publishDate
 * @returns {number|null}
 */
function getPublicationYear(
    publishDate
) {
    const dateText =
        String(
            publishDate ?? ""
        ).trim();

    if (
        !/^\d{4}-\d{2}-\d{2}$/
            .test(dateText)
    ) {
        return null;
    }

    const year =
        Number(
            dateText.slice(0, 4)
        );

    return Number.isInteger(year)
        ? year
        : null;
}


/* ========================================
   データ検証
======================================== */

/**
 * 制作物データを検証します。
 *
 * @param {Array<object>} publications
 * @returns {{
 *   isValid: boolean,
 *   errors: Array<string>,
 *   warnings: Array<string>
 * }}
 */
export function validatePublications(
    publications = PUBLICATIONS
) {
    const errors = [];
    const warnings = [];

    if (
        !Array.isArray(
            publications
        )
    ) {
        return {
            isValid: false,

            errors: [
                "制作物データが配列ではありません。"
            ],

            warnings
        };
    }

    const usedIds =
        new Set();

    publications.forEach(
        (publication, index) => {
            const position =
                index + 1;

            if (
                !publication ||
                typeof publication !==
                    "object" ||
                Array.isArray(
                    publication
                )
            ) {
                errors.push(
                    `${position}件目の制作物データがオブジェクトではありません。`
                );

                return;
            }

            validateRequiredText({
                publication,
                key: "id",
                label: "ID",
                position,
                errors
            });

            validateRequiredText({
                publication,
                key: "title",
                label: "タイトル",
                position,
                errors
            });

            validateRequiredText({
                publication,
                key: "category",
                label: "分類",
                position,
                errors
            });

            validateRequiredText({
                publication,
                key: "publishDate",
                label: "発行日",
                position,
                errors
            });

            validateId({
                publication,
                position,
                usedIds,
                errors
            });

            validatePublishDate({
                publication,
                position,
                errors
            });

            validateCategory({
                publication,
                position,
                errors,
                warnings
            });

            validateBrands({
                publication,
                position,
                errors,
                warnings
            });

            validateInterview({
                publication,
                position,
                errors
            });

            validateSiteStatuses({
                publication,
                position,
                errors,
                warnings
            });



            validatePaths({
                publication,
                position,
                warnings
            });
        }
    );

    return {
        isValid:
            errors.length === 0,

        errors,
        warnings
    };
}


/* ========================================
   必須項目検証
======================================== */

function validateRequiredText({
    publication,
    key,
    label,
    position,
    errors
}) {
    const value =
        String(
            publication[key] ?? ""
        ).trim();

    if (!value) {
        errors.push(
            `${position}件目の${label}が入力されていません。`
        );
    }
}


/* ========================================
   ID検証
======================================== */

function validateId({
    publication,
    position,
    usedIds,
    errors
}) {
    const id =
        String(
            publication.id ?? ""
        ).trim();

    if (!id) {
        return;
    }

    if (
        usedIds.has(id)
    ) {
        errors.push(
            `${position}件目のID「${id}」が重複しています。`
        );

        return;
    }

    usedIds.add(id);

    if (
        !/^[a-zA-Z0-9_-]+$/
            .test(id)
    ) {
        errors.push(
            `${position}件目のID「${id}」には英数字、ハイフン、アンダースコアのみ使用できます。`
        );
    }
}


/* ========================================
   発行日検証
======================================== */

function validatePublishDate({
    publication,
    position,
    errors
}) {
    const publishDate =
        String(
            publication.publishDate ??
            ""
        ).trim();

    if (!publishDate) {
        return;
    }

    if (
        !isValidDate(
            publishDate
        )
    ) {
        errors.push(
            `${position}件目の発行日「${publishDate}」がYYYY-MM-DD形式の正しい日付ではありません。`
        );
    }
}


function isValidDate(
    dateText
) {
    if (
        !/^\d{4}-\d{2}-\d{2}$/
            .test(dateText)
    ) {
        return false;
    }

    const [
        year,
        month,
        day
    ] = dateText
        .split("-")
        .map(Number);

    const date =
        new Date(
            year,
            month - 1,
            day
        );

    return (
        date.getFullYear() === year &&
        date.getMonth() ===
            month - 1 &&
        date.getDate() === day
    );
}


/* ========================================
   分類検証
======================================== */

function validateCategory({
    publication,
    position,
    errors,
    warnings
}) {
    const category =
        String(
            publication.category ?? ""
        ).trim();

    if (!category) {
        return;
    }

    const validCategories =
        getOptionValues(
            PUBLICATION_CATEGORIES
        );

    if (
        !validCategories.includes(
            category
        )
    ) {
        warnings.push(
            `${position}件目の分類「${category}」はPUBLICATION_CATEGORIESに登録されていません。`
        );
    }

    if (
        Array.isArray(
            publication.category
        )
    ) {
        errors.push(
            `${position}件目のcategoryは配列ではなく文字列で指定してください。`
        );
    }
}


/* ========================================
   ブランド検証
======================================== */

function validateBrands({
    publication,
    position,
    errors,
    warnings
}) {
    if (
        !Array.isArray(
            publication.brands
        )
    ) {
        errors.push(
            `${position}件目のbrandsは配列で指定してください。`
        );

        return;
    }

    const validBrands =
        getOptionValues(
            BRAND_OPTIONS
        );

    publication.brands.forEach(
        (brand) => {
            const normalizedBrand =
                String(
                    brand ?? ""
                ).trim();

            if (!normalizedBrand) {
                errors.push(
                    `${position}件目のbrandsに空の値があります。`
                );

                return;
            }

            if (
                !validBrands.includes(
                    normalizedBrand
                )
            ) {
                warnings.push(
                    `${position}件目のブランド「${normalizedBrand}」はBRAND_OPTIONSに登録されていません。`
                );
            }
        }
    );
}


/* ========================================
   インタビュー検証
======================================== */

function validateInterview({
    publication,
    position,
    errors
}) {
    if (
        typeof publication.hasInterview !==
            "boolean"
    ) {
        errors.push(
            `${position}件目のhasInterviewはtrueまたはfalseで指定してください。`
        );
    }
}


/* ========================================
   掲載状況検証
======================================== */

function validateSiteStatuses({
    publication,
    position,
    errors,
    warnings
}) {
    if (
        !Array.isArray(
            publication.siteStatuses
        )
    ) {
        errors.push(
            `${position}件目のsiteStatusesは配列で指定してください。`
        );

        return;
    }

    const validStatuses =
        getOptionValues(
            SITE_STATUS_OPTIONS
        );

    publication.siteStatuses.forEach(
        (status) => {
            const normalizedStatus =
                String(
                    status ?? ""
                ).trim();

            if (!normalizedStatus) {
                errors.push(
                    `${position}件目のsiteStatusesに空の値があります。`
                );

                return;
            }

            if (
                !validStatuses.includes(
                    normalizedStatus
                )
            ) {
                warnings.push(
                    `${position}件目の掲載状況「${normalizedStatus}」はSITE_STATUS_OPTIONSに登録されていません。`
                );
            }
        }
    );
}


/* ========================================
   パス検証
======================================== */

function validatePaths({
    publication,
    position,
    warnings
}) {
    const coverImage =
        String(
            publication.coverImage ?? ""
        ).trim();

    const detailUrl =
        String(
            publication.detailUrl ?? ""
        ).trim();

    if (!coverImage) {
        warnings.push(
            `${position}件目の表紙画像が設定されていません。`
        );
    }

    if (!detailUrl) {
        warnings.push(
            `${position}件目の詳細ページURLが設定されていません。`
        );
    }
}


/* ========================================
   選択肢補助
======================================== */

function getOptionValues(
    options
) {
    if (!Array.isArray(options)) {
        return [];
    }

    return options
        .map((option) => {
            if (
                option &&
                typeof option ===
                    "object"
            ) {
                return String(
                    option.value ?? ""
                ).trim();
            }

            return String(
                option ?? ""
            ).trim();
        })
        .filter(Boolean);
}


/* ========================================
   データ複製
======================================== */

function clonePublication(
    publication
) {
    return {
        ...publication,

        brands:
            Array.isArray(
                publication.brands
            )
                ? [
                    ...publication.brands
                ]
                : [],

        siteStatuses:
            Array.isArray(
                publication.siteStatuses
            )
                ? [
                    ...publication
                        .siteStatuses
                ]
                : []
    };
}
