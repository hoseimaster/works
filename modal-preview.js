import { PUBLICATIONS } from "./publications-data.js";
import {getPreviewDescription} from "./preview-descriptions.js";

/* ========================================
  ※※本コード編集厳禁※※
======================================== */

/**
 * 制作物アーカイブ
 * 制作物プレビューモーダル
 *
 * 現在はPCのみ有効です。
 * 将来スマートフォンで有効にする場合は、
 * PREVIEW_MODAL_CONFIG.enabledOnMobile を true に変更します。
 */

const PUBLICATION_MAP = new Map(
    PUBLICATIONS.map((publication) => [
        String(publication.id ?? ""),
        publication
    ])
);

const PREVIEW_MODAL_CONFIG = Object.freeze({
    enabledOnDesktop: true,
    enabledOnTablet: true,
    enabledOnMobile: true,
    desktopMinWidth: 1024,
    tabletMinWidth: 701,
    closeAnimationDuration: 100,
    touchFeedbackDuration: 400
});

let modalElements = null;
let previewItems = [];
let currentIndex = -1;
let previouslyFocusedElement = null;
let isInitialized = false;

const PREVIEW_ITEM_CACHE =
    new WeakMap();

const PRELOADED_PREVIEW_IMAGES =
    new Set();

initializePreviewModal();

/**
 * プレビューモーダルを初期化します。
 */
function initializePreviewModal() {
    if (isInitialized) {
        return;
    }

    isInitialized = true;
    modalElements = createPreviewModal();

    document.addEventListener(
        "click",
        handleDocumentClick,
        {
            capture: true
        }
    );

    document.addEventListener(
        "keydown",
        handleDocumentKeydown
    );
}

/**
 * 制作物カードのクリックを監視します。
 * 対象端末では通常遷移を止め、プレビューを開きます。
 *
 * @param {MouseEvent} event
 */
function handleDocumentClick(event) {
    const cardLink = event.target.closest(
        ".publication-card__link"
    );

    if (!cardLink) {
        return;
    }

    if (!shouldUsePreviewModal()) {
        return;
    }

    if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
    ) {
        return;
    }

    /*
     * 詳細ページが未準備の制作物も含め、
     * 一覧に表示されている全カードをプレビュー対象にします。
     */
    const cardLinks = Array.from(
        document.querySelectorAll(
            ".publication-list .publication-card__link"
        )
    );

    const selectedIndex = cardLinks.indexOf(
        cardLink
    );

    if (selectedIndex < 0) {
        return;
    }

    event.preventDefault();

    previewItems = cardLinks.map(
        createPreviewItemFromCard
    );

    openPreviewModal(selectedIndex);
}

/**
 * キーボード操作を処理します。
 *
 * @param {KeyboardEvent} event
 */
function handleDocumentKeydown(event) {
    if (!isPreviewModalOpen()) {
        return;
    }

    if (event.key === "Escape") {
        event.preventDefault();
        closePreviewModal();
        return;
    }

    if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousItem();
        return;
    }

    if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextItem();
        return;
    }

    if (event.key === "Tab") {
        keepFocusInsideModal(event);
    }
}

/**
 * モーダルDOMを生成します。
 * HTMLファイル側へ複雑なモーダル構造を置かず、
 * PC・スマートフォンで同じ構造を共有します。
 *
 * @returns {object}
 */
function createPreviewModal() {
    const root = document.createElement("div");
    root.id = "publicationPreviewModal";
    root.className = "preview-modal";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute(
        "aria-labelledby",
        "publicationPreviewTitle"
    );

    root.innerHTML = `
        <div
            class="preview-modal__backdrop"
            data-preview-close
            aria-hidden="true"
        ></div>

        <div
            class="preview-modal__panel"
            role="document"
        >
            <button
                class="preview-modal__close"
                type="button"
                data-preview-close
                aria-label="プレビューを閉じる"
            >
                <span aria-hidden="true">×</span>
            </button>

            <div class="preview-modal__content">
                <div class="preview-modal__visual">
                    <div class="preview-modal__image-area">
                        <img
                            class="preview-modal__image"
                            alt=""
                        >

                        <span
                            class="preview-modal__new"
                            hidden
                        >
                            NEW
                        </span>
                    </div>
                </div>

                <div class="preview-modal__information">
                    <div class="preview-modal__header-information">
                        <p class="preview-modal__date"></p>

                        <h2
                            id="publicationPreviewTitle"
                            class="preview-modal__title"
                        ></h2>

                        <div class="preview-modal__category" hidden></div>

                        <ul
                            class="preview-modal__brands"
                            aria-label="掲載ブランド"
                        ></ul>

                        <div class="preview-modal__badges"></div>
                    </div>

                    <p class="preview-modal__description"></p>

                    <div class="preview-modal__actions">
                        <button
                            class="preview-modal__navigation-button"
                            type="button"
                            data-preview-previous
                        >
                            <span aria-hidden="true">←</span>
                            <span>前へ</span>
                        </button>

                        <a
                            class="preview-modal__detail-button"
                            href="#"
                        >
                            詳細ページを見る
                        </a>

                        <button
                            class="preview-modal__navigation-button"
                            type="button"
                            data-preview-next
                        >
                            <span>次へ</span>
                            <span aria-hidden="true">→</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(root);

    const elements = {
        root,
        panel: root.querySelector(
            ".preview-modal__panel"
        ),
        closeButton: root.querySelector(
            ".preview-modal__close"
        ),
        image: root.querySelector(
            ".preview-modal__image"
        ),
        newBadge: root.querySelector(
            ".preview-modal__new"
        ),
        date: root.querySelector(
            ".preview-modal__date"
        ),
        title: root.querySelector(
            ".preview-modal__title"
        ),
        category: root.querySelector(
            ".preview-modal__category"
        ),
        brands: root.querySelector(
            ".preview-modal__brands"
        ),
        badges: root.querySelector(
            ".preview-modal__badges"
        ),
        description: root.querySelector(
            ".preview-modal__description"
        ),
        previousButton: root.querySelector(
            "[data-preview-previous]"
        ),
        nextButton: root.querySelector(
            "[data-preview-next]"
        ),
        detailButton: root.querySelector(
            ".preview-modal__detail-button"
        )
    };

    root.addEventListener(
        "click",
        (event) => {
            if (
                event.target.closest(
                    "[data-preview-close]"
                )
            ) {
                closePreviewModal();
            }
        }
    );

    elements.previousButton.addEventListener(
        "click",
        () => {
            showTouchFeedback(
                elements.previousButton
            );

            showPreviousItem();
        }
    );

    elements.nextButton.addEventListener(
        "click",
        () => {
            showTouchFeedback(
                elements.nextButton
            );

            showNextItem();
        }
    );

    return elements;
}

/**
 * タッチ端末でボタンの押下色を一定時間表示します。
 *
 * @param {HTMLButtonElement} button
 */
function showTouchFeedback(button) {
    if (
        !button ||
        !isTouchInterface()
    ) {
        return;
    }

    button.classList.remove(
        "is-tapped"
    );

    void button.offsetWidth;

    button.classList.add(
        "is-tapped"
    );

    window.setTimeout(
        () => {
            button.classList.remove(
                "is-tapped"
            );

            button.blur();
        },
        PREVIEW_MODAL_CONFIG
            .touchFeedbackDuration
    );
}


/**
 * タッチ操作を中心とする端末か判定します。
 *
 * @returns {boolean}
 */
function isTouchInterface() {
    return window.matchMedia(
        "(hover: none), (pointer: coarse)"
    ).matches;
}


/**
 * カードDOMからプレビュー表示用データを作成します。
 * render.jsのデータ構造へ直接依存しないため、
 * 将来カード項目が増えても影響範囲を限定できます。
 *
 * @param {HTMLAnchorElement} cardLink
 * @returns {object}
 */
function createPreviewItemFromCard(cardLink) {
    const cachedItem =
        PREVIEW_ITEM_CACHE.get(
            cardLink
        );

    if (cachedItem) {
        return cachedItem;
    }

    const image = cardLink.querySelector(
        ".publication-card__image"
    );

    const article = cardLink.closest(
        ".publication-card"
    );

    const publicationId = String(
        article?.dataset.publicationId ?? ""
    );

    const publication =
        PUBLICATION_MAP.get(publicationId) ??
        {};

    const badges = Array.from(
        cardLink.querySelectorAll(
            ".publication-card__badge"
        )
    ).map((badge) => {
        let type = "default";

        if (
            badge.classList.contains(
                "publication-card__badge--interview"
            )
        ) {
            type = "interview";
        } else if (
            badge.classList.contains(
                "publication-card__badge--status"
            )
        ) {
            type = "status";
        } else if (
            badge.classList.contains(
                "publication-card__badge--cover"
            )
        ) {
            type = "cover";
        }

        return {
            label:
                badge.textContent?.trim() ?? "",
            type
        };
    }).filter((badge) => badge.label);

    const previewItem = {
        detailUrl: normalizeUrl(
            publication.detailUrl ??
            cardLink.getAttribute("href")
        ),
        imageUrl:
            image?.currentSrc ||
            image?.src ||
            "",
        imageAlt:
            image?.alt ||
            "制作物の表紙",
        title: String(
            publication.title ??
            getText(
                cardLink,
                ".publication-card__title",
                "タイトル未設定"
            )
        ).trim(),
        date: getText(
            cardLink,
            ".publication-card__date"
        ),
        category: String(
            publication.category ??
            getText(
                cardLink,
                ".publication-card__category"
            )
        ).trim(),
        brands: Array.isArray(
            publication.brands
        )
            ? publication.brands
                .map((brand) =>
                    String(brand).trim()
                )
                .filter(Boolean)
            : getTexts(
                cardLink,
                ".publication-card__brand"
            ),
        badges,
        previewDescription: (
            getPreviewDescription(
                publicationId
            ) ||
            String(
                publication.description ??
                ""
            ).trim()
        ),
        isNew: Boolean(
            cardLink.querySelector(
                ".publication-card__new"
            )
        )
    };

    PREVIEW_ITEM_CACHE.set(
        cardLink,
        previewItem
    );

    return previewItem;
}

/**
 * モーダルを開きます。
 *
 * @param {number} selectedIndex
 */
function openPreviewModal(selectedIndex) {
    if (
        !modalElements ||
        previewItems.length === 0
    ) {
        return;
    }

    previouslyFocusedElement =
        document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

    /*
     * 表示前に内容を反映し、
     * モーダルが空の状態で描画される時間をなくします。
     */
    showPreviewItem(selectedIndex, {
        animate: false
    });

    modalElements.root.hidden = false;
    document.body.classList.add(
        "is-preview-modal-open"
    );

    window.requestAnimationFrame(() => {
        modalElements.root.classList.add(
            "is-open"
        );
    });

    modalElements.closeButton.focus({
        preventScroll: true
    });
}

/**
 * モーダルを閉じます。
 */
function closePreviewModal() {
    if (!isPreviewModalOpen()) {
        return;
    }

    modalElements.root.classList.remove(
        "is-open"
    );

    document.body.classList.remove(
        "is-preview-modal-open"
    );

    window.setTimeout(
        () => {
            modalElements.root.hidden = true;
            currentIndex = -1;

            if (
                previouslyFocusedElement &&
                document.contains(
                    previouslyFocusedElement
                )
            ) {
                previouslyFocusedElement.focus({
                    preventScroll: true
                });
            }
        },
        PREVIEW_MODAL_CONFIG.closeAnimationDuration
    );
}

/**
 * 指定位置の制作物を表示します。
 *
 * @param {number} nextIndex
 * @param {{animate?: boolean}} options
 */
function showPreviewItem(
    nextIndex,
    {
        animate = true
    } = {}
) {
    if (
        nextIndex < 0 ||
        nextIndex >= previewItems.length
    ) {
        return;
    }

    currentIndex = nextIndex;

    const update = () => {
        applyPreviewItem(
            previewItems[currentIndex]
        );

        preloadAdjacentPreviewImages(
            currentIndex
        );

        modalElements.panel.classList.remove(
            "is-changing"
        );
    };

    if (!animate) {
        update();
        return;
    }

    modalElements.panel.classList.add(
        "is-changing"
    );

    window.setTimeout(
        update,
        70
    );
}

/**
 * 現在位置の前後画像だけを低優先度で先読みします。
 *
 * @param {number} index
 */
function preloadAdjacentPreviewImages(
    index
) {
    [
        index - 1,
        index + 1
    ].forEach((targetIndex) => {
        const imageUrl =
            previewItems[
                targetIndex
            ]?.imageUrl;

        if (
            !imageUrl ||
            PRELOADED_PREVIEW_IMAGES.has(
                imageUrl
            )
        ) {
            return;
        }

        PRELOADED_PREVIEW_IMAGES.add(
            imageUrl
        );

        const image =
            new Image();

        image.decoding =
            "async";

        image.fetchPriority =
            "low";

        image.src =
            imageUrl;
    });
}


/**
 * 表示内容を更新します。
 *
 * @param {object} item
 */
function applyPreviewItem(item) {
    modalElements.image.src = item.imageUrl;
    modalElements.image.alt = item.imageAlt;

    modalElements.newBadge.hidden =
        !item.isNew;

    modalElements.date.textContent =
        item.date;

    modalElements.title.textContent =
        item.title;

    modalElements.category.textContent =
        item.category;

    modalElements.category.hidden =
        !item.category;

    replaceTextList(
        modalElements.brands,
        item.brands,
        "preview-modal__brand"
    );

    replaceBadgeList(
        modalElements.badges,
        item.badges
    );

    modalElements.description.textContent =
        item.previewDescription;

    const hasDetailPage =
        Boolean(item.detailUrl);

    if (hasDetailPage) {
        modalElements.detailButton.href =
            item.detailUrl;

        modalElements.detailButton.textContent =
            "詳細ページを見る";

        modalElements.detailButton.removeAttribute(
            "aria-disabled"
        );

        modalElements.detailButton.classList.remove(
            "is-disabled"
        );
    } else {
        modalElements.detailButton.removeAttribute(
            "href"
        );

        modalElements.detailButton.textContent =
            "詳細ページ準備中";

        modalElements.detailButton.setAttribute(
            "aria-disabled",
            "true"
        );

        modalElements.detailButton.classList.add(
            "is-disabled"
        );
    }

    modalElements.previousButton.disabled =
        currentIndex <= 0;

    modalElements.nextButton.disabled =
        currentIndex >=
        previewItems.length - 1;
}

/**
 * 前の制作物へ移動します。
 */
function showPreviousItem() {
    if (currentIndex <= 0) {
        return;
    }

    showPreviewItem(
        currentIndex - 1
    );
}

/**
 * 次の制作物へ移動します。
 */
function showNextItem() {
    if (
        currentIndex >=
        previewItems.length - 1
    ) {
        return;
    }

    showPreviewItem(
        currentIndex + 1
    );
}

/**
 * 現在の画面幅でモーダルを利用するか判定します。
 * 将来スマートフォン対応を行う際は設定値のみ変更します。
 *
 * @returns {boolean}
 */
function shouldUsePreviewModal() {
    const width = window.innerWidth;

    if (
        width >=
        PREVIEW_MODAL_CONFIG.desktopMinWidth
    ) {
        return PREVIEW_MODAL_CONFIG
            .enabledOnDesktop;
    }

    if (
        width >=
        PREVIEW_MODAL_CONFIG.tabletMinWidth
    ) {
        return PREVIEW_MODAL_CONFIG
            .enabledOnTablet;
    }

    return PREVIEW_MODAL_CONFIG
        .enabledOnMobile;
}

/**
 * モーダルが開いているか確認します。
 *
 * @returns {boolean}
 */
function isPreviewModalOpen() {
    return Boolean(
        modalElements &&
        !modalElements.root.hidden &&
        modalElements.root.classList.contains(
            "is-open"
        )
    );
}

/**
 * フォーカスをモーダル内に留めます。
 *
 * @param {KeyboardEvent} event
 */
function keepFocusInsideModal(event) {
    const focusableElements = Array.from(
        modalElements.root.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
    ).filter((element) => {
        return !element.hidden;
    });

    if (focusableElements.length === 0) {
        return;
    }

    const firstElement =
        focusableElements[0];

    const lastElement =
        focusableElements[
            focusableElements.length - 1
        ];

    if (
        event.shiftKey &&
        document.activeElement === firstElement
    ) {
        event.preventDefault();
        lastElement.focus();
        return;
    }

    if (
        !event.shiftKey &&
        document.activeElement === lastElement
    ) {
        event.preventDefault();
        firstElement.focus();
    }
}

/**
 * 要素内の文字列を取得します。
 *
 * @param {Element} root
 * @param {string} selector
 * @param {string} fallback
 * @returns {string}
 */
function getText(
    root,
    selector,
    fallback = ""
) {
    return (
        root.querySelector(selector)
            ?.textContent
            ?.trim() ||
        fallback
    );
}

/**
 * 複数要素の文字列を取得します。
 *
 * @param {Element} root
 * @param {string} selector
 * @returns {Array<string>}
 */
function getTexts(root, selector) {
    return Array.from(
        root.querySelectorAll(selector)
    )
        .map((element) => {
            return element.textContent.trim();
        })
        .filter(Boolean);
}

/**
 * 文字列配列から一覧要素を生成します。
 *
 * @param {HTMLElement} container
 * @param {Array<string>} values
 * @param {string} className
 */
function replaceTextList(
    container,
    values,
    className
) {
    const fragment =
        document.createDocumentFragment();

    values.forEach((value) => {
        const element =
            document.createElement(
                container.tagName === "UL"
                    ? "li"
                    : "span"
            );

        element.className = className;
        element.textContent = value;
        fragment.appendChild(element);
    });

    container.replaceChildren(fragment);
    container.hidden = values.length === 0;
}

/**
 * バッジ配列を本来の種類別配色で描画します。
 *
 * @param {HTMLElement} container
 * @param {Array<{label: string, type: string}>} badges
 */
function replaceBadgeList(
    container,
    badges
) {
    const fragment =
        document.createDocumentFragment();

    badges.forEach((badge) => {
        const element =
            document.createElement(
                "span"
            );

        element.className = [
            "preview-modal__badge",
            `preview-modal__badge--${badge.type}`
        ].join(" ");

        element.textContent =
            badge.label;

        fragment.appendChild(
            element
        );
    });

    container.replaceChildren(
        fragment
    );

    container.hidden =
        badges.length === 0;
}


/**
 * リンク先を正規化します。
 *
 * @param {*} value
 * @returns {string}
 */
function normalizeUrl(value) {
    const url = String(value ?? "").trim();

    if (!url || url === "#") {
        return "";
    }

    return url;
}
