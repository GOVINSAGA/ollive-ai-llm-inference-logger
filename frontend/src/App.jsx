import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import Dashboard from './components/Dashboard';
import About from './components/About';
import { listConversations, getConversation } from './api/client';

/**
 * App — root layout with sidebar navigation and view switching.
 */
export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeView, setActiveView] = useState('chat'); // 'chat' | 'dashboard' | 'about'

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await listConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, []);

  // Load active conversation details
  const loadConversation = useCallback(async (id) => {
    if (!id) {
      setActiveConversation(null);
      return;
    }
    try {
      const data = await getConversation(id);
      setActiveConversation(data);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setActiveConversation(null);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load conversation when selection changes
  useEffect(() => {
    loadConversation(activeConversationId);
  }, [activeConversationId, loadConversation]);

  const handleSelectConversation = useCallback((id) => {
    setActiveConversationId(id);
  }, []);

  const handleMessageSent = useCallback(() => {
    // Refresh conversations list (for updated title/time)
    loadConversations();
    // Refresh current conversation
    if (activeConversationId) {
      loadConversation(activeConversationId);
    }
  }, [activeConversationId, loadConversations, loadConversation]);

  return (
    <div className="app-layout">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onRefresh={loadConversations}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {activeView === 'dashboard' ? (
        <Dashboard />
      ) : activeView === 'about' ? (
        <About />
      ) : (
        <ChatView
          conversation={activeConversation}
          onMessageSent={handleMessageSent}
        />
      )}
    </div>
  );
}
