"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const tokenSchema = new mongoose_1.default.Schema({
    tokenId: { type: String, required: true, unique: true },
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    planAmount: { type: Number, required: true },
    planInterval: { type: String, required: true },
    planIntervalCount: { type: Number, required: true },
    planDescription: { type: String, required: true },
}, { timestamps: true });
exports.TokenModel = mongoose_1.default.model('Token', tokenSchema);
