Status: completed
Title: Remove "Describe the changes you want to make" Edit Video panel
Description: Image 6 shows a large textarea "Describe the changes you want to make..." with a purple "Edit Video" button below. User asks "what is this? ... I know what it is." — wants it removed. Likely the post-generation scoped edit / studio edit panel that appears after video is done. Feels redundant and vibe-coded, takes space without clear job.
Files: src/experimental/studio/InspectorPanel.tsx, src/experimental/studio/Studio.tsx, src/renderer/pages/StudioPage.tsx, src/renderer/components/VideoCompositionViewerModal.tsx
Fix: Remove the panel entirely (textarea + Edit Video button). If edit capability is needed, expose it via the existing AI sidebar interview/approval flow, not a separate large prompt box. Verify no dead button left behind.
