export default class Menu {
    constructor() {
        this.filterBtn = document.querySelector("#btn-filter");
        this.speciesBtn = document.querySelector("#btn-species");
        this.filterMenu = document.querySelector(".filter-menu");
        this.currentSpeciesMenu = document.querySelector(
            ".current-species-menu"
        );

        this.registerEventListeners();
    }

    registerEventListeners() {
        this.filterBtn.addEventListener("click", () => {
            this.toggleVisibility(this.filterMenu);
            this.hideOtherMenu(this.currentSpeciesMenu);
        });
        this.speciesBtn.addEventListener("click", () => {
            this.toggleVisibility(this.currentSpeciesMenu);
            this.hideOtherMenu(this.filterMenu);
        });
    }

    toggleVisibility(menu) {
        menu.classList.toggle("hidden");
    }

    hideOtherMenu(menu) {
        menu.classList.add("hidden");
    }
}
