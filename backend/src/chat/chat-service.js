const db = require('../db');
const LLMClient = require('../sdk/llm-client');
const { v4: uuidv4 } = require('uuid');

const llmClient = new LLMClient('nvidia');

// Track active AbortControllers by conversation ID
const activeRequests = new Map();

class ChatService {
  /**
   * Create a new conversation.
   */
  async createConversation(title) {
    const [conversation] = await db('conversations')
      .insert({ title: title || 'New Conversation' })
      .returning('*');
    return conversation;
  }

  /**
   * List all conversations, ordered by most recent.
   */
  async listConversations() {
    const conversations = await db('conversations')
      .orderBy('updated_at', 'desc');

    // Attach message count and last message preview
    for (const conv of conversations) {
      const [{ count }] = await db('messages')
        .where('conversation_id', conv.id)
        .count('id as count');
      conv.messageCount = parseInt(count);

      const lastMsg = await db('messages')
        .where('conversation_id', conv.id)
        .orderBy('created_at', 'desc')
        .first();
      conv.lastMessage = lastMsg ? lastMsg.content.substring(0, 100) : null;
    }

    return conversations;
  }

  /**
   * Get a conversation with all its messages.
   */
  async getConversation(id) {
    const conversation = await db('conversations').where('id', id).first();
    if (!conversation) return null;

    const messages = await db('messages')
      .where('conversation_id', id)
      .orderBy('created_at', 'asc');

    return { ...conversation, messages };
  }

  /**
   * Update conversation status (cancel/resume/complete).
   */
  async updateConversation(id, updates) {
    // If cancelling, abort any active request
    if (updates.status === 'cancelled') {
      const controller = activeRequests.get(id);
      if (controller) {
        controller.abort();
        activeRequests.delete(id);
      }
    }

    const [updated] = await db('conversations')
      .where('id', id)
      .update({ ...updates, updated_at: new Date() })
      .returning('*');

    return updated;
  }

  /**
   * Delete a conversation and all associated data.
   */
  async deleteConversation(id) {
    // Abort any active request
    const controller = activeRequests.get(id);
    if (controller) {
      controller.abort();
      activeRequests.delete(id);
    }

    await db('conversations').where('id', id).del();
  }

  /**
   * Send a message and stream the LLM response.
   * @param {string} conversationId
   * @param {string} userMessage
   * @param {function} onToken - Callback for each streamed token
   * @returns {Promise<Object>} The assistant message record
   */
  async sendMessage(conversationId, userMessage, onToken) {
    // Check conversation exists and is active
    const conversation = await db('conversations').where('id', conversationId).first();
    if (!conversation) throw new Error('Conversation not found');
    if (conversation.status === 'cancelled') throw new Error('Conversation is cancelled');

    // Resume if needed
    if (conversation.status !== 'active') {
      await db('conversations')
        .where('id', conversationId)
        .update({ status: 'active', updated_at: new Date() });
    }

    // Save user message
    const [userMsg] = await db('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: userMessage,
      })
      .returning('*');

    // Build context (last 20 messages for context window)
    const contextMessages = await db('messages')
      .where('conversation_id', conversationId)
      .orderBy('created_at', 'desc')
      .limit(20);

    const llmMessages = contextMessages.reverse().map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Add system prompt at the beginning
    llmMessages.unshift({
      role: 'system',
      content: 'You are a helpful, knowledgeable AI assistant. Provide clear, concise, and accurate responses. Use markdown formatting when appropriate.',
    });

    // Create assistant message placeholder
    const assistantMsgId = uuidv4();

    // Create AbortController for cancellation
    const abortController = new AbortController();
    activeRequests.set(conversationId, abortController);

    try {
      const result = await llmClient.chatStream({
        messages: llmMessages,
        conversationId,
        messageId: assistantMsgId,
        abortController,
        onToken,
      });

      // Save assistant message
      const [assistantMsg] = await db('messages')
        .insert({
          id: assistantMsgId,
          conversation_id: conversationId,
          role: 'assistant',
          content: result.content || '[No response]',
        })
        .returning('*');

      // Auto-generate title from first exchange
      if (conversation.title === 'New Conversation' && userMessage.length > 0) {
        const title = userMessage.substring(0, 60) + (userMessage.length > 60 ? '...' : '');
        await db('conversations')
          .where('id', conversationId)
          .update({ title, updated_at: new Date() });
      } else {
        await db('conversations')
          .where('id', conversationId)
          .update({ updated_at: new Date() });
      }

      return assistantMsg;
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || abortController.signal.aborted) {
        // Save partial response if any
        return { id: assistantMsgId, role: 'assistant', content: '[Cancelled]', cancelled: true };
      }
      throw err;
    } finally {
      activeRequests.delete(conversationId);
    }
  }

  /**
   * Cancel an active streaming request for a conversation.
   */
  cancelRequest(conversationId) {
    const controller = activeRequests.get(conversationId);
    if (controller) {
      controller.abort();
      activeRequests.delete(conversationId);
      return true;
    }
    return false;
  }
}

module.exports = new ChatService();
