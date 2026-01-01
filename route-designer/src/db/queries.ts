import { getDB } from './duckdb';
import type { Route, Waypoint } from '../types/models';

function generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15);
}

export async function createRoute(name: string): Promise<Route> {
    const { conn } = await getDB();
    if (!conn) throw new Error("DB not connected");

    const id = generateId();
    const now = new Date().toISOString();

    await conn.query(`
        INSERT INTO routes (id, name, created_at, updated_at)
        VALUES ('${id}', '${name}', '${now}', '${now}')
    `);

    return {
        id,
        name,
        created_at: new Date(now),
        updated_at: new Date(now)
    };
}

export async function getRoutes(): Promise<Route[]> {
    const { conn } = await getDB();
    if (!conn) throw new Error("DB not connected");

    const result = await conn.query(`SELECT * FROM routes ORDER BY updated_at DESC`);
    return result.toArray().map((row: any) => ({
        id: row.id,
        name: row.name,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at)
    }));
}

export async function saveWaypoints(routeId: string, waypoints: Waypoint[]) {
    const { conn } = await getDB();
    if (!conn) throw new Error("DB not connected");

    await conn.query(`DELETE FROM waypoints WHERE route_id = '${routeId}'`);

    for (const wp of waypoints) {
        const name = wp.name ? `'${wp.name}'` : 'NULL';
        const memo = wp.memo ? `'${wp.memo}'` : 'NULL';
        const stayTime = wp.stay_time || 0;

        await conn.query(`
            INSERT INTO waypoints (id, route_id, longitude, latitude, name, memo, stay_time, order_index)
            VALUES ('${wp.id}', '${routeId}', ${wp.longitude}, ${wp.latitude}, ${name}, ${memo}, ${stayTime}, ${wp.order_index})
        `);
    }

    const now = new Date().toISOString();
    await conn.query(`UPDATE routes SET updated_at = '${now}' WHERE id = '${routeId}'`);
}

export async function getWaypoints(routeId: string): Promise<Waypoint[]> {
    const { conn } = await getDB();
    if (!conn) throw new Error("DB not connected");

    const result = await conn.query(`SELECT * FROM waypoints WHERE route_id = '${routeId}' ORDER BY order_index ASC`);
    return result.toArray().map((row: any) => ({
        id: row.id,
        route_id: row.route_id,
        longitude: row.longitude,
        latitude: row.latitude,
        name: row.name,
        memo: row.memo,
        stay_time: row.stay_time,
        order_index: row.order_index
    }));
}
