"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductRoute = void 0;
const express_1 = require("express");
const blingCreateProduct_1 = __importDefault(require("../modules/blingCreateProduct/controllers/blingCreateProduct"));
const cors_1 = __importDefault(require("cors"));
const createProductRoute = (0, express_1.Router)();
exports.createProductRoute = createProductRoute;
createProductRoute.use((0, cors_1.default)());
createProductRoute.post('/', blingCreateProduct_1.default);
