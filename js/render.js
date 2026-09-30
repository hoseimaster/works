import { publicationHash } from "./publication-links.js";

const IMAGE_PRELOAD_DELAY = 300;
const IMAGE_PRELOAD_CONCURRENCY = 3;
const IMAGE_PRELOAD_RETRY_DELAY = 120;

let imagePreloadGeneration = 0;
let imagePreloadTimer = null;
let imagePreloadResumeTimer = null;
let imagePreloadLoadedCount = 0;
let imagePreloadTotalCount = 0;
let imagePreloadActiveCount = 0;
let imagePreloadFailedCount = 0;
let imagePreloadStatusTimer = null;
let imagePreloadQueue = [];
const preloadedImagePaths = new Set();
const publicationCards = new Map();

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
            ),

        preloadStatus:
            document.getElementById(
                "imagePreloadStatus"
            )
    };
}

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

function renderPublicationList(publications, container) {
    if (!container) return;
    if (!Array.isArray(publications) || publications.length === 0) {
        container.replaceChildren();
        publicationCards.clear();
        container.hidden = true;
        return;
    }

    const nextCards = new Map();
    const today = new Date().toDateString();
    let cursor = container.firstElementChild;
    publications.forEach((publication, index) => {
        const key = String(publication.id);
        const signature = JSON.stringify([publication, Math.min(index, 4), today]);
        const cached = publicationCards.get(key);
        const card = cached?.signature === signature
            ? cached.card
            : createPublicationCard(publication, index);
        if (card === cursor) cursor = cursor.nextElementSibling;
        else container.insertBefore(card, cursor);
        nextCards.set(key, { card, signature });
    });
    while (cursor) {
        const next = cursor.nextElementSibling;
        cursor.remove();
        cursor = next;
    }
    publicationCards.clear();
    nextCards.forEach((entry, key) => publicationCards.set(key, entry));
    container.hidden = false;
}

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

    const cardLink = document.createElement("a");
    cardLink.className = "publication-card__link";
    cardLink.href = publicationHash(String(publication.id));

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

    image.width = 700;
    image.height = 990;

    const isFirstImage =
        Number.isInteger(index) &&
        index === 0;

    const isInitialImage =
        Number.isInteger(index) &&
        index >= 0 &&
        index < 4;

    image.loading =
        isInitialImage
            ? "eager"
            : "lazy";

    image.fetchPriority =
        isFirstImage
            ? "high"
            : isInitialImage
                ? "auto"
                : "low";

    image.decoding = "async";

    const imagePath =
        normalizeImagePath(
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
    imagePreloadFailedCount = 0;

    updateImagePreloadProgress();

    if (paths.length > 0) {
        updateImagePreloadStatus(
            "loading"
        );
    }

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
            } else {
                imagePreloadFailedCount++;
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

function cancelScheduledImagePreload() {
    imagePreloadGeneration++;

    imagePreloadQueue = [];
    imagePreloadActiveCount = 0;
    imagePreloadLoadedCount = 0;
    imagePreloadTotalCount = 0;
    imagePreloadFailedCount = 0;

    updateImagePreloadProgress();
    hideImagePreloadStatus();

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

    const statusRow =
        document.createElement(
            "div"
        );

    statusRow.className =
        "image-preload-status-row";

    const status =
        document.createElement(
            "span"
        );

    status.id =
        "imagePreloadStatus";

    status.className =
        "image-preload-status";

    status.setAttribute(
        "aria-live",
        "polite"
    );

    status.hidden = true;

    statusRow.appendChild(
        status
    );

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
        statusRow,
        progress
    );

    elements.preloadProgress =
        progress;

    elements.preloadStatus =
        status;

    updateImagePreloadProgress();
}

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

    updateImagePreloadStatus(
        "complete"
    );
}

function updateImagePreloadStatus(
    state
) {
    const element =
        document.getElementById(
            "imagePreloadStatus"
        );

    if (!element) {
        return;
    }

    if (
        imagePreloadStatusTimer !==
        null
    ) {
        window.clearTimeout(
            imagePreloadStatusTimer
        );

        imagePreloadStatusTimer =
            null;
    }

    element.classList.remove(
        "is-loading",
        "is-complete",
        "is-error",
        "is-hiding"
    );

    const config = {
        loading: {
            text:
                "制作物データ読み込み中",
            className:
                "is-loading"
        },

        complete: {
            text:
                "制作物データ読み込み完了",
            className:
                "is-complete"
        },

        error: {
            text:
                "制作物データ読み込みエラー",
            className:
                "is-error"
        }
    }[state];

    if (!config) {
        hideImagePreloadStatus();

        return;
    }

    element.textContent =
        config.text;

    element.hidden = false;

    window.requestAnimationFrame(
        () => {
            element.classList.add(
                config.className
            );
        }
    );

    if (state === "complete") {
        imagePreloadStatusTimer =
            window.setTimeout(
                () => {
                    element.classList.add(
                        "is-hiding"
                    );

                    imagePreloadStatusTimer =
                        window.setTimeout(
                            () => {
                                hideImagePreloadStatus();
                            },
                            220
                        );
                },
                1100
            );
    }
}

function hideImagePreloadStatus() {
    const element =
        document.getElementById(
            "imagePreloadStatus"
        );

    if (!element) {
        return;
    }

    element.hidden = true;

    element.classList.remove(
        "is-loading",
        "is-complete",
        "is-error",
        "is-hiding"
    );

    element.textContent = "";
}

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

function createCoverAltText(
    publication
) {
    const title =
        String(publication.title ?? "").trim() || "制作物";

    return `${title}の表紙`;
}

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

function escapeSvgText(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

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

    linkLabel.textContent = "詳細を見る";

    linkLabel.setAttribute(
        "aria-hidden",
        "true"
    );

    content.appendChild(
        linkLabel
    );

    return content;
}

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

    elements.resultCount =
        document.getElementById(
            "resultCount"
        );
}

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

function hideLoadingMessage(
    element
) {
    if (!element) {
        return;
    }

    element.hidden = true;
}

function hideErrorMessage(
    element
) {
    if (!element) {
        return;
    }

    element.hidden = true;
}

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

function createPublicationSignature(
    publications
) {
    if (!Array.isArray(publications)) {
        return [];
    }

    return publications.map(
        (publication) => {
            return JSON.stringify(publication);
        }
    );
}
