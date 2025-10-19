import { CONFIG, EVENTS } from "./constants";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-easyprint";
export default class FinlandMap {
    #baseMapSource;
    #satelliteMapSource;
    #boundaryColour;
    #onEachFeatureHandler;

    constructor(container, dataHandler) {
        this.map = L.map(container, {
            minZoom: 5,
            maxZoom: 16,
        });

        this.dataHandler = dataHandler;
        this.baseMap = null;
        this.satelliteMap = null;
        this.overlayLayers = {};
        this.heatmapLayers = {};
        this.layerControl = null;
        this.finlandBounds = null;
        this.printControl = null;
        this.#boundaryColour = "oklch(58.5% 0.233 277.117)"; // tailwind indigo-500
        this.#baseMapSource = CONFIG.BGMAP;
        this.#satelliteMapSource = CONFIG.SATELLITEMAP;
        this.#onEachFeatureHandler = this._createOnEachFeatureHandler();
        this._registerEventListeners();
    }

    async initializeMap() {
        this._addBaseMap();
        if (import.meta.env.DEV) {
            this._addSatelliteMap();
        }

        try {
            const boundariesData = await this.dataHandler.finlandBoundaries;
            this.finlandBounds = this._renderFinlandBoundaries(boundariesData);
        } catch (error) {
            console.error("Could not fetch map boundaries", error);
        }

        this._setMapBounds();
        this._setMapLayerControl();
        this._setPrintPlugin();
    }

    _setPrintPlugin() {
        this.printControl = L.easyPrint({
            title: "Download map image",
            position: "topleft",
            filename: "finland_species_map",
            exportOnly: true,
            sizeModes: ["Current", "A4Portrait"],
        }).addTo(this.map);
    }

    _registerEventListeners() {
        document.addEventListener(EVENTS.SPECIES_DATA_READY, async (event) => {
            this._handleNewObservations(event.detail);
        });

        document.addEventListener(EVENTS.CLEAR_DATA, async (event) => {
            this._clearMapData();
        });

        document.addEventListener(EVENTS.PRINT_HEATMAP, async (event) => {
            this._triggerPrint(event.detail);
        });

        document.addEventListener(EVENTS.TOGGLE_HEATMAP, async (event) => {
            this._toggleHeatmap(event.detail);
        });
    }

    _triggerPrint(taxon) {
        const taxonName = taxon.taxonName;

        Object.entries(this.heatmapLayers).forEach(([name, layer]) => {
            if (name !== taxonName && this.map.hasLayer(layer)) {
                this.map.removeLayer(layer);
            }
        });

        this.printControl.printMap(
            "CurrentSize",
            `finland_species_map_${taxonName}`
        );

        setTimeout(() => {
            Object.entries(this.heatmapLayers).forEach(([name, layer]) => {
                if (!this.map.hasLayer(layer)) {
                    layer.addTo(this.map);
                }
            });
        }, 1200);
    }

    _toggleHeatmap(taxon) {
        const taxonName = taxon.taxonName;
        const layer = this.heatmapLayers[taxonName];

        if (!layer) {
            console.warn(`No heatmap found for ${taxonName}`);
            return;
        }
        // toggle display
        if (this.map.hasLayer(layer)) {
            this.map.removeLayer(layer);
        } else {
            layer.addTo(this.map);
        }
    }

    _handleNewObservations(observations) {
        const { taxonId, taxonName, results } = observations;
        this.addHeatmapLayer(taxonId, taxonName);
    }

    _addBaseMap() {
        const bgLayer = L.tileLayer(this.#baseMapSource, {
            attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
            maxZoom: 16,
            minZoom: 5,
        });

        bgLayer.addTo(this.map);
        this.baseMap = bgLayer;
    }

    _addSatelliteMap() {
        const sat = L.tileLayer(this.#satelliteMapSource, {
            minZoom: 5,
            maxZoom: 16,
            attribution:
                '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            ext: "jpg",
        });

        sat.addTo(this.map);
        this.satelliteMap = sat;
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
            outline: this.baseMap,
        };

        if (import.meta.env.DEV) {
            baseMaps.satellite = this.satelliteMap;
        }

        const currentOverlapMaps = {};

        for (const taxonName in this.overlayLayers) {
            currentOverlapMaps[`Observations: ${taxonName}`] =
                this.overlayLayers[taxonName];
        }

        for (const taxonName in this.heatmapLayers) {
            currentOverlapMaps[`Heatmap: ${taxonName}`] =
                this.heatmapLayers[taxonName];
        }

        this.layerControl = L.control
            .layers(baseMaps, currentOverlapMaps)
            .addTo(this.map);
    }

    // Add heatmap layer for a taxon
    addHeatmapLayer(taxonId, taxonName) {
        this.removeHeatmapLayer(taxonId);

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
        this.heatmapLayers[taxonName] = heatmapLayer;

        this._setMapLayerControl();
        return heatmapLayer;
    }

    removeHeatmapLayer(taxonName) {
        if (this.heatmapLayers[taxonName]) {
            this.map.removeLayer(this.heatmapLayers[taxonName]);
            delete this.heatmapLayers[taxonName];
            this._setMapLayerControl();
        }
    }

    _setMapBounds() {
        const bounds = this.finlandBounds.getBounds();
        this.map.fitBounds(bounds);
        // to force snap back to finland map: But I'm finding this kind of user unfriendly atm
        // this.map.setMaxBounds(bounds);
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

    _clearMapData() {
        for (const layer in this.heatmapLayers) {
            this.removeHeatmapLayer(layer);
        }

        for (const layer in this.overlayLayers) {
            this.removeLayer(layer);
        }
    }
}
