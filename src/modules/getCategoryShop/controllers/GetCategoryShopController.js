"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCategoryShopController = void 0;
const GetCategoryShopService_1 = require("../services/GetCategoryShopService");
class GetCategoryShopController {
    handleRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const accessToken = req.headers.authorization;
                if (!accessToken) {
                    return res.status(401).json({ error: 'Token de acesso não fornecido' });
                }
                const categoryService = new GetCategoryShopService_1.GetCategoryShopService();
                const data = yield categoryService.getCategory(accessToken);
                return res.status(200).json(data);
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ error: 'Failed to get category' });
            }
        });
    }
}
exports.GetCategoryShopController = GetCategoryShopController;
