const DEFAULT_FILTERS = {
    keyword: "",
    categories: [],
    brands: [],
    years: [],
    interview: [],
    siteStatuses: [],
    singleBrandOnly: false
};

const DEFAULT_STATE = {
    publications: [],
    visiblePublications: [],
    filters: DEFAULT_FILTERS,
    sortType: "date-desc"
};

export function createArchiveStore(
    initialState = {}
) {
    let state =
        normalizeState({
            ...DEFAULT_STATE,
            ...initialState,

            filters: {
                ...DEFAULT_FILTERS,
                ...(
                    initialState.filters ??
                    {}
                )
            }
        });

    const listeners =
        new Set();

    function getState() {
        return cloneState(
            state
        );
    }

    function subscribe(
        listener
    ) {
        if (
            typeof listener !==
            "function"
        ) {
            throw new TypeError(
                "subscribeには関数を指定してください。"
            );
        }

        listeners.add(
            listener
        );

        listener(
            getState()
        );

        return () => {
            listeners.delete(
                listener
            );
        };
    }

    function setState(
        updater
    ) {
        const currentState =
            getState();

        const partialState =
            typeof updater ===
            "function"
                ? updater(
                    currentState
                )
                : updater;

        if (
            !partialState ||
            typeof partialState !==
                "object" ||
            Array.isArray(
                partialState
            )
        ) {
            return;
        }

        const nextState =
            normalizeState({
                ...state,
                ...partialState,

                filters:
                    partialState.filters
                        ? {
                            ...state.filters,
                            ...partialState.filters
                        }
                        : state.filters
            });

        if (
            areStatesEqual(
                state,
                nextState
            )
        ) {
            return;
        }

        state =
            nextState;

        notifyListeners(
            listeners,
            state
        );
    }

    function setPublications(
        publications
    ) {
        const normalizedPublications =
            normalizePublications(
                publications
            );

        setState({
            publications:
                normalizedPublications
        });
    }

    function setVisiblePublications(
        publications
    ) {
        const normalizedPublications =
            normalizePublications(
                publications
            );

        setState({
            visiblePublications:
                normalizedPublications
        });
    }

    function setKeyword(
        keyword
    ) {
        setState({
            filters: {
                keyword:
                    normalizeKeyword(
                        keyword
                    )
            }
        });
    }

    function setFilters(
        filters
    ) {
        if (
            !filters ||
            typeof filters !==
                "object" ||
            Array.isArray(
                filters
            )
        ) {
            return;
        }

        const nextFilters = {};

        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    filters,
                    "keyword"
                )
        ) {
            nextFilters.keyword =
                normalizeKeyword(
                    filters.keyword
                );
        }

        FILTER_ARRAY_KEYS.forEach(
            (key) => {
                if (
                    Object.prototype
                        .hasOwnProperty
                        .call(
                            filters,
                            key
                        )
                ) {
                    nextFilters[key] =
                        normalizeFilterArray(
                            filters[key]
                        );
                }
            }
        );

        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    filters,
                    "singleBrandOnly"
                )
        ) {
            nextFilters.singleBrandOnly =
                Boolean(
                    filters.singleBrandOnly
                );
        }

        setState({
            filters:
                nextFilters
        });
    }

    function addFilterValue(
        filterKey,
        value
    ) {
        if (
            !FILTER_ARRAY_KEYS.includes(
                filterKey
            )
        ) {
            return;
        }

        const normalizedValue =
            normalizeFilterValue(
                value
            );

        if (!normalizedValue) {
            return;
        }

        const currentValues =
            state.filters[
                filterKey
            ] ?? [];

        if (
            currentValues.includes(
                normalizedValue
            )
        ) {
            return;
        }

        setFilters({
            [filterKey]: [
                ...currentValues,
                normalizedValue
            ]
        });
    }

    function removeFilterValue(
        filterKey,
        value
    ) {
        if (
            !FILTER_ARRAY_KEYS.includes(
                filterKey
            )
        ) {
            return;
        }

        const normalizedValue =
            normalizeFilterValue(
                value
            );

        const nextValues =
            (
                state.filters[
                    filterKey
                ] ?? []
            ).filter(
                (currentValue) => {
                    return (
                        currentValue !==
                        normalizedValue
                    );
                }
            );

        setFilters({
            [filterKey]:
                nextValues
        });
    }

    function clearFilterGroup(
        filterKey
    ) {
        if (
            filterKey === "keyword"
        ) {
            setKeyword("");
            return;
        }

        if (
            filterKey ===
            "singleBrandOnly"
        ) {
            setFilters({
                singleBrandOnly: false
            });

            return;
        }

        if (
            !FILTER_ARRAY_KEYS.includes(
                filterKey
            )
        ) {
            return;
        }

        setFilters({
            [filterKey]: []
        });
    }

    function resetFilters() {
        setState({
            filters:
                createDefaultFilters()
        });
    }

    function setSortType(
        sortType
    ) {
        setState({
            sortType:
                normalizeSortType(
                    sortType
                )
        });
    }

    return {
        getState,
        subscribe,
        setState,

        setPublications,
        setVisiblePublications,

        setKeyword,
        setFilters,
        addFilterValue,
        removeFilterValue,
        clearFilterGroup,
        resetFilters,

        setSortType
    };
}

const FILTER_ARRAY_KEYS = [
    "categories",
    "brands",
    "years",
    "interview",
    "siteStatuses"
];

const VALID_SORT_TYPES = [
    "date-desc",
    "date-asc",
    "title-asc",
    "title-desc"
];

function normalizeState(
    rawState
) {
    const publications =
        normalizePublications(
            rawState.publications
        );

    const visiblePublications =
        normalizePublications(
            rawState.visiblePublications
        );

    return {
        publications,

        visiblePublications,

        filters:
            normalizeFilters(
                rawState.filters
            ),

        sortType:
            normalizeSortType(
                rawState.sortType
            )
    };
}

function normalizeFilters(
    filters
) {
    const source =
        filters &&
        typeof filters ===
            "object" &&
        !Array.isArray(
            filters
        )
            ? filters
            : {};

    return {
        keyword:
            normalizeKeyword(
                source.keyword
            ),

        categories:
            normalizeFilterArray(
                source.categories
            ),

        brands:
            normalizeFilterArray(
                source.brands
            ),

        years:
            normalizeFilterArray(
                source.years
            ),

        interview:
            normalizeFilterArray(
                source.interview
            ),

        siteStatuses:
            normalizeFilterArray(
                source.siteStatuses
            ),

        singleBrandOnly:
            Boolean(
                source.singleBrandOnly
            )
    };
}

function normalizePublications(
    publications
) {
    if (
        !Array.isArray(
            publications
        )
    ) {
        return [];
    }

    return publications
        .filter(
            (publication) => {
                return (
                    publication &&
                    typeof publication ===
                        "object" &&
                    !Array.isArray(
                        publication
                    )
                );
            }
        )
        .map(
            (publication) => {
                return {
                    ...publication,

                    category:
                        normalizeFilterValue(
                            publication.category
                        ),

                    brands:
                        Array.isArray(
                            publication.brands
                        )
                            ? publication.brands
                                .map(
                                    normalizeFilterValue
                                )
                            : [],

                    siteStatuses:
                        Array.isArray(
                            publication
                                .siteStatuses
                        )
                            ? publication
                                .siteStatuses
                                .map(
                                    normalizeFilterValue
                                )
                            : []
                };
            }
        );
}

function normalizeKeyword(
    keyword
) {
    return String(
        keyword ?? ""
    )
        .normalize("NFKC")
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}

function normalizeFilterArray(
    values
) {
    if (!Array.isArray(values)) {
        return [];
    }

    const normalizedValues =
        values
            .map(
                normalizeFilterValue
            )
            .filter(Boolean);

    return [
        ...new Set(
            normalizedValues
        )
    ];
}

function normalizeFilterValue(
    value
) {
    return String(
        value ?? ""
    )
        .normalize("NFKC")
        .trim();
}

function normalizeSortType(
    sortType
) {
    const normalizedSortType =
        String(
            sortType ?? ""
        ).trim();

    return VALID_SORT_TYPES.includes(
        normalizedSortType
    )
        ? normalizedSortType
        : "date-desc";
}

function createDefaultFilters() {
    return {
        keyword: "",
        categories: [],
        brands: [],
        years: [],
        interview: [],
        siteStatuses: [],
        singleBrandOnly: false
    };
}

function notifyListeners(
    listeners,
    state
) {
    const snapshot =
        cloneState(
            state
        );

    listeners.forEach(
        (listener) => {
            try {
                listener(
                    snapshot
                );
            } catch (error) {
                console.error(
                    "状態変更の通知中にエラーが発生しました。",
                    error
                );
            }
        }
    );
}

function cloneState(
    state
) {
    return {
        publications:
            state.publications.map(
                clonePublication
            ),

        visiblePublications:
            state
                .visiblePublications
                .map(
                    clonePublication
                ),

        filters: {
            keyword:
                state.filters.keyword,

            categories: [
                ...state
                    .filters
                    .categories
            ],

            brands: [
                ...state
                    .filters
                    .brands
            ],

            years: [
                ...state
                    .filters
                    .years
            ],

            interview: [
                ...state
                    .filters
                    .interview
            ],

            siteStatuses: [
                ...state
                    .filters
                    .siteStatuses
            ],

            singleBrandOnly:
                Boolean(
                    state
                        .filters
                        .singleBrandOnly
                )
        },

        sortType:
            state.sortType
    };
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
                    ...publication
                        .brands
                ]
                : [],

        siteStatuses:
            Array.isArray(
                publication
                    .siteStatuses
            )
                ? [
                    ...publication
                        .siteStatuses
                ]
                : []
    };
}

function areStatesEqual(
    stateA,
    stateB
) {
    return (
        stateA.sortType ===
            stateB.sortType &&

        areFiltersEqual(
            stateA.filters,
            stateB.filters
        ) &&

        arePublicationArraysEqual(
            stateA.publications,
            stateB.publications
        ) &&

        arePublicationArraysEqual(
            stateA.visiblePublications,
            stateB.visiblePublications
        )
    );
}

function areFiltersEqual(
    filtersA,
    filtersB
) {
    if (
        filtersA.keyword !==
            filtersB.keyword ||
        Boolean(
            filtersA.singleBrandOnly
        ) !==
        Boolean(
            filtersB.singleBrandOnly
        )
    ) {
        return false;
    }

    return FILTER_ARRAY_KEYS.every(
        (key) => {
            return areStringArraysEqual(
                filtersA[key],
                filtersB[key]
            );
        }
    );
}

function areStringArraysEqual(
    arrayA,
    arrayB
) {
    if (
        arrayA.length !==
        arrayB.length
    ) {
        return false;
    }

    return arrayA.every(
        (value, index) => {
            return (
                value ===
                arrayB[index]
            );
        }
    );
}

function arePublicationArraysEqual(
    arrayA,
    arrayB
) {
    if (
        arrayA.length !==
        arrayB.length
    ) {
        return false;
    }

    return arrayA.every(
        (publication, index) => {
            const comparedPublication =
                arrayB[index];

            if (!comparedPublication) {
                return false;
            }

            return (
                publication.id ===
                    comparedPublication.id &&

                publication.title ===
                    comparedPublication.title &&

                publication.publishDate ===
                    comparedPublication
                        .publishDate &&

                publication.category ===
                    comparedPublication
                        .category &&

                publication.coverImage ===
                    comparedPublication
                        .coverImage &&

                publication.pdfPath ===
                    comparedPublication
                        .pdfPath &&

                publication.salesUrl ===
                    comparedPublication
                        .salesUrl &&

                publication.hasInterview ===
                    comparedPublication
                        .hasInterview &&

                areStringArraysEqual(
                    publication.brands,
                    comparedPublication
                        .brands
                ) &&

                areStringArraysEqual(
                    publication.siteStatuses,
                    comparedPublication
                        .siteStatuses
                )
            );
        }
    );
}
