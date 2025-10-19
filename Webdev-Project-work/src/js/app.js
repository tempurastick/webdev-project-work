import { CONFIG, SPECIES_GLOSSARY } from "./constants.js";
import DataHandler from "./DataHandler.js";
import DomRenderer from "./DomRenderer.js";
import FilterMenu from "./filterMenu.js";
import FinlandMap from "./finlandMap.js";
import Menu from "./Menu.js";

async function init() {
    const dataHandler = new DataHandler();
    const finlandMap = new FinlandMap("finlandMap", dataHandler);
    const domRenderer = new DomRenderer(dataHandler);
    const menu = new Menu();
    // TODO: change from constructor args to a more decoupled method later
    const filterMenu = new FilterMenu();

    finlandMap.initializeMap();
}

init();
