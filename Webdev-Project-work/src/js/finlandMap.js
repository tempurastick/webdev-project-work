import { CONFIG } from "./constants";

// missing overlay map in this refactoring bc it's the dummy data
function setMapLayerControl(baseMaps, overlayMaps) {
    L.control.layers(baseMaps, overlayMaps).addTo(finland);
}

function createGeoJsonFeature(observation) {
    const feature = {
        type: "Feature",
        properties: {
            name:
                observation.taxon?.name ||
                observation.taxon?.preferred_commono_name,

            popupContent: "This is where the Rockies play!",
        },
        geometry: {
            type: observation.geojson?.type,
            coordinates: observation.geojson?.coordinates,
        },
    };
    return feature;
}

export default class FinlandMap {
    #baseMapSource;
    #boundaryColour;
    #onEachFeatureHandler;

    constructor(container, dataHandler) {
        this.map = L.map(container, {
            //zoomControl: false,
        });

        this.dataHandler = dataHandler;
        this.baseMap = null;
        this.overlayLayers = {};
        this.heatmapLayers = {};
        this.layerControl = null;
        this.finlandBounds = null;
        this.#boundaryColour = "oklch(58.5% 0.233 277.117)"; // tailwind indigo-500
        this.#baseMapSource = CONFIG.BGMAP;

        this.#onEachFeatureHandler = this._createOnEachFeatureHandler();
    }

    async initializeMap() {
        this._addBaseMap();

        try {
            const boundariesData = await this.dataHandler.finlandBoundaries;
            this.finlandBounds = this._renderFinlandBoundaries(boundariesData);
        } catch (error) {
            console.error("Could not fetch map boundaries", error);
        }

        this._setMapBounds();
        this.map.on("moveend", this._updateHeatmapLayers.bind(this));
    }

    _addBaseMap() {
        const bgLayer = L.tileLayer(this.#baseMapSource, {
            attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
            maxZoom: 9,
            minZoom: 5,
            zoomControl: false,
        });

        bgLayer.addTo(this.map);
        this.baseMap = bgLayer;
    }

    _renderFinlandBoundaries(boundaries) {
        return L.geoJSON(boundaries, {
            style: {
                color: this.#boundaryColour,
                weight: 2,
            },
        }).addTo(this.map);
    }

    _setMapLayerControl() {
        if (this.layerControl) {
            this.map.removeControl(this.layerControl);
        }

        const baseMaps = {
            bgMap: this.baseMap,
        };

        const currentOverlapMaps = {};
        for (const taxonName in this.overlayLayers) {
            currentOverlapMaps[`Observations: ${taxonName}`] =
                this.overlayLayers[taxonName];
        }

        for (const taxonId in this.heatmapLayers) {
            currentOverlapMaps[`Heatmap: ${taxonId}`] =
                this.heatmapLayers[taxonId];
        }

        this.layerControl = L.control
            .layers(baseMaps, currentOverlapMaps)
            .addTo(this.map);
    }

    // Add heatmap layer for a taxon
    addHeatmapLayer(taxonId, taxonName = null) {
        // Remove existing heatmap layer if it exists
        this.removeHeatmapLayer(taxonId);

        // there's also:      `${CONFIG.API_URL}taxon_ranges/${taxonId}/{z}/{x}/{y}.png`, for taxon range
        const heatmapLayer = L.tileLayer(
            `${CONFIG.API_URL}heatmap/{z}/{x}/{y}.png?taxon_id=${taxonId}&verifiable=true&place_id=${CONFIG.FINLAND_PLACE_ID}`,
            {
                attribution: "© iNaturalist",
                maxZoom: 18,
                minZoom: 1,
                opacity: 1,
                zIndex: 500,
            }
        );

        heatmapLayer.addTo(this.map);
        this.heatmapLayers[taxonId] = heatmapLayer;

        this._setMapLayerControl();
        return heatmapLayer;
    }

    _updateHeatmapLayers() {
        // If you need to dynamically update heatmap parameters based on viewport
        // This is called on map moveend
        const bounds = this.map.getBounds();
        // You could update heatmap layers here if needed
    }

    removeHeatmapLayer(taxonId) {
        if (this.heatmapLayers[taxonId]) {
            this.map.removeLayer(this.heatmapLayers[taxonId]);
            delete this.heatmapLayers[taxonId];
            this._setMapLayerControl();
        }
    }

    _setMapBounds() {
        const bounds = this.finlandBounds.getBounds();
        this.map.fitBounds(bounds);
        this.map.setMaxBounds(bounds);
    }

    _createGeoJsonFeature(observation) {
        const feature = {
            type: "Feature",
            id: observation.id,
            properties: {
                name:
                    observation.taxon?.name ||
                    observation.taxon?.preferred_common_name,
                occurence:
                    observation.taxon?.establishment_means
                        ?.occurrence_status_level,

                popupContent: this._generatePopupContent(observation),
            },
            geometry: {
                type: observation.geojson?.type,
                coordinates: observation.geojson?.coordinates,
            },
        };
        return feature;
    }

    // might make more sense to use observation -> observation.id but we'll see
    removeLayer(id) {
        let currentLayer = this._getExistingFeatureCollection(id);

        if (currentLayer) {
            this.map.removeLayer(currentLayer);
            delete this.overlayLayers[id];
            this._setMapLayerControl();
        } else {
            console.warn(`Layer "${id}" does not exist`);
        }
    }

    addObservationLayer(observations) {
        const speciesId = observations.taxon?.id;
        const geoJsonFeature = this._createGeoJsonFeature(observations);

        this._getExistingFeatureCollection(speciesId)
            ? this._updateFeatureCollection(speciesId, geoJsonFeature)
            : this._generateFeatureCollection(speciesId, geoJsonFeature);

        this._setMapLayerControl();
    }

    _getExistingFeatureCollection(id) {
        return this.overlayLayers[id] ?? null;
    }

    _generateFeatureCollection(id, geoJsonFeature) {
        const featureCollection = {
            type: "FeatureCollection",
            features: [],
        };

        featureCollection.features.push(geoJsonFeature);

        const geoJsonLayer = L.geoJSON(featureCollection, {
            onEachFeature: this.#onEachFeatureHandler,
        });

        geoJsonLayer.addTo(this.map);
        this.overlayLayers[id] = geoJsonLayer;
    }

    _updateFeatureCollection(id, geoJsonFeature) {
        const existingLayer = this.overlayLayers[id];
        existingLayer.addData(geoJsonFeature);
    }

    _generatePopupContent(observation) {
        return `Name: ${observation.taxon.preferred_common_name}`;
    }

    _createOnEachFeatureHandler() {
        return (feature, layer) => {
            if (feature.properties && feature.properties.popupContent) {
                layer.bindPopup(feature.properties.popupContent);
            }
        };
    }
}
