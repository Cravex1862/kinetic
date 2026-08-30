Status: completed
Title: Repo Scan shows Skip/Generate before pipeline starts
Description: In SaaS template sidebar, REPO SCAN card shows "Enter Git repository link", "Upload Local Repo" and "Skip — generate without repo context" permanently, even before generation starts. Per design (Image 1) these controls should only appear when pipeline is actually at `repoScan` stage (when AI asks for repo context). Outside of generation they clutter the pre-generation setup and confuse user.
Files: src/renderer/templates/saasVideoDemo/SaaSGenerator.tsx:367, src/renderer/components/sidebar-components/RepoScanStage.tsx, src/renderer/agents/pipeline.ts:220
Fix: Gate RepoScanStage render on `pipelineState.status === 'repoScan'`. Before generation, hide Skip and Generate buttons; show only a collapsed placeholder or nothing. Use frontend-design: keep quiet, show only when relevant.
