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
exports.GetProductsService = void 0;
const axios_1 = __importDefault(require("axios"));
class GetProductsService {
    getProducts(nameProduct, accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`https://api.bling.com.br/Api/v3/produtos?pagina=1&limite=15&criterio=2&tipo=P&nome=${nameProduct}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `${accessToken}`, // Certifique-se de incluir 'Bearer ' no token se necessário
                    },
                });
                // Verifica se a resposta foi bem-sucedida (axios lança erro para respostas com status >= 400 automaticamente)
                if (response.status >= 200 && response.status < 300) {
                    return response.data;
                }
                else {
                    throw new Error(`Erro ao realizar requisição: ${response.statusText}`);
                }
            }
            catch (error) {
                const errorMessage = error.response ? `Erro ao realizar requisição: ${error.response.statusText}` : error.message;
                throw new Error(`Erro ao buscar produtos: ${errorMessage}`);
            }
        });
    }
}
exports.GetProductsService = GetProductsService;
