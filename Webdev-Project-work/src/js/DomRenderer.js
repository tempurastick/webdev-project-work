import { CONFIG, SPECIES_GLOSSARY } from "./constants.js";
export default class DomRenderer {
    constructor(dataHandler) {
        this.dataHandler = dataHandler;
        this.speciesGrid = document.querySelector("#speciesGrid");
        this.scientificNameToggle = document.querySelector(
            "#scientific-name-toggle"
        );
        this.speciesSelectedListElement = document.querySelector(
            ".species-selected-list"
        );

        this.currentSpeciesCardTemplate =
            document.getElementById("currentSpeciesCard");

        this.speciesClasses = {};

        this.#registerToggleEventListeners();
        this.init();
    }

    async init() {
        await this.populateSpecies();
    }

    #registerToggleEventListeners() {
        this.scientificNameToggle.addEventListener("input", () => {
            this.toggleSpeciesNameDisplay();
        });
    }

    async populateSpecies() {
        SPECIES_GLOSSARY.forEach(async (speciesClass) => {
            const data = await this.dataHandler.fetchData(speciesClass.file);

            this.speciesClasses[speciesClass.type] = data;
        });
    }

    renderAllSpeciesLists() {
        const speciesClassNames = Object.keys(this.speciesClasses);
        speciesClassNames.forEach((speciesClass) => {
            const speciesList = this.speciesClasses[speciesClass];
            this.speciesGrid.appendChild(
                this._renderSpeciesClassList(speciesList, speciesClass)
            );
        });
    }

    _renderSpeciesClassList(speciesList, speciesClass) {
        const template = document.getElementById("speciesDropdownList");
        const dropdownFragment = template.content.cloneNode(true);

        const speciesCategory =
            dropdownFragment.querySelector(".species-category");
        const speciesDropdown =
            dropdownFragment.querySelector(".species-dropdown");
        const speciesDropdownItem = dropdownFragment.querySelector(
            ".species-dropdown-item"
        );

        // I could probably turn this into one param to save on speciesCategory
        speciesCategory.textContent = speciesClass;

        speciesDropdown.setAttribute("id", `species-dropdown-${speciesClass}`);

        const optionNode = dropdownFragment.querySelector(
            ".species-dropdown-item"
        );
        speciesList.forEach((item) => {
            const scientificName = item["Scientific name"];
            const commonName = item["Vernacular name"];
            const optionEl = optionNode.cloneNode(true);
            const scientificEl = optionEl.querySelector(
                ".species-dropdown-item--scientific"
            );
            const commonEl = optionEl.querySelector(
                ".species-dropdown-item--common"
            );
            const labelEl = optionEl.querySelector(
                ".species-dropdown-item__label"
            );
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

    renderCurrentSpeciesCard(taxon) {
        const parentContainer = document.getElementById(
            "current-species-container"
        );
        const template = document.getElementById("currentSpeciesCard");
        const speciesCardFragment = template.content.cloneNode(true);
        const img = speciesCardFragment.querySelector(".current-species-img");
        const name = speciesCardFragment.querySelector(".current-species-name");
        const subHeading = speciesCardFragment.querySelector(
            ".current-species-sub-heading"
        );
        const desc = speciesCardFragment.querySelector(
            ".current-species-description"
        );
        img.src =
            taxon?.default_photo?.square_url || CONFIG.PLACEHOLDER_IMAGE_URL;
        img.alt = taxon?.default_photo?.attribution || `No Image Found`;
        name.textContent = taxon?.preferred_common_name;
        subHeading.textContent = taxon?.name;
        console.log(taxon);
        // missing desc in current fetch
        parentContainer.appendChild(speciesCardFragment);
        // maybe should have an info about how many sightings there were etc too
    }
}
