import React from 'react';

/**
 * MessageBubble — renders a single chat message with minimalist styling.
 */
export default function MessageBubble({ role, content, isStreaming }) {
  return (
    <div className={`message ${role}`}>
      {role === 'assistant' && (
        <div className="message-avatar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
          </svg>
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '100%' }}>
        {role === 'assistant' && (
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', marginLeft: '4px' }}>
            Llama 3.2
          </div>
        )}
        <div className="message-content">
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: formatContent(content) }} />
          ) : isStreaming ? (
            <div className="loading-dots">
              <span></span><span></span><span></span>
            </div>
          ) : null}
          {isStreaming && content && <span className="streaming-cursor" />}
        </div>
      </div>
    </div>
  );
}

/**
 * Basic markdown-like formatting for chat messages.
 */
function formatContent(text) {
  if (!text) return '';

  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br/>');

  return html;
}
