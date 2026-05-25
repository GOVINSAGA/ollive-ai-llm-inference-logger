import React, { useState, useRef, useEffect, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import { sendMessage, cancelConversation } from '../api/client';

/**
 * ChatView — main chat interface with message history and streaming input.
 */
export default function ChatView({ conversation, onMessageSent }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const controllerRef = useRef(null);

  // Sync messages when conversation changes
  useEffect(() => {
    if (conversation?.messages) {
      setMessages(conversation.messages);
    } else {
      setMessages([]);
    }
    setIsStreaming(false);
    setStreamingContent('');
  }, [conversation?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Auto-resize textarea
  const handleInput = useCallback((e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming || !conversation) return;

    const userMessage = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Add user message optimistically
    const userMsg = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userMessage,
    };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingContent('');

    // Stream response
    controllerRef.current = sendMessage(conversation.id, userMessage, {
      onToken: (token) => {
        setStreamingContent(prev => prev + token);
      },
      onDone: (assistantMsg) => {
        setMessages(prev => [
          ...prev,
          {
            id: assistantMsg?.id || 'msg-' + Date.now(),
            role: 'assistant',
            content: assistantMsg?.content || '',
          },
        ]);
        setIsStreaming(false);
        setStreamingContent('');
        if (onMessageSent) onMessageSent();
      },
      onError: (error) => {
        console.error('Stream error:', error);
        setMessages(prev => [
          ...prev,
          {
            id: 'err-' + Date.now(),
            role: 'assistant',
            content: `⚠️ Error: ${error}`,
          },
        ]);
        setIsStreaming(false);
        setStreamingContent('');
      },
    });
  }, [input, isStreaming, conversation, onMessageSent]);

  const handleCancel = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    if (conversation) {
      cancelConversation(conversation.id).catch(() => {});
    }
    if (streamingContent) {
      setMessages(prev => [
        ...prev,
        {
          id: 'cancelled-' + Date.now(),
          role: 'assistant',
          content: streamingContent + '\n\n*[Response cancelled]*',
        },
      ]);
    }
    setIsStreaming(false);
    setStreamingContent('');
  }, [conversation, streamingContent]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  if (!conversation) {
    return (
      <div className="main-content">
        <div className="chat-split-view">
          <div className="chat-main-column">
            <div className="chat-area">
              <div className="chat-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '16px' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>LLM Inference Logger</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Select an existing conversation or create a new one to begin.</p>
              </div>
            </div>
          </div>
          <SidePanel />
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Header */}
      <div className="main-header">
        <h2>{conversation.title || 'New Conversation'}</h2>
        <div className="header-actions">
          <button className="header-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
        </div>
      </div>

      <div className="chat-split-view">
        <div className="chat-main-column">
          {/* Messages */}
          <div className="chat-area">
            {messages.length === 0 && !isStreaming && (
              <div className="chat-empty">
                <p>Type a message below to start chatting with Llama 3.2.</p>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
              />
            ))}

            {isStreaming && (
              <MessageBubble
                role="assistant"
                content={streamingContent}
                isStreaming={true}
              />
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <div className="chat-input-wrapper">
              <button className="action-icon-btn" title="Attach file">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              </button>
              <button className="action-icon-btn" title="Voice input">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
              </button>
              
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={conversation.status === 'cancelled' ? 'Conversation cancelled. Resume to continue...' : 'Message...'}
                disabled={isStreaming || conversation.status === 'cancelled'}
                rows={1}
                id="chat-input"
              />
              
              <button className="action-icon-btn" title="Settings">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </button>

              {isStreaming ? (
                <button className="cancel-btn" onClick={handleCancel} title="Cancel response" id="cancel-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                </button>
              ) : (
                <button
                  className="send-btn"
                  onClick={handleSend}
                  disabled={!input.trim() || conversation.status === 'cancelled'}
                  title="Send message"
                  id="send-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <SidePanel />
      </div>
    </div>
  );
}

function SidePanel() {
  return (
    <div className="chat-side-panel">
      <div className="chat-side-panel-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <h3>LLM Inference Logger</h3>
      </div>
      
      <div className="chat-side-panel-grid">
        <div className="side-feature-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          <h4>Analyze API Performance</h4>
          <p>Analyze the prompt inner performance of API endpoints.</p>
        </div>
        <div className="side-feature-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <h4>Debug Inference Errors</h4>
          <p>Quickly start and debug inference LLM errors.</p>
        </div>
        <div className="side-feature-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <h4>Explore Model Metadata</h4>
          <p>Explore the models and dive into metadata values.</p>
        </div>
        <div className="side-feature-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <h4>Start a New Chat</h4>
          <p>Start a new prompt to test a new conversation.</p>
        </div>
      </div>
    </div>
  );
}
