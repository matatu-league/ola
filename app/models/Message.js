// models/Message.js
import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;

// ─── Conversation ─────────────────────────────────────────────────────────────
const ConversationSchema = new Schema({
  participants: [{
    type:     Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  }],

  lastMessage: {
    text:     { type: String, default: '' },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    sentAt:   { type: Date,   default: null },
    type:     { type: String, default: 'text' },
  },

  unreadCounts: {
    type:    Map,
    of:      Number,
    default: {},
  },

  // Only relatedStore stays on conversation — for filtering seller inbox by store.
  // Product/order references are encoded inside message TEXT, not on the conversation.
  relatedStore: { type: Schema.Types.ObjectId, ref: 'Store', default: null, index: true },

  deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

ConversationSchema.index({ participants: 1, updatedAt: -1 });
ConversationSchema.index({ 'lastMessage.sentAt': -1 });

// ─── Message ──────────────────────────────────────────────────────────────────
// Text-only schema. Product/order references are encoded inside `text` as:
//   [Product: Title|productId|imageUrl]
//   [Order: ORD-001|orderId|total|status|img1,img2,img3]
// The client's parseMessage() extracts these to render preview cards.
const MessageSchema = new Schema({
  conversation: {
    type:     Schema.Types.ObjectId,
    ref:      'Conversation',
    required: true,
    index:    true,
  },
  sender: {
    type:     Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },

  type:    { type: String, enum: ['text', 'image', 'file', 'video', 'system'], default: 'text' },
  text:    { type: String, default: '' },
  fileUrl: { type: String, default: null },
  fileName:{ type: String, default: null },

  readBy: [{
    user:   { type: Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date },
  }],

  deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

MessageSchema.index({ conversation: 1, createdAt: 1 });

export const Conversation = models.Conversation || model('Conversation', ConversationSchema);
export const Message      = models.Message      || model('Message',      MessageSchema);