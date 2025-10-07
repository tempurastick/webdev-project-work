import { CONFIG, SPECIES_GLOSSARY } from "./constants.js";
import DataHandler from "./DataHandler.js";
import DomRenderer from "./DomRenderer.js";
import FinlandMap from "./finlandMap.js";

async function init() {
    const dataHandler = new DataHandler();
    const finlandMap = new FinlandMap("finlandMap", dataHandler);
    const domRenderer = new DomRenderer(dataHandler, finlandMap);
    finlandMap.initializeMap();

    function handleObservationData(observation) {
        const taxonData = dataHandler.getTaxonData(observation);

        domRenderer.renderCurrentSpeciesCard(taxonData);

        observation.forEach((result) => {
            finlandMap.addObservationLayer(result);
        });
    }
}

init();
