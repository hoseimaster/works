const SORT_OPTIONS = {
    "date-desc": {
        label: "発行日の新しい順",
        compare:
            compareByDateDescending
    },

    "date-asc": {
        label: "発行日の古い順",
        compare:
            compareByDateAscending
    },

    "title-asc": {
        label: "タイトル昇順",
        compare:
            compareByTitleAscending
    },

    "title-desc": {
        label: "タイトル降順",
        compare:
            compareByTitleDescending
    }
};

const DEFAULT_SORT_TYPE =
    "date-desc";

export function initializeSort({
    store
}) {
    if (!store) {
        throw new Error(
            "sort.jsの初期化にはstoreが必要です。"
        );
    }

    const elements =
        getSortElements();

    if (!elements.sortSelect) {
        return;
    }

    renderSortOptions(
        elements.sortSelect
    );

    elements.sortSelect
        .addEventListener(
            "change",
            () => {
                const sortType =
                    normalizeSortType(
                        elements
                            .sortSelect
                            .value
                    );

                store.setSortType(
                    sortType
                );

                applySortToStore({
                    store,
                    sortType
                });
            }
        );

    let previousSortSignature = "";

    store.subscribe((state) => {
        const sortType =
            normalizeSortType(
                state.sortType
            );

        if (
            elements.sortSelect.value !==
            sortType
        ) {
            elements.sortSelect.value =
                sortType;
        }

        const signature =
            createSortSignature(
                state.visiblePublications,
                sortType
            );

        if (
            signature ===
            previousSortSignature
        ) {
            return;
        }

        previousSortSignature =
            signature;

        const sortedPublications =
            sortPublications(
                state.visiblePublications,
                sortType
            );

        if (
            !arePublicationListsEqual(
                state.visiblePublications,
                sortedPublications
            )
        ) {
            store.setVisiblePublications(
                sortedPublications
            );
        }
    });
}

function getSortElements() {
    return {
        sortSelect:
            document.getElementById(
                "sortSelect"
            ) ??
            document.getElementById(
                "sortOrder"
            )
    };
}

function renderSortOptions(
    select
) {
    const currentValue =
        normalizeSortType(
            select.value
        );

    const fragment =
        document.createDocumentFragment();

    Object.entries(
        SORT_OPTIONS
    ).forEach(
        ([value, config]) => {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                value;

            option.textContent =
                config.label;

            fragment.appendChild(
                option
            );
        }
    );

    select.replaceChildren(
        fragment
    );

    select.value =
        currentValue;
}

function applySortToStore({
    store,
    sortType
}) {
    const state =
        store.getState();

    const sortedPublications =
        sortPublications(
            state.visiblePublications,
            sortType
        );

    store.setVisiblePublications(
        sortedPublications
    );
}

export function sortPublications(
    publications = [],
    sortType =
        DEFAULT_SORT_TYPE
) {
    if (
        !Array.isArray(
            publications
        )
    ) {
        return [];
    }

    const normalizedSortType =
        normalizeSortType(
            sortType
        );

    const compare =
        SORT_OPTIONS[
            normalizedSortType
        ].compare;

    return publications
        .map(
            (
                publication,
                originalIndex
            ) => {
                return {
                    publication,
                    originalIndex
                };
            }
        )
        .sort(
            (itemA, itemB) => {
                const result =
                    compare(
                        itemA.publication,
                        itemB.publication
                    );

                if (result !== 0) {
                    return result;
                }

                return (
                    itemA.originalIndex -
                    itemB.originalIndex
                );
            }
        )
        .map(
            (item) =>
                item.publication
        );
}

function compareByDateDescending(
    publicationA,
    publicationB
) {
    return comparePublicationDates(
        publicationA,
        publicationB,
        "desc"
    );
}

function compareByDateAscending(
    publicationA,
    publicationB
) {
    return comparePublicationDates(
        publicationA,
        publicationB,
        "asc"
    );
}

function comparePublicationDates(
    publicationA,
    publicationB,
    direction
) {
    const dateA =
        getDateTimestamp(
            publicationA
                ?.publishDate
        );

    const dateB =
        getDateTimestamp(
            publicationB
                ?.publishDate
        );

    const isValidA =
        Number.isFinite(dateA);

    const isValidB =
        Number.isFinite(dateB);

    if (
        !isValidA &&
        !isValidB
    ) {
        return compareFallbackValues(
            publicationA,
            publicationB
        );
    }

    if (!isValidA) {
        return 1;
    }

    if (!isValidB) {
        return -1;
    }

    if (dateA !== dateB) {
        return direction === "asc"
            ? dateA - dateB
            : dateB - dateA;
    }

    return compareFallbackValues(
        publicationA,
        publicationB
    );
}

function getDateTimestamp(
    value
) {
    const dateText =
        String(
            value ?? ""
        ).trim();

    if (
        !/^\d{4}-\d{2}-\d{2}$/
            .test(dateText)
    ) {
        return Number.NaN;
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

    const isValid =
        date.getFullYear() ===
            year &&
        date.getMonth() ===
            month - 1 &&
        date.getDate() ===
            day;

    if (!isValid) {
        return Number.NaN;
    }

    return date.getTime();
}

function compareByTitleAscending(
    publicationA,
    publicationB
) {
    const result =
        compareJapaneseText(
            publicationA?.title,
            publicationB?.title
        );

    if (result !== 0) {
        return result;
    }

    return compareFallbackValues(
        publicationA,
        publicationB
    );
}

function compareByTitleDescending(
    publicationA,
    publicationB
) {
    const result =
        compareJapaneseText(
            publicationB?.title,
            publicationA?.title
        );

    if (result !== 0) {
        return result;
    }

    return compareFallbackValues(
        publicationA,
        publicationB
    );
}

function compareJapaneseText(
    valueA,
    valueB
) {
    const textA =
        normalizeSortText(
            valueA
        );

    const textB =
        normalizeSortText(
            valueB
        );

    if (
        !textA &&
        !textB
    ) {
        return 0;
    }

    if (!textA) {
        return 1;
    }

    if (!textB) {
        return -1;
    }

    return textA.localeCompare(
        textB,
        "ja",
        {
            sensitivity: "base",
            numeric: true,
            ignorePunctuation: true
        }
    );
}

function compareFallbackValues(
    publicationA,
    publicationB
) {
    const titleResult =
        compareJapaneseText(
            publicationA?.title,
            publicationB?.title
        );

    if (titleResult !== 0) {
        return titleResult;
    }

    return compareJapaneseText(
        publicationA?.id,
        publicationB?.id
    );
}

function normalizeSortText(
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
    const normalized =
        String(
            sortType ?? ""
        ).trim();

    return Object.prototype
        .hasOwnProperty
        .call(
            SORT_OPTIONS,
            normalized
        )
        ? normalized
        : DEFAULT_SORT_TYPE;
}

function createSortSignature(
    publications,
    sortType
) {
    if (
        !Array.isArray(
            publications
        )
    ) {
        return JSON.stringify({
            sortType,
            publications: []
        });
    }

    return JSON.stringify({
        sortType,

        publications:
            publications.map(
                (publication) => {
                    return [
                        publication.id,
                        publication.publishDate,
                        publication.title
                    ].join("|");
                }
            )
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
