const AVES_FILE = "/data/aves.json";
const MAMMALS_FILE = "/data/mammals.json";
const FISH_FILE = "/data/fish.json";
const AMPHIBIANS_FILE = "/data/amphibians.json";

async function loadLocalSpeciesData(file) {
    let data = await fetch(file).then((response) => response.json());
    return await data;
}

const species = {
    name: "bla",
    data: "re",
};

async function populateSpecies({ species }) {
    const speciesGrid = document.querySelector("#speciesGrid");

    speciesGrid.appendChild(
        populateDropdown(species.data, species.name, scientificNameToggleValue)
    );

    createTaglist();
}
