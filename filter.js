/**
 * 制作物アーカイブ
 * 検索・絞り込み処理
 */

import {
    PUBLICATION_CATEGORIES,
    BRAND_OPTIONS,
    SITE_STATUS_OPTIONS,
    getPublicationYears
} from "./publications.js";

const KEYWORD_INPUT_DELAY = 300;

let selectedYearFrom = "";
let selectedYearTo = "";

const FILTER_GROUP_CONFIG = [
    {
        stateKey: "categories",
        containerId: "categoryFilterOptions",
        options: PUBLICATION_CATEGORIES
    },
    {
        stateKey: "brands",
        containerId: "brandFilterOptions",
        options: BRAND_OPTIONS
    },
    {
        stateKey: "interview",
        containerId: "interviewFilterOptions",
        options: [
            {
                value: "yes",
                label: "あり"
            },
            {
                value: "no",
                label: "なし"
            }
        ]
    },
    {
        stateKey: "siteStatuses",
        containerId: "siteStatusFilterOptions",
        options: SITE_STATUS_OPTIONS
    }
];


/* ========================================
   初期化
======================================== */

export function initializeFilters({
    store,
    publications = []
}) {
    if (!store) {
        throw new Error(
            "filter.jsの初期化にはstoreが必要です。"
        );
    }

    const elements =
        getFilterElements();

    const filterConfig =
        createFilterConfig();

    renderFilterOptions(
        filterConfig,
        elements
    );

    initializeYearRange({
        store,
        publications,
        elements
    });

    initializeKeywordSearch({
        store,
        elements
    });

    initializeFilterOptionEvents({
        store,
        elements
    });

    initializeSingleBrandFilter({
        store,
        elements
    });

    initializeFilterButtons({
        store,
        elements
    });

    initializeGroupClearButtons({
        store,
        elements
    });

    initializeActiveFilterEvents({
        store,
        elements
    });

    initializeEmptyResetButton({
        store,
        elements
    });

    let previousFilterSignature = "";

    store.subscribe((state) => {
        synchronizeFilterInputs(
            state.filters,
            elements
        );

        renderActiveFilters(
            state.filters,
            elements.activeFilterList,
            elements.activeFiltersSection
        );

        updateFilterCount(
            state.filters,
            elements.filterCount
        );

        updateResetButtonState(
            state.filters,
            elements
        );

        const filteredPublications =
            filterPublications(
                state.publications,
                state.filters
            );

        updateModalResultCount(
            filteredPublications.length,
            elements.modalResultCount
        );

        const currentSignature =
            createFilterSignature(
                state.publications,
                state.filters
            );

        if (
            currentSignature ===
            previousFilterSignature
        ) {
            return;
        }

        previousFilterSignature =
            currentSignature;

        if (
            !arePublicationListsEqual(
                state.visiblePublications,
                filteredPublications
            )
        ) {
            store.setVisiblePublications(
                filteredPublications
            );
        }
    });
}


/* ========================================
   DOM取得
======================================== */

function getFilterElements() {
    return {
        keywordInput:
            document.getElementById(
                "keywordSearchInput"
            ) ??
            document.getElementById(
                "keywordInput"
            ),

        modalKeywordInput:
            document.getElementById(
                "modalKeywordInput"
            ),

        keywordSearchButton:
            document.getElementById(
                "keywordSearchButton"
            ) ??
            document.getElementById(
                "searchButton"
            ),

        keywordClearButton:
            document.getElementById(
                "keywordClearButton"
            ) ??
            document.getElementById(
                "clearKeywordButton"
            ),

        categoryFilterOptions:
            document.getElementById(
                "categoryFilterOptions"
            ),

        brandFilterOptions:
            document.getElementById(
                "brandFilterOptions"
            ),

        singleBrandOnlyCheckbox:
            document.getElementById(
                "singleBrandOnlyCheckbox"
            ),

        yearFromSelect:
            document.getElementById(
                "yearFromSelect"
            ),

        yearToSelect:
            document.getElementById(
                "yearToSelect"
            ),

        interviewFilterOptions:
            document.getElementById(
                "interviewFilterOptions"
            ),

        siteStatusFilterOptions:
            document.getElementById(
                "siteStatusFilterOptions"
            ),

        coverTypeFilterOptions:
            document.getElementById(
                "coverTypeFilterOptions"
            ),

        applyFilterButton:
            document.getElementById(
                "applyFilterButton"
            ),

        resetFilterButton:
            document.getElementById(
                "resetFilterButton"
            ),

        clearAllFiltersButton:
            document.getElementById(
                "clearAllFiltersButton"
            ),

        emptyResetButton:
            document.getElementById(
                "emptyResetButton"
            ),

        activeFilterList:
            document.getElementById(
                "activeFilterList"
            ) ??
            document.getElementById(
                "activeFilters"
            ),

        activeFiltersSection:
            document.getElementById(
                "activeFiltersSection"
            ),

        filterCount:
            document.getElementById(
                "selectedFilterCount"
            ) ??
            document.getElementById(
                "filterCount"
            ),

        modalResultCount:
            document.getElementById(
                "modalResultCount"
            ),

        filterModal:
            document.getElementById(
                "filterModal"
            )
    };
}


/* ========================================
   フィルター設定
======================================== */

function createFilterConfig() {
    return FILTER_GROUP_CONFIG.map(
        (config) => {
            return {
                ...config
            };
        }
    );
}


/* ========================================
   発行年の範囲指定
======================================== */

function initializeYearRange({
    store,
    publications,
    elements
}) {
    const {
        yearFromSelect,
        yearToSelect
    } = elements;

    if (
        !yearFromSelect ||
        !yearToSelect
    ) {
        return;
    }

    const years =
        getPublicationYears(
            publications
        )
            .map(Number)
            .filter(Number.isFinite)
            .sort((a, b) => {
                return a - b;
            });

    renderYearOptions(
        yearFromSelect,
        years
    );

    renderYearOptions(
        yearToSelect,
        years
    );

    const updateYearRange = () => {
        let yearFrom =
            yearFromSelect.value;

        let yearTo =
            yearToSelect.value;

        if (
            yearFrom &&
            yearTo &&
            Number(yearFrom) >
                Number(yearTo)
        ) {
            if (
                document.activeElement ===
                yearFromSelect
            ) {
                yearTo = yearFrom;
                yearToSelect.value =
                    yearTo;
            } else {
                yearFrom = yearTo;
                yearFromSelect.value =
                    yearFrom;
            }
        }

        selectedYearFrom = yearFrom;
        selectedYearTo = yearTo;

        store.setFilters({
            years: createSelectedYears(
                years,
                yearFrom,
                yearTo
            )
        });
    };

    yearFromSelect.addEventListener(
        "change",
        updateYearRange
    );

    yearToSelect.addEventListener(
        "change",
        updateYearRange
    );
}


function createSelectedYears(
    years,
    yearFrom,
    yearTo
) {
    const normalizedFrom =
        normalizeYearValue(yearFrom);

    const normalizedTo =
        normalizeYearValue(yearTo);

    if (
        !normalizedFrom &&
        !normalizedTo
    ) {
        return [];
    }

    return years
        .filter((year) => {
            if (
                normalizedFrom &&
                year < Number(normalizedFrom)
            ) {
                return false;
            }

            if (
                normalizedTo &&
                year > Number(normalizedTo)
            ) {
                return false;
            }

            return true;
        })
        .map(String);
}


function renderYearOptions(
    select,
    years
) {
    const currentValue =
        select.value;

    const fragment =
        document.createDocumentFragment();

    const emptyOption =
        document.createElement(
            "option"
        );

    emptyOption.value = "";

    emptyOption.textContent =
        "指定なし";

    fragment.appendChild(
        emptyOption
    );

    years.forEach((year) => {
        const option =
            document.createElement(
                "option"
            );

        option.value =
            String(year);

        option.textContent =
            `${year}年`;

        fragment.appendChild(
            option
        );
    });

    select.replaceChildren(
        fragment
    );

    if (
        currentValue &&
        years.includes(
            Number(currentValue)
        )
    ) {
        select.value =
            currentValue;
    }
}


/* ========================================
   選択肢描画
======================================== */

function renderFilterOptions(
    filterConfig,
    elements
) {
    filterConfig.forEach(
        (config) => {
            const container =
                elements[
                    config.containerId
                ];

            if (!container) {
                return;
            }

            const fragment =
                document.createDocumentFragment();

            config.options.forEach(
                (option, index) => {
                    const normalizedOption =
                        normalizeFilterOption(
                            option
                        );

                    const checkboxId =
                        createCheckboxId(
                            config.stateKey,
                            normalizedOption.value,
                            index
                        );

                    fragment.appendChild(
                        createFilterCheckbox({
                            checkboxId,

                            stateKey:
                                config.stateKey,

                            value:
                                normalizedOption.value,

                            label:
                                normalizedOption.label
                        })
                    );
                }
            );

            container.replaceChildren(
                fragment
            );
        }
    );
}


function normalizeFilterOption(
    option
) {
    if (
        option &&
        typeof option === "object"
    ) {
        return {
            value: String(
                option.value ?? ""
            ),

            label: String(
                option.label ??
                option.value ??
                ""
            )
        };
    }

    return {
        value: String(
            option ?? ""
        ),

        label: String(
            option ?? ""
        )
    };
}


function createFilterCheckbox({
    checkboxId,
    stateKey,
    value,
    label
}) {
    const labelElement =
        document.createElement(
            "label"
        );

    labelElement.className =
        "filter-option";

    labelElement.dataset.filterValue =
        value;

    const checkbox =
        document.createElement(
            "input"
        );

    checkbox.type =
        "checkbox";

    checkbox.id =
        checkboxId;

    checkbox.value =
        value;

    checkbox.dataset.filterKey =
        stateKey;

    const visual =
        document.createElement(
            "span"
        );

    visual.className =
        "filter-option__visual";

    visual.setAttribute(
        "aria-hidden",
        "true"
    );

    const text =
        document.createElement(
            "span"
        );

    text.className =
        "filter-option__label";

    text.textContent =
        label;

    labelElement.append(
        checkbox,
        visual,
        text
    );

    return labelElement;
}


function createCheckboxId(
    stateKey,
    value,
    index
) {
    const safeValue =
        value
            .normalize("NFKC")
            .replace(
                /[^a-zA-Z0-9\u3040-\u30ff\u3400-\u9fff-]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            )
            .toLowerCase();

    return [
        "filter",
        stateKey,
        safeValue || index
    ].join("-");
}

/* ========================================
   キーワード検索
======================================== */

function initializeKeywordSearch({
    store,
    elements
}) {
    const inputs = [
        elements.keywordInput,
        elements.modalKeywordInput
    ].filter(Boolean);

    if (inputs.length === 0) {
        return;
    }

    const updateKeyword =
        debounce(
            (sourceInput) => {
                synchronizeKeywordInputs(
                    sourceInput.value,
                    elements,
                    sourceInput
                );

                store.setKeyword(
                    sourceInput.value
                );
            },
            KEYWORD_INPUT_DELAY
        );

    inputs.forEach((input) => {
        input.addEventListener(
            "input",
            () => {
                updateKeyword(input);
            }
        );

        input.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key !== "Enter"
                ) {
                    return;
                }

                event.preventDefault();

                synchronizeKeywordInputs(
                    input.value,
                    elements,
                    input
                );

                store.setKeyword(
                    input.value
                );
            }
        );
    });

    elements.keywordSearchButton
        ?.addEventListener(
            "click",
            () => {
                const value =
                    elements
                        .keywordInput
                        ?.value ?? "";

                synchronizeKeywordInputs(
                    value,
                    elements,
                    elements.keywordInput
                );

                store.setKeyword(
                    value
                );
            }
        );

    elements.keywordClearButton
        ?.addEventListener(
            "click",
            () => {
                synchronizeKeywordInputs(
                    "",
                    elements
                );

                store.setKeyword("");

                elements
                    .keywordInput
                    ?.focus();
            }
        );
}


function synchronizeKeywordInputs(
    value,
    elements,
    sourceInput = null
) {
    [
        elements.keywordInput,
        elements.modalKeywordInput
    ]
        .filter(Boolean)
        .forEach((input) => {
            if (
                input !== sourceInput
            ) {
                input.value =
                    value;
            }
        });
}


/* ========================================
   チェックボックス操作
======================================== */

function initializeFilterOptionEvents({
    store,
    elements
}) {
    getFilterOptionContainers(
        elements
    ).forEach((container) => {
        container.addEventListener(
            "change",
            (event) => {
                const checkbox =
                    event.target.closest(
                        'input[type="checkbox"][data-filter-key]'
                    );

                if (!checkbox) {
                    return;
                }

                applyCheckedFilters(
                    store,
                    elements
                );
            }
        );
    });
}


function applyCheckedFilters(
    store,
    elements
) {
    const nextFilters =
        createEmptyArrayFilters();

    getFilterOptionContainers(
        elements
    ).forEach((container) => {
        container.querySelectorAll(
            'input[type="checkbox"][data-filter-key]:checked'
        ).forEach((checkbox) => {
            const filterKey =
                checkbox.dataset
                    .filterKey;

            if (
                !nextFilters[
                    filterKey
                ]
            ) {
                return;
            }

            nextFilters[
                filterKey
            ].push(
                checkbox.value
            );
        });
    });

    nextFilters.years = [
        ...(
            store.getState()
                .filters
                .years ?? []
        )
    ];

    nextFilters.singleBrandOnly =
        Boolean(
            elements
                .singleBrandOnlyCheckbox
                ?.checked
        );

    store.setFilters(
        nextFilters
    );
}


function getFilterOptionContainers(
    elements
) {
    return [
        elements.categoryFilterOptions,
        elements.brandFilterOptions,
        elements.interviewFilterOptions,
        elements.siteStatusFilterOptions
    ].filter(Boolean);
}


/* ========================================
   単一ブランドのみ表示
======================================== */

function initializeSingleBrandFilter({
    store,
    elements
}) {
    const checkbox =
        elements.singleBrandOnlyCheckbox;

    if (!checkbox) {
        return;
    }

    checkbox.addEventListener(
        "change",
        () => {
            store.setFilters({
                singleBrandOnly:
                    checkbox.checked
            });
        }
    );
}


/* ========================================
   適用・解除ボタン
======================================== */

function initializeFilterButtons({
    store,
    elements
}) {
    elements.applyFilterButton
        ?.addEventListener(
            "click",
            () => {
                applyCheckedFilters(
                    store,
                    elements
                );

                const keyword =
                    elements
                        .modalKeywordInput
                        ?.value ??
                    elements
                        .keywordInput
                        ?.value ??
                    "";

                synchronizeKeywordInputs(
                    keyword,
                    elements,
                    elements.modalKeywordInput
                );

                store.setKeyword(
                    keyword
                );

                closeFilterModal(
                    elements.filterModal
                );
            }
        );

    elements.resetFilterButton
        ?.addEventListener(
            "click",
            () => {
                clearCheckboxes(
                    elements
                );

                clearYearRange(
                    elements
                );

                synchronizeKeywordInputs(
                    "",
                    elements
                );

                store.resetFilters();
            }
        );

    elements.clearAllFiltersButton
        ?.addEventListener(
            "click",
            () => {
                clearAllFilters({
                    store,
                    elements
                });
            }
        );
}


function initializeEmptyResetButton({
    store,
    elements
}) {
    elements.emptyResetButton
        ?.addEventListener(
            "click",
            () => {
                clearAllFilters({
                    store,
                    elements
                });
            }
        );
}


function initializeGroupClearButtons({
    store,
    elements
}) {
    document
        .querySelectorAll(
            "[data-clear-filter]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    const filterKey =
                        button.dataset
                            .clearFilter;

                    if (!filterKey) {
                        return;
                    }

                    if (
                        filterKey === "years" ||
                        filterKey === "yearRange" ||
                        filterKey === "yearFrom" ||
                        filterKey === "yearTo"
                    ) {
                        clearYearRange(
                            elements
                        );

                        store.setFilters({
                            years: []
                        });

                        return;
                    }

                    const escapedFilterKey =
                        typeof CSS !==
                            "undefined" &&
                        typeof CSS.escape ===
                            "function"
                            ? CSS.escape(
                                filterKey
                            )
                            : filterKey;

                    document.querySelectorAll(
                        `input[type="checkbox"][data-filter-key="${escapedFilterKey}"]`
                    ).forEach(
                        (checkbox) => {
                            checkbox.checked =
                                false;
                        }
                    );

                    if (
                        filterKey === "brands" &&
                        elements
                            .singleBrandOnlyCheckbox
                    ) {
                        elements
                            .singleBrandOnlyCheckbox
                            .checked = false;

                        store.setFilters({
                            brands: [],
                            singleBrandOnly: false
                        });

                        return;
                    }

                    store.setFilters({
                        [filterKey]: []
                    });
                }
            );
        });
}


function clearAllFilters({
    store,
    elements
}) {
    clearCheckboxes(
        elements
    );

    clearYearRange(
        elements
    );

    if (
        elements.singleBrandOnlyCheckbox
    ) {
        elements
            .singleBrandOnlyCheckbox
            .checked = false;
    }

    synchronizeKeywordInputs(
        "",
        elements
    );

    store.resetFilters();
}


function clearCheckboxes(
    elements
) {
    getFilterOptionContainers(
        elements
    ).forEach((container) => {
        container.querySelectorAll(
            'input[type="checkbox"]'
        ).forEach((checkbox) => {
            checkbox.checked =
                false;
        });
    });
}


function clearYearRange(
    elements
) {
    selectedYearFrom = "";
    selectedYearTo = "";
    if (
        elements.yearFromSelect
    ) {
        elements.yearFromSelect
            .value = "";
    }

    if (
        elements.yearToSelect
    ) {
        elements.yearToSelect
            .value = "";
    }
}


function createEmptyArrayFilters() {
    return {
        categories: [],
        brands: [],
        years: [],
        interview: [],
        siteStatuses: []
    };
}


/* ========================================
   選択中条件
======================================== */

function initializeActiveFilterEvents({
    store,
    elements
}) {
    elements.activeFilterList
        ?.addEventListener(
            "click",
            (event) => {
                const removeButton =
                    event.target.closest(
                        "[data-remove-filter]"
                    );

                if (!removeButton) {
                    return;
                }

                removeActiveFilter({
                    store,
                    elements,

                    filterKey:
                        removeButton
                            .dataset
                            .filterKey,

                    filterValue:
                        removeButton
                            .dataset
                            .filterValue
                });
            }
        );
}


function renderActiveFilters(
    filters,
    container,
    section
) {
    if (!container) {
        return;
    }

    const activeFilters =
        collectActiveFilters(
            filters
        );

    if (
        activeFilters.length === 0
    ) {
        container.replaceChildren();
        container.hidden = true;

        if (section) {
            section.hidden = true;
        }

        return;
    }

    const fragment =
        document.createDocumentFragment();

    activeFilters.forEach(
        (filter) => {
            fragment.appendChild(
                createActiveFilterButton(
                    filter
                )
            );
        }
    );

    container.replaceChildren(
        fragment
    );

    container.hidden = false;

    if (section) {
        section.hidden = false;
    }
}


function collectActiveFilters(
    filters
) {
    const activeFilters = [];

    const keyword =
        String(
            filters.keyword ?? ""
        ).trim();

    if (keyword) {
        activeFilters.push({
            key: "keyword",
            value: keyword,
            label:
                `キーワード：${keyword}`
        });
    }

    const filterLabels = {
        categories: "分類",
        brands: "ブランド",
        years: "発行年",
        interview: "インタビュー",
        siteStatuses:
            "サイト掲載状況"
    };

    Object.entries(
        filterLabels
    ).forEach(
        ([key, groupLabel]) => {
            (
                filters[key] ?? []
            ).forEach((value) => {
                activeFilters.push({
                    key,
                    value,

                    label:
                        `${groupLabel}：` +
                        getFilterValueLabel(
                            key,
                            value
                        )
                });
            });
        }
    );

    if (
        filters.singleBrandOnly
    ) {
        activeFilters.push({
            key: "singleBrandOnly",
            value: "true",
            label: "単一ブランドのみ"
        });
    }

    return activeFilters;
}


function createActiveFilterButton(
    filter
) {
    const button =
        document.createElement(
            "button"
        );

    button.type = "button";

    button.className =
        "active-filter";

    button.dataset.removeFilter =
        "true";

    button.dataset.filterKey =
        filter.key;

    button.dataset.filterValue =
        filter.value;

    button.setAttribute(
        "aria-label",
        `${filter.label}を解除`
    );

    const label =
        document.createElement(
            "span"
        );

    label.className =
        "active-filter__label";

    label.textContent =
        filter.label;

    const icon =
        document.createElement(
            "span"
        );

    icon.className =
        "active-filter__remove";

    icon.setAttribute(
        "aria-hidden",
        "true"
    );

    icon.textContent = "×";

    button.append(
        label,
        icon
    );

    return button;
}

function removeActiveFilter({
    store,
    elements,
    filterKey,
    filterValue
}) {
    const state =
        store.getState();

    if (
        filterKey === "keyword"
    ) {
        synchronizeKeywordInputs(
            "",
            elements
        );

        store.setKeyword("");
        return;
    }


    if (
        filterKey ===
        "singleBrandOnly"
    ) {
        if (
            elements
                .singleBrandOnlyCheckbox
        ) {
            elements
                .singleBrandOnlyCheckbox
                .checked = false;
        }

        store.setFilters({
            singleBrandOnly: false
        });

        return;
    }

    if (
        !Array.isArray(
            state.filters[
                filterKey
            ]
        )
    ) {
        return;
    }

    const nextValues =
        state.filters[
            filterKey
        ].filter((value) => {
            return (
                normalizeFilterValue(
                    value
                ) !==
                normalizeFilterValue(
                    filterValue
                )
            );
        });

    store.setFilters({
        [filterKey]:
            nextValues
    });
}


function getFilterValueLabel(
    key,
    value
) {
    if (
        key === "interview"
    ) {
        return value === "yes"
            ? "あり"
            : "なし";
    }

    return String(value);
}


/* ========================================
   入力状態同期
======================================== */

function synchronizeFilterInputs(
    filters,
    elements
) {
    [
        elements.keywordInput,
        elements.modalKeywordInput
    ]
        .filter(Boolean)
        .forEach((input) => {
            if (
                document.activeElement !==
                input
            ) {
                input.value =
                    filters.keyword ?? "";
            }
        });

    getFilterOptionContainers(
        elements
    ).forEach((container) => {
        container.querySelectorAll(
            'input[type="checkbox"][data-filter-key]'
        ).forEach((checkbox) => {
            const filterKey =
                checkbox.dataset
                    .filterKey;

            const selectedValues =
                filters[
                    filterKey
                ] ?? [];

            checkbox.checked =
                selectedValues.some(
                    (value) => {
                        return (
                            normalizeFilterValue(
                                value
                            ) ===
                            normalizeFilterValue(
                                checkbox.value
                            )
                        );
                    }
                );
        });
    });

    if (
        elements.singleBrandOnlyCheckbox
    ) {
        elements
            .singleBrandOnlyCheckbox
            .checked =
                Boolean(
                    filters.singleBrandOnly
                );
    }

    if (
        elements.yearFromSelect &&
        document.activeElement !==
            elements.yearFromSelect
    ) {
        elements.yearFromSelect.value =
            selectedYearFrom;
    }

    if (
        elements.yearToSelect &&
        document.activeElement !==
            elements.yearToSelect
    ) {
        elements.yearToSelect.value =
            selectedYearTo;
    }
}


/* ========================================
   件数・ボタン状態
======================================== */

function updateFilterCount(
    filters,
    element
) {
    if (!element) {
        return;
    }

    const count =
        countActiveFilters(
            filters
        );

    element.textContent =
        String(count);

    element.hidden =
        count === 0;
}


function updateModalResultCount(
    count,
    element
) {
    if (!element) {
        return;
    }

    element.textContent =
        `${count}件`;
}


function countActiveFilters(
    filters
) {
    let count =
        String(
            filters.keyword ?? ""
        ).trim()
            ? 1
            : 0;

    [
        "categories",
        "brands",
        "years",
        "interview",
        "siteStatuses"
    ].forEach((key) => {
        count += (
            filters[key] ?? []
        ).length;
    });

    if (
        filters.singleBrandOnly
    ) {
        count += 1;
    }

    return count;
}


function updateResetButtonState(
    filters,
    elements
) {
    const hasArrayFilters =
        [
            "categories",
            "brands",
            "interview",
            "siteStatuses",
            "coverTypes"
        ].some((key) => {
            return (
                filters[key] ?? []
            ).length > 0;
        });


    const hasKeyword =
        Boolean(
            String(
                filters.keyword ?? ""
            ).trim()
        );

    const hasSingleBrandFilter =
        Boolean(
            filters.singleBrandOnly
        );

    if (
        elements.resetFilterButton
    ) {
        elements.resetFilterButton
            .disabled =
                !hasArrayFilters &&
                !hasKeyword &&
                !hasSingleBrandFilter;
    }

    if (
        elements.clearAllFiltersButton
    ) {
        elements.clearAllFiltersButton
            .disabled =
                countActiveFilters(
                    filters
                ) === 0;
    }
}


/* ========================================
   絞り込み本体
======================================== */

export function filterPublications(
    publications = [],
    filters = {}
) {
    if (
        !Array.isArray(
            publications
        )
    ) {
        return [];
    }

    return publications.filter(
        (publication) => {
            return (
                matchesKeyword(
                    publication,
                    filters.keyword
                ) &&
                matchesSingleValueGroup(
                    publication.category,
                    filters.categories
                ) &&
                matchesArrayGroup(
                    publication.brands,
                    filters.brands
                ) &&
                matchesSingleBrandOnly(
                    publication.brands,
                    filters.singleBrandOnly
                ) &&
                matchesYearGroup(
                    publication.publishDate,
                    filters.years
                ) &&
                matchesInterviewGroup(
                    publication.hasInterview,
                    filters.interview
                ) &&
                matchesArrayGroup(
                    publication.siteStatuses,
                    filters.siteStatuses
                )
            );
        }
    );
}


export function matchesKeyword(
    publication,
    keyword
) {
    const normalizedKeyword =
        normalizeSearchText(
            keyword
        );

    if (!normalizedKeyword) {
        return true;
    }

    const searchableValues = [
        publication.title,
        publication.category,
        publication.description,
        publication.publishDate,
        ...(publication.brands ?? []),
        ...(publication.siteStatuses ?? []),
        ...(publication.keywords ?? [])
    ];

    const searchableText =
        searchableValues
            .map(
                normalizeSearchText
            )
            .join(" ");

    const keywordParts =
        normalizedKeyword
            .split(/\s+/)
            .filter(Boolean);

    return keywordParts.every(
        (part) => {
            return searchableText
                .includes(part);
        }
    );
}


function matchesSingleBrandOnly(
    publicationBrands,
    singleBrandOnly
) {
    if (!singleBrandOnly) {
        return true;
    }

    if (
        !Array.isArray(
            publicationBrands
        )
    ) {
        return false;
    }

    const normalizedBrands = [
        ...new Set(
            publicationBrands
                .map(
                    normalizeFilterValue
                )
                .filter(Boolean)
        )
    ];

    return (
        normalizedBrands.length === 1
    );
}


function matchesSingleValueGroup(
    publicationValue,
    selectedValues
) {
    if (
        !Array.isArray(
            selectedValues
        ) ||
        selectedValues.length === 0
    ) {
        return true;
    }

    return selectedValues.some(
        (selectedValue) => {
            return (
                normalizeFilterValue(
                    publicationValue
                ) ===
                normalizeFilterValue(
                    selectedValue
                )
            );
        }
    );
}


function matchesArrayGroup(
    publicationValues,
    selectedValues
) {
    if (
        !Array.isArray(
            selectedValues
        ) ||
        selectedValues.length === 0
    ) {
        return true;
    }

    const normalizedPublicationValues =
        Array.isArray(
            publicationValues
        )
            ? publicationValues.map(
                normalizeFilterValue
            )
            : [];

    return selectedValues.some(
        (selectedValue) => {
            return normalizedPublicationValues
                .includes(
                    normalizeFilterValue(
                        selectedValue
                    )
                );
        }
    );
}


function matchesYearGroup(
    publishDate,
    selectedYears
) {
    if (
        !Array.isArray(selectedYears) ||
        selectedYears.length === 0
    ) {
        return true;
    }

    const publicationYear =
        extractPublicationYear(
            publishDate
        );

    if (!publicationYear) {
        return false;
    }

    return selectedYears.some(
        (year) => {
            return (
                Number(year) ===
                publicationYear
            );
        }
    );
}

function extractPublicationYear(
    publishDate
) {
    const dateText =
        String(
            publishDate ?? ""
        ).trim();

    const yearMatch =
        dateText.match(
            /^(\d{4})/
        );

    if (!yearMatch) {
        return null;
    }

    const year =
        Number(
            yearMatch[1]
        );

    return Number.isFinite(year)
        ? year
        : null;
}


function normalizeYearValue(
    value
) {
    const normalized =
        String(
            value ?? ""
        ).trim();

    if (
        !/^\d{4}$/.test(
            normalized
        )
    ) {
        return "";
    }

    return normalized;
}


function matchesInterviewGroup(
    hasInterview,
    selectedValues
) {
    if (
        !Array.isArray(
            selectedValues
        ) ||
        selectedValues.length === 0
    ) {
        return true;
    }

    return selectedValues.some(
        (selectedValue) => {
            if (
                selectedValue === "yes"
            ) {
                return (
                    hasInterview === true
                );
            }

            if (
                selectedValue === "no"
            ) {
                return (
                    hasInterview !== true
                );
            }

            return false;
        }
    );
}

/* ========================================
   フィルター値正規化
======================================== */

function normalizeFilterValue(
    value
) {
    return String(
        value ?? ""
    )
        .normalize("NFKC")
        .trim();
}


/* ========================================
   検索文字正規化
======================================== */

function normalizeSearchText(
    value
) {
    return String(
        value ?? ""
    )
        .normalize("NFKC")
        .toLocaleLowerCase("ja")
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


/* ========================================
   比較・署名
======================================== */

function createFilterSignature(
    publications,
    filters
) {
    const publicationSignature =
        publications.map(
            (publication) => {
                return [
                    publication.id,
                    publication.publishDate,
                    publication.title
                ].join(":");
            }
        );

    return JSON.stringify({
        publications:
            publicationSignature,

        filters
    });
}


function arePublicationListsEqual(
    listA,
    listB
) {
    if (
        !Array.isArray(listA) ||
        !Array.isArray(listB)
    ) {
        return false;
    }

    if (
        listA.length !==
        listB.length
    ) {
        return false;
    }

    return listA.every(
        (publication, index) => {
            return (
                publication.id ===
                listB[index]?.id
            );
        }
    );
}


/* ========================================
   モーダル補助
======================================== */

function closeFilterModal(
    modal
) {
    if (!modal) {
        return;
    }

    modal.classList.remove(
        "is-open"
    );

    modal.hidden = true;

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "is-modal-open"
    );

    document.dispatchEvent(
        new CustomEvent(
            "archive:filter-modal-close"
        )
    );
}


/* ========================================
   共通関数
======================================== */

function debounce(
    callback,
    delay = 300
) {
    let timerId = null;

    return (...args) => {
        window.clearTimeout(
            timerId
        );

        timerId =
            window.setTimeout(
                () => {
                    callback(
                        ...args
                    );
                },
                delay
            );
    };
}
