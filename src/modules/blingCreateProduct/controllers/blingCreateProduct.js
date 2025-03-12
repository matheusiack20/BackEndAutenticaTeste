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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const accessToken = req.headers.authorization;
    const productData = req.body;
    if (!accessToken) {
        return res.status(401).json({ error: 'Access token not found' });
    }
    const url = 'https://bling.com.br/Api/v3/produtos';
    try {
        const response = yield axios_1.default.post(url, productData, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${accessToken}`,
            },
        });
        res.json(response.data);
    }
    catch (error) {
        console.error('Erro ao criar o produto:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        if (error.response) {
            console.error('Status do erro:', error.response.status);
            console.error('Dados da resposta de erro:', ((_c = (_b = error.response.data) === null || _b === void 0 ? void 0 : _b.error) === null || _c === void 0 ? void 0 : _c.fields) || error.response.data);
        }
        res.status(((_d = error.response) === null || _d === void 0 ? void 0 : _d.status) || 500).json({ error: error.message });
    }
});
exports.default = createProduct;
