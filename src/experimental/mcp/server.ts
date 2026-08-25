import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { PRIMITIVE_MENU_SUMMARY, ingestPrimitiveSourceCode } from "./primitiveRegistry";
import { generateFCPXML } from "../../renderer/utils/fcpxmlExporter";

const server = new Server(
    {
        name: "kinetic-mcp-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "list_kinetic_primitives",
                description: "List all 45+ available Kinetic UI primitive schemas (BrowserFrames, Cards, Charts, Motion cursors)",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "generate_video_demo_prompt",
                description: "Generates a Remotion video scene composition spec from a natural language prompt",
                inputSchema: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "Video description e.g. Show ARR growth card and line chart inside mac browser"
                        },
                        scenesCount: { type: "number", description: "Number of scenes to generate (default: 1)" },
                    },
                    required: ["prompt"],
                },
            },
            {
                name: "export_timeline_fcpxml",
                description: "Generates an FCPXML 1.9 timeline file for Premiere Pro & DaVinci Resolve",
                inputSchema: {
                    type: "object",
                    properties: {
                        title: { type: "string", description: "Project Title" },
                        width: { type: "number", description: "Width in px (default 1920)" },
                        height: { type: "number", description: "Height in px (default 1080)" },
                        fps: { type: "number", description: "FPS (default 30)" },
                        layersCount: { type: "number", description: "Number of component tracks (default 4)" },
                    },
                    required: ["title"],
                },
            },
            {
                name: "get_primitive_source_code",
                description: "Retrieves the exact prop schemas and source code for up to 10 specified Kinetic UI primitives (e.g. BrowserFrame, BarChartCard, Cursor)",
                inputSchema: {
                    type: "object",
                    properties: {
                        names: {
                            type: "array",
                            items: { type: "string" },
                            description: "List of primitive component names (max 10), e.g. ['BrowserFrame', 'BarChartCard', 'Cursor']"
                        }
                    },
                    required: ["names"]
                }
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "list_kinetic_primitives") {
        return {
            content: [
                {
                    type: "text",
                    text: `Kinetic Primitive SDKs Summary:\n\n${PRIMITIVE_MENU_SUMMARY}`,
                },
            ],
        };
    }

    if (name === "generate_video_demo_prompt") {
        const prompt = String(args?.prompt || "");
        const scenesCount = Number(args?.scenesCount || 1);

        const sampleComposition = `
// Generated Scene Spec for: "${prompt}"
export const Scene1: React.FC = () => {
    return (
        <Sequence from={0} durationInFrames={150}>
            <BrowserFrame url="https://app.kinetic.com" width={1150} height={650}>
                <Sequence from={15} durationInFrames={135}>
                    <BarChartCard titleText="Quarterly Growth" barColor="#10B981" />
                </Sequence>
                <Sequence from={45} durationInFrames={45}>
                    <Cursor startX={200} startY={200} targetId="target-card" clickFrame={20} />
                </Sequence>
            </BrowserFrame>
        </Sequence>
    );
};
`;

        return {
            content: [
                {
                    type: "text",
                    text: `Generated Composition Code:\n\n\`\`\`tsx\n${sampleComposition}\n\`\`\``,
                },
            ],
        };
    }

    if (name === "export_timeline_fcpxml") {
        const title = String(args?.title || "Kinetic Export");
        const width = Number(args?.width || 1920);
        const height = Number(args?.height || 1080);
        const fps = Number(args?.fps || 30);
        const layersCount = Number(args?.layersCount || 4);

        const clips = Array.from({ length: layersCount }).map((_, i) => ({
            id: `clip-${i + 1}`,
            name: `Scene1_Layer_${i + 1}`,
            srcPath: `Assets/Scene1_Layer_${i + 1}.png`,
            trackType: "video" as const,
            trackIndex: i + 1,
            startFrame: i * 15,
            durationInFrames: 150 - i * 15,
        }));

        const xmlString = generateFCPXML(title, width, height, fps, clips);

        return {
            content: [
                {
                    type: "text",
                    text: xmlString,
                },
            ],
        };
    }

    if (name === "get_primitive_source_code") {
        const rawNames = Array.isArray(args?.names) ? (args.names as string[]) : [];
        const names = rawNames.slice(0, 10);

        const sourceMap = await ingestPrimitiveSourceCode(names);
        const resultText = names.map(n => {
            const code = sourceMap[n] || "Source code not found in registry";
            return `=== PRIMITIVE: ${n} ===\n${code}`;
        }).join("\n\n");

        return {
            content: [
                {
                    type: "text",
                    text: resultText || "No valid primitive names provided.",
                },
            ],
        };
    }

    throw new Error(`Tool not found: ${name}`);
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Kinetic MCP Server running on Stdio");
}

main().catch((error) => {
    console.error("Fatal error running Kinetic MCP Server:", error);
    process.exit(1);
});