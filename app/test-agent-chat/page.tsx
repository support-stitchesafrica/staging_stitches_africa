'use client';

import { useState, useEffect } from 'react';
import { agentChatService } from '@/lib/agent-chat/agent-chat-service';

export default function TestAgentChatPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Load all sessions
    const loadSessions = async () => {
      try {
        const allSessions = await agentChatService.getPendingSessions();
        setSessions(allSessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    };

    loadSessions();
  }, []);

  const selectSession = async (session) => {
    setSelectedSession(session);
    try {
      const sessionMessages = await agentChatService.getSessionMessages(session.id);
      setMessages(sessionMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedSession || !newMessage.trim()) return;

    try {
      await agentChatService.addMessage(selectedSession.id, {
        role: 'agent',
        content: newMessage,
        messageType: 'text',
        agentId: 'test-agent',
        agentName: 'Test Agent'
      });

      setNewMessage('');
      
      // Reload messages
      const sessionMessages = await agentChatService.getSessionMessages(selectedSession.id);
      setMessages(sessionMessages);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Agent Chat Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sessions List */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Active Sessions</h2>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-3 border rounded cursor-pointer ${
                  selectedSession?.id === session.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                }`}
                onClick={() => selectSession(session)}
              >
                <div className="font-medium">{session.userName || 'Anonymous'}</div>
                <div className="text-sm text-gray-600">{session.userEmail}</div>
                <div className="text-xs text-gray-500">
                  Status: {session.status} | Created: {session.createdAt?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">
            {selectedSession ? `Chat with ${selectedSession.userName || 'Anonymous'}` : 'Select a session'}
          </h2>
          
          {selectedSession && (
            <>
              {/* Messages */}
              <div className="h-64 overflow-y-auto border rounded p-2 mb-4 space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-2 rounded max-w-xs ${
                      message.role === 'user'
                        ? 'bg-blue-100 ml-auto'
                        : message.role === 'agent'
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <div className="text-xs text-gray-600 mb-1">
                      {message.role} - {message.timestamp?.toLocaleTimeString()}
                    </div>
                    <div className="text-sm">{message.content}</div>
                  </div>
                ))}
              </div>

              {/* Send Message */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border rounded px-3 py-2"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}