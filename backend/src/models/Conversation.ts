import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  sender: 'user' | 'ai';
  text: string;
  ts: Date;
}

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  sender: { type: String, enum: ['user', 'ai'], required: true },
  text: { type: String, required: true },
  ts: { type: Date, default: Date.now },
});

const ConversationSchema = new Schema<IConversation>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  title: { type: String, default: 'New Conversation' },
  messages: { type: [MessageSchema], default: [] },
}, { timestamps: true });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
