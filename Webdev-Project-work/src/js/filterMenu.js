import { debounce } from "./helpers";
export default class FilterMenu {
    constructor() {
        this.submitBtn = document.querySelector("#btn-filter-submit");
        this.resetBtn = document.querySelector("#btn-filter-reset");
        this.categoryItems = document.querySelectorAll(".category-item");
        this.searchInput = document.querySelector("#filterSpecies");
        this.scientificNameToggle = document.querySelector(
            "#scientific-name-toggle"
        );
        this.currentSelection = [];
        this._init();
    }

    _init() {
        console.log("current selection", this.currentSelection);
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
        this.currentSelection.forEach((speciesGrid) => {
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
                this._addToCurrentSelection(dataAttribute);
            }
        } else {
            if (speciesList) {
                this._hideSpeciesGrid(speciesList.parentElement);
                this._removeFromCurrentSelection(dataAttribute);
            }
        }
    }

    _checkCurrentSelection(species) {
        return this.currentSelection.includes(species);
    }

    _addToCurrentSelection(species) {
        const existsInSelection = this._checkCurrentSelection(species);
        console.log(existsInSelection, species);

        if (existsInSelection) {
            return;
        } else {
            this.currentSelection.push(species);
            console.log("updated selection", this.currentSelection);
        }
    }

    _removeFromCurrentSelection(species) {
        const existsInSelection = this._checkCurrentSelection(species);

        if (existsInSelection) {
            const index = this.currentSelection.indexOf(species);

            this.currentSelection.splice(index, 1);

            console.log("updated selection", this.currentSelection);
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
