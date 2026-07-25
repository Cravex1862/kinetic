export function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '').trim();
    return [
        parseInt(h.slice(0, 2), 16) || 0,
        parseInt(h.slice(2, 4), 16) || 0,
        parseInt(h.slice(4, 6), 16) || 0,
    ];
}

export function rgbToHex(r: number, g: number, b: number): string {
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

export function getLowOpacityColor(colorStr: string = '#ffffff', opacity: number = 0.15): string {
    const cleanColor = colorStr.trim().toLowerCase();
    
    // Hex format: #rrggbb or #rgb
    if (cleanColor.startsWith('#')) {
        const hex = cleanColor.substring(1);
        let r = 255, g = 255, b = 255;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // RGB format: rgb(r, g, b)
    if (cleanColor.startsWith('rgb(')) {
        const rgbValues = cleanColor.replace('rgb(', '').replace(')', '').split(',');
        if (rgbValues.length === 3) {
            return `rgba(${rgbValues[0].trim()}, ${rgbValues[1].trim()}, ${rgbValues[2].trim()}, ${opacity})`;
        }
    }

    // RGBA format: rgba(r, g, b, a)
    if (cleanColor.startsWith('rgba(')) {
        const rgbaValues = cleanColor.replace('rgba(', '').replace(')', '').split(',');
        if (rgbaValues.length >= 3) {
            return `rgba(${rgbaValues[0].trim()}, ${rgbaValues[1].trim()}, ${rgbaValues[2].trim()}, ${opacity})`;
        }
    }

    return `rgba(255, 255, 255, ${opacity})`;
}
