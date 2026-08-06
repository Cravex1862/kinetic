/**
 * @file semanticParser.ts
 * @description Scene AST & Keyframe Parser for Remotion Compositions.
 * Parses React JSX scene source code into editable ComponentNode keyframe trees,
 * deduplicates keyframe points to ensure monotonic increasing frame arrays,
 * and serializes keyframe interpolation statements into TSX code.
 */

export type EasingType = 'linear' | 'easeOut' | 'easeIn' | 'easeInOut' | 'spring';

export interface KeyframePoint {
  frame: number;
  value: number | string;
  easing?: EasingType;
}

export interface ComponentNode {
  id: string;
  label: string;
  tagName: string;
  props: Record<string, any>;
  keyframes: Record<string, KeyframePoint[]>;
  children: ComponentNode[];
}

export interface TimelineCommentPin {
  id: string;
  frame: number;
  text: string;
  targetNodeId?: string;
  resolved: boolean;
  createdAt: number;
}

/**
 * Deduplicates and sorts keyframe points to guarantee strictly monotonic increasing frame numbers.
 * Remotion's `interpolate()` throws runtime crashes if frame input ranges are not strictly increasing (f0 < f1 < f2).
 */
export function deduplicateKeyframePoints(points: KeyframePoint[]): KeyframePoint[] {
  if (!points || points.length === 0) return [];

  const sortedPoints = [...points].sort((a, b) => a.frame - b.frame);
  const uniquePoints: KeyframePoint[] = [];

  for (const pt of sortedPoints) {
    if (uniquePoints.length === 0 || pt.frame > uniquePoints[uniquePoints.length - 1].frame) {
      uniquePoints.push(pt);
    } else {
      // Replace duplicate frame entry with latest keyframe value
      uniquePoints[uniquePoints.length - 1] = pt;
    }
  }

  return uniquePoints;
}

/**
 * Parses TSX scene source code into an array of editable ComponentNodes with keyframe maps.
 */
export function parseSceneCodeToNodes(code: string): ComponentNode[] {
  const nodes: ComponentNode[] = [];
  if (!code) return nodes;

  // Match explicit data-label or known primitive SDK components
  const tagRegex = /(?:data-label=["']([^"']+)["']|<(BrowserFrame|AppCanvas|HeroMetricCard|GlassmorphicCard|PricingPlanCard|KanbanTaskCard|FeatureCard|BarChartCard|LineChartCard|PieChartCard|DonutChartCard|SidebarLayout|TopNavbar|TextTyper|VectorMorph))/g;
  let match: RegExpExecArray | null;

  let index = 0;
  const seenLabels = new Set<string>();

  while ((match = tagRegex.exec(code)) !== null) {
    const label = match[1] || match[2];
    if (!label || seenLabels.has(label + match.index)) continue;
    seenLabels.add(label + match.index);

    const id = `node-${index++}`;
    const matchPos = match.index;

    const snippet = code.substring(Math.max(0, matchPos - 200), matchPos + 400);

    const extractNumProp = (propName: string, defaultVal: number): number => {
      const rx = new RegExp(`${propName}=\\{?\\s*(-?\\d+(?:\\.\\d+)?)\\s*\\}?`, 'i');
      const m = snippet.match(rx);
      return m ? Number(m[1]) : defaultVal;
    };

    const extractStrProp = (propName: string, defaultVal: string): string => {
      const rx = new RegExp(`${propName}=["']([^"']+)["']`, 'i');
      const m = snippet.match(rx);
      return m ? m[1] : defaultVal;
    };

    const is3D = label.toLowerCase().includes('browser') || label.toLowerCase().includes('frame') || label.toLowerCase().includes('card');

    nodes.push({
      id,
      label,
      tagName: 'div',
      props: {
        rotateX: extractNumProp('rotateX', 0),
        rotateY: extractNumProp('rotateY', 0),
        rotateZ: extractNumProp('rotateZ', 0),
        perspective: extractNumProp('perspective', 0),
        translateX: extractNumProp('translateX', 0),
        translateY: extractNumProp('translateY', 0),
        translateZ: extractNumProp('translateZ', 0),
        scale: extractNumProp('scale', 1.0),
        opacity: extractNumProp('opacity', 1),
        width: extractNumProp('width', 1150),
        height: extractNumProp('height', 650),
        targetId: extractStrProp('targetId', id),
        textValue: extractStrProp('titleText', extractStrProp('title', label)),
      },
      keyframes: {},
      children: [],
    });
  }

  if (nodes.length === 0) {
    nodes.push({
      id: 'main-scene-root',
      label: 'Main Scene Viewport',
      tagName: 'div',
      props: {
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        perspective: 1200,
        translateX: 0,
        translateY: 0,
        translateZ: 0,
        scale: 1.0,
        targetId: 'main-scene-root',
        textValue: 'Main Scene',
      },
      keyframes: {},
      children: [],
    });
  }

  // Parse existing Remotion interpolate() statements
  const interpRegex = /const\s+([a-zA-Z0-9_]+)_([a-zA-Z0-9_]+)\s*=\s*interpolate\(\s*frame\s*,\s*\[([^\]]+)\]\s*,\s*\[([^\]]+)\]/g;
  let interpMatch: RegExpExecArray | null;
  while ((interpMatch = interpRegex.exec(code)) !== null) {
    const rawNodeIdStr = interpMatch[1];
    const propKey = interpMatch[2];
    const framesArr = interpMatch[3].split(',').map((s) => Number(s.trim()));
    const valuesArr = interpMatch[4].split(',').map((s) => Number(s.trim()));

    const fullMatchLine = code.substring(interpMatch.index, interpMatch.index + 250);
    let easing: EasingType = 'easeOut';
    if (fullMatchLine.includes('Easing.linear')) easing = 'linear';
    else if (fullMatchLine.includes('Easing.in(')) easing = 'easeIn';
    else if (fullMatchLine.includes('0.42')) easing = 'easeInOut';
    else if (fullMatchLine.includes('0.34')) easing = 'spring';

    const targetNode = nodes.find((n) => n.id === rawNodeIdStr.replace(/_/g, '-') || n.id.replace(/-/g, '_') === rawNodeIdStr);
    if (targetNode && framesArr.length === valuesArr.length) {
      const rawPoints: KeyframePoint[] = framesArr.map((f, i) => ({
        frame: f,
        value: valuesArr[i],
        easing,
      }));
      targetNode.keyframes[propKey] = deduplicateKeyframePoints(rawPoints);
      if (targetNode.props[propKey] === undefined && targetNode.keyframes[propKey].length > 0) {
        targetNode.props[propKey] = targetNode.keyframes[propKey][0].value;
      }
    }
  }

  // Parse single keyframe points preserved in comments
  const kfCommentRegex = /\/\/\s*kf:\s*([a-zA-Z0-9_]+)_([a-zA-Z0-9_]+)=([^\n]+)/g;
  let commentMatch: RegExpExecArray | null;
  while ((commentMatch = kfCommentRegex.exec(code)) !== null) {
    const rawNodeIdStr = commentMatch[1];
    const propKey = commentMatch[2];
    try {
      const points = JSON.parse(commentMatch[3].trim());
      const targetNode = nodes.find((n) => n.id === rawNodeIdStr.replace(/_/g, '-') || n.id.replace(/-/g, '_') === rawNodeIdStr);
      if (targetNode && Array.isArray(points)) {
        targetNode.keyframes[propKey] = deduplicateKeyframePoints(points);
      }
    } catch {
      // Ignore comment parse errors
    }
  }

  return nodes;
}

/**
 * Re-serializes modified ComponentNode keyframe points into TSX Remotion code.
 */
export function updateCodeWithNodeProps(originalCode: string, nodes: ComponentNode[]): string {
  if (!originalCode) return originalCode;

  const isWindows = originalCode.includes('\r\n') || (typeof process !== 'undefined' && process.platform === 'win32');
  let updatedCode = originalCode.replace(/\r\n/g, '\n');

  // Strip duplicate frame declarations
  const frameDeclCount = (updatedCode.match(/const\s+frame\s*=\s*useCurrentFrame\(\);?/g) || []).length;
  if (frameDeclCount > 1) {
    let seen = false;
    updatedCode = updatedCode.replace(/^[ \t]*const[ \t]+frame[ \t]*=[ \t]*useCurrentFrame\(\);?[ \t]*\n?/gm, () => {
      if (!seen) {
        seen = true;
        return '  const frame = useCurrentFrame();\n';
      }
      return '';
    });
  }

  // Ensure Remotion Easing import exists
  if (!/import[^;]*\bEasing\b[^;]*from\s+['"]remotion['"]/.test(updatedCode)) {
    updatedCode = updatedCode.replace(
      /(import\s*\{[^}]*)(\}\s*from\s*['"]remotion['"])/,
      (m, p1, p2) => (p1.includes('Easing') ? m : `${p1}, Easing ${p2}`)
    );
  }

  // Strip existing keyframe interpolations and comments before re-generating
  updatedCode = updatedCode
    .replace(/^[ \t]*const[ \t]+[a-zA-Z0-9_]+_[a-zA-Z0-9_]+[ \t]*=[ \t]*interpolate\([^;]+;[ \t]*\n?/gm, '')
    .replace(/^[ \t]*\/\/[ \t]*kf:[ \t]*[^\n]+\n?/gm, '');

  let interpolations = '';
  let singleKfComments = '';

  for (const node of nodes) {
    const labelEscaped = node.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tagRegex = new RegExp(`(<[a-zA-Z0-9_]+[^>]*data-label=["']${labelEscaped}["'][^>]*>)`, 'g');

    updatedCode = updatedCode.replace(tagRegex, (fullTag) => {
      let modifiedTag = fullTag;
      const propsToUpdate = [
        'rotateX', 'rotateY', 'rotateZ',
        'translateX', 'translateY', 'translateZ',
        'perspective',
        'width', 'height', 'scale', 'opacity'
      ];

      for (const prop of propsToUpdate) {
        const kfPoints = node.keyframes[prop];
        if (kfPoints && kfPoints.length >= 2) {
          const uniquePoints = deduplicateKeyframePoints(kfPoints);

          if (uniquePoints.length >= 2) {
            const frames = uniquePoints.map((p) => p.frame).join(', ');
            const values = uniquePoints.map((p) => p.value).join(', ');
            const varName = `${node.id.replace(/-/g, '_')}_${prop}`;

            const easingType = uniquePoints[0]?.easing || uniquePoints[1]?.easing || 'easeOut';
            let easingFnStr = 'Easing.out(Easing.cubic)';
            if (easingType === 'linear') easingFnStr = 'Easing.linear';
            else if (easingType === 'easeIn') easingFnStr = 'Easing.in(Easing.cubic)';
            else if (easingType === 'easeInOut') easingFnStr = 'Easing.bezier(0.42, 0, 0.58, 1.0)';
            else if (easingType === 'spring') easingFnStr = 'Easing.bezier(0.34, 1.56, 0.64, 1.0)';

            interpolations += `  const ${varName} = interpolate(frame, [${frames}], [${values}], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ${easingFnStr} });\n`;

            const propRegex = new RegExp(`${prop}=\\{?[^\\}>\\s]+\\}?`, 'g');
            if (propRegex.test(modifiedTag)) {
              modifiedTag = modifiedTag.replace(propRegex, `${prop}={${varName}}`);
            } else if (/\/>$/.test(modifiedTag)) {
              modifiedTag = modifiedTag.replace(/\/>$/, ` ${prop}={${varName}} />`);
            } else {
              modifiedTag = modifiedTag.replace(/>$/, ` ${prop}={${varName}}>`);
            }
          }
        } else if (kfPoints && kfPoints.length === 1) {
          const varName = `${node.id.replace(/-/g, '_')}_${prop}`;
          singleKfComments += `  // kf: ${varName}=${JSON.stringify(kfPoints)}\n`;

          const val = kfPoints[0].value;
          const propRegex = new RegExp(`${prop}=\\{?[^\\}>\\s]+\\}?`, 'g');
          if (propRegex.test(modifiedTag)) {
            modifiedTag = modifiedTag.replace(propRegex, `${prop}={${val}}`);
          } else if (/\/>$/.test(modifiedTag)) {
            modifiedTag = modifiedTag.replace(/\/>$/, ` ${prop}={${val}} />`);
          } else {
            modifiedTag = modifiedTag.replace(/>$/, ` ${prop}={${val}}>`);
          }
        } else {
          const val = node.props[prop];
          if (val === undefined) continue;

          const propRegex = new RegExp(`${prop}=\\{?[^\\}>\\s]+\\}?`, 'g');
          if (propRegex.test(modifiedTag)) {
            modifiedTag = modifiedTag.replace(propRegex, `${prop}={${val}}`);
          } else if (/\/>$/.test(modifiedTag)) {
            modifiedTag = modifiedTag.replace(/\/>$/, ` ${prop}={${val}} />`);
          } else {
            modifiedTag = modifiedTag.replace(/>$/, ` ${prop}={${val}}>`);
          }
        }
      }

      if (node.props.textValue !== undefined) {
        const textVal = String(node.props.textValue).replace(/"/g, '&quot;');
        if (/titleText=["'][^"']*["']/.test(modifiedTag)) {
          modifiedTag = modifiedTag.replace(/titleText=["'][^"']*["']/, `titleText="${textVal}"`);
        } else if (/title=["'][^"']*["']/.test(modifiedTag)) {
          modifiedTag = modifiedTag.replace(/title=["'][^"']*["']/, `title="${textVal}"`);
        }
      }

      return modifiedTag;
    });
  }

  const codeToInject = interpolations + singleKfComments;

  if (codeToInject) {
    if (/const\s+frame\s*=\s*useCurrentFrame\(\)/.test(updatedCode)) {
      updatedCode = updatedCode.replace(
        /(const\s+frame\s*=\s*useCurrentFrame\(\);?)/,
        `$1\n${codeToInject}`
      );
    } else {
      const sceneRegex = /(export\s+const\s+Scene1\s*:\s*React\.FC\s*=\s*\(\)\s*=>\s*\{)/;
      if (sceneRegex.test(updatedCode)) {
        updatedCode = updatedCode.replace(sceneRegex, `$1\n  const frame = useCurrentFrame();\n${codeToInject}`);
      } else {
        const funcRegex = /(function\s+Scene1\s*\(\)\s*\{)/;
        if (funcRegex.test(updatedCode)) {
          updatedCode = updatedCode.replace(funcRegex, `$1\n  const frame = useCurrentFrame();\n${codeToInject}`);
        }
      }
    }
  }

  if (isWindows) {
    updatedCode = updatedCode.replace(/\r?\n/g, '\r\n');
  }

  return updatedCode;
}
