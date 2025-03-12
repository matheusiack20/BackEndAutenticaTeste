"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategory = void 0;
const express_1 = require("express");
const cors_1 = __importDefault(require("cors"));
const GetCategoryShopController_1 = require("../modules/getCategoryShop/controllers/GetCategoryShopController");
const getCategory = (0, express_1.Router)();
exports.getCategory = getCategory;
const getCategoryShopController = new GetCategoryShopController_1.GetCategoryShopController();
getCategory.use((0, cors_1.default)());
getCategory.get('/', getCategoryShopController.handleRequest);
