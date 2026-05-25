import React from 'react';

/**
 * MessageBubble — renders a single chat message with avatar and styling.
 */
export default function MessageBubble({ role, content, isStreaming }) {
  return (
    <div className={`message ${role}`}>
      <div className="message-avatar">
        {role === 'user' ? 'U' : '✦'}
      </div>
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
