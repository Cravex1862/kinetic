import React from 'react';

export interface SignalIn {
    sourceId: string;
    event: string;
    action: string;
}

export function useSignal(signalIn?: SignalIn): number | null {
    const [triggerFrame, setTriggerFrame] = React.useState<number | null>(null);

    React.useLayoutEffect(() => {
        if (!signalIn) return;
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
    }, [signalIn]);

    return triggerFrame;
}