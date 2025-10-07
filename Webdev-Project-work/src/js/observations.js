// maybe would make sense to turn into a class
// const taxon = replaceWhiteSpace(taxon);
const API_URL = "https://api.inaturalist.org/v1/";
const FINLAND_PLACE_ID = 7020;

const query = {
    apiUrl: API_URL,
    placeId: FINLAND_PLACE_ID,
    taxonName: "Purple%Heron",
};

// const observationQuery = buildObservationQuery(query);

// getObservations(observationQuery);

// example URL
//https://api.inaturalist.org/v1/observations?captive=false&geo=true&place_id=7020&taxon_name=%22Purple%20Heron%22&quality_grade=research&order=desc&order_by=created_at

async function getObservations(observationQuery) {
    try {
        const body = await fetch(query).then((response) => response.json());
        return await body;
    } catch (error) {
        console.error(error);
    }
}

function replaceWhiteSpace(string) {
    return string.replace(/\s/g, "%");
}

function buildObservationQuery({ query }) {
    return `${query.apiUrl}observations?captive=false&geo=true&place_id=${query.placeId}&taxon_name=${query.taxon}&quality_grade=research&order=desc&order_by=created_at`;
}
