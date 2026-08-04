/**
 * 制作物アーカイブ
 * メイン初期化処理
 */

import {
    getPublications,
    validatePublications
} from "./publications.js";

import {
    createArchiveStore
} from "./state.js";

import {
    initializeFilters
} from "./filter.js";

import {
    initializeSort,
    sortPublications
} from "./sort.js";

import {
    initializeRenderer
} from "./render.js";

import {
    initializeFilterModal
} from "./modal.js";


import {
    initializePagination
} from "./pagination.js";


/* ========================================
   ページ初期化
======================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializeArchivePage();
    }
);


/**
 * アーカイブページ全体を初期化します。
 */
function initializeArchivePage() {
    const elements =
        getMainElements();

    try {
        initializeGlobalNavigation(
            elements
        );

        initializePageTopButton(
            elements
        );

        const publications =
            getPublications();

        validatePublicationData(
            publications
        );

        const initialPublications =
            sortPublications(
                publications,
                "date-desc"
            );

        const store =
            createArchiveStore({
                publications:
                    initialPublications,

                visiblePublications:
                    initialPublications,

                filters:
                    createInitialFilters(),

                sortType:
                    "date-desc"
            });

        initializeRenderer({
            store
        });

        initializePagination({
            store
        });

        initializeFilters({
            store,
            publications:
                initialPublications
        });

        initializeSort({
            store
        });

        initializeFilterModal({
            store
        });

        exposeArchiveDebugTools(
            store
        );
    } catch (error) {
        console.error(
            "制作物アーカイブの初期化に失敗しました。",
            error
        );

        showInitializationError(
            elements
        );
    }
}


/* ========================================
   DOM取得
======================================== */

function getMainElements() {
    return {
        menuToggleButton:
            document.getElementById(
                "menuToggleButton"
            ),

        globalNavigation:
            document.getElementById(
                "globalNavigation"
            ),

        pageTopButton:
            document.getElementById(
                "pageTopButton"
            ),

        loadingMessage:
            document.getElementById(
                "loadingMessage"
            ),

        errorMessage:
            document.getElementById(
                "errorMessage"
            ),

        emptyMessage:
            document.getElementById(
                "emptyMessage"
            ),

        publicationList:
            document.getElementById(
                "publicationList"
            )
    };
}


/* ========================================
   初期状態
======================================== */

function createInitialFilters() {
    return {
        keyword: "",
        categories: [],
        brands: [],
        years: [],
        interview: [],
        siteStatuses: []
    };
}


/* ========================================
   データ検証
======================================== */

function validatePublicationData(
    publications
) {
    if (!Array.isArray(publications)) {
        return {
            isValid: false,
            errors: [
                "制作物データが配列ではありません。"
            ]
        };
    }

    try {
        const validationResult =
            validatePublications(
                publications
            );

        if (
            validationResult === true ||
            validationResult === undefined
        ) {
            return {
                isValid: true,
                errors: []
            };
        }

        if (
            validationResult &&
            typeof validationResult ===
                "object"
        ) {
            return {
                isValid:
                    validationResult
                        .isValid !== false,

                errors:
                    Array.isArray(
                        validationResult.errors
                    )
                        ? validationResult.errors
                        : []
            };
        }

        return {
            isValid:
                Boolean(
                    validationResult
                ),

            errors:
                validationResult
                    ? []
                    : [
                        "制作物データの検証に失敗しました。"
                    ]
        };
    } catch (error) {
        return {
            isValid: false,
            errors: [
                error instanceof Error
                    ? error.message
                    : String(error)
            ]
        };
    }
}


/* ========================================
   初期化エラー
======================================== */

function showInitializationError(
    elements
) {
    if (elements.loadingMessage) {
        elements.loadingMessage.hidden =
            true;
    }

    if (elements.emptyMessage) {
        elements.emptyMessage.hidden =
            true;
    }

    if (elements.publicationList) {
        elements.publicationList
            .replaceChildren();

        elements.publicationList.hidden =
            true;
    }

    if (elements.errorMessage) {
        elements.errorMessage.hidden =
            false;
    }
}


/* ========================================
   グローバルナビゲーション
======================================== */

function initializeGlobalNavigation(
    elements
) {
    const button =
        elements.menuToggleButton;

    const navigation =
        elements.globalNavigation;

    if (
        !button ||
        !navigation
    ) {
        return;
    }

    const closeNavigation = () => {
        button.setAttribute(
            "aria-expanded",
            "false"
        );

        button.setAttribute(
            "aria-label",
            "メニューを開く"
        );

        navigation.classList.remove(
            "is-open"
        );

        document.body.classList.remove(
            "is-navigation-open"
        );
    };

    const openNavigation = () => {
        button.setAttribute(
            "aria-expanded",
            "true"
        );

        button.setAttribute(
            "aria-label",
            "メニューを閉じる"
        );

        navigation.classList.add(
            "is-open"
        );

        document.body.classList.add(
            "is-navigation-open"
        );
    };

    button.addEventListener(
        "click",
        () => {
            const isExpanded =
                button.getAttribute(
                    "aria-expanded"
                ) === "true";

            if (isExpanded) {
                closeNavigation();
            } else {
                openNavigation();
            }
        }
    );

    navigation.addEventListener(
        "click",
        (event) => {
            const link =
                event.target.closest(
                    "a"
                );

            if (!link) {
                return;
            }

            if (
                window.matchMedia(
                    "(max-width: 900px)"
                ).matches
            ) {
                closeNavigation();
            }
        }
    );

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key !== "Escape"
            ) {
                return;
            }

            closeNavigation();
        }
    );

    const mediaQuery =
        window.matchMedia(
            "(min-width: 901px)"
        );

    const handleMediaChange = (
        event
    ) => {
        if (event.matches) {
            closeNavigation();
        }
    };

    if (
        typeof mediaQuery
            .addEventListener ===
        "function"
    ) {
        mediaQuery.addEventListener(
            "change",
            handleMediaChange
        );
    } else {
        mediaQuery.addListener(
            handleMediaChange
        );
    }
}


/* ========================================
   ページ上部へ戻る
======================================== */

function initializePageTopButton(
    elements
) {
    const button =
        elements.pageTopButton;

    if (!button) {
        return;
    }

    const updateButtonVisibility =
        throttle(
            () => {
                const shouldShow =
                    window.scrollY >
                    400;

                button.hidden =
                    !shouldShow;

                button.classList.toggle(
                    "is-visible",
                    shouldShow
                );
            },
            100
        );

    button.addEventListener(
        "click",
        () => {
            window.scrollTo({
                top: 0,
                behavior:
                    prefersReducedMotion()
                        ? "auto"
                        : "smooth"
            });
        }
    );

    window.addEventListener(
        "scroll",
        updateButtonVisibility,
        {
            passive: true
        }
    );

    updateButtonVisibility();
}


/* ========================================
   開発確認用
======================================== */

function exposeArchiveDebugTools(
    store
) {
    if (
        typeof window ===
        "undefined"
    ) {
        return;
    }

    window.archiveDebug = {
        getState() {
            return store.getState();
        },

        resetFilters() {
            store.resetFilters();
        }
    };
}


/* ========================================
   共通関数
======================================== */

function prefersReducedMotion() {
    return window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;
}


function throttle(
    callback,
    delay = 100
) {
    let isWaiting = false;
    let latestArgs = null;

    const execute = () => {
        if (!latestArgs) {
            isWaiting = false;
            return;
        }

        const args =
            latestArgs;

        latestArgs = null;

        callback(...args);

        window.setTimeout(
            execute,
            delay
        );
    };

    return (...args) => {
        latestArgs = args;

        if (isWaiting) {
            return;
        }

        isWaiting = true;

        callback(...latestArgs);

        latestArgs = null;

        window.setTimeout(
            execute,
            delay
        );
    };
}
