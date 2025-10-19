import { CONFIG, EVENTS } from "./constants";
import { replaceWhitespace, debounce } from "./helpers";
import StorageHandler from "./StorageHandler";
export default class DataHandler {
    #finlandGeojson;
    #iNatApi;
    #storage;

    constructor() {
        this.#finlandGeojson =
            "/data/Finland_ADM0_simplified.simplified.geojson";
        this.#iNatApi = "https://api.inaturalist.org/v1/";
        this.#storage = new StorageHandler();
        this._registerEventListeners();
    }

    async fetchData(source) {
        try {
            const data = await fetch(source).then((response) =>
                response.json()
            );
            return await data;
        } catch (error) {
            this._createErrorEvent(error);
        }
    }

    _registerEventListeners() {
        document.addEventListener(
            EVENTS.SUBMIT_SPECIES_SEARCH,
            async (event) => {
                this._handleSearchSubmission(event.detail);
            }
        );
    }

    _handleSearchSubmission(speciesList) {
        debounce(this._fetchSpeciesBatch(speciesList, 1000));
    }

    async _fetchSpeciesBatch(speciesList) {
        const promises = speciesList.map(async (selection) => {
            const taxon = replaceWhitespace(selection);
            const cached = await this.#storage.getSpeciesData(taxon);

            if (cached) {
                this._sendObservationData(cached.results);
                return cached;
            }

            const query = this.buildObservationQuery(selection);
            const data = await this.fetchData(query);

            if (data?.results?.length) {
                const taxonData = data.results[0].taxon;
                await this.#storage.saveSpeciesData(
                    taxon,
                    taxonData.id,
                    data.results
                );
                this._sendObservationData(data.results);
            } else {
                this._createErrorEvent(`No results for ${selection}`);
            }

            return data;
        });

        return Promise.all(promises);
    }

    _createErrorEvent(errorMessage) {
        const errorEvent = new CustomEvent(EVENTS.ERROR, {
            detail: errorMessage,
        });

        document.dispatchEvent(errorEvent);
    }

    _sendObservationData(results) {
        const { id: taxonId, name: taxonName } = results[0].taxon;

        const speciesDataEvent = new CustomEvent(EVENTS.SPECIES_DATA_READY, {
            detail: {
                taxonId,
                taxonName,
                results,
            },
        });

        document.dispatchEvent(speciesDataEvent);
    }

    buildHeatmapTileUrl(taxon, options = {}) {
        taxon = replaceWhitespace(taxon);

        const baseUrl = `${this.#iNatApi}colored_heatmap/{z}/{x}/{y}.png`;
        const params = new URLSearchParams({
            taxon_name: taxon,
            verifiable: "true",
            place_id: CONFIG.FINLAND_PLACE_ID,
            ...options,
        });

        return `${baseUrl}?${params.toString()}`;
    }

    async _loadFinlandBoundaries() {
        try {
            let finlandBoundaries = await fetch(this.#finlandGeojson).then(
                (response) => response.json()
            );

            return finlandBoundaries;
        } catch (error) {
            console.error(error);
        }
    }

    // fetch the taxon data from the result array, since it's all the same, just the first is fine
    getTaxonData(results) {
        return results[0].taxon;
    }

    buildTaxonQuery(taxon) {
        taxon = replaceWhitespace(taxon);
        return `${this.#iNatApi}taxa?q=${taxon}&per_page=1`;
    }

    // maybe it'd make sense to split the query into different types, because then the buildObs can be private
    // like pass { query = { type: observation, taxon: name }}
    buildObservationQuery(taxon) {
        taxon = replaceWhitespace(taxon);
        return `${this.#iNatApi}observations?captive=false&geo=true&place_id=${
            CONFIG.FINLAND_PLACE_ID
        }&taxon_name=${taxon}&quality_grade=research&order=desc&order_by=created_at&per_page=200`;
    }

    get finlandBoundaries() {
        return this._loadFinlandBoundaries();
    }
}
