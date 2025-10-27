import mongoose, { Schema, Document } from 'mongoose';
import type { DrawnCard, SpreadType } from './tarot.model';

export interface IReading extends Document {
  userId: mongoose.Types.ObjectId;
  question: string;
  spreadType: SpreadType;
  drawnCards: DrawnCard[];
  interpretation: string;
  elementalHarmony: string;
  personalizedAdvice: string;
  aiProvider?: 'gemini' | 'claude';
  createdAt: Date;
}

const ReadingSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  spreadType: {
    type: String,
    enum: ['one-card', 'three-card', 'celtic-cross', 'saju-custom'],
    required: true
  },
  drawnCards: {
    type: Schema.Types.Mixed,
    required: true
  },
  interpretation: {
    type: String,
    required: true
  },
  elementalHarmony: {
    type: String,
    required: true
  },
  personalizedAdvice: {
    type: String,
    required: true
  },
  aiProvider: {
    type: String,
    enum: ['gemini', 'claude']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 인덱스
ReadingSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IReading>('Reading', ReadingSchema);
