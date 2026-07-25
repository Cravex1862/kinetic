import React, { useState } from 'react';
import { CaretDown, Plus, Trash, Sparkle } from '@phosphor-icons/react';
import { callLLM, getStoredConfig, safeParseJson } from '../agents/llmClient';
import { getSceneFrame } from '../scenes/timeline';

export interface TimelineComment {
    id: string,
    frame: number,
    text: string,
}

interface PanelProps {
    frame: number;
    localScenes: any[];
    comments: TimelineComment[];
    setComments: React.Dispatch<React.SetStateAction<TimelineComment[]>>;
    setFrame: (f: number) => void;
    setPlaying: (p: boolean) => void;
    customAlert: (title: string, message: string) => Promise<void>;
    updateScene: (sceneIdx: number, updateScene: any) => void;
}

export const TimelineCommentsPanel: React.FC<PanelProps> = ({
    frame,
    localScenes,
    comments,
    setComments,
    setFrame,
    setPlaying,
    customAlert,
    updateScene,
}) => {
    const [commentsOpen, setCommentsOpen] = useState(true);
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [refiningSceneIdx, setRefiningSceneIdx] = useState<number | null>(null);

    const handleRefineScene = async (comment: TimelineComment) => {
        const config = getStoredConfig();

        if (!config) {
            await customAlert("API Key missing", "Please set your API provider and key in Settings first");
            return;
        }

        const sceneDurations = localScenes.map(s => s.duration);
        const targetFrame = comment.frame;
        const sceneFrameInfo = getSceneFrame(targetFrame, sceneDurations);
        const targetSceneIdx = sceneFrameInfo.sceneIndex;
        const targetScene = localScenes[targetSceneIdx];

        if (!targetScene) return;

        setRefiningSceneIdx(targetSceneIdx);

        try {
            const sytemPrompt = `You are an expert AI video design subagent.
            You reeive a JSON bock representing a single video scene.
            Your task is to modify the properties or structure of components in this scene according to the user's layout  and styling feedback comment : "${comment.text}".
            - BrowserFrame: { url, panelSize: "small"|"medium"|"large", windowStyle: "mac"|"windows" }
            - AppCanvas: { aspectRatio: "16:9"|"4:3"|"1:1" }
            - MockWindow: { visible, top, left, width, height, windowStyle }
            - SidebarLayout: { collapsed, sidebarWidth, sidebarPosition: "left"|"right" }
            - DataGridContainer: { columns, gap }
            - TopNavbar: { brandName, searchPlaceholder }
            - HeroMetricCard: { primaryText, captionText, trend: "up"|"down" }
            - ActionButton: { size: "sm"|"md"|"lg", label, icon, layout: "label-only"|"icon-label"|"icon-only" }
            - SplitHeroLayout: { splitRatio }
            - TabSwitcherContainer: { tabs: string[], activeTab }
            - BreadcrumbHeader: { pathSequence: string[], separator }
            - NotificationToaster: { position }
            - CustomCard: { variant: "elevated"|"outlined"|"flat" }
            - GlassmorphicCard: { blur, saturate }
            - ProfileHeaderCard: { name, handle, badge }
            - FeatureBenefitCard: { accent, header, description }
            - PricingPlanCard: { highlighted, accentColor, price }
            - KanbanTaskCard: { priorityLabel, title }
            - BillingInvoiceCard: { status, description, amount, dueDate }
            - SettingsToggleCard: { size, label, description }
            - PushNotificationToast: { appName, title, body, time }
            - CursorClick : {clickX, clickY, radius, showHand}
            - ScrollReveal: {scrollDistance, direction, containerHeight}
            - MetricCounter: {from,to,duration,prefix,suffix,decimals}
            - ToggleAnimate: {toggled, label, size}
            - MenuExpand: {expanded, maxHeight}
            - Cursor: {startX, startY, targetId, clickFrame, duration}
            - TextTyper: {text, charsPerFrame, showCursor}
            - ProgressRing: { targetPercentage, size, duration}
            - Map: { lat,lng,zoom,pinLat, pinLng, pinScale,routeProgress, styleVariant: "standard" || "dark" || "neon" }

            Every primitive component can optionally accept:
                - id : string (unique identifier)
                - signalIn : {sourceId: string, event: 'click', action: 'expand' | "toggle" | "show" }
                - signalOut : { event:string, frame: number }

            Rules for Clicks:
                - To animate a cursor click, set "targetId" on the Cursor to match "id" of the target component, and specify "clickFrame".

            Output a JSON component tree. Every component must have "type" and "props". Use "children" for nesting.
            Return valid JSON only. `;

            const userPrompt = `Target Scene JSON: ${JSON.stringify(targetScene, null, 2)}
                                User feedback request for this scene: "${comment.text}"`;

            const res = await callLLM(config, sytemPrompt, userPrompt);

            if (res.error) {
                await customAlert("Generation Error", res.error);
                return;
            }

            const parsed = safeParseJson<any>(res.content, null);

            if (parsed && Array.isArray(parsed.component)) {
                updateScene(targetSceneIdx, parsed);
                await customAlert("Refine Complete", `Scene ${targetSceneIdx} has been updated based on feedback`);
            } else {
                await customAlert("Invalid AI Response", "The AI did not return a valid scene JSON configuration.");
            }
        } catch (err: any) {
            await customAlert("Refinement Error", err.message || String(err));
        } finally {
            setRefiningSceneIdx(null);
        }
    };

    return (
        <section className='mb-4'>
            <button onClick={() => setCommentsOpen((o) => !o)} className='flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500'>
                Timeline Feedback <CaretDown size={12} className={`transition-transform ${commentsOpen ? '' : '-rotate-90'}`} />
            </button>
            {commentsOpen && (
                <div className='mt-3 space-y-2'>
                    <button
                        onClick={() => {
                            setIsAddingComment(true);
                            setCommentText('');
                        }}
                        className='flex w-full items-center justify-center gap px-3 py-1.5 rounded-lg border border-gray-800 bg-gray-950 text-xs text-gray-400 hover:text-white transition-colors'>
                        <Plus size={14} /> Add Comment at Frame {frame}
                    </button>

                    {isAddingComment && (
                        <div className='p-3 bg-gray-950 border border-gray-800 rounded-lg space-y-2'>
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder='Fix layout alignment on this'
                                className='w-full h-16 bg-gray-900 text-xs rounded border border-gray-700 p-1.5 text-white outline-none focus:border-violet-500'
                            />
                            <div className='flex justify-end gap-1.5'>
                                <button onClick={() => setIsAddingComment(false)} className='px-2 py-1 text-[10px] text-gray-400 hover:text-white'>
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (commentText.trim()) {
                                            const newComment: TimelineComment = {
                                                id: Date.now().toString(),
                                                frame,
                                                text: commentText.trim()
                                            };
                                            setComments(prev => [...prev, newComment]);
                                            setIsAddingComment(false);
                                        }
                                    }}
                                    className='px-2.5 py-1 bg-violet-600 text-white rounded text-[10px] hover:bg-violet-500'>
                                    Save
                                </button>
                            </div>
                        </div>
                    )}
                    <div className='space-y-1.5 max-h-[220px] overflow-y-auto pr-1'>
                        {comments.length === 0 ? (
                            <span className='text-[10px] text-gray-600 italic block text-center py-2'>No comments pinned</span>
                        ) : (
                            comments.map((c) => {
                                const isRefining = refiningSceneIdx === getSceneFrame(c.frame, localScenes.map(s => s.duration)).sceneIndex;
                                return (
                                    <div key={c.id} className='p-2 bg-gray-950/40 border border-gray-900 rounded-md flex flex-col gap-1.5'>
                                        <div className='flex justify-between items-center text-[9px] text-gray-500'>
                                            <span onClick={() => {
                                                setFrame(c.frame);
                                                setPlaying(false);
                                            }}
                                                className='hover:text-violet-400 cursor-pointer font-mono font-semibold'>
                                                Frame {c.frame}
                                            </span>
                                            <button
                                                onClick={() => setComments(prev => prev.filter(x => x.id !== c.id))}
                                                className='text-gray-600 hover:text-red-400'>
                                                <Trash size={10} />
                                            </button>
                                        </div>
                                        <p className='text-[10px] text-gray-300'>{c.text}</p>
                                        <button
                                            onClick={() => handleRefineScene(c)}
                                            disabled={isRefining || refiningSceneIdx !== null}
                                            className='w-full flex items-center justify-center gap-1.5 py-1 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white text-[9px] font-bold rounded transistion-colors'>
                                            {isRefining ? (
                                                <>Refining Scene...</>
                                            ) : (
                                                <>
                                                    <Sparkle size={10} weight='fill' />
                                                    Edit Scene with AI
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}

        </section>
    )

};

interface PinsProps {
    comments: TimelineComment[];
    maxFrames: number;
    setFrame: (f: number) => void;
    setPlaying: (p: boolean) => void;
}

export const TimelineCommentPins: React.FC<PinsProps> = ({
    comments,
    maxFrames,
    setFrame,
    setPlaying,
}) => {
    return (
        <>
            {comments.map((c) => (
                <div
                    key={c.id}
                    style={{ left: `${(c.frame / maxFrames) * 100}%` }}
                    onClick={() => { setFrame(c.frame); setPlaying(false); }}
                    className='absolute top-1/2 -translate-y-1/2 h-3.5 w-1.5 bg-rose-500 border border-black rounded-sm cursor-pointer hover:bg-rose-400 z-10 transition-colors'
                    title={`Frame ${c.frame} : ${c.text}`} />

            ))}
        </>
    );
};
