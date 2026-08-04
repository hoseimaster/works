/**
 * 制作物アーカイブ
 * 制作物一覧の描画処理
 */


const IMAGE_PRELOAD_DELAY = 300;
const IMAGE_PRELOAD_CONCURRENCY = 3;
const IMAGE_PRELOAD_RETRY_DELAY = 120;

let imagePreloadGeneration = 0;
let imagePreloadTimer = null;
let imagePreloadResumeTimer = null;
let imagePreloadLoadedCount = 0;
let imagePreloadTotalCount = 0;
let imagePreloadActiveCount = 0;
let imagePreloadQueue = [];
const preloadedImagePaths = new Set();


/* ========================================
   初期化
======================================== */

/**
 * 制作物一覧の描画機能を初期化します。
 *
 * @param {{
 *   store: object
 * }} options
 */
export function initializeRenderer({
    store
}) {
    if (!store) {
        throw new Error(
            "render.jsの初期化にはstoreが必要です。"
        );
    }

    const elements =
        getRenderElements();

    initializeImagePreloadProgress(
        elements
    );

    initializeImagePreloadRuntime();

    initializePublicationListEvents(
        elements
    );

    let previousRenderSignature = "";

    store.subscribe((state) => {
        const signature =
            createRenderSignature(
                state.visiblePublications,
                state.publications,
                state.filters
            );

        if (
            signature ===
            previousRenderSignature
        ) {
            return;
        }

        previousRenderSignature =
            signature;

        renderArchive({
            state,
            elements
        });
    });
}


/* ========================================
   DOM取得
======================================== */

/**
 * 描画処理で使用するDOM要素を取得します。
 *
 * @returns {object}
 */
function getRenderElements() {
    return {
        publicationList:
            document.getElementById(
                "publicationList"
            ),

        resultCount:
            document.getElementById(
                "resultCount"
            ),

        resultSummary:
            document.getElementById(
                "resultSummary"
            ),

        emptyMessage:
            document.getElementById(
                "emptyMessage"
            ),

        loadingMessage:
            document.getElementById(
                "loadingMessage"
            ),

        errorMessage:
            document.getElementById(
                "errorMessage"
            ),

        preloadProgress:
            document.getElementById(
                "imagePreloadProgress"
            )
    };
}


/* ========================================
   全体描画
======================================== */

/**
 * アーカイブ表示を更新します。
 *
 * @param {{
 *   state: object,
 *   elements: object
 * }} options
 */
function renderArchive({
    state,
    elements
}) {
    const visiblePublications =
        Array.isArray(
            state.visiblePublications
        )
            ? state.visiblePublications
            : [];

    const allPublications =
        Array.isArray(
            state.publications
        )
            ? state.publications
            : [];

    hideLoadingMessage(
        elements.loadingMessage
    );

    hideErrorMessage(
        elements.errorMessage
    );

    updateResultSummary({
        visibleCount:
            visiblePublications.length,

        totalCount:
            allPublications.length,

        filters:
            state.filters,

        elements
    });

    renderPublicationList(
        visiblePublications,
        elements.publicationList
    );

    scheduleImagePreload(
        visiblePublications
    );

    updateEmptyMessage({
        isEmpty:
            visiblePublications.length === 0,

        element:
            elements.emptyMessage
    });
}


/* ========================================
   制作物一覧
======================================== */

/**
 * 制作物カード一覧を描画します。
 *
 * @param {Array<object>} publications
 * @param {HTMLElement|null} container
 */
function renderPublicationList(
    publications,
    container
) {
    if (!container) {
        return;
    }

    if (
        !Array.isArray(publications) ||
        publications.length === 0
    ) {
        container.replaceChildren();
        container.hidden = true;

        return;
    }

    const fragment =
        document.createDocumentFragment();

    publications.forEach(
        (publication, index) => {
            fragment.appendChild(
                createPublicationCard(
                    publication,
                    index
                )
            );
        }
    );

    container.replaceChildren(
        fragment
    );

    container.hidden = false;
}


/**
 * 制作物カードを作成します。
 *
 * @param {object} publication
 * @param {number} index
 * @returns {HTMLElement}
 */
function createPublicationCard(
    publication,
    index
) {
    const article =
        document.createElement(
            "article"
        );

    article.className =
        "publication-card";

    if (publication.id) {
        article.dataset.publicationId =
            String(publication.id);
    }

    const detailUrl =
        normalizeDetailUrl(
            publication.detailUrl
        );

    const cardLink =
        document.createElement("a");

    cardLink.className =
        "publication-card__link";

    cardLink.href =
        detailUrl || "#";

    if (!detailUrl) {
        cardLink.dataset.disabledLink =
            "true";

        cardLink.setAttribute(
            "aria-disabled",
            "true"
        );
    }

    const imageArea =
        createPublicationImageArea(
            publication,
            index
        );

    const content =
        createPublicationContent(
            publication
        );

    cardLink.append(
        imageArea,
        content
    );

    article.appendChild(
        cardLink
    );

    return article;
}


/* ========================================
   表紙画像
======================================== */

/**
 * 表紙画像部分を作成します。
 *
 * @param {object} publication
 * @returns {HTMLElement}
 */
function createPublicationImageArea(
    publication,
    index
) {
    const imageArea =
        document.createElement(
            "div"
        );

    imageArea.className =
        "publication-card__image-area";

    const image =
        document.createElement("img");

    image.className =
        "publication-card__image";

    image.alt =
        createCoverAltText(
            publication
        );

    /*
     * 読み込み前から画像領域を確保し、
     * レイアウトのずれを防ぎます。
     */
    image.width = 700;
    image.height = 990;

    image.decoding = "async";

    /*
     * 最初に見える可能性が高い画像だけ優先し、
     * それ以外は遅延読み込みにします。
     */
    const isPriorityImage =
        Number.isInteger(index) &&
        index >= 0 &&
        index < 4;

    image.loading =
        isPriorityImage
            ? "eager"
            : "lazy";

    image.fetchPriority =
        isPriorityImage
            ? "high"
            : "low";

    const imagePath =
        normalizeImagePath(
            publication.thumbnailImage ??
            publication.coverImage
        );

    image.addEventListener(
        "error",
        () => {
            applyFallbackImage(
                image,
                publication.title
            );
        },
        {
            once: true
        }
    );

    if (imagePath) {
        image.src =
            imagePath;
    } else {
        applyFallbackImage(
            image,
            publication.title
        );
    }

    if (
        shouldDisplayNewBadge(
            publication.publishDate
        )
    ) {
        const newBadge =
            document.createElement(
                "span"
            );

        newBadge.className =
            "publication-card__new";

        newBadge.textContent =
            "NEW";

        newBadge.setAttribute(
            "aria-label",
            "新着"
        );

        imageArea.appendChild(
            newBadge
        );
    }

    imageArea.appendChild(
        image
    );

    return imageArea;
}


/* ========================================
   表示外画像の段階的プリロード
======================================== */

/**
 * タブの表示状態が変わった際に、
 * 非表示中は停止し、復帰時にすぐ再開します。
 */
function initializeImagePreloadRuntime() {
    if (
        document.documentElement.dataset
            .imagePreloadRuntimeReady ===
        "true"
    ) {
        return;
    }

    document.documentElement.dataset
        .imagePreloadRuntimeReady =
        "true";

    document.addEventListener(
        "visibilitychange",
        () => {
            if (
                !document.hidden &&
                imagePreloadQueue.length > 0
            ) {
                schedulePreloadPump(
                    0
                );
            }
        }
    );
}

/**
 * 現在の検索結果に含まれる表示外画像を、
 * 初期表示を妨げない速度で並列プリロードします。
 *
 * @param {Array<object>} publications
 */
function scheduleImagePreload(
    publications
) {
    cancelScheduledImagePreload();

    const paths =
        Array.isArray(publications)
            ? createImagePreloadQueue(
                publications
            )
            : [];

    imagePreloadQueue =
        [...paths];

    imagePreloadLoadedCount = 0;
    imagePreloadTotalCount =
        paths.length;
    imagePreloadActiveCount = 0;

    updateImagePreloadProgress();

    if (
        paths.length === 0 ||
        shouldSkipImagePreload()
    ) {
        completeImagePreloadProgress();

        return;
    }

    imagePreloadGeneration++;

    schedulePreloadPump(
        IMAGE_PRELOAD_DELAY
    );
}

/**
 * 画像パスを重複なしでキュー化します。
 * 先頭4件は表示用として優先読み込みされるため除外します。
 *
 * @param {Array<object>} publications
 * @returns {Array<string>}
 */
function createImagePreloadQueue(
    publications
) {
    const uniquePaths =
        new Set();

    publications
        .slice(4)
        .forEach(
            (publication) => {
                const path =
                    normalizeImagePath(
                        publication.thumbnailImage ??
                        publication.coverImage
                    );

                if (
                    path &&
                    !preloadedImagePaths.has(
                        path
                    )
                ) {
                    uniquePaths.add(
                        path
                    );
                }
            }
        );

    return [...uniquePaths];
}

/**
 * プリロード処理の再開を予約します。
 *
 * @param {number} delay
 */
function schedulePreloadPump(
    delay = 0
) {
    if (
        imagePreloadResumeTimer !==
        null
    ) {
        window.clearTimeout(
            imagePreloadResumeTimer
        );
    }

    imagePreloadResumeTimer =
        window.setTimeout(
            () => {
                imagePreloadResumeTimer =
                    null;

                pumpImagePreloadQueue();
            },
            delay
        );
}

/**
 * 最大3枚まで同時に読み込みます。
 * 入力処理が待機している場合は、少し待ってから再開します。
 */
function pumpImagePreloadQueue() {
    if (
        document.hidden ||
        shouldPauseForUserInput()
    ) {
        schedulePreloadPump(
            IMAGE_PRELOAD_RETRY_DELAY
        );

        return;
    }

    const generation =
        imagePreloadGeneration;

    while (
        imagePreloadActiveCount <
            IMAGE_PRELOAD_CONCURRENCY &&
        imagePreloadQueue.length > 0
    ) {
        const nextPath =
            imagePreloadQueue.shift();

        preloadSingleImage({
            path:
                nextPath,
            generation
        });
    }

    if (
        imagePreloadQueue.length === 0 &&
        imagePreloadActiveCount === 0
    ) {
        completeImagePreloadProgress();
    }
}

/**
 * 画像を1枚読み込みます。
 *
 * @param {{
 *   path: string,
 *   generation: number
 * }} options
 */
function preloadSingleImage({
    path,
    generation
}) {
    if (
        generation !==
        imagePreloadGeneration
    ) {
        return;
    }

    imagePreloadActiveCount++;

    const image =
        new Image();

    image.decoding =
        "async";

    image.fetchPriority =
        "low";

    let settled = false;

    const finish =
        ({
            succeeded
        }) => {
            if (settled) {
                return;
            }

            settled = true;

            if (
                generation !==
                imagePreloadGeneration
            ) {
                return;
            }

            if (succeeded) {
                preloadedImagePaths.add(
                    path
                );
            }

            imagePreloadActiveCount =
                Math.max(
                    imagePreloadActiveCount - 1,
                    0
                );

            imagePreloadLoadedCount =
                Math.min(
                    imagePreloadLoadedCount + 1,
                    imagePreloadTotalCount
                );

            updateImagePreloadProgress();

            pumpImagePreloadQueue();
        };

    image.addEventListener(
        "load",
        () => {
            finish({
                succeeded: true
            });
        },
        {
            once: true
        }
    );

    image.addEventListener(
        "error",
        () => {
            finish({
                succeeded: false
            });
        },
        {
            once: true
        }
    );

    image.src =
        path;
}

/**
 * ユーザー入力が待機中なら、
 * プリロード開始を少し遅らせます。
 *
 * @returns {boolean}
 */
function shouldPauseForUserInput() {
    const isInputPending =
        navigator.scheduling
            ?.isInputPending;

    if (
        typeof isInputPending !==
        "function"
    ) {
        return false;
    }

    try {
        return isInputPending.call(
            navigator.scheduling,
            {
                includeContinuous:
                    true
            }
        );
    } catch {
        return false;
    }
}

/**
 * 保留中の処理と古いキューを無効化します。
 */
function cancelScheduledImagePreload() {
    imagePreloadGeneration++;

    imagePreloadQueue = [];
    imagePreloadActiveCount = 0;
    imagePreloadLoadedCount = 0;
    imagePreloadTotalCount = 0;

    updateImagePreloadProgress();

    if (
        imagePreloadTimer !==
        null
    ) {
        window.clearTimeout(
            imagePreloadTimer
        );

        imagePreloadTimer = null;
    }

    if (
        imagePreloadResumeTimer !==
        null
    ) {
        window.clearTimeout(
            imagePreloadResumeTimer
        );

        imagePreloadResumeTimer =
            null;
    }
}

/**
 * 「全○件」と「○〜○件を表示」の間に置く
 * 控えめなプリロード進捗線を生成します。
 *
 * @param {object} elements
 */
function initializeImagePreloadProgress(
    elements
) {
    const existing =
        document.getElementById(
            "imagePreloadProgress"
        );

    if (existing) {
        elements.preloadProgress =
            existing;

        return;
    }

    const resultsHeader =
        document.querySelector(
            ".archive-results-header"
        );

    if (!resultsHeader) {
        return;
    }

    const progress =
        document.createElement(
            "div"
        );

    progress.id =
        "imagePreloadProgress";

    progress.className =
        "image-preload-progress";

    progress.setAttribute(
        "aria-hidden",
        "true"
    );

    const bar =
        document.createElement(
            "span"
        );

    bar.className =
        "image-preload-progress__bar";

    progress.appendChild(
        bar
    );

    resultsHeader.after(
        progress
    );

    elements.preloadProgress =
        progress;

    updateImagePreloadProgress();
}

/**
 * 現在のプリロード進捗率を線へ反映します。
 */
function updateImagePreloadProgress() {
    const progress =
        document.getElementById(
            "imagePreloadProgress"
        );

    if (!progress) {
        return;
    }

    const ratio =
        imagePreloadTotalCount > 0
            ? imagePreloadLoadedCount /
                imagePreloadTotalCount
            : 0;

    const normalizedRatio =
        Math.min(
            Math.max(
                ratio,
                0
            ),
            1
        );

    progress.style.setProperty(
        "--image-preload-progress",
        `${normalizedRatio * 100}%`
    );

    progress.classList.toggle(
        "is-complete",
        normalizedRatio >= 1
    );
}

/**
 * プリロード対象がない場合や完了時に100%へ進めます。
 */
function completeImagePreloadProgress() {
    const progress =
        document.getElementById(
            "imagePreloadProgress"
        );

    if (!progress) {
        return;
    }

    progress.style.setProperty(
        "--image-preload-progress",
        "100%"
    );

    progress.classList.add(
        "is-complete"
    );
}

/**
 * 通信量節約設定や低速回線ではプリロードを停止します。
 *
 * @returns {boolean}
 */
function shouldSkipImagePreload() {
    const connection =
        navigator.connection ??
        navigator.mozConnection ??
        navigator.webkitConnection;

    if (!connection) {
        return false;
    }

    if (
        connection.saveData ===
        true
    ) {
        return true;
    }

    return [
        "slow-2g",
        "2g"
    ].includes(
        connection.effectiveType
    );
}


/**
 * 表紙画像の代替テキストを作成します。
 *
 * @param {object} publication
 * @returns {string}
 */
function createCoverAltText(
    publication
) {
    const title =
        String(publication.title ?? "").trim() || "制作物";

    return `${title}の表紙`;
}


/**
 * 画像がない場合の代替画像を設定します。
 *
 * SVGをData URLとして生成するため、
 * 追加の画像ファイルは不要です。
 *
 * @param {HTMLImageElement} image
 * @param {*} title
 */
function applyFallbackImage(
    image,
    title
) {
    const safeTitle =
        escapeSvgText(
            String(title ?? "").trim() || "NO IMAGE"
                .trim()
                .slice(0, 24)
        );

    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="700"
            height="990"
            viewBox="0 0 700 990"
        >
            <rect
                width="700"
                height="990"
                fill="#f3f3f3"
            />

            <rect
                x="40"
                y="40"
                width="620"
                height="910"
                rx="16"
                fill="none"
                stroke="#cccccc"
                stroke-width="4"
            />

            <text
                x="350"
                y="455"
                text-anchor="middle"
                font-family="sans-serif"
                font-size="34"
                fill="#777777"
            >
                NO IMAGE
            </text>

            <text
                x="350"
                y="515"
                text-anchor="middle"
                font-family="sans-serif"
                font-size="24"
                fill="#999999"
            >
                ${safeTitle}
            </text>
        </svg>
    `;

    image.src =
        `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

    image.classList.add(
        "publication-card__image--fallback"
    );
}


/**
 * SVG内で使用する文字列を安全にします。
 *
 * @param {string} value
 * @returns {string}
 */
function escapeSvgText(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}


/* ========================================
   カード本文
======================================== */

/**
 * 制作物カード本文を作成します。
 *
 * @param {object} publication
 * @returns {HTMLElement}
 */
function createPublicationContent(
    publication
) {
    const content =
        document.createElement(
            "div"
        );

    content.className =
        "publication-card__content";

    const metadata =
        createPublicationMetadata(
            publication
        );

    const title =
        document.createElement("h3");

    title.className =
        "publication-card__title";

    title.textContent =
        String(publication.title ?? "").trim() || "タイトル未設定";

    content.append(
        metadata,
        title
    );

    const brands =
        createBrandList(
            publication.brands
        );

    if (brands) {
        content.appendChild(
            brands
        );
    }

    const badges =
        createPublicationBadges(
            publication
        );

    if (badges) {
        content.appendChild(
            badges
        );
    }

    const description =
        createDescription(
            publication.description
        );

    if (description) {
        content.appendChild(
            description
        );
    }

    const linkLabel =
        document.createElement(
            "span"
        );

    linkLabel.className =
        "publication-card__detail-label";

    linkLabel.textContent =
        normalizeDetailUrl(
            publication.detailUrl
        )
            ? "詳細を見る"
            : "詳細ページ準備中";

    linkLabel.setAttribute(
        "aria-hidden",
        "true"
    );

    content.appendChild(
        linkLabel
    );

    return content;
}


/**
 * 発行日・分類を表示する領域を作成します。
 *
 * @param {object} publication
 * @returns {HTMLElement}
 */
function createPublicationMetadata(
    publication
) {
    const metadata =
        document.createElement(
            "div"
        );

    metadata.className =
        "publication-card__metadata";

    const date =
        document.createElement(
            "time"
        );

    date.className =
        "publication-card__date";

    const publishDate =
        String(
            publication.publishDate ??
            ""
        ).trim();

    if (isValidDateFormat(
        publishDate
    )) {
        date.dateTime =
            publishDate;

        date.textContent =
            formatPublishDate(
                publishDate
            );
    } else {
        date.textContent =
            "発行日未登録";
    }

    metadata.appendChild(date);

    const category =
        String(
            publication.category ??
            ""
        ).trim();

    if (category) {
        const categoryElement =
            document.createElement(
                "span"
            );

        categoryElement.className =
            "publication-card__category";

        categoryElement.textContent =
            category;

        metadata.appendChild(
            categoryElement
        );
    }

    return metadata;
}


/**
 * ブランド一覧を作成します。
 *
 * @param {Array<*>} brands
 * @returns {HTMLElement|null}
 */
function createBrandList(
    brands
) {
    const normalizedBrands =
        normalizeStringArray(
            brands
        );

    if (
        normalizedBrands.length === 0
    ) {
        return null;
    }

    const list =
        document.createElement("ul");

    list.className =
        "publication-card__brands";

    list.setAttribute(
        "aria-label",
        "掲載ブランド"
    );

    normalizedBrands.forEach(
        (brand) => {
            const item =
                document.createElement(
                    "li"
                );

            item.className =
                "publication-card__brand";

            item.textContent =
                brand;

            list.appendChild(
                item
            );
        }
    );

    return list;
}


/**
 * 制作物の特徴を示すバッジを作成します。
 *
 * @param {object} publication
 * @returns {HTMLElement|null}
 */
function createPublicationBadges(
    publication
) {
    const badges = [];

    if (
        publication.hasInterview ===
        true
    ) {
        badges.push({
            className:
                "publication-card__badge--interview",

            label:
                "インタビューあり"
        });
    }

    normalizeStringArray(
        publication.siteStatuses
    )
    .filter((status) => status !== "非公開")
    .forEach((status) => {
        badges.push({
            className:
                "publication-card__badge--status",

            label:
                status
        });
    });

    const coverType =
        String(
            publication.coverType ??
            ""
        ).trim();

    if (coverType) {
        badges.push({
            className:
                "publication-card__badge--cover",

            label:
                `表紙：${coverType}`
        });
    }

    if (badges.length === 0) {
        return null;
    }

    const container =
        document.createElement(
            "div"
        );

    container.className =
        "publication-card__badges";

    badges.forEach((badge) => {
        const badgeElement =
            document.createElement(
                "span"
            );

        badgeElement.className = [
            "publication-card__badge",
            badge.className
        ].join(" ");

        badgeElement.textContent =
            badge.label;

        container.appendChild(
            badgeElement
        );
    });

    return container;
}


/**
 * 説明文を作成します。
 *
 * @param {*} description
 * @returns {HTMLElement|null}
 */
function createDescription(
    description
) {
    const text =
        String(
            description ?? ""
        ).trim();

    if (!text) {
        return null;
    }

    const paragraph =
        document.createElement("p");

    paragraph.className =
        "publication-card__description";

    paragraph.textContent =
        text;

    return paragraph;
}


/* ========================================
   検索結果件数
======================================== */

/**
 * 検索結果件数を更新します。
 *
 * @param {{
 *   visibleCount: number,
 *   totalCount: number,
 *   filters: object,
 *   elements: object
 * }} options
 */
function updateResultSummary({
    visibleCount,
    totalCount,
    filters,
    elements
}) {
    if (elements.resultCount) {
        elements.resultCount.textContent =
            String(visibleCount);
    }

    if (!elements.resultSummary) {
        return;
    }

    const hasFilters =
        hasActiveFilters(
            filters
        );

    const fragment =
        document.createDocumentFragment();

    if (hasFilters) {
        fragment.append(
            document.createTextNode(
                "全"
            )
        );

        const total =
            document.createElement(
                "span"
            );

        total.className =
            "archive-results-header__total";

        total.textContent =
            String(totalCount);

        fragment.append(
            total,
            document.createTextNode(
                "件中 "
            )
        );

        const strong =
            document.createElement(
                "strong"
            );

        strong.id =
            "resultCount";

        strong.textContent =
            String(visibleCount);

        fragment.append(
            strong,
            document.createTextNode(
                "件"
            )
        );
    } else {
        fragment.append(
            document.createTextNode(
                "全"
            )
        );

        const strong =
            document.createElement(
                "strong"
            );

        strong.id =
            "resultCount";

        strong.textContent =
            String(visibleCount);

        fragment.append(
            strong,
            document.createTextNode(
                "件"
            )
        );
    }

    elements.resultSummary
        .replaceChildren(
            fragment
        );

    /*
     * replaceChildrenによりresultCountが
     * 新しい要素へ置き換わるため参照を更新します。
     */
    elements.resultCount =
        document.getElementById(
            "resultCount"
        );
}


/**
 * 検索条件が1つ以上あるか確認します。
 *
 * @param {object} filters
 * @returns {boolean}
 */
function hasActiveFilters(
    filters = {}
) {
    if (
        String(
            filters.keyword ?? ""
        ).trim()
    ) {
        return true;
    }

    return [
        "categories",
        "brands",
        "years",
        "interview",
        "siteStatuses",
        "coverTypes"
    ].some((key) => {
        return (
            Array.isArray(
                filters[key]
            ) &&
            filters[key].length > 0
        );
    });
}


/* ========================================
   該当なし・エラー表示
======================================== */

/**
 * 該当なし表示を更新します。
 *
 * @param {{
 *   isEmpty: boolean,
 *   element: HTMLElement|null
 * }} options
 */
function updateEmptyMessage({
    isEmpty,
    element
}) {
    if (!element) {
        return;
    }

    element.hidden =
        !isEmpty;
}


/**
 * 読み込み中表示を非表示にします。
 *
 * @param {HTMLElement|null} element
 */
function hideLoadingMessage(
    element
) {
    if (!element) {
        return;
    }

    element.hidden = true;
}


/**
 * エラー表示を非表示にします。
 *
 * @param {HTMLElement|null} element
 */
function hideErrorMessage(
    element
) {
    if (!element) {
        return;
    }

    element.hidden = true;
}


/* ========================================
   一覧内イベント
======================================== */

/**
 * 制作物一覧内のイベントを登録します。
 *
 * @param {object} elements
 */
function initializePublicationListEvents(
    elements
) {
    const container =
        elements.publicationList;

    if (!container) {
        return;
    }

    container.addEventListener(
        "click",
        (event) => {
            const disabledLink =
                event.target.closest(
                    '[data-disabled-link="true"]'
                );

            if (!disabledLink) {
                return;
            }

            event.preventDefault();
        }
    );

    container.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key !== "Enter" &&
                event.key !== " "
            ) {
                return;
            }

            const disabledLink =
                event.target.closest(
                    '[data-disabled-link="true"]'
                );

            if (!disabledLink) {
                return;
            }

            event.preventDefault();
        }
    );
}


/* ========================================
   データ整形
======================================== */

/**
 * 発行日からNEW表示の対象か判定します。
 *
 * 未来の日付は常に表示し、
 * 過去の日付は当日を含む31日以内だけ表示します。
 *
 * @param {*} value
 * @returns {boolean}
 */
function shouldDisplayNewBadge(
    value
) {
    const dateText =
        String(value ?? "").trim();

    if (
        !isValidDateFormat(
            dateText
        )
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

    const publishDate =
        new Date(
            year,
            month - 1,
            day
        );

    publishDate.setHours(
        0,
        0,
        0,
        0
    );

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const elapsedDays =
        Math.floor(
            (
                today.getTime() -
                publishDate.getTime()
            ) /
            (
                1000 *
                60 *
                60 *
                24
            )
        );

    return elapsedDays <= 31;
}


/**
 * 発行日を日本語表示へ変換します。
 *
 * @param {string} dateText
 * @returns {string}
 */
function formatPublishDate(
    dateText
) {
    const [
        year,
        month,
        day
    ] = dateText.split("-");

    return [
        Number(year),
        "年",
        Number(month),
        "月",
        Number(day),
        "日"
    ].join("");
}


/**
 * YYYY-MM-DD形式か確認します。
 *
 * @param {*} value
 * @returns {boolean}
 */
function isValidDateFormat(
    value
) {
    const dateText =
        String(value ?? "");

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


/**
 * 文字列配列を正規化します。
 *
 * @param {*} values
 * @returns {Array<string>}
 */
function normalizeStringArray(
    values
) {
    if (!Array.isArray(values)) {
        return [];
    }

    return [
        ...new Set(
            values
                .map((value) => {
                    return String(
                        value ?? ""
                    ).trim();
                })
                .filter(Boolean)
        )
    ];
}


/**
 * 詳細ページURLを整えます。
 *
 * @param {*} value
 * @returns {string}
 */
function normalizeDetailUrl(
    value
) {
    const url =
        String(
            value ?? ""
        ).trim();

    if (
        !url ||
        url === "#"
    ) {
        return "";
    }

    let parsed;

    try {
        parsed = new URL(
            url,
            document.baseURI
        );
    } catch {
        return "";
    }

    if (
        parsed.protocol !== "http:" &&
        parsed.protocol !== "https:"
    ) {
        return "";
    }

    return parsed.href;
}


/**
 * 画像パスを整えます。
 *
 * @param {*} value
 * @returns {string}
 */
function normalizeImagePath(
    value
) {
    const path =
        String(
            value ?? ""
        ).trim();

    if (!path) {
        return "";
    }

    return path;
}


/* ========================================
   描画判定
======================================== */

/**
 * 再描画判定用の署名を作成します。
 *
 * @param {Array<object>} visiblePublications
 * @param {Array<object>} allPublications
 * @param {object} filters
 * @returns {string}
 */
function createRenderSignature(
    visiblePublications,
    allPublications,
    filters
) {
    return JSON.stringify({
        visible:
            createPublicationSignature(
                visiblePublications
            ),

        total:
            Array.isArray(
                allPublications
            )
                ? allPublications.length
                : 0,

        filters
    });
}


/**
 * 制作物一覧の署名を作成します。
 *
 * @param {Array<object>} publications
 * @returns {Array<string>}
 */
function createPublicationSignature(
    publications
) {
    if (!Array.isArray(publications)) {
        return [];
    }

    return publications.map(
        (publication) => {
            return [
                publication.id,
                publication.title,
                publication.publishDate,
                publication.thumbnailImage,
                publication.coverImage,
                publication.detailUrl,
                publication.category,
                publication.hasInterview,
                publication.coverType,
                ...(publication.brands ?? []),
                ...(publication.siteStatuses ?? [])
            ].join("|");
        }
    );
}
