import React from 'react';

export interface SignalIn {
    sourceId: string;
    event: string;
    action: string;
}

export interface SignalData {
    clickFrame?: number;
    signalOutEvent?: string;
    signalOutFrame?: number;
}

export const SignalContext = React.createContext<Record<string, SignalData> | null>(null);

export function useSignal(signalIn?: SignalIn): number | null {
    const signalMap = React.useContext(SignalContext);
    const [triggerFrame, setTriggerFrame] = React.useState<number | null>(null);

    // 1. Synchronous static lookup (Headless render path)
    if (signalMap && signalIn) {
        const data = signalMap[signalIn.sourceId];
        if (data) {
            if (signalIn.event === 'click' && data.clickFrame !== undefined) {
                return data.clickFrame;
            }
            const matchEvent = data.signalOutEvent === signalIn.event;
            if (matchEvent && data.signalOutFrame !== undefined) {
                return data.signalOutFrame;
            }
        }
    }

    // 2. Asynchronous DOM query fallback (Dev/interactive preview path)
    React.useLayoutEffect(() => {
        if (!signalIn) return;
        if (signalMap && signalMap[signalIn.sourceId]) return; // Skip if already resolved in Context

        const element = document.getElementById(signalIn.sourceId);
        if (!element) return;

        if (signalIn.event === 'click') {
            const attr = element.getAttribute('data-click-frame');
            if (attr !== null) setTriggerFrame(parseInt(attr, 10));
        }
        else {
            const ev = element.getAttribute('data-signal-event');
            const fr = element.getAttribute('data-signal-frame');
            if (ev === signalIn.event && fr !== null) {
                setTriggerFrame(parseInt(fr, 10));
            }
        }
    }, [signalIn, signalMap]);

    return triggerFrame;
}