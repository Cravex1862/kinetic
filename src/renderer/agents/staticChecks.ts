import { sceneExportName, sceneExportRegex } from "./compositionStore";

export interface StaticIssue {
  line: number;
  message: string;
}

export function runStaticChecks(code: string): StaticIssue[] {
  const issues: StaticIssue[] = [];
  if (!code || !code.trim()) {
    return [{ line: 0, message: "Composition file is empty" }];
  }

  const lines = code.split("\n");
  lines.forEach((line, idx) => {
    const n = idx + 1;
    if (/^\s*import\s/.test(line)) {
      issues.push({
        line: n,
        message:
          "Import statement found — all imports are injected by the pipeline; remove it",
      });
    }
    if (/Math\.random\s*\(/.test(line)) {
      issues.push({
        line: n,
        message:
          "Math.random() breaks Remotion determinism — use random() from 'remotion'",
      });
    }
    if (/Date\.now\s*\(|new Date\s*\(/.test(line)) {
      issues.push({
        line: n,
        message:
          "Non-deterministic Date usage — animation values must depend only on the frame number",
      });
    }
    if (/process\.env|require\s*\(/.test(line)) {
      issues.push({
        line: n,
        message: "Node-only API used in browser/renderer code",
      });
    }
  });

  const stripped = code
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(
      /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g,
      "''",
    );
  const countChar = (ch: string) =>
    stripped.split("").filter((c) => c === ch).length;
  const openCurly = countChar("{");
  const closeCurly = countChar("}");
  const openParen = countChar("(");
  const closeParen = countChar(")");
  if (openCurly !== closeCurly) {
    issues.push({
      line: 0,
      message: `Unbalanced braces: ${openCurly} '{' vs ${closeCurly} '}'`,
    });
  }
  if (openParen !== closeParen) {
    issues.push({
      line: 0,
      message: `Unbalanced parentheses: ${openParen} '(' vs ${closeParen} ')'`,
    });
  }

  const sceneExports = [...code.matchAll(sceneExportRegex())].map((m) => m[1]);
  if (sceneExports.length === 0) {
    issues.push({
      line: 0,
      message: "No scene components found — expected at least one 'export const SceneN' component",
    });
  } else {
    const nums = sceneExports.map((s) => Number(s.slice(5)));
    const max = Math.max(...nums);
    for (let i = 1; i <= max; i++) {
      if (!nums.includes(i)) {
        issues.push({
          line: 0,
          message: `Missing export const ${sceneExportName(i - 1)} — sequence numbering gap`,
        });
      }
    }
  }

  if (
    !/export\s+default\s+VideoComposition|export\s+const\s+VideoComposition/.test(
      code,
    )
  ) {
    issues.push({
      line: 0,
      message: "Missing VideoComposition master component / default export",
    });
  }

  return issues;
}
