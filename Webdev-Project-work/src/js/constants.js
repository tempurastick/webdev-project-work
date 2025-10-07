export const CONFIG = {
    API_URL: "https://api.inaturalist.org/v1/",
    FINLAND_PLACE_ID: 7020,
    SEARCH: "search?q=Finland&sources=places&include_taxon_ancestors=false&per_page=200",
    BGMAP: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    FINLAND_MAP: "/data/Finland_ADM0_simplified.simplified.geojson",
    PLACEHOLDER_IMAGE_URL: "https://via.placeholder.com/200x200?text=No+Image",
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
];
