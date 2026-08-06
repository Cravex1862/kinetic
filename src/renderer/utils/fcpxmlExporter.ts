export interface TrackClipAsset {
    id: string;
    name: string;
    srcPath: string;
    trackType: 'video' | 'audio';
    trackIndex: number;
    startFrame: number;
    durationInFrames: number;
}

export function generateFCPXML(
    title: string,
    width: number = 1920,
    height: number = 1080,
    fps: number = 30,
    clips: TrackClipAsset[]
): string {
    const frameDuration = `100/${fps * 100}s`;

    const videoTracksMap = new Map<number, TrackClipAsset[]>();
    clips.filter(c => c.trackType === 'video').forEach(c => {
        const track = videoTracksMap.get(c.trackIndex) || [];
        track.push(c);
        videoTracksMap.set(c.trackIndex, track);
    });

    const trackNumbers = Array.from(videoTracksMap.keys()).sort((a, b) => a - b);
    const totalDurationFrames = Math.max(...clips.map(c => c.startFrame + c.durationInFrames), 300);

    const v1Clips = videoTracksMap.get(1) || [];

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
    <resources>
        <format id="r1" name="FFVideoFormat1080p${fps}" frameDuration="${frameDuration}" width="${width}" height="${height}" />
        ${clips.map((c, i) => `
        <asset id="r${i + 2}" name="${c.name}" src="${c.srcPath}" start="0s" duration="${c.durationInFrames}/${fps}s" hasVideo="${c.trackType === 'video' ? '1' : '0'}" hasAudio="${c.trackType === 'audio' ? '1' : '0'}" />
        `).join('')}
    </resources>
    <library>
        <event name="${title} Export">
            <project name="${title}">
                <sequence format="r1" duration="${totalDurationFrames}/${fps}s" tcStart="0s">
                    <spine>
                        ${v1Clips.map((c, i) => `
                        <asset-clip name="${c.name}" ref="r${i + 2}" offset="${c.startFrame}/${fps}s" duration="${c.durationInFrames}/${fps}s">
                            ${trackNumbers.filter(tNum => tNum > 1).flatMap(tNum => {
                                const layerClips = videoTracksMap.get(tNum) || [];
                                return layerClips.map(clip => `
                            <asset-clip name="${clip.name}" ref="r${clips.findIndex(x => x.id === clip.id) + 2}" lane="${tNum - 1}" offset="${clip.startFrame}/${fps}s" duration="${clip.durationInFrames}/${fps}s" />
                                `);
                            }).join('')}
                        </asset-clip>
                        `).join('')}
                    </spine>
                </sequence>
            </project>
        </event>
    </library>
</fcpxml>`;
}