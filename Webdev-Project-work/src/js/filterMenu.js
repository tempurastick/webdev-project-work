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
        this.currentCategories = [];
        this.selectedSpecies = [];
        this._init();
    }

    _init() {
        console.log("current selection", this.currentCategories);
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

        document.addEventListener("speciesListsRendered", () => {
            this._registerSpeciesSelectors();
        });
    }

    _registerSpeciesSelectors() {
        const selectElements = document.querySelectorAll(
            ".species-dropdown-item__checkbox"
        );

        selectElements.forEach((selectEl) => {
            selectEl.addEventListener("input", () => {
                this._handleSpeciesSelection(selectEl);
            });
        });
    }

    _handleSpeciesSelection(selected) {
        //const speciesId = selected.id;
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
