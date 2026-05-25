import React, { useState } from 'react';
import {
  createConversation,
  updateConversation,
  deleteConversation,
} from '../api/client';

/**
 * Sidebar — conversation list with navigation, CRUD actions, and view switching.
 */
export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onRefresh,
  activeView,
  onViewChange,
}) {
  const [isCreating, setIsCreating] = useState(false);

  const handleNewChat = async () => {
    setIsCreating(true);
    try {
      const conv = await createConversation();
      onRefresh();
      onSelectConversation(conv.id);
      onViewChange('chat');
    } catch (err) {
      console.error('Failed to create conversation:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = async (e, id) => {
    e.stopPropagation();
    try {
      await updateConversation(id, { status: 'cancelled' });
      onRefresh();
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  const handleResume = async (e, id) => {
    e.stopPropagation();
    try {
      await updateConversation(id, { status: 'active' });
      onRefresh();
      onSelectConversation(id);
      onViewChange('chat');
    } catch (err) {
      console.error('Failed to resume:', err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      if (activeConversationId === id) {
        onSelectConversation(null);
      }
      onRefresh();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">✦</div>
          <div>
            <h1>Inference Logger</h1>
          </div>
          <span className="version">v1.0</span>
        </div>
        <button
          className="new-chat-btn"
          onClick={handleNewChat}
          disabled={isCreating}
          id="new-chat-btn"
        >
          <span>+</span>
          {isCreating ? 'Creating...' : 'New Conversation'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="sidebar-nav">
        <button
          className={`nav-tab ${activeView === 'chat' ? 'active' : ''}`}
          onClick={() => onViewChange('chat')}
          id="nav-chat"
        >
          💬 Chat
        </button>
        <button
          className={`nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
          id="nav-dashboard"
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-tab ${activeView === 'about' ? 'active' : ''}`}
          onClick={() => onViewChange('about')}
          id="nav-about"
        >
          🏗️ About
        </button>
      </div>

      {/* Conversation List */}
      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💭</div>
            <h3>No conversations</h3>
            <p>Create a new conversation to get started</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${conv.id === activeConversationId ? 'active' : ''}`}
              onClick={() => {
                onSelectConversation(conv.id);
                onViewChange('chat');
              }}
              id={`conv-${conv.id}`}
            >
              <div className="conv-title">{conv.title || 'New Conversation'}</div>
              <div className="conv-meta">
                <span className={`status-badge ${conv.status}`}>{conv.status}</span>
                <span className="conv-time">{formatTime(conv.updated_at)}</span>
                <div className="conv-actions">
                  {conv.status === 'active' && (
                    <button
                      className="conv-action-btn"
                      onClick={(e) => handleCancel(e, conv.id)}
                      title="Cancel conversation"
                    >
                      ⏸
                    </button>
                  )}
                  {conv.status === 'cancelled' && (
                    <button
                      className="conv-action-btn"
                      onClick={(e) => handleResume(e, conv.id)}
                      title="Resume conversation"
                    >
                      ▶
                    </button>
                  )}
                  <button
                    className="conv-action-btn danger"
                    onClick={(e) => handleDelete(e, conv.id)}
                    title="Delete conversation"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
