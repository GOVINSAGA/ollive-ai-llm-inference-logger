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
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <h1>Inference Logger</h1>
          <span className="version">v1.0</span>
        </div>
      </div>

      {/* Navigation Tabs (Vertical) */}
      <div className="sidebar-nav" style={{ flexDirection: 'column', gap: '8px', padding: '16px' }}>
        <button
          className={`nav-tab ${activeView === 'chat' ? 'active' : ''}`}
          onClick={() => onViewChange('chat')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start' }}
          id="nav-chat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          CHAT
        </button>
        <button
          className={`nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start' }}
          id="nav-dashboard"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          DASHBOARD
        </button>
        <button
          className={`nav-tab ${activeView === 'about' ? 'active' : ''}`}
          onClick={() => onViewChange('about')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start' }}
          id="nav-about"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          ABOUT
        </button>
      </div>

      <div style={{ padding: '0 16px', marginTop: '8px', marginBottom: '8px' }}>
        <button
          className="new-chat-btn"
          onClick={handleNewChat}
          disabled={isCreating}
          id="new-chat-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          {isCreating ? 'Creating...' : 'New Conversation'}
        </button>
      </div>

      {/* Conversation List */}
      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '12px' }}>No conversations</p>
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    </button>
                  )}
                  {conv.status === 'cancelled' && (
                    <button
                      className="conv-action-btn"
                      onClick={(e) => handleResume(e, conv.id)}
                      title="Resume conversation"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </button>
                  )}
                  <button
                    className="conv-action-btn danger"
                    onClick={(e) => handleDelete(e, conv.id)}
                    title="Delete conversation"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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
