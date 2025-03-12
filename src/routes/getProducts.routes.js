"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducts = void 0;
const express_1 = require("express");
const cors_1 = __importDefault(require("cors"));
const GetProductsController_1 = require("../modules/getProducts/controllers/GetProductsController");
const getProducts = (0, express_1.Router)();
exports.getProducts = getProducts;
const getProductsController = new GetProductsController_1.GetProductsController();
getProducts.use((0, cors_1.default)());
getProducts.get('/', getProductsController.handleRequest);
