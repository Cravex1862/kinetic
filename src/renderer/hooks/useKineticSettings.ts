import { useState, useEffect, useCallback } from "react";
import { MODEL_PRESETS } from "../constants";

const LS = {
  provider: "kinetic-provider",
  apiKey: "kinetic-api-key",
  baseUrl: "kinetic-base-url",
  model: "kinetic-model",
  resolution: "kinetic-default-resolution",
  fps: "kinetic-default-fps",
  aspectRatio: "kinetic-default-aspect-ratio",
  workspaceDir: "kinetic-workspace-dir",
};

export function useKineticSettings() {
  const [provider, setProvider] = useState(() => localStorage.getItem(LS.provider) || "openai");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS.apiKey) || "");
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem(LS.baseUrl) || "");
  const [model, setModel] = useState(() => localStorage.getItem(LS.model) || "");
  const [customModel, setCustomModel] = useState("");
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [resolution, setResolution] = useState(() => localStorage.getItem(LS.resolution) || "1080p");
  const [fps, setFps] = useState(() => Number(localStorage.getItem(LS.fps)) || 30);
  const [aspectRatio, setAspectRatio] = useState(() => localStorage.getItem(LS.aspectRatio) || "16:9");
  const [workspaceDir, setWorkspaceDir] = useState(() => localStorage.getItem(LS.workspaceDir) || "");

  useEffect(() => {
    if (provider === "ollama" && !baseUrl) setBaseUrl("http://localhost:11434");
    else if (provider === "lmstudio" && !baseUrl) setBaseUrl("http://localhost:1234");
    const savedModel = localStorage.getItem(LS.model) || "";
    const presets = MODEL_PRESETS[provider] || [];
    if (savedModel && presets.includes(savedModel)) {
      setModel(savedModel);
      setUseCustomModel(false);
    } else if (savedModel) {
      setCustomModel(savedModel);
      setUseCustomModel(true);
    } else {
      setModel(presets[0] || "");
      setUseCustomModel(false);
    }
  }, [provider]);

  const save = useCallback(() => {
    localStorage.setItem(LS.provider, provider);
    localStorage.setItem(LS.apiKey, apiKey.trim());
    if (baseUrl.trim()) localStorage.setItem(LS.baseUrl, baseUrl.trim());
    else localStorage.removeItem(LS.baseUrl);
    const finalModel = useCustomModel ? customModel.trim() : model;
    if (finalModel) localStorage.setItem(LS.model, finalModel);
    else localStorage.removeItem(LS.model);
    localStorage.setItem(LS.resolution, resolution);
    localStorage.setItem(LS.fps, String(fps));
    localStorage.setItem(LS.aspectRatio, aspectRatio);
    localStorage.setItem(LS.workspaceDir, workspaceDir);
  }, [provider, apiKey, baseUrl, model, customModel, useCustomModel, resolution, fps, aspectRatio, workspaceDir]);

  return {
    provider, setProvider,
    apiKey, setApiKey,
    baseUrl, setBaseUrl,
    model, setModel,
    customModel, setCustomModel,
    useCustomModel, setUseCustomModel,
    resolution, setResolution,
    fps, setFps,
    aspectRatio, setAspectRatio,
    workspaceDir, setWorkspaceDir,
    save,
  };
}
