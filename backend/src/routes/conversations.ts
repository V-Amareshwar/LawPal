import express from 'express';
import Conversation from '../models/Conversation';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// List conversations for current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const items = await Conversation.find({ userId }).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, conversations: items.map(c => ({
      id: String(c._id),
      title: c.title,
      date: new Date(c.updatedAt || c.createdAt).toLocaleString(),
      messages: c.messages.map(m => ({ sender: m.sender, text: m.text })),
    })) });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message || 'Server error' });
  }
});

// Create new conversation
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { title } = req.body || {};
    const convo = await Conversation.create({ userId, title: title || 'New Conversation', messages: [] });
    res.status(201).json({ success: true, conversation: { id: String(convo._id), title: convo.title, date: new Date(convo.createdAt).toLocaleString(), messages: [] } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message || 'Server error' });
  }
});

// Rename conversation
router.put('/:id/title', verifyToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { title } = req.body || {};
    if (!title || !String(title).trim()) return res.status(400).json({ success: false, message: 'Title is required' });
    const convo = await Conversation.findOneAndUpdate({ _id: id, userId }, { title }, { new: true });
    if (!convo) return res.status(404).json({ success: false, message: 'Conversation not found' });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message || 'Server error' });
  }
});

// Append message
router.post('/:id/messages', verifyToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { sender, text } = req.body || {};
    if (!sender || !text) return res.status(400).json({ success: false, message: 'sender and text are required' });
    const convo = await Conversation.findOneAndUpdate(
      { _id: id, userId },
      { $push: { messages: { sender, text, ts: new Date() } } },
      { new: true }
    );
    if (!convo) return res.status(404).json({ success: false, message: 'Conversation not found' });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message || 'Server error' });
  }
});

// Message pair deletion endpoint removed per request

// Delete conversation
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const result = await Conversation.findOneAndDelete({ _id: id, userId });
    if (!result) return res.status(404).json({ success: false, message: 'Conversation not found' });
    return res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message || 'Server error' });
  }
});

export default router;
