export interface Route {
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
}

export interface Waypoint {
    id: string;
    route_id: string;
    longitude: number;
    latitude: number;
    name?: string;
    memo?: string;
    stay_time?: number; // minutes
    order_index: number;
}
