Status: completed
Title: LLM errors freeze at Designing with no user feedback
Description: Any LLM failure (rate limit, 401, timeout, Ollama not installed, network unreachable) only logs to console. Pipeline stays stuck at `designing` stage forever, UI shows spinner and never recovers. Affects all providers (OpenAI, Ollama, custom). User sees no error, cannot retry.
Files: src/renderer/agents/llmClient.ts, src/renderer/agents/subagents/designAgent.ts, src/renderer/agents/pipeline.ts, src/renderer/components/AIsidebar.tsx
Fix: Catch all callLLM errors in pipeline/design agent, set pipelineState to `error` with human message (e.g. "Ollama not reachable — is it running?" / "Rate limited — try again in 30s"), surface via AIsidebar ErrorStage + toast, allow retry/dismiss without reload. Add timeout + friendly messages per provider.
