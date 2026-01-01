import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// Using DeckGLProps['viewState'] or similar to infer types if specific exports are missing
// Or simply defined them loosely as DeckGL v9 types are sometimes hard to import directly from core if not exposed.

interface MapComponentProps {
    viewState: any; // Relaxed type as MapViewState is hard to find in v9 exports sometimes
    onViewStateChange: (params: any) => void;
    layers: any[]; // Relaxed type
    onClick?: (info: any) => void;
}

export function MapComponent({ viewState, onViewStateChange, layers, onClick }: MapComponentProps) {
    return (
        // @ts-ignore
        <DeckGL
            viewState={viewState}
            onViewStateChange={onViewStateChange}
            controller={true}
            layers={layers}
            onClick={onClick}
            style={{ width: '100vw', height: '100vh', position: 'relative' }}
        >
            <Map
                mapStyle="https://demotiles.maplibre.org/style.json"
            />
        </DeckGL>
    );
}
