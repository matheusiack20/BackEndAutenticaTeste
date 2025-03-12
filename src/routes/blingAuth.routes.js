"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blingAuthRouter = void 0;
const express_1 = require("express");
const blingAuthController_1 = require("../modules/blingAuth/controllers/blingAuthController");
const cors_1 = __importDefault(require("cors"));
const blingAuthRouter = (0, express_1.Router)();
exports.blingAuthRouter = blingAuthRouter;
blingAuthRouter.use((0, cors_1.default)());
blingAuthRouter.get('/blingAuth', blingAuthController_1.blingAuth);
blingAuthRouter.get('/callback', blingAuthController_1.callback);
blingAuthRouter.post('/refresh-token', blingAuthController_1.refreshAccessToken);
