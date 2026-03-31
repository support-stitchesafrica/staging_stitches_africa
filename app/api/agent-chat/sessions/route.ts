import { NextRequest, NextResponse } from 'next/server';
import { agentChatService } from '@/lib/agent-chat/agent-chat-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (sessionId) {
      // Get specific session
      const session = await agentChatService.getAgentSession(sessionId);
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      
      const messages = await agentChatService.getSessionMessages(sessionId);
      
      return NextResponse.json({
        session,
        messages
      });
    } else {
      // Get all pending sessions
      const sessions = await agentChatService.getPendingSessions();
      return NextResponse.json({ sessions });
    }
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, userCredentials, chatHistory } = await request.json();
    
    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Session ID and User ID are required' },
        { status: 400 }
      );
    }
    
    const agentSession = await agentChatService.createAgentSession(
      sessionId,
      userId,
      userCredentials,
      chatHistory || []
    );
    
    return NextResponse.json({ 
      success: true, 
      session: agentSession 
    });
  } catch (error) {
    console.error('Error creating agent session:', error);
    return NextResponse.json(
      { error: 'Failed to create agent session' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { sessionId, action, agentId, agentEmail } = await request.json();
    
    if (!sessionId || !action) {
      return NextResponse.json(
        { error: 'Session ID and action are required' },
        { status: 400 }
      );
    }
    
    switch (action) {
      case 'assign':
        if (!agentId || !agentEmail) {
          return NextResponse.json(
            { error: 'Agent ID and email are required for assignment' },
            { status: 400 }
          );
        }
        await agentChatService.assignSessionToAgent(sessionId, agentId, agentEmail);
        break;
        
      case 'close':
        await agentChatService.closeSession(sessionId, agentId);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}