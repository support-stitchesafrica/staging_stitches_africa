export interface AgentChatSession {
  id: string;
  sessionId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  status: 'pending' | 'active' | 'closed';
  assignedAgentId?: string;
  assignedAgentEmail?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  metadata: {
    userLocation?: string;
    userAgent?: string;
    referrer?: string;
    chatHistory: AgentChatMessage[];
  };
}

export interface AgentChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
  agentName?: string;
  messageType: 'text' | 'system' | 'handoff';
  metadata?: {
    products?: string[];
    attachments?: string[];
  };
}

export interface UserCredentials {
  userId: string;
  email?: string;
  name?: string;
  phone?: string;
  location?: string;
  preferences?: {
    categories: string[];
    brands: string[];
    priceRange: { min: number; max: number };
  };
  analyticsData: {
    sessionCount: number;
    totalSpent: number;
    lastActive: Date;
    favoriteCategories: string[];
  };
}

export interface AgentProfile {
  id: string;
  email: string;
  name: string;
  role: 'agent' | 'supervisor' | 'admin';
  status: 'online' | 'offline' | 'busy';
  specialties: string[];
  activeSessions: string[];
  maxConcurrentSessions: number;
}

export interface TypingIndicator {
  sessionId: string;
  userId: string;
  role: 'user' | 'agent';
  isTyping: boolean;
  timestamp: Date;
  expiresAt: Date;
}