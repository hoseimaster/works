import { api } from "./supabase-api.js";

export const PUBLICATIONS = [];

let pendingPublications = null;

export async function loadPublications() {
    if (!pendingPublications) {
        pendingPublications = fetchPublications().finally(() => {
            pendingPublications = null;
        });
    }
    await pendingPublications;
    return getPublications();
}

async function fetchPublications() {
    const now = Date.now();
    const releaseLimit = encodeURIComponent(new Date(now).toISOString());
    const rows = await api(`/rest/v1/archive_publications?select=*&publication_permission=eq.true&or=(release_at.is.null,release_at.lte.${releaseLimit})&order=publish_date.desc,id.desc`);
    PUBLICATIONS.splice(0, PUBLICATIONS.length, ...rows.filter(row =>
        row.publication_permission === true &&
        (row.release_at == null || (Number.isFinite(Date.parse(row.release_at)) && Date.parse(row.release_at) <= Date.now()))
    ).map(row => ({
        id: row.id,
        title: row.title,
        publishDate: row.publish_date || "",
        category: row.category,
        brands: row.brands || [],
        keywords: row.keywords || [],
        coverImage: row.cover_path ?? `./cover/${row.id}.png`,
        pdfPath: row.pdf_path || "",
        pdfBinding: row.pdf_binding || "left",
        salesUrl: row.sales_url || "",
        publicationPermission: row.publication_permission,
        releaseAt: row.release_at,
        hasInterview: row.has_interview,
        siteStatuses: row.site_statuses || [],
        description: row.description || "",
        previewDescription: row.preview_description || ""
    })));
    return getPublications();
}

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
        label: "その他出版物"
    },
    {
        value: "グッズ・特典",
        label: "グッズ・特典"
    },
];

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

export function getPublications() {
    return PUBLICATIONS
        .filter((publication) => {
            return (
                publication
                    .publicationPermission ===
                true &&
                (!publication.releaseAt ||
                    (Number.isFinite(Date.parse(publication.releaseAt)) && Date.parse(publication.releaseAt) <= Date.now()))
            );
        })
        .map(
            clonePublication
        );
}

export function getPublicationCount() {
    return PUBLICATIONS.length;
}

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

    return publication && publication.publicationPermission === true &&
        (!publication.releaseAt ||
            (Number.isFinite(Date.parse(publication.releaseAt)) && Date.parse(publication.releaseAt) <= Date.now()))
        ? clonePublication(
            publication
        )
        : null;
}

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

function validatePaths({
    publication,
    position,
    warnings
}) {
    const coverImage =
        String(
            publication.coverImage ?? ""
        ).trim();

    if (!coverImage) {
        warnings.push(
            `${position}件目の表紙画像が設定されていません。`
        );
    }

}

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
