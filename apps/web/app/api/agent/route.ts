import { NextResponse } from 'next/server';
import { agentService } from '@/lib/agent/service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, mode, history, provider } = body;
    
    // In a real app, we'd get these from a secure store or env vars
    // For now, we'll try to get them from the request or defaults
    const apiKeys = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
    };

    if (!agentService.isInitialized()) {
      await agentService.initialize(apiKeys);
    }

    const orchestrator = agentService.getOrchestrator();
    
    // Update history if provided (optional, depending on state management strategy)
    // For this simple implementation, we'll trust the orchestrator's internal state
    // but in a stateless API we'd rebuild context here.
    
    const response = await orchestrator.processCommand(message, mode === 'terminal' ? 'terminal' : 'chat');

    return NextResponse.json(response.message);
  } catch (error) {
    console.error('Agent API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process agent request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
