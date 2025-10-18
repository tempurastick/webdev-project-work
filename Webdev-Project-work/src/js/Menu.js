import { debounce } from "./helpers";
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
        this.filterBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            this._openFilterMenu();
        });
        this.speciesBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            this._openCurrentSpeciesMenu();
        });
    }

    _openFilterMenu() {
        this.filterMenu.classList.toggle("hidden");
        this._registerOutsideCloseEventListener(this.filterMenu);
        this._hideOtherMenu(this.currentSpeciesMenu);
    }

    _registerOutsideCloseEventListener(menu) {
        menu.addEventListener("click", (e) => e.stopPropagation());
        setTimeout(() => {
            document.addEventListener("click", (event) => {
                debounce(() => this._closeOnOutside(menu, event), 200)();
            });
        }, 200);
    }

    _openCurrentSpeciesMenu() {
        this.currentSpeciesMenu.classList.toggle("hidden");
        this._registerOutsideCloseEventListener(this.currentSpeciesMenu);
        this._hideOtherMenu(this.filterMenu);
    }

    _closeOnOutside(menu, event) {
        if (!menu.contains(event.target)) {
            this._closeAllMenus();
        }
    }

    _closeAllMenus() {
        this.currentSpeciesMenu.classList.add("hidden");
        this.filterMenu.classList.add("hidden");
    }

    _hideOtherMenu(menu) {
        menu.classList.add("hidden");
    }
}
