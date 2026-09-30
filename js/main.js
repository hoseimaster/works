import {
    getPublications,
    loadPublications,
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
    initializePagination
} from "./pagination.js";

import {
    initializeRenderer
} from "./render.js";

import {
    initializeFilterModal
} from "./modal.js";

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializeArchivePage();
    }
);

async function initializeArchivePage() {
    const elements =
        getMainElements();

    try {
        initializeGlobalNavigation(
            elements
        );

        initializePageTopButton(
            elements
        );

        initializeFilterModalFocusGuard(
            elements
        );

        const publications =
            await loadPublications();

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

        let refreshing = false;
        async function refreshPublishedWorks() {
            if (refreshing || document.hidden) return;
            refreshing = true;
            try {
                const latest = await loadPublications();
                store.setPublications(sortPublications(latest, store.getState().sortType));
            } catch (error) {
                console.error("公開作品の自動更新に失敗しました。", error);
            } finally {
                refreshing = false;
            }
        }
        window.setInterval(refreshPublishedWorks, 10000);
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) refreshPublishedWorks();
        });
        window.addEventListener("online", refreshPublishedWorks);
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

        filterModal:
            document.getElementById(
                "filterModal"
            ),

        siteFooter:
            document.querySelector(
                ".site-footer"
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

function initializePageTopButton(
    elements
) {
    const button =
        elements.pageTopButton;

    if (!button) {
        return;
    }

    const footer =
        elements.siteFooter;

    let isFooterVisible = false;

    const updateButtonVisibility =
        throttle(
            () => {
                const shouldShowByScroll =
                    window.scrollY >
                    400;

                const shouldShow =
                    shouldShowByScroll &&
                    !isFooterVisible;

                button.hidden =
                    !shouldShow;

                button.classList.toggle(
                    "is-visible",
                    shouldShow
                );
            },
            80
        );

    if (
        footer &&
        "IntersectionObserver" in
        window
    ) {
        const footerObserver =
            new IntersectionObserver(
                (entries) => {
                    isFooterVisible =
                        entries.some(
                            (entry) =>
                                entry.isIntersecting
                        );

                    updateButtonVisibility();
                },
                {

                    rootMargin:
                        "0px 0px 72px 0px",
                    threshold: 0
                }
            );

        footerObserver.observe(
            footer
        );
    }

    button.addEventListener(
        "click",
        () => {
            button.blur();

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

    window.addEventListener(
        "resize",
        updateButtonVisibility,
        {
            passive: true
        }
    );

    updateButtonVisibility();
}

function initializeFilterModalFocusGuard(
    elements
) {
    const modal =
        elements.filterModal;

    if (!modal) {
        return;
    }

    if (
        !modal.hasAttribute(
            "tabindex"
        )
    ) {
        modal.setAttribute(
            "tabindex",
            "-1"
        );
    }

    const releaseKeywordFocus =
        () => {
            const activeElement =
                document.activeElement;

            if (
                activeElement instanceof
                    HTMLInputElement &&
                modal.contains(
                    activeElement
                )
            ) {
                activeElement.blur();
            }

            window.requestAnimationFrame(
                () => {
                    modal.focus({
                        preventScroll: true
                    });
                }
            );
        };

    const observer =
        new MutationObserver(
            () => {
                const isOpen =
                    !modal.hidden &&
                    modal.classList.contains(
                        "is-open"
                    );

                if (!isOpen) {
                    return;
                }

                releaseKeywordFocus();
            }
        );

    observer.observe(
        modal,
        {
            attributes: true,
            attributeFilter: [
                "class",
                "hidden",
                "aria-hidden"
            ]
        }
    );

    document.addEventListener(
        "archive:filter-modal-open",
        releaseKeywordFocus
    );
}

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

let lastTouchEnd = 0;

document.addEventListener(
    "touchend",
    (event) => {
        const now = Date.now();

        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }

        lastTouchEnd = now;
    },
    {
        passive: false
    }
);
