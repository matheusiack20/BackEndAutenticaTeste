"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEventConversionRouter = void 0;
const express_1 = require("express");
const cors_1 = __importDefault(require("cors"));
const ConversionAPIController_1 = require("../modules/ConversionAPI/controllers/ConversionAPIController");
const sendEventConversionRouter = (0, express_1.Router)();
exports.sendEventConversionRouter = sendEventConversionRouter;
const postEventConversionAPIController = new ConversionAPIController_1.PostEventConversionAPIController();
sendEventConversionRouter.use((0, cors_1.default)());
sendEventConversionRouter.post('/api/track-event/', postEventConversionAPIController.handleRequest);
