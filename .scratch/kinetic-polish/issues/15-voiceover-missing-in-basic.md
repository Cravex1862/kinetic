Status: completed
Title: Voiceover & Animation Timing missing in Basic Animation
Description: SaaS has Voiceover & Animation Timing panel with Timestamp Script / Audio File tabs (Image 2) that lets user drive animation keyframes via `[00:02]` timestamps. Basic Animation template lacks this panel entirely, but user wants it there too. Inconsistent feature set across templates.
Files: src/renderer/templates/basicAnimation/BasicGenerator.tsx:270, src/renderer/templates/saasVideoDemo/SaaSGenerator.tsx:372, src/renderer/components/VoiceoverAudioField.tsx, src/renderer/components/sidebar-components/VoiceoverStage.tsx, src/renderer/utils/timestampScriptParser.ts
Fix: Add same Voiceover panel to BasicGenerator (and check UI/UX Walkthrough). Reuse VoiceoverAudioField with same Timestamp Script / Audio File switch, share scaffold voiceoverMode/narration state. Ensure design language matches pill morph sidebar — quiet, consistent spacing.
