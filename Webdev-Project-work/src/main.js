const finland = L.map("finlandMap");
const indigo = "oklch(58.5% 0.233 277.117)";

const API_URL = "https://api.inaturalist.org/v1/";
const FINLAND_PLACE_ID = 7020;
const QUERY =
    "search?q=Finland&sources=places&include_taxon_ancestors=false&per_page=200";

const AVES_FILE = "/data/aves.json";
const MAMMALS_FILE = "/data/mammals.json";
const FISH_FILE = "/data/fish.json";
const AMPHIBIANS_FILE = "/data/amphibians.json";

// make this more dynamic later
const scientificNameToggle = document.querySelector("#scientific-name-toggle");
const scientificNameToggleValue = scientificNameToggle.checked;

scientificNameToggle.addEventListener("input", () => {
    // grab all dropdowns and toggle the display
    const speciesDropdownElements =
        document.querySelectorAll(".species-dropdown");
    speciesDropdownElements.forEach((el) => {
        el.classList.toggle("--common");
        el.classList.toggle("--scientific");
    });

    const speciesSelectedListElement = document.querySelector(
        ".species-selected-list"
    );

    speciesSelectedListElement.classList.toggle("--common");
    speciesSelectedListElement.classList.toggle("--scientific");
});

// TODO search function inside dropdown
// TODO display dropdowns of selected categories

async function loadLocalJson(file) {
    let data = await fetch(file).then((response) => response.json());
    return await data;
}

async function populateSpecies() {
    const aves = await loadLocalJson(AVES_FILE);
    const mammals = await loadLocalJson(MAMMALS_FILE);
    const fish = await loadLocalJson(FISH_FILE);
    const amphibians = await loadLocalJson(AMPHIBIANS_FILE);
    const speciesGrid = document.querySelector("#speciesGrid");

    speciesGrid.appendChild(
        populateDropdown(aves, "Birds", scientificNameToggleValue)
    );

    createTaglist();
}

function createTaglist() {
    const selectedCheckbox = document.querySelectorAll(
        ".species-dropdown-item__checkbox"
    );

    // gonna have multiple so this needs to be adjusted later on
    const selectedList = document.querySelector(".species-selected-list");

    selectedCheckbox.forEach((checkbox) => {
        checkbox.addEventListener("input", () => {
            if (checkbox.checked) {
                // get the li element
                const clone =
                    checkbox.parentElement.parentElement.cloneNode(true);

                // copy it to the new list - not sure of this whole process rn because it might be overkill + not clean enough
                selectedList.appendChild(clone);
            }
        });
    });
}

// TODO when selected -> appear as a tag

function populateDropdown(list, category, scientific) {
    const template = document.getElementById("speciesDropdownList");

    const dropdownFragment = template.content.cloneNode(true);
    const speciesGrid = dropdownFragment.querySelector(".species-grid");
    const speciesCategory = dropdownFragment.querySelector(".species-category");
    const speciesDropdown = dropdownFragment.querySelector(".species-dropdown");
    const speciesDropdownItem = dropdownFragment.querySelector(
        ".species-dropdown-item"
    );

    // I could probably put this in another function for the toggle event listener itself
    const nameToDisplay = scientific ? "--scientific" : "--common";
    speciesDropdown.classList.add(nameToDisplay);

    speciesCategory.textContent = category;

    speciesDropdown.setAttribute("id", `species-dropdown-${category}`);

    const optionNode = dropdownFragment.querySelector(".species-dropdown-item");
    list.forEach((item) => {
        const scientificName = item["Scientific name"];
        const commonName = item["Vernacular name"];
        const optionEl = optionNode.cloneNode(true);
        const scientificEl = optionEl.querySelector(
            ".species-dropdown-item--scientific"
        );
        const commonEl = optionEl.querySelector(
            ".species-dropdown-item--common"
        );
        const labelEl = optionEl.querySelector(".species-dropdown-item__label");
        const checkboxEl = optionEl.querySelector(
            ".species-dropdown-item__checkbox"
        );

        labelEl.setAttribute("for", scientificName);
        checkboxEl.setAttribute("id", scientificName);

        scientificEl.textContent = scientificName;
        commonEl.textContent = commonName;
        speciesDropdown.appendChild(optionEl);
    });

    return dropdownFragment;
}

populateSpecies();

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

    let dummyData = await fetchTaxonObservations("Purple Heron");
    dummyData = dummyData.results;

    let featureList = [];
    dummyData.forEach((data) => featureList.push(createGeoJsonFeature(data)));

    let observationGeoJson = L.geoJSON(featureList, {
        onEachFeature: onEachFeature,
    }).addTo(finland);

    const Esri_WorldGrayCanvas = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
            attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
            maxZoom: 9,
            minZoom: 5,
            zoomControl: false,
        }
    ).addTo(finland);

    const baseMaps = {
        Esri: Esri_WorldGrayCanvas,
    };

    const overlayMaps = {
        observations: observationGeoJson,
    };

    const layerControl = L.control.layers(baseMaps, overlayMaps).addTo(finland);
    finland.fitBounds(geoJson.getBounds());
    const bounds = geoJson.getBounds();
    finland.setMaxBounds(bounds);
}

function onEachFeature(feature, layer) {
    if (feature.properties && feature.properties.popupContent) {
        layer.bindPopup(feature.properties.popupContent);
    }
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

// need to clean this up too, but basic local storage
function initialPage() {
    if (!localStorage.getItem("Results")) {
        const results = populatePage();
        console.log("not cached", results);
    } else {
        const results = JSON.parse(localStorage.getItem("Results"));
        console.log("cached", results);
    }
}

async function populatePage() {
    const results = await fetchLocalObservations();
    localStorage.setItem("Results", JSON.stringify(results));
    return await results;
}

function createGeoJsonFeature(observation) {
    const feature = {
        type: "Feature",
        properties: {
            name:
                observation.taxon?.name ||
                observation.taxon?.preferred_commono_name,

            popupContent: "This is where the Rockies play!",
        },
        geometry: {
            type: observation.geojson?.type,
            coordinates: observation.geojson?.coordinates,
        },
    };
    return feature;
}

initialPage();

async function fetchTaxonObservations(taxon) {
    // example URL
    //https://api.inaturalist.org/v1/observations?captive=false&geo=true&place_id=7020&taxon_name=%22Purple%20Heron%22&quality_grade=research&order=desc&order_by=created_at
    taxon = taxon.replace(/\s/g, "%");

    const queryParameters = `observations?captive=false&geo=true&place_id=${FINLAND_PLACE_ID}&taxon_name=${taxon}&quality_grade=research&order=desc&order_by=created_at`;

    const query = `${API_URL}${queryParameters}`;

    const data = await fetch(query).then((response) => response.json());

    return await data;
}
