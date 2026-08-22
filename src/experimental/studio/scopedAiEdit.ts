import type { ComponentNode } from './semanticParser';
import type { TimelineCommentPin } from './semanticParser';

export function buildTargetedCommentPrompt(
    pin: TimelineCommentPin,
    activeNode?: ComponentNode,
    currentCode?: string
): string {
    const targetLabel = activeNode ? activeNode.id : 'Active Scene Elements';

    return `
Targeted Section Edit Request:
- Target Frame: ${pin.frame}
- Target Component: ${targetLabel}
- User Feedback Instruction: "${pin.text}"

Existing Scene TSX Source Code:
\`\`\`tsx
${currentCode || ''}
\`\`\`

Strict Constraints:
1. Modify keyframe values or layout parameters strictly for the requested edit at frame ${pin.frame}.
2. Return the complete updated React TSX scene component inside a single tsx markdown block.
`.trim();
}