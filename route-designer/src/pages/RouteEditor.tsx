import { useState, useCallback, useEffect } from 'react';
import { MapComponent } from '../components/MapComponent';
import { EditableGeoJsonLayer } from '@nebula.gl/layers';
import { DrawLineStringMode, ViewMode, ModifyMode, DrawPointMode } from '@nebula.gl/edit-modes';
import type { Waypoint } from '../types/models';
import { saveWaypoints, createRoute as createNewRouteDb } from '../db/queries';
import type { FeatureCollection, Point } from 'geojson';
import { WaypointEditor } from '../components/WaypointEditor';

// Temporary ID generator
const uuid = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15);
};

export default function RouteEditor() {
    // Map State
    const [viewState, setViewState] = useState({
        longitude: 139.767125,
        latitude: 35.681236,
        zoom: 13,
        pitch: 0,
        bearing: 0
    });

    // Editor State
    const [mode, setMode] = useState<any>(() => ViewMode);
    const [selectedFeatureIndexes, setSelectedFeatureIndexes] = useState<number[]>([]);
    const [editingWaypoint, setEditingWaypoint] = useState<Waypoint | null>(null);

    // Data State (GeoJSON for Nebula)
    const [features, setFeatures] = useState<FeatureCollection>({
        type: 'FeatureCollection',
        features: []
    });

    // We also need to maintain the "Route" context (DB ID)
    const [currentRouteId, setCurrentRouteId] = useState<string | null>(null);

    // Initial load (create a dummy route for now if none)
    useEffect(() => {
        const init = async () => {
             // In a real app, we would load from URL or list.
             // Here we create a new route session.
             const route = await createNewRouteDb("New Trip");
             setCurrentRouteId(route.id);
        };
        init();
    }, []);


    // Update handlers
    const onEdit = useCallback(({ updatedData }: any) => {
        setFeatures(updatedData);
    }, []);

    const saveToDb = async () => {
        if (!currentRouteId) return;

        const waypoints: Waypoint[] = features.features
            .filter(f => f.geometry.type === 'Point')
            .map((f, i) => {
                const p = f.geometry as Point;
                // Try to extract existing properties
                const props = f.properties || {};

                return {
                    id: (props.id as string) || uuid(),
                    route_id: currentRouteId,
                    longitude: p.coordinates[0],
                    latitude: p.coordinates[1],
                    order_index: i,
                    name: props.name || `Point ${i + 1}`,
                    memo: props.memo || '',
                    stay_time: props.stay_time || 0
                };
            });

        await saveWaypoints(currentRouteId, waypoints);
        console.log("Saved waypoints:", waypoints);
    };

    const handleMapClick = (info: any) => {
        if (info && info.index !== -1 && info.object) {
            setSelectedFeatureIndexes([info.index]);

            // Open editor for this point
            const feature = features.features[info.index];
            if (feature.geometry.type === 'Point') {
                const p = feature.geometry as Point;
                const props = feature.properties || {};

                setEditingWaypoint({
                    id: (props.id as string) || uuid(),
                    route_id: currentRouteId || '',
                    longitude: p.coordinates[0],
                    latitude: p.coordinates[1],
                    order_index: info.index,
                    name: props.name || `Point ${info.index + 1}`,
                    memo: props.memo || '', // This should contain the full text including frontmatter
                    stay_time: props.stay_time || 0
                });
            }
        } else {
            setSelectedFeatureIndexes([]);
            setEditingWaypoint(null);
        }
    };

    const handleWaypointSave = (updated: Waypoint) => {
         // Update the feature collection
         const newFeatures = { ...features };
         if (updated.order_index >= 0 && updated.order_index < newFeatures.features.length) {
             const f = newFeatures.features[updated.order_index];
             f.properties = {
                 ...f.properties,
                 name: updated.name,
                 memo: updated.memo,
                 stay_time: updated.stay_time,
                 id: updated.id
             };
         }
         setFeatures(newFeatures);
         setEditingWaypoint(null);
    };

    // Construct Layers
    const layers = [
        // @ts-ignore
        new EditableGeoJsonLayer({
            id: 'geojson-layer',
            data: features,
            mode: mode,
            selectedFeatureIndexes,
            onEdit: onEdit,
            // Styling
            pointRadiusMinPixels: 5,
            // @ts-ignore
            getPointColor: [0, 128, 255],
            getLineColor: [0, 0, 0, 150],
            getLineWidth: 3
        })
    ];

    return (
        <div style={{ position: 'relative' }}>
            <MapComponent
                viewState={viewState}
                onViewStateChange={(e) => setViewState(e.viewState)}
                layers={layers}
                onClick={handleMapClick}
            />

            {/* Control Panel */}
            <div style={{ position: 'absolute', top: 20, left: 20, background: 'white', padding: 10, borderRadius: 5, zIndex: 1000 }}>
                <h3>Route Editor</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <button onClick={() => setMode(() => ViewMode)}>View</button>
                    <button onClick={() => setMode(() => DrawPointMode)}>Add Points</button>
                    <button onClick={() => setMode(() => DrawLineStringMode)}>Draw Line</button>
                    <button onClick={() => setMode(() => ModifyMode)}>Edit (Drag)</button>
                </div>
                <div style={{ marginTop: 10 }}>
                    <button onClick={saveToDb}>Save Route</button>
                </div>
            </div>

            {/* Waypoint Editor Sidebar */}
            {editingWaypoint && (
                <WaypointEditor
                    waypoint={editingWaypoint}
                    onSave={handleWaypointSave}
                    onClose={() => setEditingWaypoint(null)}
                />
            )}
        </div>
    );
}
