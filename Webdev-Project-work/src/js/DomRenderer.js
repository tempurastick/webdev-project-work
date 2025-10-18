import { CONFIG, SPECIES_GLOSSARY, EVENTS } from "./constants.js";

import { icons } from "./assets.js";

export default class DomRenderer {
    constructor(dataHandler, finlandMap) {
        this.dataHandler = dataHandler;
        this.finlandMap = finlandMap;
        this.speciesGrid = document.querySelector("#speciesGrid");

        this.speciesSelectedListElement = document.querySelector(
            ".species-selected-list"
        );

        this.currentSpeciesContainer = document.getElementById(
            "current-species-container"
        );
        this.currentSpeciesCardTemplate =
            document.getElementById("currentSpeciesCard");

        this.toastNotificationEl = document.getElementById("toastNotification");
        this.toastText = this.toastNotificationEl.querySelector(
            ".toast-notification__text"
        );
        this.toastDismissBtn = document.getElementById("toastDismissBtn");
        this.speciesClasses = {};
        this.selectedValues = [];
        this.init();
    }

    async init() {
        await this.populateSpecies();
        this.renderAllSpeciesLists();
        this._emitSpeciesListsRenderedEvent();
        this._registerEventListeners();
    }

    _getCurrentSelections() {
        return this.selectedValues.slice(0);
    }

    _registerEventListeners() {
        document.addEventListener(EVENTS.SPECIES_DATA_READY, async (event) => {
            const taxon = event.detail.results[0].taxon;
            this.renderCurrentSpeciesCard(taxon);
            this._renderToastSuccess("Successfuly fetched all info.");
        });

        document.addEventListener(EVENTS.CLEAR_DATA, async (event) => {
            this._clearCurrentCards();
        });

        document.addEventListener(EVENTS.ERROR, async (event) => {
            this._renderToastWarning(event.detail);
        });

        this.toastDismissBtn.addEventListener("click", () => {
            this._clearToastNotification();
        });
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
        console.log("taxon card:", taxon);

        const template = document.getElementById("currentSpeciesCard");
        const speciesCardFragment = template.content.cloneNode(true);
        const img = speciesCardFragment.querySelector(".current-species-img");
        const name = speciesCardFragment.querySelector(".current-species-name");
        const subHeading = speciesCardFragment.querySelector(
            ".current-species-sub-heading"
        );

        const nativity = speciesCardFragment.querySelector(
            ".current-species-nativity"
        );

        const wikipedia = speciesCardFragment.querySelector(
            ".current-species-wikipedia"
        );

        img.src =
            taxon?.default_photo?.medium_url || CONFIG.PLACEHOLDER_IMAGE_URL;
        img.alt = taxon?.default_photo?.attribution || `No Image Found`;
        name.textContent = taxon?.preferred_common_name;
        subHeading.textContent = taxon?.name;
        nativity.textContent = taxon?.native ? "Native" : "Non-Native";

        wikipedia.href = taxon?.wikipedia_url;

        // destructuring args because it keeps things a little cleaner
        this._conservationStatus({
            conservationInfo: taxon.conservation_status ?? taxon.threatened,
            conservationImg: speciesCardFragment.querySelector(
                ".current-species-conservation-img"
            ),
            conservationLabel: speciesCardFragment.querySelector(
                ".current-species-conservation-label"
            ),
        });

        // missing desc in current fetch
        this.currentSpeciesContainer.appendChild(speciesCardFragment);
        // maybe should have an info about how many sightings there were etc too
    }

    _conservationStatus({
        conservationInfo,
        conservationImg,
        conservationLabel,
    }) {
        if (conservationInfo == false) {
            conservationLabel.textContent = "Least Concern";
            conservationImg.src = icons.lc;
        } else {
            conservationLabel.textContent = conservationInfo.status_name;
            conservationImg.src = icons[conservationInfo.status]; // accessing correct icon by mapping the key to icon name
        }
    }

    // send custom event once species list is rendered, so filter menu knows when to attach event listener
    _emitSpeciesListsRenderedEvent() {
        const event = new CustomEvent(EVENTS.SPECIES_LIST_RENDERED, {
            bubble: true,
            detail: { timestamp: Date.now() },
        });
        document.dispatchEvent(event);
    }

    _clearCurrentCards() {
        this.currentSpeciesContainer.textContent = "";
    }

    _renderToastWarning(warning) {
        this.toastNotificationEl.classList.add("--warning");

        this.toastText.textContent = warning;

        this.toastNotificationEl.show();
    }

    _renderToastSuccess(message) {
        this.toastNotificationEl.classList.add("--success");

        this.toastText.textContent = message;
        this.toastNotificationEl.show();
    }

    _clearToastNotification() {
        this.toastNotificationEl.classList.remove("--warning");
        this.toastNotificationEl.classList.remove("--error");
        this.toastNotificationEl.classList.remove("--success");

        this.toastText.textContent = "";
    }
}
