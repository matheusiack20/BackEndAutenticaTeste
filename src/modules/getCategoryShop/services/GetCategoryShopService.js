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
exports.GetCategoryShopService = void 0;
const axios_1 = __importDefault(require("axios"));
class GetCategoryShopService {
    getCategory(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get('https://api.bling.com.br/Api/v3/categorias/produtos?pagina=1&limite=100', {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `${accessToken}`, // Certifique-se de incluir 'Bearer ' no token se necessário
                    },
                });
                console.log(response.data);
                // Verifica se a resposta foi bem-sucedida (adicionando uma verificação explícita)
                if (response.status >= 200 && response.status < 300) {
                    const data = response.data;
                    // Extraindo as descrições dos produtos
                    const categories = data.data.map(item => ({
                        id: item.id,
                        descricao: item.descricao
                    })).sort((a, b) => a.descricao.localeCompare(b.descricao));
                    return categories;
                }
                else {
                    throw new Error(`Erro na requisição: ${response.statusText}`);
                }
            }
            catch (error) {
                // Se o erro for uma resposta de erro do servidor, você pode acessar mais informações com `error.response`
                const errorMessage = error.response ? `Erro na requisição: ${error.response.statusText}` : error.message;
                throw new Error(`Erro ao buscar categoria de produtos: ${errorMessage}`);
            }
        });
    }
}
exports.GetCategoryShopService = GetCategoryShopService;
