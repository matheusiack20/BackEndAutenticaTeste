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
exports.GetProductsController = void 0;
const zod_1 = require("zod");
const GetProductsService_1 = require("../services/GetProductsService");
class GetProductsController {
    handleRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const accessToken = req.headers.authorization;
                const nameProduct = req.query.nameProduct;
                if (!accessToken) {
                    return res.status(401).json({ error: 'Token de acesso não fornecido' });
                }
                if (!nameProduct) {
                    return res.status(400).json({ error: 'Nome do produto não fornecido' });
                }
                const getProductsSchema = zod_1.z.object({
                    nameProduct: zod_1.z.string().min(2),
                });
                const result = getProductsSchema.safeParse({ nameProduct });
                if (!result.success) {
                    return res.status(400).json({
                        error: result.error.issues.map((issue) => ({
                            code: issue.code,
                            message: issue.message,
                            path: issue.path,
                        })),
                    });
                }
                const productService = new GetProductsService_1.GetProductsService();
                const data = yield productService.getProducts(nameProduct, accessToken);
                return res.status(200).json(data);
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ error: 'Failed to get products' });
            }
        });
    }
}
exports.GetProductsController = GetProductsController;
