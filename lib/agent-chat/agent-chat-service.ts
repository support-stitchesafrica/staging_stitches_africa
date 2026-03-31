import { db } from '@/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import type { AgentChatSession, AgentChatMessage, UserCredentials } from '@/types/agent-chat';

export class AgentChatService {
  private static instance: AgentChatService;
  
  static getInstance(): AgentChatService {
    if (!AgentChatService.instance) {
      AgentChatService.instance = new AgentChatService();
    }
    return AgentChatService.instance;
  }

  // Create a new agent chat session
  async createAgentSession(
    sessionId: string,
    userId: string,
    userCredentials?: Partial<UserCredentials>,
    chatHistory: any[] = []
  ): Promise<AgentChatSession> {
    try {
      const sessionData = {
        sessionId,
        userId,
        userEmail: userCredentials?.email || '',
        userName: userCredentials?.name || '',
        userPhone: userCredentials?.phone || '',
        status: 'pending' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        priority: 'medium' as const,
        tags: ['ai-handoff'],
        metadata: {
          userLocation: userCredentials?.location || '',
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
          referrer: typeof window !== 'undefined' ? document.referrer : '',
          chatHistory: chatHistory.map(msg => ({
            id: msg.id,
            sessionId: msg.sessionId || sessionId,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            messageType: 'text' as const
          }))
        }
      };

      const docRef = await addDoc(collection(db, 'staging_agent_chat_sessions'), sessionData);
      
      // Add system message about handoff
      await this.addMessage(docRef.id, {
        role: 'system',
        content: 'User requested to chat with a human agent. AI conversation history has been preserved.',
        messageType: 'handoff'
      });

      return {
        id: docRef.id,
        ...sessionData,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: new Date()
      } as AgentChatSession;
    } catch (error) {
      console.error('Error creating agent session:', error);
      throw new Error('Failed to create agent chat session');
    }
  }

  // Add a message to an agent chat session
  async addMessage(
    sessionId: string, 
    message: {
      role: 'user' | 'agent' | 'system';
      content: string;
      messageType?: 'text' | 'system' | 'handoff';
      agentId?: string;
      agentName?: string;
      metadata?: any;
    }
  ): Promise<AgentChatMessage> {
    try {
      const messageData = {
        sessionId,
        role: message.role,
        content: message.content,
        timestamp: serverTimestamp(),
        messageType: message.messageType || 'text',
        agentId: message.agentId || '',
        agentName: message.agentName || '',
        metadata: message.metadata || {}
      };

      const docRef = await addDoc(collection(db, 'staging_agent_chat_messages'), messageData);
      
      // Update session's last message time
      await updateDoc(doc(db, 'agent_chat_sessions', sessionId), {
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        id: docRef.id,
        ...messageData,
        timestamp: new Date()
      } as AgentChatMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      throw new Error('Failed to add message');
    }
  }

  // Get agent chat session by ID
  async getAgentSession(sessionId: string): Promise<AgentChatSession | null> {
    try {
      const docRef = doc(db, 'staging_agent_chat_sessions', sessionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastMessageAt: data.lastMessageAt?.toDate() || new Date()
        } as AgentChatSession;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting agent session:', error);
      return null;
    }
  }

  // Get messages for an agent chat session
  async getSessionMessages(sessionId: string): Promise<AgentChatMessage[]> {
    try {
      const q = query(
        collection(db, 'staging_agent_chat_messages'),
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as AgentChatMessage[];
    } catch (error) {
      console.error('Error getting session messages:', error);
      return [];
    }
  }

  // Get pending agent sessions
  async getPendingSessions(): Promise<AgentChatSession[]> {
    try {
      const q = query(
        collection(db, 'staging_agent_chat_sessions'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastMessageAt: doc.data().lastMessageAt?.toDate() || new Date()
      })) as AgentChatSession[];
    } catch (error) {
      console.error('Error getting pending sessions:', error);
      return [];
    }
  }

  // Assign session to agent
  async assignSessionToAgent(
    sessionId: string, 
    agentId: string, 
    agentEmail: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'staging_agent_chat_sessions', sessionId), {
        status: 'active',
        assignedAgentId: agentId,
        assignedAgentEmail: agentEmail,
        updatedAt: serverTimestamp()
      });

      // Add system message about assignment
      await this.addMessage(sessionId, {
        role: 'system',
        content: `Agent ${agentEmail} has joined the conversation.`,
        messageType: 'system'
      });
    } catch (error) {
      console.error('Error assigning session to agent:', error);
      throw new Error('Failed to assign session to agent');
    }
  }

  // Close agent session
  async closeSession(sessionId: string, agentId?: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'staging_agent_chat_sessions', sessionId), {
        status: 'closed',
        updatedAt: serverTimestamp()
      });

      // Add system message about closure
      await this.addMessage(sessionId, {
        role: 'system',
        content: 'Chat session has been closed.',
        messageType: 'system',
        agentId
      });
    } catch (error) {
      console.error('Error closing session:', error);
      throw new Error('Failed to close session');
    }
  }

  // Save user credentials for analytics
  async saveUserCredentials(
    userId: string, 
    credentials: Partial<UserCredentials>
  ): Promise<void> {
    try {
      const userRef = doc(db, "staging_user_credentials", userId);
      
      // For unauthenticated users, always try to create a new document
      // Use setDoc without merge to ensure it's treated as a create operation
      const credentialsData = {
        userId,
        email: credentials.email || '',
        name: credentials.name || '',
        phone: credentials.phone || '',
        location: credentials.location || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        analyticsData: {
          sessionCount: 1,
          totalSpent: 0,
          lastActive: serverTimestamp(),
          favoriteCategories: []
        }
      };
      
      await setDoc(userRef, credentialsData);
      
    } catch (error: any) {
      console.error('Error saving user credentials:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      
      // If document already exists, try to update with merge
      if (error?.code === 'permission-denied') {
        try {
          console.log('Retrying with merge option...');
          await setDoc(doc(db, "staging_user_credentials", userId), {
            userId,
            email: credentials.email || '',
            name: credentials.name || '',
            phone: credentials.phone || '',
            location: credentials.location || '',
            updatedAt: serverTimestamp(),
            analyticsData: {
              lastActive: serverTimestamp(),
              sessionCount: 1
            }
          }, { merge: true });
        } catch (mergeError) {
          console.error('Merge operation also failed:', mergeError);
          // Don't throw error - this is not critical for the chat handoff
          console.warn('User credentials could not be saved, but chat handoff will continue');
        }
      } else {
        // Don't throw error - this is not critical for the chat handoff
        console.warn('User credentials could not be saved, but chat handoff will continue');
      }
    }
  }

  // Listen to session messages in real-time
  subscribeToSessionMessages(
    sessionId: string, 
    callback: (messages: AgentChatMessage[]) => void
  ): () => void {
    const q = query(
      collection(db, 'staging_agent_chat_messages'),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as AgentChatMessage[];
      
      callback(messages);
    }, (error) => {
      console.error('Error in message subscription:', error);
    });
  }

  // Listen to session status changes in real-time
  subscribeToSessionUpdates(
    sessionId: string,
    callback: (session: AgentChatSession | null) => void
  ): () => void {
    const sessionRef = doc(db, 'staging_agent_chat_sessions', sessionId);
    
    return onSnapshot(sessionRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const session: AgentChatSession = {
          id: docSnapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastMessageAt: data.lastMessageAt?.toDate() || new Date()
        } as AgentChatSession;
        
        callback(session);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in session subscription:', error);
    });
  }

  // Listen to all sessions in real-time (pending, active, and closed)
  subscribeToAllSessions(
    callback: (sessions: AgentChatSession[]) => void
  ): () => void {
    const q = query(
      collection(db, 'staging_agent_chat_sessions'),
      orderBy('lastMessageAt', 'desc'),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastMessageAt: data.lastMessageAt?.toDate() || new Date()
        };
      }) as AgentChatSession[];
      
      callback(sessions);
    }, (error) => {
      console.error('Error in sessions subscription:', error);
      callback([]);
    });
  }

  // Keep the old method for backward compatibility but make it more robust
  subscribeToPendingSessions(
    callback: (sessions: AgentChatSession[]) => void
  ): () => void {
    return this.subscribeToAllSessions((allSessions) => {
      // Filter to only pending and active sessions
      const pendingSessions = allSessions.filter(session => 
        session.status === 'pending' || session.status === 'active'
      );
      callback(pendingSessions);
    });
  }

  // Set typing indicator
  async setTypingIndicator(
    sessionId: string,
    userId: string,
    isTyping: boolean,
    role: 'user' | 'agent' = 'user'
  ): Promise<void> {
    try {
      const typingRef = doc(db, 'agent_chat_typing', `${sessionId}_${userId}_${role}`);
      
      if (isTyping) {
        await setDoc(typingRef, {
          sessionId,
          userId,
          role,
          isTyping: true,
          timestamp: serverTimestamp(),
          expiresAt: new Date(Date.now() + 10000) // Expires in 10 seconds
        });
      } else {
        await updateDoc(typingRef, {
          isTyping: false,
          timestamp: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
      // Don't throw error as this is not critical
    }
  }

  // Subscribe to typing indicators for a session
  subscribeToTypingIndicators(
    sessionId: string,
    callback: (typingUsers: Array<{userId: string, role: 'user' | 'agent', isTyping: boolean}>) => void
  ): () => void {
    const q = query(
      collection(db, 'staging_agent_chat_typing'),
      where('sessionId', '==', sessionId),
      where('isTyping', '==', true)
    );

    return onSnapshot(q, (snapshot) => {
      const typingUsers = snapshot.docs
        .map(doc => {
          const data = doc.data();
          // Filter out expired typing indicators
          const expiresAt = data.expiresAt?.toDate();
          if (expiresAt && expiresAt < new Date()) {
            return null;
          }
          return {
            userId: data.userId,
            role: data.role,
            isTyping: data.isTyping
          };
        })
        .filter(Boolean) as Array<{userId: string, role: 'user' | 'agent', isTyping: boolean}>;
      
      callback(typingUsers);
    }, (error) => {
      console.error('Error in typing indicators subscription:', error);
    });
  }

  // Send email notification to support
  async notifySupport(sessionId: string, userInfo: any): Promise<void> {
    try {
      await fetch('/api/agent-chat/notify-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userInfo,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error notifying support:', error);
      // Don't throw error as this is not critical for user experience
    }
  }

  // Test method to create a sample session (for debugging)
  async createTestSession(): Promise<void> {
    try {
      const testSession = {
        sessionId: `test_${Date.now()}`,
        userId: `test_user_${Date.now()}`,
        userEmail: 'test@example.com',
        userName: 'Test User',
        status: 'pending' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        priority: 'medium' as const,
        tags: ['test'],
        metadata: {
          userLocation: 'Test Location',
          userAgent: 'Test Browser',
          referrer: '',
          chatHistory: []
        }
      };

      const docRef = await addDoc(collection(db, 'staging_agent_chat_sessions'), testSession);

      // Add a test message
      await this.addMessage(docRef.id, {
        role: 'user',
        content: 'Hello, I need help with my order.',
        messageType: 'text'
      });

    } catch (error) {
      console.error('Error creating test session:', error);
    }
  }
}

export const agentChatService = AgentChatService.getInstance();