export const CONFIG = {
    API_URL: "https://api.inaturalist.org/v1/",
    FINLAND_PLACE_ID: 7020,
    SEARCH: "search?q=Finland&sources=places&include_taxon_ancestors=false&per_page=200",
    BGMAP: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    SATELLITEMAP:
        "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}",
    FINLAND_MAP: "/data/Finland_ADM0_simplified.simplified.geojson",
    PLACEHOLDER_IMAGE_URL: "https://placehold.co/200x200?text=No+Image",
    LOCALSTORAGE_ENTRIES_LIMIT: 5,
    STORAGE_KEY_SPECIES_DATA: "speciesData_",
};

export const SPECIES_GLOSSARY = [
    {
        type: "Aves",
        file: "/data/aves.json",
    },
    {
        type: "Mammals",
        file: "/data/mammals.json",
    },
    {
        type: "Fish",
        file: "/data/fish.json",
    },
    {
        type: "Amphibians",
        file: "/data/amphibians.json",
    },
    {
        type: "Insects",
        file: "/data/insects.json",
    },
    {
        type: "Mollusks",
        file: "/data/mollusks.json",
    },
    {
        type: "Reptiles",
        file: "/data/reptiles.json",
    },
    {
        type: "Arachnids",
        file: "/data/arachnids.json",
    },
];

export const EVENTS = {
    SPECIES_LIST_RENDERED: "speciesListsRendered",
    SUBMIT_SPECIES_SEARCH: "speciesSubmitted",
    SPECIES_DATA_READY: "speciesDataFetched",
    CLEAR_DATA: "clearData",
    ERROR: "error",
    PRINT_HEATMAP: "prinHeatMap",
    TOGGLE_HEATMAP: "toggleHeatMap",
};
