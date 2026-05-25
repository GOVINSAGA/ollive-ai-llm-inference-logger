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
        <div className="chat-area">
          <div className="chat-empty">
            <div className="empty-icon">✦</div>
            <h3>LLM Inference Logger</h3>
            <p>Start a new conversation or select an existing one from the sidebar to begin chatting.</p>
          </div>
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
          <span className={`status-badge ${conversation.status}`}>
            {conversation.status}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-area">
        {messages.length === 0 && !isStreaming && (
          <div className="chat-empty">
            <div className="empty-icon">💬</div>
            <h3>Start the conversation</h3>
            <p>Type a message below to start chatting with the AI assistant.</p>
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
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={conversation.status === 'cancelled' ? 'Conversation cancelled. Resume to continue...' : 'Type your message... (Shift+Enter for new line)'}
            disabled={isStreaming || conversation.status === 'cancelled'}
            rows={1}
            id="chat-input"
          />
          {isStreaming ? (
            <button className="cancel-btn" onClick={handleCancel} title="Cancel response" id="cancel-btn">
              ■
            </button>
          ) : (
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || conversation.status === 'cancelled'}
              title="Send message"
              id="send-btn"
            >
              ↑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
