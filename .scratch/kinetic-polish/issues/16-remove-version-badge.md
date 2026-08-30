Status: completed
Title: Remove v0.4.2 version badge from header
Description: Every template header shows a `v0.4.2` pill on the right (Image 3) next to `kinetic / Template`. User says remove it — it's vibe-coded, clutters header, and looks like a template tag not a shipped product.
Files: src/renderer/templates/basicAnimation/BasicGenerator.tsx:200, src/renderer/templates/saasVideoDemo/SaaSGenerator.tsx:337, src/renderer/templates/uiUxWalkthrough/UiUxGenerator.tsx:124, src/renderer/templates/logoAnimator/LogoGenerator.tsx:242
Fix: Delete the version badge span entirely from all 4 generator headers. Keep only `kinetic / Template` and back arrow. No replacement.
