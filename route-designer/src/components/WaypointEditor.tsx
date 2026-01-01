import { useState, useEffect } from 'react';
import matter from 'gray-matter';
import type { Waypoint } from '../types/models';

interface WaypointEditorProps {
    waypoint: Waypoint;
    onSave: (updatedWaypoint: Waypoint) => void;
    onClose: () => void;
}

export function WaypointEditor({ waypoint, onSave, onClose }: WaypointEditorProps) {
    const [content, setContent] = useState('');

    useEffect(() => {
        // Construct Front Matter from structured data if available, or just use existing memo
        // If memo already has Front Matter, we should parse it first to avoid double wrapping?
        // But for simplicity, we assume `waypoint.memo` contains the FULL text (FM + Content)
        // If it's empty, we construct a default one.

        if (waypoint.memo && waypoint.memo.trim().startsWith('---')) {
             setContent(waypoint.memo);
        } else {
            // New or plain text memo
            const frontMatter: any = {};
            if (waypoint.stay_time) frontMatter.stay_time = waypoint.stay_time;

            const file = matter.stringify(waypoint.memo || '', frontMatter);
            setContent(file);
        }
    }, [waypoint]);

    const handleSave = () => {
        try {
            const parsed = matter(content);
            const stayTime = parsed.data.stay_time ? parseInt(parsed.data.stay_time, 10) : 0;

            onSave({
                ...waypoint,
                memo: content,
                stay_time: isNaN(stayTime) ? 0 : stayTime
            });
        } catch (e) {
            console.error("Failed to parse Front Matter", e);
            alert("Invalid YAML Front Matter");
        }
    };

    return (
        <div style={{
            position: 'absolute', top: 0, right: 0, width: '300px', height: '100vh',
            background: 'white', boxShadow: '-2px 0 5px rgba(0,0,0,0.1)', zIndex: 2000,
            padding: '20px', display: 'flex', flexDirection: 'column'
        }}>
            <h3>Edit Waypoint</h3>
            <div style={{ marginBottom: '10px' }}>
                <label>Name</label>
                <input
                    type="text"
                    value={waypoint.name || ''}
                    onChange={e => onSave({ ...waypoint, name: e.target.value })}
                    style={{ width: '100%', marginBottom: '10px' }}
                />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>Content (Markdown with YAML Front Matter)</label>
                <textarea
                    style={{ flex: 1, fontFamily: 'monospace', resize: 'none', padding: '10px' }}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            </div>

            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                <button onClick={handleSave}>Save</button>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
}
