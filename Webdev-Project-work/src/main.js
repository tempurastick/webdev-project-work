const finland = L.map("finlandMap");
const indigo = "oklch(58.5% 0.233 277.117)";

const API_URL = "https://api.inaturalist.org/v1/";
const FINLAND_PLACE_ID = 7020;
const QUERY =
    "search?q=Finland&sources=places&include_taxon_ancestors=false&per_page=100";

async function loadFinlandBoundaries() {
    let finlandBoundaries = await fetch(
        "/data/Finland_ADM0_simplified.simplified.geojson"
    );

    finlandBoundaries = await finlandBoundaries.json();

    const geoJson = L.geoJSON(finlandBoundaries, {
        style: {
            color: indigo,
            weight: 2,
        },
    }).addTo(finland);

    finland.fitBounds(geoJson.getBounds());
    const bounds = geoJson.getBounds();

    finland.setMaxBounds(bounds);

    const Esri_WorldGrayCanvas = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
            attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
            maxZoom: 9,
            minZoom: 5,
            zoomControl: false,
        }
    ).addTo(finland);
}

loadFinlandBoundaries();

function attachOSM() {
    const tile = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 15,
        minZoom: 5,
        attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(finland);
}

const viableCategories = [
    "Aves",
    "Amphibia",
    "Reptilia",
    "Mammalia",
    "Actinopterygii",
    "Mollusca",
    "Arachnida",
    "Insecta",
];

//https://www.inaturalist.org/observations?place_id=7020&quality_grade=research&subview=map&iconic_taxa=Aves,Amphibia,Reptilia,Mammalia,Actinopterygii,Mollusca,Arachnida,Insecta
async function fetchLocalObservations() {
    // i need to make this more reusable later on
    const observationQuery = `${API_URL}observations?`;
    const placeQuery = `place_id=${FINLAND_PLACE_ID}`;
    const qualityQuery = `quality_grade=research`;
    const pageLimit = "per_page=30";
    let categories = "iconic_taxa=";
    const cats = viableCategories.join(",");

    const initialQuery = await fetch(
        `${observationQuery}${placeQuery}&${qualityQuery}&${pageLimit}&${categories}${cats}`
    );

    const response = await initialQuery.json();

    const results = await response.results;
    return await results;
}

async function initialPage() {
    const results = await fetchLocalObservations();

    console.log(results);
}

initialPage();
