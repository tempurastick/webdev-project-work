import { CONFIG, SPECIES_GLOSSARY } from "./constants.js";
export default class DomRenderer {
    constructor(dataHandler, finlandMap) {
        this.dataHandler = dataHandler;
        this.finlandMap = finlandMap;
        this.speciesGrid = document.querySelector("#speciesGrid");

        this.speciesSelectedListElement = document.querySelector(
            ".species-selected-list"
        );

        this.resetBtn = document.querySelector("#btn-filter-reset");
        this.submitBtn = document.querySelector("#btn-filter-submit");

        this.currentSpeciesCardTemplate =
            document.getElementById("currentSpeciesCard");

        this.speciesClasses = {};
        this.selectedValues = [];

        this.init();
    }

    async init() {
        await this.populateSpecies();
        this.renderAllSpeciesLists();
        this._registerEventListeners();
        this._emitSpeciesListsRenderedEvent();
    }

    _registerEventListeners() {
        //this._registerSelectEventListeners();
        this._registerResetBtn();
        this._registerSubmitBtn();
    }

    _registerResetBtn() {
        this.resetBtn.addEventListener("click", () => {
            this._resetSelectedValues();
        });
    }

    _registerSubmitBtn() {
        this.submitBtn.addEventListener("click", () => {
            this._resolveSubmission();
        });
    }

    // definitely need a debouncer on the button for the wait time
    _resolveSubmission() {
        const currentSelections = this._getCurrentSelections();
        if (currentSelections.length == 0) {
            return console.warn("No selection");
            // do other stuff here, or maybe submit should just be disabled until currentSelection is filled
        } else {
            currentSelections.forEach(async (selection) => {
                const selectionQuery =
                    this.dataHandler.buildObservationQuery(selection);
                let selectionData = await this.dataHandler.fetchDataThrottle(
                    selectionQuery
                );
                selectionData = selectionData.results;

                // I need something for when no observations are recorded
                selectionData.forEach((result) => {
                    this.finlandMap.addObservationLayer(result);
                });
            });
        }
    }

    _getCurrentSelections() {
        return this.selectedValues.slice(0);
    }

    _registerSelectEventListeners() {
        const selectElements = document.querySelectorAll(
            ".species-dropdown-item__checkbox"
        );

        selectElements.forEach((selectEl) => {
            selectEl.addEventListener("input", () => {
                this._resolveSelection(selectEl);
                console.log(this.selectedValues);
            });
        });
    }

    _getSelectedValue(selected) {
        return selected.id ?? null;
    }

    _resolveSelection(selectEl) {
        const value = this._getSelectedValue(selectEl);

        this._storeSelectedValues(value);
    }

    _checkSelectionvalue(value) {
        if (this.selectedValues.includes(value) || value == null) {
            return true;
        }
    }

    _storeSelectedValues(value) {
        if (this._checkSelectionvalue(value)) {
            return;
        }

        this.selectedValues.push(value);
    }

    _resetSelectedValues() {
        this.selectedValues = [];
        console.log("current selections are empty:", this.selectedValues);
    }

    async populateSpecies() {
        const fetchPromises = SPECIES_GLOSSARY.map(async (speciesClass) => {
            const data = await this.dataHandler.fetchData(speciesClass.file);

            this.speciesClasses[speciesClass.type] = data;
        });

        await Promise.all(fetchPromises);
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

            // put these as variables later
            optionNode.setAttribute("data-species-scientific", scientificName);
            optionNode.setAttribute("data-species-common", commonName);
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

    // send custom event once species list is rendered, so filter menu knows when to attach event listener
    _emitSpeciesListsRenderedEvent() {
        const event = new CustomEvent("speciesListsRendered", {
            bubble: true,
            detail: { timestamp: Date.now() },
        });
        document.dispatchEvent(event);
    }
}
