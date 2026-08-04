/**
 * 制作物アーカイブ
 * 表示件数切り替え・ページネーション
 *
 * 使用方法:
 *   import { initializePagination } from "./pagination.js";
 *
 *   initializeRenderer({ store });
 *   initializePagination({ store });
 */

const PAGE_SIZE_OPTIONS = [20, 50, 100, "all"];
const DEFAULT_PAGE_SIZE = 20;

export function initializePagination({
    store
}) {
    if (
        !store ||
        typeof store.subscribe !== "function"
    ) {
        throw new Error(
            "pagination.jsの初期化にはstoreが必要です。"
        );
    }

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

    store.subscribe((state) => {
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

        /*
         * render.jsによるカード生成後に処理するため、
         * マイクロタスクで実行します。
         */
        queueMicrotask(
            applyPagination
        );
    });

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
    const existing =
        document.getElementById(
            "archivePaginationControls"
        );

    if (existing) {
        return {
            root: existing,
            summary:
                existing.querySelector(
                    "[data-pagination-summary]"
                ),
            pageSizeSelect:
                existing.querySelector(
                    "[data-page-size]"
                ),
            paginationTop:
                existing.querySelector(
                    "[data-pagination-top]"
                ),
            paginationBottom:
                document.querySelector(
                    "[data-pagination-bottom]"
                )
        };
    }

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
        "制作物の表示件数とページ移動"
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

    const sizeArea =
        document.createElement(
            "label"
        );

    sizeArea.className =
        "archive-pagination-controls__size";

    const sizeLabel =
        document.createElement(
            "span"
        );

    sizeLabel.textContent =
        "表示件数";

    const pageSizeSelect =
        document.createElement(
            "select"
        );

    pageSizeSelect.className =
        "archive-pagination-controls__select";

    pageSizeSelect.dataset.pageSize =
        "";

    pageSizeSelect.setAttribute(
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

            pageSizeSelect.appendChild(
                option
            );
        }
    );

    sizeArea.append(
        sizeLabel,
        pageSizeSelect
    );

    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "archive-pagination-controls__actions";

    actions.appendChild(
        sizeArea
    );

    const existingSortArea =
        document.querySelector(
            ".archive-sort"
        ) ??
        document.querySelector(
            ".sort-area"
        );

    if (existingSortArea) {
        existingSortArea.classList.add(
            "archive-pagination-controls__sort"
        );

        let sortLabel =
            existingSortArea.querySelector(
                ".archive-sort__label"
            );

        if (!sortLabel) {
            sortLabel =
                document.createElement(
                    "span"
                );

            sortLabel.className =
                "archive-sort__label";

            existingSortArea.prepend(
                sortLabel
            );
        }

        sortLabel.textContent =
            "並び替え";

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

    injectPaginationStyles();

    return {
        root,
        summary,
        pageSizeSelect,
        paginationTop,
        paginationBottom
    };
}


/**
 * 上部・下部共通のページナビゲーションを作成します。
 *
 * @param {{
 *   position: "top"|"bottom",
 *   ariaLabel: string
 * }} options
 * @returns {HTMLElement}
 */
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
        `${startIndex + 1}〜${endIndex}件を表示

/* 表示件数・並び替えのタイトルとプルダウンを同一仕様に統一 */
.archive-pagination-controls__size,
.archive-pagination-controls__sort,
.archive-pagination-controls__sort.archive-sort,
.archive-pagination-controls__sort.sort-area {
    display: grid;
    grid-template-columns: auto 168px;
    gap: 8px;
    align-items: center;
}

.archive-pagination-controls__select,
.archive-pagination-controls__sort .archive-sort__select {
    box-sizing: border-box;
    width: 168px;
    min-width: 168px;
    max-width: 168px;
    height: 40px;
    min-height: 40px;
    padding: 0 30px 0 12px;
    border: 1px solid #d8d8d8;
    border-radius: 9px;
    background-color: #ffffff;
    color: #333333;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 700;
}

@media screen and (max-width: 700px) {
    .archive-pagination-controls__actions {
        grid-template-columns: 1fr;
    }

    .archive-pagination-controls__size,
    .archive-pagination-controls__sort,
    .archive-pagination-controls__sort.archive-sort,
    .archive-pagination-controls__sort.sort-area {
        grid-template-columns: 72px minmax(0, 1fr);
        width: 100%;
    }

    .archive-pagination-controls__select,
    .archive-pagination-controls__sort .archive-sort__select {
        width: 100%;
        min-width: 0;
        max-width: none;
        height: 44px;
        min-height: 44px;
        font-size: 16px;
    }
}



.archive-pagination--bottom {
    margin-top: 34px;
    margin-bottom: 8px;
}

@media screen and (max-width: 700px) {
    .archive-pagination--bottom {
        margin-top: 28px;
        margin-bottom: 4px;
    }
}



.archive-pagination-controls__sort .archive-sort__label {
    display: inline-block;
    margin: 0;
    color: #666666;
    font-size: 0.8rem;
    font-weight: 700;
    line-height: 1.4;
    white-space: nowrap;
}

@media screen and (max-width: 700px) {
    .archive-pagination-controls__sort .archive-sort__label {
        font-size: 0.75rem;
    }
}

`;
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

    const pageNumbers =
        createPageNumbers({
            currentPage,
            totalPages
        });

    pageNumbers.forEach(
        (pageNumber) => {
            if (
                pageNumber === "ellipsis"
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

function normalizePageSize(
    value
) {
    if (value === "all") {
        return "all";
    }

    const numberValue =
        Number(value);

    return PAGE_SIZE_OPTIONS
        .filter(
            (option) =>
                typeof option ===
                "number"
        )
        .includes(numberValue)
            ? numberValue
            : DEFAULT_PAGE_SIZE;
}

function updateAllOptionLabel({
    select,
    filteredCount
}) {
    if (!select) {
        return;
    }

    const allOption =
        select.querySelector(
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
    const header =
        document.querySelector(
            ".archive-results-header"
        );

    const target =
        header ??
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
                    "archivePageSize"
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
                "archivePageSize",
                String(pageSize)
            );
    } catch {
        /*
         * プライベートブラウズ等で
         * localStorageが使えない場合は
         * 保存せず、そのまま動作させます。
         */
    }
}


/* ========================================
   専用スタイル
======================================== */

function injectPaginationStyles() {
    if (
        document.getElementById(
            "archivePaginationStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "archivePaginationStyles";

    style.textContent = `
.archive-pagination-controls {
    margin: 0 0 28px;
}

.archive-pagination-controls[hidden] {
    display: none !important;
}

.archive-pagination-controls__top {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
}

.archive-pagination-controls__summary {
    margin: 0;
    color: #555555;
    font-size: 0.9rem;
    line-height: 1.7;
}

.archive-pagination-controls__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    justify-content: flex-end;
}

.archive-pagination-controls__size,
.archive-pagination-controls__sort,
.archive-pagination-controls__sort.archive-sort,
.archive-pagination-controls__sort.sort-area {
    display: inline-flex;
    gap: 7px;
    align-items: center;
    width: auto;
    min-width: 0;
    margin: 0;
    color: #666666;
    font-size: 0.8rem;
    font-weight: 700;
    white-space: nowrap;
}

.archive-pagination-controls__select,
.archive-pagination-controls__sort .archive-sort__select {
    width: auto;
    min-height: 38px;
    margin: 0;
    padding: 0 30px 0 11px;
    border: 1px solid #d8d8d8;
    border-radius: 9px;
    background-color: #ffffff;
    color: #333333;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    outline: none;
}

.archive-pagination-controls__select {
    min-width: 92px;
}

.archive-pagination-controls__sort .archive-sort__select {
    min-width: 150px;
}

.archive-pagination-controls__select:hover,
.archive-pagination-controls__sort .archive-sort__select:hover {
    border-color: #d8aa87;
    background-color: #fffaf6;
}

.archive-pagination-controls__select:focus-visible,
.archive-pagination-controls__sort .archive-sort__select:focus-visible {
    border-color: #d9905f;
    outline: 3px solid rgb(217 144 95 / 16%);
    outline-offset: 2px;
}

.archive-pagination {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: center;
}

.archive-pagination[hidden] {
    display: none !important;
}

.archive-pagination__button {
    display: inline-grid;
    min-width: 42px;
    min-height: 42px;
    padding: 7px 11px;
    border: 1px solid #dedad6;
    border-radius: 10px;
    background: #ffffff;
    color: #555555;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    place-items: center;
    transition:
        border-color 0.2s ease,
        background-color 0.2s ease,
        color 0.2s ease,
        transform 0.2s ease;
}

.archive-pagination__button:hover:not(:disabled) {
    border-color: #e6b58f;
    background: #fff5ed;
    color: #a95720;
    transform: translateY(-1px);
}

.archive-pagination__button.is-current {
    border-color: #eda46f;
    background: #eda46f;
    color: #ffffff;
    cursor: default;
}

.archive-pagination__button:disabled {
    border-color: #ece9e6;
    background: #f5f4f3;
    color: #b7b4b1;
    cursor: default;
}

.archive-pagination__button:focus-visible {
    outline: 3px solid rgb(120 120 120 / 18%);
    outline-offset: 2px;
}

.archive-pagination__ellipsis {
    display: inline-grid;
    min-width: 28px;
    min-height: 42px;
    color: #888888;
    place-items: center;
}

@media screen and (max-width: 700px) {
    .archive-pagination-controls {
        margin-bottom: 24px;
    }

    .archive-pagination-controls__top {
        align-items: stretch;
        flex-direction: column;
        gap: 10px;
    }

    .archive-pagination-controls__actions {
        display: grid;
        grid-template-columns:
            minmax(0, auto)
            minmax(0, 1fr);
        gap: 8px 12px;
        align-items: center;
        justify-content: stretch;
        width: 100%;
    }

    .archive-pagination-controls__size,
    .archive-pagination-controls__sort,
    .archive-pagination-controls__sort.archive-sort,
    .archive-pagination-controls__sort.sort-area {
        display: grid;
        grid-template-columns:
            auto
            minmax(0, 1fr);
        gap: 6px;
        align-items: center;
        width: 100%;
        font-size: 0.75rem;
    }

    .archive-pagination-controls__select,
    .archive-pagination-controls__sort .archive-sort__select {
        width: 100%;
        min-width: 0;
        min-height: 40px;
        padding-right: 26px;
        padding-left: 10px;
        font-size: 16px;
    }

    .archive-pagination {
        gap: 6px;
    }

    .archive-pagination__button {
        min-width: 40px;
        min-height: 40px;
        padding: 6px 9px;
        font-size: 0.78rem;
    }

    .archive-pagination__button--previous,
    .archive-pagination__button--next {
        min-width: 62px;
    }
}

@media screen and (max-width: 430px) {
    .archive-pagination-controls__actions {
        grid-template-columns: 1fr;
    }

    .archive-pagination-controls__button--number {
        min-width: 36px;
    }
}
`

    document.head.appendChild(
        style
    );
}
