import React, { useMemo } from "react";
import { delayRender, continueRender } from "remotion";
import { useFrame } from "./useFrame";
import { configToStyle, type StyleConfig } from "./types";

interface MapProps {
    lat: number;
    lng: number;
    zoom: number;
    pinLat?: number;
    pinLng?: number;
    pinScale?: number;
    routeProgress?: number;
    styleVariant?: 'standard' | 'dark' | 'neon'
    width?: number;
    height?: number;
    style?: StyleConfig;
    frame?: number;
}

function getTileCoords(lat: number, lng: number, zoom: number) {
    const n = Math.pow(2, zoom);
    const latRad = (lat * Math.PI) / 180;
    const x = ((lng + 180) / 360) * n;
    const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
    return { x, y };
}

function latLngtoPixels(
    lat: number,
    lng: number,
    zoom: number,
    centerLat: number,
    centerLng: number,
    containerW: number,
    containerH: number
) {
    const centerCoords = getTileCoords(centerLat, centerLng, zoom);
    const targetCoords = getTileCoords(lat, lng, zoom);
    const dx = (targetCoords.x - centerCoords.x) * 256;
    const dy = (targetCoords.y - centerCoords.y) * 256;
    return {
        x: containerW / 2 + dx,
        y: containerH / 2 + dy,
    };
}

export function Map({
    lat,
    lng,
    zoom = 12,
    pinLat,
    pinLng,
    pinScale = 1.0,
    routeProgress = 0,
    styleVariant = 'neon',
    width = 800,
    height = 450,
    style,
    frame,
}: MapProps) {
    const currentFrame = useFrame(frame);
    
    // Resolve integer baseZoom and scale multiplier for smooth fractional zooms
    const baseZoom = Math.max(0, Math.min(19, Math.floor(zoom)));
    const fraction = zoom - baseZoom;
    const scale = Math.pow(2, fraction);

    const centerCoords = getTileCoords(lat, lng, baseZoom);

    const mapW = width;
    const mapH = height;

    const tilesInfo = useMemo(() => {
        const tilesAroundX = Math.ceil(mapW / 512) + 1;
        const tilesAroundY = Math.ceil(mapH / 512) + 1;
        const minX = Math.max(0, Math.floor(centerCoords.x) - tilesAroundX);
        const maxX = Math.min(Math.pow(2, baseZoom) - 1, Math.ceil(centerCoords.x) + tilesAroundX);
        const minY = Math.max(0, Math.floor(centerCoords.y) - tilesAroundY);
        const maxY = Math.min(Math.pow(2, baseZoom) - 1, Math.floor(centerCoords.y) + tilesAroundY);

        const list = [];
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const left = mapW / 2 + (x - centerCoords.x) * 256;
                const top = mapH / 2 + (y - centerCoords.y) * 256;

                list.push({
                    x,
                    y,
                    left,
                    top,
                    url: `https://tile.openstreetmap.org/${baseZoom}/${x}/${y}.png`,
                });
            }
        }
        return list;
    }, [centerCoords.x, centerCoords.y, baseZoom, mapW, mapH]);

    // Preload map tile images before capturing/displaying the frame to prevent flickering
    React.useEffect(() => {
        const activeUrls = tilesInfo.map(t => t.url);
        const handle = delayRender("Loading map tiles");

        Promise.all(
            activeUrls.map(url => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.src = url;
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                });
            })
        ).then(() => {
            continueRender(handle);
        });
    }, [tilesInfo]);

    const filterStyles = {
        standard: `none`,
        dark: `invert(0.9) hue-rotate(180deg) brightness(0.95) contrast(1.2)`,
        neon: `invert(0.95) hue-rotate(220deg) brightness(0.85) contrast(1.4) saturate(1.8)`
    };

    const selectedFilter = filterStyles[styleVariant] || filterStyles.neon;

    const pinPos = useMemo(() => {
        if (pinLat === undefined || pinLng === undefined) return null;
        return latLngtoPixels(pinLat, pinLng, baseZoom, lat, lng, mapW, mapH);
    }, [pinLat, pinLng, baseZoom, lat, lng, mapW, mapH]);

    const routeLine = useMemo(() => {
        if (pinLat === undefined || pinLng === undefined) return null;
        const startPos = { x: mapW / 2, y: mapH / 2 };
        const endPos = pinPos;
        if (!endPos) return null;

        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return {
            x1: startPos.x,
            y1: startPos.y,
            x2: endPos.x,
            y2: endPos.y,
            length: distance,
        };
    }, [pinLat, pinLng, pinPos, mapW, mapH]);

    const us = configToStyle(style);

    const pulseSize = (currentFrame % 30) * 1.5;
    const pulseOpacity = 1 - (currentFrame % 30) / 30;

    return (
        <div
            style={{
                position: 'relative',
                width: `${mapW}px`,
                height: `${mapH}px`,
                overflow: 'hidden',
                backgroundColor: "#090d16",
                borderRadius: '12px',
                border: '1px solid #1e293b',
                ...us,
              }}
        >
            {/* Smooth Zoom Wrapper Container */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    pointerEvents: 'none',
                }}
            >
                {/* Tiles Container */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        filter: selectedFilter,
                    }}
                >
                    {tilesInfo.map((tile) => (
                        <img
                            key={`${tile.x}-${tile.y}-${baseZoom}`}
                            src={tile.url}
                            alt=""
                            style={{
                                position: 'absolute',
                                left: `${tile.left}px`,
                                top: `${tile.top}px`,
                                width: '256px',
                                height: '256px',
                            }}
                        />
                    ))}
                </div>

                {/* SVG Route Line */}
                {routeLine && routeProgress > 0 && (
                    <svg
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            zIndex: 10,
                        }}
                    >
                        <line
                            x1={routeLine.x1}
                            y1={routeLine.y1}
                            x2={routeLine.x2}
                            y2={routeLine.y2}
                            stroke="#06b6d4"
                            strokeWidth={4 / scale} // Compensate stroke width so route line remains crisp and uniform
                            strokeLinecap="round"
                            strokeDasharray={routeLine.length}
                            strokeDashoffset={routeLine.length * (1 - routeProgress)}
                        />
                    </svg>
                )}

                {/* Pin Drop Marker */}
                {pinPos && (
                    <div
                        style={{
                            position: "absolute",
                            left: pinPos.x,
                            top: pinPos.y,
                            transform: `translate(-50%, -50%) scale(${pinScale / scale})`, // Counter-scale to preserve pin visual size
                            zIndex: 20,
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                left: `50%`,
                                top: '50%',
                                width: `${pulseSize * 2}px`,
                                height: `${pulseSize * 2}px`,
                                transform: 'translate(-50%, -50%)',
                                border: '2px solid #6366f1',
                                borderRadius: '50%',
                                opacity: pulseOpacity,
                            }}
                        />
                        <div
                            style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: '#6366f1',
                                border: '3px solid #fff',
                                borderRadius: '50%',
                                boxShadow: '0 0 10px rgba(99,102,241, 0.8)',
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}