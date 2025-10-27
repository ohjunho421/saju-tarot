import mongoose, { Schema, Document } from 'mongoose';
import type { BirthInfo, SajuAnalysis } from './saju.model';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  birthInfo: BirthInfo;
  sajuAnalysis: SajuAnalysis;
  createdAt: Date;
  lastLoginAt?: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  birthInfo: {
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    day: { type: Number, required: true },
    hour: { type: Number, required: true },
    isLunar: { type: Boolean, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true }
  },
  sajuAnalysis: {
    type: Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  }
});

// 인덱스 생성
UserSchema.index({ email: 1 });

export default mongoose.model<IUser>('User', UserSchema);
