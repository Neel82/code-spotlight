import { useEffect, useState } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";

declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();

export default function App() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [fontSize, setFontSize] = useState(28);
  const [live, setLive] = useState(true);
  const MIN_FONT_SIZE = 14;
  const MAX_FONT_SIZE = 80;
  const ZOOM_STEP = 1;

  // Map VS Code languageId to PrismJS language
  const languageMap: Record<string, string> = {
    typescript: "typescript",
    tsx: "tsx",
    javascript: "javascript",
    jsx: "jsx",
    python: "python",
    java: "java",
  };

  // Optional: dynamically load PrismJS languages if needed
  const prismLanguages: Record<string, () => Promise<void>> = {
    python: () => import("prismjs/components/prism-python"),
    java: () => import("prismjs/components/prism-java"),
    tsx: () => import("prismjs/components/prism-tsx"),
    jsx: () => import("prismjs/components/prism-jsx"),
    typescript: () => import("prismjs/components/prism-typescript"),
    javascript: () => import("prismjs/components/prism-javascript"),
  };

  const loadPrismLanguage = async (lang: string) => {
    const loader = prismLanguages[lang];
    if (loader && !Prism.languages[lang]) {
      try {
        await loader();
      } catch (e) {
        console.warn(`PrismJS: Failed to load ${lang}`, e);
      }
    }
  };

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
    const msg = event.data;
      if (msg.type === "update") {
        setCode(msg.code);

        const prismLang = languageMap[msg.language] || "typescript";
        setLanguage(prismLang);

        await loadPrismLanguage(prismLang); // <- dynamically load
        Prism.highlightAll();
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    Prism.highlightAll();
  }, [code, language]);

  useEffect(() => {
  const handleWheel = (event: WheelEvent) => {
    if (!event.ctrlKey) return;

    event.preventDefault(); // stop browser zoom

    setFontSize((current) => {
      const next =
        event.deltaY < 0
          ? current + ZOOM_STEP
          : current - ZOOM_STEP;

        return Math.min(
          MAX_FONT_SIZE,
          Math.max(MIN_FONT_SIZE, next)
        );
      });
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      };
    }, []);
    
  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setFontSize(f => f + 2)}>A+</button>
        <button onClick={() => setFontSize(f => f - 2)}>A-</button>
        <button
          onClick={() => {
            const next = !live;
            setLive(next);
            vscode.postMessage({ type: "setLive", value: next });

            // If Live just turned OFF, push current selection once
            if (!next) {
              vscode.postMessage({ type: "updateOnce" });
            }
          }}
        >
          {live ? "Live ✓" : "Live ✕"}
        </button>
        <button
           onClick={() => {
          vscode.postMessage({ type: "toggleFullscreen" });
            }}
              >
              ⛶
        </button>
      </div>

      <pre style={{ fontSize }}>
        <code className={`language-${language}`}>
          {code || "// Select code to magnify"}
        </code>
      </pre>
    </div>
  );
}
