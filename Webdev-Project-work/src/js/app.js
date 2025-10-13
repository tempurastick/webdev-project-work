import { CONFIG, SPECIES_GLOSSARY } from "./constants.js";
import DataHandler from "./DataHandler.js";
import DomRenderer from "./DomRenderer.js";
import FilterMenu from "./filterMenu.js";
import FinlandMap from "./finlandMap.js";
import Menu from "./Menu.js";

async function init() {
    const dataHandler = new DataHandler();
    const finlandMap = new FinlandMap("finlandMap", dataHandler);
    const domRenderer = new DomRenderer(dataHandler, finlandMap);
    const menu = new Menu();
    const filterMenu = new FilterMenu();

    finlandMap.initializeMap();
    const heronQuery = dataHandler.buildObservationQuery("Purple Heron");
    let heronData = await dataHandler.fetchData(heronQuery);
    heronData = heronData.results;

    //finlandMap.addHeatmapLayer(heronData[0].taxon.id, "Birds");
    handleObservationData(heronData);
    function handleObservationData(observation) {
        const taxonData = dataHandler.getTaxonData(observation);
        console.log(taxonData);

        domRenderer.renderCurrentSpeciesCard(taxonData);
        finlandMap.addHeatmapLayer(taxonData.id);

        observation.forEach((result) => {
            finlandMap.addObservationLayer(result);
        });
    }

    // this function should handle the event listeners for the dom and send the events too. Makes more sense
}

init();
