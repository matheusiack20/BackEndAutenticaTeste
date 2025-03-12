import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, unique: true },
  planId: { type: String, required: true },
  planName: { type: String, required: true },
  planAmount: { type: Number, required: true },
  planInterval: { type: String, required: true },
  planIntervalCount: { type: Number, required: true },
  planDescription: { type: String, required: true },
}, { timestamps: true });

export const TokenModel = mongoose.model('Token', tokenSchema);
