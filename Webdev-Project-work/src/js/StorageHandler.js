import { openDB } from "idb";

export default class StorageHandler {
    constructor() {
        this.dbPromise = this._initDB();
    }

    async _initDB() {
        return openDB("iNatCacheDB", 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains("species")) {
                    const store = db.createObjectStore("species", {
                        keyPath: "taxonName",
                    });
                    store.createIndex("taxonId", "taxonId");
                }
            },
        });
    }

    async saveSpeciesData(taxonName, taxonId, results) {
        const db = await this.dbPromise;
        const entry = {
            taxonName,
            taxonId,
            results,
            timestamp: Date.now(),
        };
        await db.put("species", entry);
    }

    async getSpeciesData(taxonName) {
        const db = await this.dbPromise;
        return await db.get("species", taxonName);
    }

    async hasRecentData(taxonName, maxAge = 1000 * 60 * 60 * 24) {
        // default: 1 day
        const entry = await this.getSpeciesData(taxonName);
        if (!entry) return false;
        return Date.now() - entry.timestamp < maxAge;
    }

    async clearOldData(maxAge = 1000 * 60 * 60 * 24 * 7) {
        // default: 1 week
        const db = await this.dbPromise;
        const tx = db.transaction("species", "readwrite");
        const store = tx.objectStore("species");
        const all = await store.getAll();

        for (const entry of all) {
            if (Date.now() - entry.timestamp > maxAge) {
                await store.delete(entry.taxonName);
            }
        }

        await tx.done;
    }
}
