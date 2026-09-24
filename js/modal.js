/**
 * 制作物アーカイブ
 * 絞り込みモーダル制御
 */


/* ========================================
   初期化
======================================== */

export function initializeFilterModal({
    store = null
} = {}) {
    const elements =
        getModalElements();

    if (
        !elements.modal ||
        !elements.openButton
    ) {
        return;
    }

    let previouslyFocusedElement =
        null;

    const openModal = () => {
        if (
            isModalOpen(
                elements.modal
            )
        ) {
            return;
        }

        previouslyFocusedElement =
            document.activeElement;

        synchronizeModalKeyword(
            elements
        );

        elements.modal.hidden =
            false;

        elements.modal.classList.add(
            "is-open"
        );

        elements.modal.setAttribute(
            "aria-hidden",
            "false"
        );

        elements.openButton.setAttribute(
            "aria-expanded",
            "true"
        );

        elements.openButton.setAttribute(
            "aria-label",
            "検索条件を閉じる"
        );

        document.body.classList.add(
            "is-modal-open"
        );

        window.requestAnimationFrame(
            () => {
                focusInitialElement(
                    elements
                );
            }
        );
    };

    const closeModal = ({
        restoreFocus = true
    } = {}) => {
        if (
            !isModalOpen(
                elements.modal
            )
        ) {
            return;
        }

        /*
         * aria-hidden を設定する前にフォーカスをモーダル外へ戻す。
         * モーダル内のボタン等にフォーカスが残ったまま
         * aria-hidden="true" にすると、アクセシビリティ警告が発生する。
         */
        if (
            restoreFocus &&
            previouslyFocusedElement instanceof
                HTMLElement
        ) {
            previouslyFocusedElement.focus();
        } else if (restoreFocus) {
            elements.openButton.focus();
        }

        elements.modal.classList.remove(
            "is-open"
        );

        elements.modal.hidden =
            true;

        elements.modal.setAttribute(
            "aria-hidden",
            "true"
        );

        elements.openButton.setAttribute(
            "aria-expanded",
            "false"
        );

        elements.openButton.setAttribute(
            "aria-label",
            "検索条件を開く"
        );

        document.body.classList.remove(
            "is-modal-open"
        );

        previouslyFocusedElement =
            null;
    };

    elements.openButton.addEventListener(
        "click",
        () => {
            if (
                isModalOpen(
                    elements.modal
                )
            ) {
                closeModal();
            } else {
                openModal();
            }
        }
    );

    elements.closeButtons.forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    closeModal();
                }
            );
        }
    );

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                !isModalOpen(
                    elements.modal
                )
            ) {
                return;
            }

            if (
                event.key === "Escape"
            ) {
                event.preventDefault();

                closeModal();

                return;
            }

            if (
                event.key === "Tab"
            ) {
                trapFocus({
                    event,
                    modal:
                        elements.modal
                });
            }
        }
    );

    document.addEventListener(
        "archive:filter-modal-close",
        () => {
            closeModal();
        }
    );

    elements.modal.addEventListener(
        "click",
        (event) => {
            if (
                event.target !==
                elements.modal
            ) {
                return;
            }

            closeModal();
        }
    );

    window.addEventListener(
        "resize",
        () => {
            if (
                !isModalOpen(
                    elements.modal
                )
            ) {
                return;
            }

            keepFocusedElementVisible(
                elements.modal
            );
        }
    );

    if (
        store &&
        typeof store.subscribe ===
            "function"
    ) {
        store.subscribe(
            (state) => {
                if (
                    !isModalOpen(
                        elements.modal
                    )
                ) {
                    return;
                }

                synchronizeModalWithState({
                    state,
                    elements
                });
            }
        );
    }
}


/* ========================================
   DOM取得
======================================== */

function getModalElements() {
    const modal =
        document.getElementById(
            "filterModal"
        );

    return {
        modal,

        panel:
            modal?.querySelector(
                ".filter-modal__panel"
            ) ?? null,

        openButton:
            document.getElementById(
                "openFilterButton"
            ),

        closeButtons:
            modal
                ? [
                    ...modal.querySelectorAll(
                        "[data-modal-close]"
                    )
                ]
                : [],

        keywordInput:
            document.getElementById(
                "keywordInput"
            ) ??
            document.getElementById(
                "keywordSearchInput"
            ),

        modalKeywordInput:
            document.getElementById(
                "modalKeywordInput"
            ),

        applyButton:
            document.getElementById(
                "applyFilterButton"
            ),

        resetButton:
            document.getElementById(
                "resetFilterButton"
            )
    };
}


/* ========================================
   開閉判定
======================================== */

function isModalOpen(
    modal
) {
    if (!modal) {
        return false;
    }

    return (
        modal.hidden === false &&
        modal.classList.contains(
            "is-open"
        )
    );
}


/* ========================================
   初期フォーカス
======================================== */

function focusInitialElement(
    elements
) {
    if (
        elements.modalKeywordInput &&
        !elements.modalKeywordInput.disabled
    ) {
        elements.modalKeywordInput
            .focus();

        elements.modalKeywordInput
            .select();

        return;
    }

    const focusableElements =
        getFocusableElements(
            elements.modal
        );

    focusableElements[0]
        ?.focus();
}


/* ========================================
   フォーカストラップ
======================================== */

function trapFocus({
    event,
    modal
}) {
    const focusableElements =
        getFocusableElements(
            modal
        );

    if (
        focusableElements.length === 0
    ) {
        event.preventDefault();

        modal.setAttribute(
            "tabindex",
            "-1"
        );

        modal.focus();

        return;
    }

    const firstElement =
        focusableElements[0];

    const lastElement =
        focusableElements[
            focusableElements.length - 1
        ];

    const activeElement =
        document.activeElement;

    if (
        event.shiftKey &&
        activeElement === firstElement
    ) {
        event.preventDefault();

        lastElement.focus();

        return;
    }

    if (
        !event.shiftKey &&
        activeElement === lastElement
    ) {
        event.preventDefault();

        firstElement.focus();

        return;
    }

    if (
        !modal.contains(
            activeElement
        )
    ) {
        event.preventDefault();

        firstElement.focus();
    }
}


function getFocusableElements(
    container
) {
    if (!container) {
        return [];
    }

    const selector = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        '[tabindex]:not([tabindex="-1"])'
    ].join(",");

    return [
        ...container.querySelectorAll(
            selector
        )
    ].filter(
        (element) => {
            return (
                element instanceof
                    HTMLElement &&
                !element.hidden &&
                element.getAttribute(
                    "aria-hidden"
                ) !== "true" &&
                isElementVisible(
                    element
                )
            );
        }
    );
}


function isElementVisible(
    element
) {
    return Boolean(
        element.offsetWidth ||
        element.offsetHeight ||
        element.getClientRects()
            .length
    );
}


/* ========================================
   キーワード同期
======================================== */

function synchronizeModalKeyword(
    elements
) {
    if (
        !elements.modalKeywordInput
    ) {
        return;
    }

    elements.modalKeywordInput.value =
        elements.keywordInput
            ?.value ?? "";
}


function synchronizeModalWithState({
    state,
    elements
}) {
    if (
        !state ||
        !state.filters
    ) {
        return;
    }

    const keyword =
        String(
            state.filters.keyword ??
            ""
        );

    if (
        elements.modalKeywordInput &&
        document.activeElement !==
            elements.modalKeywordInput
    ) {
        elements.modalKeywordInput.value =
            keyword;
    }
}


/* ========================================
   表示位置補助
======================================== */

function keepFocusedElementVisible(
    modal
) {
    const activeElement =
        document.activeElement;

    if (
        !(
            activeElement instanceof
            HTMLElement
        ) ||
        !modal.contains(
            activeElement
        )
    ) {
        return;
    }

    activeElement.scrollIntoView({
        block: "nearest",
        inline: "nearest"
    });
}
