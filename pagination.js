/**
 * 制作物アーカイブ
 * 表示件数切り替え・ページネーション
 */

const PAGE_SIZE_OPTIONS = [20, 50, 100, "all"];
const DEFAULT_PAGE_SIZE = 20;
const STORAGE_KEY = "archivePageSize";

/**
 * 表示件数切り替えとページネーションを初期化します。
 *
 * @param {{ store: object }} options
 */
export function initializePagination({
    store
}) {
    validateStore(store);

    const publicationList =
        document.getElementById(
            "publicationList"
        );

    if (!publicationList) {
        console.warn(
            "pagination.js: #publicationListが見つかりません。"
        );

        return;
    }

    const elements =
        createPaginationElements(
            publicationList
        );

    let currentPage = 1;
    let pageSize =
        restorePageSize();
    let previousListSignature = "";

    elements.pageSizeSelect.value =
        String(pageSize);

    elements.pageSizeSelect
        .addEventListener(
            "change",
            () => {
                pageSize =
                    normalizePageSize(
                        elements
                            .pageSizeSelect
                            .value
                    );

                currentPage = 1;

                savePageSize(
                    pageSize
                );

                applyPagination();
            }
        );

    [
        elements.paginationTop,
        elements.paginationBottom
    ].forEach(
        (paginationElement) => {
            paginationElement
                ?.addEventListener(
                    "click",
                    (event) => {
                        const button =
                            event.target.closest(
                                "[data-page]"
                            );

                        if (
                            !button ||
                            button.disabled
                        ) {
                            return;
                        }

                        const requestedPage =
                            Number(
                                button.dataset.page
                            );

                        if (
                            !Number.isInteger(
                                requestedPage
                            ) ||
                            requestedPage < 1
                        ) {
                            return;
                        }

                        currentPage =
                            requestedPage;

                        applyPagination();

                        scrollToResults(
                            publicationList
                        );
                    }
                );
        }
    );

    store.subscribe(
        (state) => {
            const publications =
                Array.isArray(
                    state.visiblePublications
                )
                    ? state.visiblePublications
                    : [];

            const nextSignature =
                createListSignature(
                    publications
                );

            if (
                nextSignature !==
                previousListSignature
            ) {
                previousListSignature =
                    nextSignature;

                currentPage = 1;
            }

            queueMicrotask(
                applyPagination
            );
        }
    );

    function applyPagination() {
        const state =
            store.getState();

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

        const filteredCount =
            visiblePublications.length;

        const totalCount =
            allPublications.length;

        updateAllOptionLabel({
            select:
                elements.pageSizeSelect,
            filteredCount
        });

        const effectivePageSize =
            pageSize === "all"
                ? Math.max(
                    filteredCount,
                    1
                )
                : pageSize;

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    filteredCount /
                    effectivePageSize
                )
            );

        currentPage =
            Math.min(
                Math.max(
                    currentPage,
                    1
                ),
                totalPages
            );

        const startIndex =
            (currentPage - 1) *
            effectivePageSize;

        const endIndex =
            Math.min(
                startIndex +
                effectivePageSize,
                filteredCount
            );

        const cards =
            Array.from(
                publicationList.children
            );

        cards.forEach(
            (card, index) => {
                const shouldShow =
                    index >= startIndex &&
                    index < endIndex;

                card.hidden =
                    !shouldShow;
            }
        );

        updateSummary({
            totalCount,
            filteredCount,
            startIndex,
            endIndex,
            summary:
                elements.summary
        });

        [
            elements.paginationTop,
            elements.paginationBottom
        ].forEach(
            (container) => {
                renderPaginationButtons({
                    currentPage,
                    totalPages,
                    container
                });
            }
        );

        const hasResults =
            filteredCount > 0;

        elements.root.hidden =
            !hasResults;

        const shouldHidePagination =
            !hasResults ||
            totalPages <= 1;

        elements.paginationTop.hidden =
            shouldHidePagination;

        elements.paginationBottom.hidden =
            shouldHidePagination;
    }
}


/* ========================================
   UI生成
======================================== */

function createPaginationElements(
    publicationList
) {
    removeExistingPagination();

    const root =
        document.createElement(
            "section"
        );

    root.id =
        "archivePaginationControls";

    root.className =
        "archive-pagination-controls";

    root.setAttribute(
        "aria-label",
        "制作物の表示件数・並び替え・ページ移動"
    );

    const topRow =
        document.createElement(
            "div"
        );

    topRow.className =
        "archive-pagination-controls__top";

    const summary =
        document.createElement(
            "p"
        );

    summary.className =
        "archive-pagination-controls__summary";

    summary.dataset.paginationSummary =
        "";

    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "archive-pagination-controls__actions";

    const sizeArea =
        createPageSizeControl();

    const existingSortArea =
        getExistingSortArea();

    actions.appendChild(
        sizeArea.wrapper
    );

    if (existingSortArea) {
        prepareSortArea(
            existingSortArea
        );

        actions.appendChild(
            existingSortArea
        );
    }

    topRow.append(
        summary,
        actions
    );

    const paginationTop =
        createPaginationNavigation({
            position: "top",
            ariaLabel:
                "制作物一覧のページ（上部）"
        });

    const paginationBottom =
        createPaginationNavigation({
            position: "bottom",
            ariaLabel:
                "制作物一覧のページ（下部）"
        });

    root.append(
        topRow,
        paginationTop
    );

    publicationList.before(
        root
    );

    publicationList.after(
        paginationBottom
    );

    return {
        root,
        summary,
        pageSizeSelect:
            sizeArea.select,
        paginationTop,
        paginationBottom
    };
}

function createPageSizeControl() {
    const wrapper =
        document.createElement(
            "label"
        );

    wrapper.className =
        "archive-pagination-controls__size";

    const label =
        document.createElement(
            "span"
        );

    label.className =
        "archive-pagination-controls__label";

    label.textContent =
        "表示件数";

    const select =
        document.createElement(
            "select"
        );

    select.className =
        "archive-pagination-controls__select";

    select.dataset.pageSize =
        "";

    select.setAttribute(
        "aria-label",
        "1ページに表示する制作物の件数"
    );

    PAGE_SIZE_OPTIONS.forEach(
        (size) => {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                String(size);

            option.textContent =
                size === "all"
                    ? "全件"
                    : `${size}件`;

            if (size === "all") {
                option.dataset.allOption =
                    "";
            }

            select.appendChild(
                option
            );
        }
    );

    wrapper.append(
        label,
        select
    );

    return {
        wrapper,
        select
    };
}

function getExistingSortArea() {
    return (
        document.querySelector(
            ".archive-sort"
        ) ??
        document.querySelector(
            ".sort-area"
        )
    );
}

function prepareSortArea(
    sortArea
) {
    sortArea.classList.add(
        "archive-pagination-controls__sort"
    );

    let sortLabel =
        sortArea.querySelector(
            ".archive-sort__label"
        );

    if (!sortLabel) {
        sortLabel =
            document.createElement(
                "span"
            );

        sortLabel.className =
            "archive-sort__label";

        sortArea.prepend(
            sortLabel
        );
    }

    sortLabel.textContent =
        "並び替え";
}

function createPaginationNavigation({
    position,
    ariaLabel
}) {
    const pagination =
        document.createElement(
            "nav"
        );

    pagination.className =
        [
            "archive-pagination",
            `archive-pagination--${position}`
        ].join(" ");

    pagination.dataset.pagination =
        position;

    if (position === "top") {
        pagination.dataset.paginationTop =
            "";
    } else {
        pagination.dataset.paginationBottom =
            "";
    }

    pagination.setAttribute(
        "aria-label",
        ariaLabel
    );

    return pagination;
}

function removeExistingPagination() {
    document
        .getElementById(
            "archivePaginationControls"
        )
        ?.remove();

    document
        .querySelectorAll(
            "[data-pagination-bottom]"
        )
        .forEach(
            (element) => {
                element.remove();
            }
        );
}


/* ========================================
   件数表示
======================================== */

function updateSummary({
    totalCount,
    filteredCount,
    startIndex,
    endIndex,
    summary
}) {
    if (!summary) {
        return;
    }

    if (filteredCount === 0) {
        summary.textContent =
            `全${totalCount}件中 0件を表示`;

        return;
    }

    if (
        filteredCount ===
        totalCount
    ) {
        summary.textContent =
            `全${totalCount}件中 ` +
            `${startIndex + 1}〜${endIndex}件を表示`;

        return;
    }

    summary.textContent =
        `全${totalCount}件中 ` +
        `${filteredCount}件が該当・` +
        `${startIndex + 1}〜${endIndex}件を表示`;
}


/* ========================================
   ページ番号
======================================== */

function renderPaginationButtons({
    currentPage,
    totalPages,
    container
}) {
    if (!container) {
        return;
    }

    const fragment =
        document.createDocumentFragment();

    fragment.appendChild(
        createPageButton({
            label: "前へ",
            page:
                currentPage - 1,
            disabled:
                currentPage <= 1,
            className:
                "archive-pagination__button archive-pagination__button--previous"
        })
    );

    createPageNumbers({
        currentPage,
        totalPages
    }).forEach(
        (pageNumber) => {
            if (
                pageNumber ===
                "ellipsis"
            ) {
                const ellipsis =
                    document.createElement(
                        "span"
                    );

                ellipsis.className =
                    "archive-pagination__ellipsis";

                ellipsis.textContent =
                    "…";

                ellipsis.setAttribute(
                    "aria-hidden",
                    "true"
                );

                fragment.appendChild(
                    ellipsis
                );

                return;
            }

            const button =
                createPageButton({
                    label:
                        String(
                            pageNumber
                        ),
                    page:
                        pageNumber,
                    disabled: false,
                    className:
                        "archive-pagination__button archive-pagination__button--number"
                });

            if (
                pageNumber ===
                currentPage
            ) {
                button.classList.add(
                    "is-current"
                );

                button.setAttribute(
                    "aria-current",
                    "page"
                );
            }

            fragment.appendChild(
                button
            );
        }
    );

    fragment.appendChild(
        createPageButton({
            label: "次へ",
            page:
                currentPage + 1,
            disabled:
                currentPage >=
                totalPages,
            className:
                "archive-pagination__button archive-pagination__button--next"
        })
    );

    container.replaceChildren(
        fragment
    );
}

function createPageButton({
    label,
    page,
    disabled,
    className
}) {
    const button =
        document.createElement(
            "button"
        );

    button.type =
        "button";

    button.className =
        className;

    button.textContent =
        label;

    button.dataset.page =
        String(page);

    button.disabled =
        Boolean(disabled);

    return button;
}

function createPageNumbers({
    currentPage,
    totalPages
}) {
    if (totalPages <= 7) {
        return Array.from(
            {
                length:
                    totalPages
            },
            (_, index) =>
                index + 1
        );
    }

    const pages =
        new Set([
            1,
            totalPages,
            currentPage,
            currentPage - 1,
            currentPage + 1
        ]);

    if (currentPage <= 3) {
        pages.add(2);
        pages.add(3);
        pages.add(4);
    }

    if (
        currentPage >=
        totalPages - 2
    ) {
        pages.add(
            totalPages - 1
        );

        pages.add(
            totalPages - 2
        );

        pages.add(
            totalPages - 3
        );
    }

    const sorted =
        [...pages]
            .filter(
                (page) =>
                    page >= 1 &&
                    page <= totalPages
            )
            .sort(
                (a, b) =>
                    a - b
            );

    const result = [];

    sorted.forEach(
        (page, index) => {
            const previous =
                sorted[index - 1];

            if (
                index > 0 &&
                page - previous > 1
            ) {
                result.push(
                    "ellipsis"
                );
            }

            result.push(
                page
            );
        }
    );

    return result;
}


/* ========================================
   ユーティリティ
======================================== */

function validateStore(
    store
) {
    if (
        !store ||
        typeof store.getState !==
            "function" ||
        typeof store.subscribe !==
            "function"
    ) {
        throw new Error(
            "pagination.jsの初期化には有効なstoreが必要です。"
        );
    }
}

function normalizePageSize(
    value
) {
    if (value === "all") {
        return "all";
    }

    const numberValue =
        Number(value);

    return [20, 50, 100]
        .includes(numberValue)
            ? numberValue
            : DEFAULT_PAGE_SIZE;
}

function updateAllOptionLabel({
    select,
    filteredCount
}) {
    const allOption =
        select?.querySelector(
            "[data-all-option]"
        );

    if (!allOption) {
        return;
    }

    allOption.textContent =
        `全件（${filteredCount}件）`;
}

function createListSignature(
    publications
) {
    return publications
        .map(
            (publication, index) =>
                String(
                    publication.id ??
                    publication.slug ??
                    publication.url ??
                    publication.title ??
                    index
                )
        )
        .join("|");
}

function scrollToResults(
    publicationList
) {
    const target =
        document.querySelector(
            ".archive-results-header"
        ) ??
        publicationList;

    target.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function restorePageSize() {
    try {
        return normalizePageSize(
            window.localStorage
                .getItem(
                    STORAGE_KEY
                )
        );
    } catch {
        return DEFAULT_PAGE_SIZE;
    }
}

function savePageSize(
    pageSize
) {
    try {
        window.localStorage
            .setItem(
                STORAGE_KEY,
                String(pageSize)
            );
    } catch {
        // localStorageが利用できない場合も、そのまま動作させます。
    }
}

