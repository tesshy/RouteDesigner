// Remove strict type checks for DuckDB internals if they cause issues during build due to version mismatches or declaration merging
// The actual runtime code is correct per DuckDB documentation.
// We use 'any' for the types to bypass the TS2694 error.

import * as duckdb from '@duckdb/duckdb-wasm';

const MANUAL_BUNDLES: any = {
    mvp: {
        mainModule: '/duckdb-mvp.wasm',
        mainWorker: '/duckdb-browser-mvp.worker.js',
    },
    eh: {
        mainModule: '/duckdb-eh.wasm',
        mainWorker: '/duckdb-browser-eh.worker.js',
    },
};

let db: any | null = null;
let conn: any | null = null;

export async function initDB() {
    if (db) return { db, conn };

    // Select a bundle based on browser support
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

    if (!bundle.mainWorker) {
        throw new Error("DuckDB worker bundle could not be found.");
    }

    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger();
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    conn = await db.connect();

    // Initialize Schema
    await createSchema(conn);

    return { db, conn };
}

export async function getDB() {
    if (!db || !conn) {
        return await initDB();
    }
    return { db, conn };
}

async function createSchema(conn: any) {
    // Routes table
    await conn.query(`
        CREATE TABLE IF NOT EXISTS routes (
            id VARCHAR PRIMARY KEY,
            name VARCHAR,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        );
    `);

    // Waypoints table
    await conn.query(`
        CREATE TABLE IF NOT EXISTS waypoints (
            id VARCHAR PRIMARY KEY,
            route_id VARCHAR,
            longitude DOUBLE,
            latitude DOUBLE,
            name VARCHAR,
            memo VARCHAR,
            stay_time INTEGER, -- in minutes
            order_index INTEGER,
            FOREIGN KEY (route_id) REFERENCES routes(id)
        );
    `);
}
