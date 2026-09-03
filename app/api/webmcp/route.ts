import { NextRequest, NextResponse } from 'next/server';
import { ALL_WEBMCP_TOOLS } from '@/webmcp/registry';

export async function GET() {
  return NextResponse.json({
    status: 'connected',
    protocol: 'WebMCP',
    version: '1.0',
    toolsCount: ALL_WEBMCP_TOOLS.length,
    tools: ALL_WEBMCP_TOOLS.map(t => ({
      name: t.name,
      description: t.description,
      category: t.category,
      inputSchema: t.inputSchema,
      requiresApproval: !!t.requiresApproval
    }))
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { toolName, input, context } = body;

    const tool = ALL_WEBMCP_TOOLS.find(t => t.name === toolName);
    if (!tool) {
      return NextResponse.json(
        { success: false, error: `Tool "${toolName}" not found.` },
        { status: 404 }
      );
    }

    const result = await tool.execute(input || {}, context || { actor: 'agent' });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Execution error' },
      { status: 500 }
    );
  }
}
