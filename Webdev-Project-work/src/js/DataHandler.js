import { CONFIG } from "./constants";
import replaceWhiteSpace from "./helpers";

export default class DataHandler {
    #finlandGeojson;
    #iNatApi;

    constructor() {
        this.#finlandGeojson =
            "/data/Finland_ADM0_simplified.simplified.geojson";
        this.#iNatApi = "https://api.inaturalist.org/v1/";
    }

    async fetchData(source) {
        try {
            const data = await fetch(source).then((response) =>
                response.json()
            );
            return await data;
        } catch (error) {
            console.error(error);
        }
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
        taxon = replaceWhiteSpace(taxon);
        return `${this.#iNatApi}taxa?q=${taxon}&per_page=1`;
    }

    // maybe it'd make sense to split the query into different types, because then the buildObs can be private
    // like pass { query = { type: observation, taxon: name }}
    buildObservationQuery(taxon) {
        taxon = replaceWhiteSpace(taxon);
        return `${this.#iNatApi}observations?captive=false&geo=true&place_id=${
            CONFIG.FINLAND_PLACE_ID
        }&taxon_name=${taxon}&quality_grade=research&order=desc&order_by=created_at&per_page=200`;
    }

    get finlandBoundaries() {
        return this._loadFinlandBoundaries();
    }
}
