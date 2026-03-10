import { NextRequest, NextResponse } from 'next/server';
import { agentChatService } from '@/lib/agent-chat/agent-chat-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    const messages = await agentChatService.getSessionMessages(sessionId);
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, role, content, agentId, agentName, messageType, metadata } = await request.json();
    
    if (!sessionId || !role || !content) {
      return NextResponse.json(
        { error: 'Session ID, role, and content are required' },
        { status: 400 }
      );
    }
    
    const message = await agentChatService.addMessage(sessionId, {
      role,
      content,
      messageType,
      agentId,
      agentName,
      metadata
    });
    
    return NextResponse.json({ 
      success: true, 
      message 
    });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}