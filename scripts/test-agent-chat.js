/**
 * Test script for Agent Chat functionality
 * Run this to create test data and verify the system is working
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config (you'll need to replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestSession() {
  try {
    console.log('Creating test agent chat session...');
    
    const testSession = {
      sessionId: `test_${Date.now()}`,
      userId: `test_user_${Date.now()}`,
      userEmail: 'test.user@example.com',
      userName: 'Test User',
      userPhone: '+1234567890',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      priority: 'medium',
      tags: ['test', 'demo'],
      metadata: {
        userLocation: 'Lagos, Nigeria',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        referrer: 'https://stitchesafrica.com',
        chatHistory: []
      }
    };

    const docRef = await addDoc(collection(db, 'agent_chat_sessions'), testSession);
    console.log('Test session created with ID:', docRef.id);

    // Add a test message
    const testMessage = {
      sessionId: docRef.id,
      role: 'user',
      content: 'Hello! I need help with my order. I placed an order yesterday but haven\'t received any confirmation email.',
      timestamp: serverTimestamp(),
      messageType: 'text',
      agentId: '',
      agentName: '',
      metadata: {}
    };

    const messageRef = await addDoc(collection(db, 'agent_chat_messages'), testMessage);
    console.log('Test message created with ID:', messageRef.id);

    // Add another message
    const testMessage2 = {
      sessionId: docRef.id,
      role: 'user',
      content: 'My order number is #SA-2024-001234. Can you please check the status?',
      timestamp: serverTimestamp(),
      messageType: 'text',
      agentId: '',
      agentName: '',
      metadata: {}
    };

    const messageRef2 = await addDoc(collection(db, 'agent_chat_messages'), testMessage2);
    console.log('Second test message created with ID:', messageRef2.id);

    console.log('✅ Test data created successfully!');
    console.log('You should now see the test session in your agent chat dashboard.');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

async function createMultipleTestSessions() {
  const statuses = ['pending', 'active', 'closed'];
  const priorities = ['low', 'medium', 'high'];
  const users = [
    { name: 'Alice Johnson', email: 'alice@example.com', phone: '+1234567890' },
    { name: 'Bob Smith', email: 'bob@example.com', phone: '+1234567891' },
    { name: 'Carol Davis', email: 'carol@example.com', phone: '+1234567892' },
    { name: 'David Wilson', email: 'david@example.com', phone: '+1234567893' },
    { name: 'Eva Brown', email: 'eva@example.com', phone: '+1234567894' }
  ];

  for (let i = 0; i < 5; i++) {
    const user = users[i];
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    
    try {
      const testSession = {
        sessionId: `test_${Date.now()}_${i}`,
        userId: `test_user_${Date.now()}_${i}`,
        userEmail: user.email,
        userName: user.name,
        userPhone: user.phone,
        status: status,
        assignedAgentId: status === 'active' ? 'agent_123' : '',
        assignedAgentEmail: status === 'active' ? 'agent@stitchesafrica.com' : '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        priority: priority,
        tags: ['test', 'demo', status],
        metadata: {
          userLocation: 'Lagos, Nigeria',
          userAgent: 'Mozilla/5.0 (Test Browser)',
          referrer: 'https://stitchesafrica.com',
          chatHistory: []
        }
      };

      const docRef = await addDoc(collection(db, 'agent_chat_sessions'), testSession);
      console.log(`Test session ${i + 1} created with ID: ${docRef.id} (${status})`);

      // Add messages for each session
      const messages = [
        `Hi! I'm ${user.name} and I need help with my order.`,
        'I placed an order but haven\'t received confirmation.',
        'Can you please help me track my order?'
      ];

      for (let j = 0; j < messages.length; j++) {
        const message = {
          sessionId: docRef.id,
          role: 'user',
          content: messages[j],
          timestamp: serverTimestamp(),
          messageType: 'text',
          agentId: '',
          agentName: '',
          metadata: {}
        };

        await addDoc(collection(db, 'agent_chat_messages'), message);
      }

      // Add agent response for active sessions
      if (status === 'active') {
        const agentMessage = {
          sessionId: docRef.id,
          role: 'agent',
          content: `Hello ${user.name}! I'm here to help you with your order. Let me check that for you right away.`,
          timestamp: serverTimestamp(),
          messageType: 'text',
          agentId: 'agent_123',
          agentName: 'Support Agent',
          metadata: {}
        };

        await addDoc(collection(db, 'agent_chat_messages'), agentMessage);
      }

    } catch (error) {
      console.error(`Error creating test session ${i + 1}:`, error);
    }
  }

  console.log('✅ Multiple test sessions created successfully!');
}

// Run the test
if (require.main === module) {
  console.log('🚀 Starting Agent Chat test...');
  createMultipleTestSessions()
    .then(() => {
      console.log('🎉 Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = {
  createTestSession,
  createMultipleTestSessions
};