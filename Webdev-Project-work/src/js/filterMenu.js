import { debounce } from "./helpers";
import { EVENTS } from "./constants";
export default class FilterMenu {
    constructor() {
        this.submitBtn = document.querySelector("#btn-filter-submit");
        this.resetBtn = document.querySelector("#btn-filter-reset");
        this.clearBtn = document.querySelector("#btn-filter-clear");
        this.categoryItems = document.querySelectorAll(".category-item");
        this.searchInput = document.querySelector("#filterSpecies");
        this.scientificNameToggle = document.querySelector(
            "#scientific-name-toggle"
        );
        this.currentCategories = [];
        this.selectedSpecies = [];
        this._init();
    }

    _init() {
        this._registerEventListeners();
    }

    _registerEventListeners() {
        this.categoryItems.forEach((categoryItem) => {
            const categorySelector = categoryItem.querySelector(
                ".category-item-selector"
            );

            categorySelector.addEventListener("change", () => {
                this._listenForSelection(categorySelector);
            });
        });

        // debounce to throttle event listener
        this.searchInput.addEventListener("keyup", () => {
            debounce(this._filterSpecies(), 300);
        });

        this.scientificNameToggle.addEventListener("input", () => {
            debounce(this._toggleSpeciesNameDisplay(), 300);
        });

        this.resetBtn.addEventListener("click", () => {
            this._resetSelection();
        });

        this._registerSubmitBtn();
        this._registerClearBtn();

        document.addEventListener(EVENTS.SPECIES_LIST_RENDERED, () => {
            this._registerSpeciesSelectors();
        });

        document.addEventListener(EVENTS.ERROR, async () =>
            this._removeLoaderFromBtn()
        );

        document.addEventListener(EVENTS.SPECIES_DATA_READY, async () => {
            this._removeLoaderFromBtn();
        });
    }

    _registerClearBtn() {
        this.clearBtn.addEventListener("click", () => {
            this._resetSelection();
            this._createClearEvent();
        });
    }

    _createClearEvent() {
        const clearEvent = new CustomEvent(EVENTS.CLEAR_DATA, {
            bubbles: true,
            cancelable: true,
        });

        document.dispatchEvent(clearEvent);
    }

    _registerSubmitBtn() {
        this.submitBtn.addEventListener("click", () => {
            debounce(this._resolveSubmission(), 1000);
        });
    }

    _createSubmitEvent(details) {
        const submitSpecies = new CustomEvent(EVENTS.SUBMIT_SPECIES_SEARCH, {
            bubbles: true,
            cancelable: true,
            detail: details,
        });

        document.dispatchEvent(submitSpecies);
    }

    _createLoaderIndicator() {
        return `<i
                    class="fa-solid fa-circle-notch animate-spin text-white"
                ></i> Fetching...`;
    }

    _attachLoaderToBtn() {
        this.submitBtn.classList.add("--loading");
        this.submitBtn.innerHTML = this._createLoaderIndicator();
    }

    _removeLoaderFromBtn() {
        this.submitBtn.classList.remove("--loading");
        this.submitBtn.textContent = "Submit";
    }

    _resolveSubmission() {
        this._attachLoaderToBtn();
        const currentSelections = this._copySelectionList();

        if (currentSelections.length == 0) {
            return console.warn("No selection");
            // for now just leaving the submit button disabled
        } else {
            this._createSubmitEvent(currentSelections);
            this._resetSelection();
        }
    }

    _copySelectionList() {
        return Array.from(this.selectedSpecies);
    }

    _resetSelection() {
        // creating a copy of the array to prevent side effects like an item missing from the removal
        const speciesToRemove = this._copySelectionList();

        speciesToRemove.forEach((speciesId) => {
            const el = document.querySelector(
                `[data-species-scientific="${speciesId}"]`
            );

            const addIcon = el.querySelector(".icon-add");
            const removeIcon = el.querySelector(".icon-remove");
            const checkbox = el.querySelector(
                ".species-dropdown-item__checkbox"
            );

            checkbox.checked = false;

            const params = { speciesId, addIcon, removeIcon };

            this._removeFromSelectedSpecies(params);
        });

        const currentList = this.selectedSpecies.length;
        this._setSubmitBtnState(currentList);
    }

    _registerSpeciesSelectors() {
        const selectElements = document.querySelectorAll(
            ".species-dropdown-item__checkbox"
        );

        selectElements.forEach((selectEl) => {
            selectEl.addEventListener("input", () => {
                debounce(this._handleSpeciesSelection(selectEl), 300);
            });
        });
    }

    _handleSpeciesSelection(selected) {
        const { id: speciesId, checked, parentElement: parent } = selected;

        if (!speciesId) {
            return;
        }

        const addIcon = parent.querySelector(".icon-add");
        const removeIcon = parent.querySelector(".icon-remove");

        const params = { speciesId, addIcon, removeIcon };

        checked
            ? this._addToSelectedSpecies(params)
            : this._removeFromSelectedSpecies(params);

        const currentList = this.selectedSpecies.length;
        this._setSubmitBtnState(currentList);
    }

    _setSubmitBtnState(currentList) {
        if (currentList == 0) {
            this.submitBtn.disabled = true;
        } else {
            this.submitBtn.disabled = false;
        }
    }

    _checkCurrentSelection(speciesId) {
        return this.selectedSpecies.includes(speciesId);
    }

    _addToSelectedSpecies(selected) {
        if (this._checkCurrentSelection(selected.speciesId)) {
            return;
        } else {
            const addIcon = selected.addIcon;
            const removeIcon = selected.removeIcon;

            addIcon.classList.add("--hide");
            removeIcon.classList.remove("--hide");
            this.selectedSpecies.push(selected.speciesId);
        }
    }

    _removeFromSelectedSpecies(selected) {
        if (this._checkCurrentSelection(selected.speciesId)) {
            const addIcon = selected.addIcon;
            const removeIcon = selected.removeIcon;
            removeIcon.classList.add("--hide");
            addIcon.classList.remove("--hide");
            const index = this.selectedSpecies.indexOf(selected.speciesId);
            this.selectedSpecies.splice(index, 1);
        }
    }

    _toggleSpeciesNameDisplay() {
        const showScientificName = this.scientificNameToggle.checked;
        const addClass = showScientificName ? "--scientific" : "--common";
        const removeClass = showScientificName ? "--common" : "--scientific";

        const speciesDropdownElements =
            document.querySelectorAll(".species-dropdown");

        speciesDropdownElements.forEach((el) => {
            el.classList.remove(removeClass);
            el.classList.add(addClass);
        });

        const speciesSelectedListElement = document.querySelector(
            ".species-selected-list"
        );

        speciesSelectedListElement.classList.remove(removeClass);
        speciesSelectedListElement.classList.add(addClass);
    }

    _filterSpecies() {
        const searchQuery = this.searchInput.value.toLowerCase();
        this._searchSelectedLists(searchQuery);
    }

    _searchSelectedLists(searchQuery) {
        this.currentCategories.forEach((speciesGrid) => {
            const el = document.querySelector(`#${speciesGrid}`);
            this._searchListForResult(el, searchQuery);
        });
    }

    _searchListForResult(listEl, searchQuery) {
        const listItems = listEl.querySelectorAll(".species-dropdown-item");
        listItems.forEach((li) => {
            const commonName = new String(
                li.dataset.speciesCommon.toLowerCase()
            );
            const scientificName = new String(
                li.dataset.speciesScientific.toLowerCase()
            );

            const nameInSearchQuery =
                this._checkIfNameMatches(commonName, searchQuery) ||
                this._checkIfNameMatches(scientificName, searchQuery);

            if (nameInSearchQuery) {
                this._showSpeciesItem(li);
            } else {
                this._hideSpeciesItem(li);
            }
        });
    }

    _checkIfNameMatches(name, searchQuery) {
        return name.includes(searchQuery);
    }

    _hideSpeciesItem(li) {
        li.classList.add("hidden");
    }

    _showSpeciesItem(li) {
        li.classList.remove("hidden");
    }

    _listenForSelection(categorySelector) {
        const dataAttribute = categorySelector.dataset.selectorFor;

        const speciesList = document.querySelector(`#${dataAttribute}`);

        if (categorySelector.checked) {
            if (speciesList) {
                this._showSpeciesGrid(speciesList.parentElement);
                this._addTocurrentCategories(dataAttribute);
            }
        } else {
            if (speciesList) {
                this._hideSpeciesGrid(speciesList.parentElement);
                this._removeFromcurrentCategories(dataAttribute);
            }
        }
    }

    _checkcurrentCategories(species) {
        return this.currentCategories.includes(species);
    }

    _addTocurrentCategories(species) {
        const existsInSelection = this._checkcurrentCategories(species);

        if (existsInSelection) {
            return;
        } else {
            this.currentCategories.push(species);
        }
    }

    _removeFromcurrentCategories(species) {
        const existsInSelection = this._checkcurrentCategories(species);

        if (existsInSelection) {
            const index = this.currentCategories.indexOf(species);

            this.currentCategories.splice(index, 1);
        }
    }

    _showSpeciesGrid(grid) {
        grid.classList.remove("hidden");
        grid.classList.add("visible");
    }

    _hideSpeciesGrid(grid) {
        grid.classList.remove("visible");
        grid.classList.add("hidden");
    }
}
