'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Bot,
  Send,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { agentChatService } from '@/lib/agent-chat/agent-chat-service';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { scrollToBottom } from '@/lib/utils/chat-scroll';
import type { AgentChatSession, AgentChatMessage } from '@/types/agent-chat';

export default function MarketingAgentChatPage() {
  const { marketingUser } = useMarketingAuth();
  const [sessions, setSessions] = useState<AgentChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AgentChatSession | null>(null);
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Array<{userId: string, role: 'user' | 'agent', isTyping: boolean}>>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionFilter, setSessionFilter] = useState<'all' | 'pending' | 'active' | 'closed'>('all');

  // Load all sessions (pending, active, and closed)
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    
    const setupSubscription = () => {
      const unsubscribe = agentChatService.subscribeToAllSessions((allSessions) => {
        setSessions(allSessions);
        setIsLoading(false);
        setError(null);
      });

      return unsubscribe;
    };

    let unsubscribe = setupSubscription();

    // Set a timeout to handle cases where the subscription doesn't fire due to permission issues
    const timeout = setTimeout(() => {
      setIsLoading(false);
      if (sessions.length === 0) {
        setError('Unable to load sessions. Please check your connection.');
        
        // Retry after 3 seconds in case the marketing user document is being created
        retryTimeout = setTimeout(() => {
          setIsLoading(true);
          setError(null);
          unsubscribe(); // Clean up old subscription
          unsubscribe = setupSubscription(); // Try again
        }, 3000);
      }
    }, 10000); // 10 second timeout

    return () => {
      unsubscribe();
      clearTimeout(timeout);
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  // Load messages for selected session
  useEffect(() => {
    if (!selectedSession) {
      setMessages([]);
      return;
    }

    const unsubscribe = agentChatService.subscribeToSessionMessages(
      selectedSession.id,
      (sessionMessages) => {
        setMessages(sessionMessages);
        // Auto-scroll to bottom when messages update
        setTimeout(() => {
          const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]') || 
                           document.querySelector('.chat-scroll-area');
          if (scrollArea) {
            scrollArea.scrollTop = scrollArea.scrollHeight;
          }
        }, 100);
      }
    );

    return unsubscribe;
  }, [selectedSession]);

  // Subscribe to typing indicators for selected session
  useEffect(() => {
    if (!selectedSession) {
      setTypingUsers([]);
      return;
    }

    const unsubscribe = agentChatService.subscribeToTypingIndicators(
      selectedSession.id,
      (typing) => {
        setTypingUsers(typing);
        // Auto-scroll to bottom when typing indicators update
        setTimeout(() => {
          const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]') || 
                           document.querySelector('.chat-scroll-area');
          if (scrollArea) {
            scrollArea.scrollTop = scrollArea.scrollHeight;
          }
        }, 50);
      }
    );

    return unsubscribe;
  }, [selectedSession]);

  const handleSessionSelect = async (session: AgentChatSession) => {
    setSelectedSession(session);
    
    // Assign session to current agent if not already assigned
    if (session.status === 'pending' && marketingUser) {
      try {
        await agentChatService.assignSessionToAgent(
          session.id,
          marketingUser.uid,
          marketingUser.email
        );
      } catch (error) {
        console.error('Error assigning session:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedSession || !newMessage.trim() || !marketingUser) return;

    setIsSending(true);
    try {
      await agentChatService.addMessage(selectedSession.id, {
        role: 'agent',
        content: newMessage.trim(),
        messageType: 'text',
        agentId: marketingUser.uid,
        agentName: marketingUser.name || marketingUser.email
      });
      
      setNewMessage('');
      // Auto-scroll to bottom after sending message
      setTimeout(() => {
        const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]') || 
                         document.querySelector('.chat-scroll-area');
        if (scrollArea) {
          scrollArea.scrollTop = scrollArea.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    if (!marketingUser) return;
    
    try {
      await agentChatService.closeSession(sessionId, marketingUser.uid);
      setSelectedSession(null);
    } catch (error) {
      console.error('Error closing session:', error);
    }
  };

  // Filter sessions based on selected filter
  const filteredSessions = sessions.filter(session => {
    if (sessionFilter === 'all') return true;
    return session.status === sessionFilter;
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <X className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent chat sessions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <MessageCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-2 font-medium">Unable to load chat sessions</p>
          <p className="text-gray-600 text-sm mb-4">
            There was an issue connecting to the chat system. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Chat</h1>
          <p className="text-gray-600 mt-1">
            Manage customer support conversations and agent handoffs
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{filteredSessions.length} sessions</span>
            <span className="text-gray-400">•</span>
            <span>{sessions.filter(s => s.status === 'pending').length} pending</span>
            <span className="text-gray-400">•</span>
            <span>{sessions.filter(s => s.status === 'active').length} active</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Sessions</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-240px)] max-h-[800px]">
        {/* Sessions List */}
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {filteredSessions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>
                    {sessionFilter === 'all' 
                      ? 'No chat sessions found' 
                      : `No ${sessionFilter} sessions`
                    }
                  </p>
                  {sessionFilter !== 'all' && (
                    <button
                      onClick={() => setSessionFilter('all')}
                      className="mt-2 text-primary hover:text-primary/80 text-sm"
                    >
                      View all sessions
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => handleSessionSelect(session)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedSession?.id === session.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {session.userName || 'Anonymous User'}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {session.userEmail}
                          </p>
                        </div>
                        <Badge className={`ml-2 ${getStatusColor(session.status)}`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(session.status)}
                            <span className="capitalize">{session.status}</span>
                          </div>
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatTime(session.lastMessageAt)}</span>
                        <span>ID: {session.id.slice(-8)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {selectedSession ? (
            <>
              <CardHeader className="border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {selectedSession.userName || 'Anonymous User'}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedSession.userEmail} • Session: {selectedSession.id.slice(-8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedSession.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(selectedSession.status)}
                        <span className="capitalize">{selectedSession.status}</span>
                      </div>
                    </Badge>
                    {selectedSession.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCloseSession(selectedSession.id)}
                      >
                        Close Session
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex flex-col flex-1 p-0 overflow-hidden">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4 overflow-auto">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === 'agent' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className="flex items-end gap-2 max-w-[80%]">
                          {message.role !== 'agent' && (
                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                              {message.role === 'system' ? (
                                <Bot className="w-4 h-4 text-white" />
                              ) : (
                                <User className="w-4 h-4 text-white" />
                              )}
                            </div>
                          )}
                          
                          <div
                            className={`rounded-lg p-3 ${
                              message.role === 'agent'
                                ? 'bg-primary text-white'
                                : message.role === 'system'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs opacity-70">
                                {formatTime(message.timestamp)}
                              </span>
                              {message.agentName && (
                                <span className="text-xs opacity-70">
                                  {message.agentName}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {message.role === 'agent' && (
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* User Typing Indicator */}
                    {typingUsers.some(user => user.role === 'user' && user.isTyping) && (
                      <div className="flex justify-start">
                        <div className="flex items-end gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                            <div className="flex items-center space-x-1">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              </div>
                              <span className="text-xs text-gray-700 ml-2">User is typing...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                {selectedSession.status === 'active' && (
                  <div className="border-t p-4 flex-shrink-0">
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="self-end flex-shrink-0"
                      >
                        {isSending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center flex-1">
              <div className="text-center text-gray-500">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Chat Session</h3>
                <p>Choose a session from the left to start chatting with customers</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}