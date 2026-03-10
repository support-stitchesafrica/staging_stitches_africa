'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/firebase';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

interface AgentUser {
  uid: string;
  email: string;
  name: string;
  role: 'agent' | 'super_agent' | 'admin';
  permissions: string[];
  isActive: boolean;
  territory?: string;
  assignedTailors?: string[];
}

interface AgentAuthContextType {
  user: User | null;
  agentData: AgentUser | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  isAgent: boolean;
  signOut: () => Promise<void>;
}

const AgentAuthContext = createContext<AgentAuthContextType | undefined>(undefined);

export const useAgentAuth = () => {
  const context = useContext(AgentAuthContext);
  if (context === undefined) {
    throw new Error('useAgentAuth must be used within an AgentAuthProvider');
  }
  return context;
};

export const AgentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [agentData, setAgentData] = useState<AgentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }
    
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        // Check if email is allowed
        if (user.email !== 'agent@stitchesafrica.com') {
          console.log('Unauthorized email:', user.email);
          await auth.signOut();
          setAgentData(null);
          setLoading(false);
          return;
        }

        try {
          // Parallel fetch for better performance
          const [agentDoc, userDoc] = await Promise.all([
            getDoc(doc(db, 'agents', user.uid)),
            getDoc(doc(db, 'staging_users', user.uid))
          ]);
          
          if (agentDoc.exists()) {
            const data = agentDoc.data();
            setAgentData({
              uid: user.uid,
              email: user.email || '',
              name: data.name || user.displayName || '',
              role: data.role || 'agent',
              permissions: data.permissions || ['view_products', 'create_products', 'edit_products', 'view_tailors', 'manage_tailors'],
              isActive: data.isActive !== false,
              territory: data.territory,
              assignedTailors: data.assignedTailors || []
            });
          } else if (userDoc.exists() && userDoc.data().role === 'agent') {
            setAgentData({
              uid: user.uid,
              email: user.email || '',
              name: userDoc.data().name || user.displayName || '',
              role: 'agent',
              permissions: ['view_products', 'create_products', 'edit_products', 'view_tailors', 'manage_tailors'],
              isActive: true
            });
          } else {
            setAgentData(null);
          }
        } catch (error) {
          console.error('Error fetching agent data:', error);
          setAgentData(null);
        }
      } else {
        setAgentData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const hasPermission = (permission: string): boolean => {
    if (!agentData) return false;
    if (agentData.role === 'admin') return true;
    return agentData.permissions.includes(permission);
  };

  const isAgent = !!agentData && agentData.isActive;

  const signOut = async () => {
    await auth.signOut();
  };

  const value: AgentAuthContextType = {
    user,
    agentData,
    loading,
    hasPermission,
    isAgent,
    signOut
  };

  return (
    <AgentAuthContext.Provider value={value}>
      {children}
    </AgentAuthContext.Provider>
  );
};