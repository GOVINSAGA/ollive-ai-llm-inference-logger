const express = require('express');
const chatService = require('./chat-service');

const router = express.Router();

/**
 * POST /api/conversations — Create a new conversation.
 */
router.post('/', async (req, res) => {
  try {
    const conversation = await chatService.createConversation(req.body.title);
    res.status(201).json(conversation);
  } catch (err) {
    console.error('[Chat] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

/**
 * GET /api/conversations — List all conversations.
 */
router.get('/', async (req, res) => {
  try {
    const conversations = await chatService.listConversations();
    res.json(conversations);
  } catch (err) {
    console.error('[Chat] List error:', err.message);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
});

/**
 * GET /api/conversations/:id — Get conversation with messages.
 */
router.get('/:id', async (req, res) => {
  try {
    const conversation = await chatService.getConversation(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (err) {
    console.error('[Chat] Get error:', err.message);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

/**
 * PATCH /api/conversations/:id — Update conversation (cancel/resume).
 */
router.patch('/:id', async (req, res) => {
  try {
    const updated = await chatService.updateConversation(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Conversation not found' });
    res.json(updated);
  } catch (err) {
    console.error('[Chat] Update error:', err.message);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

/**
 * DELETE /api/conversations/:id — Delete a conversation.
 */
router.delete('/:id', async (req, res) => {
  try {
    await chatService.deleteConversation(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error('[Chat] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

/**
 * POST /api/conversations/:id/messages — Send a message and stream response via SSE.
 */
router.post('/:id/messages', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Handle client disconnect
  req.on('close', () => {
    chatService.cancelRequest(req.params.id);
  });

  try {
    const assistantMsg = await chatService.sendMessage(
      req.params.id,
      message.trim(),
      (token) => {
        // Stream each token to the client via SSE
        res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
      }
    );

    // Send completion event
    res.write(`data: ${JSON.stringify({ type: 'done', message: assistantMsg })}\n\n`);
    res.end();
  } catch (err) {
    console.error('[Chat] Message error:', err.message);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/conversations/:id/cancel — Cancel active streaming.
 */
router.post('/:id/cancel', (req, res) => {
  const cancelled = chatService.cancelRequest(req.params.id);
  res.json({ cancelled });
});

module.exports = router;
