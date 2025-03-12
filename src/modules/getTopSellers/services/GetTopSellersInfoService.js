"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.fetchDataWithRetry = fetchDataWithRetry;
const axios_1 = __importDefault(require("axios"));
const mongoose_1 = __importStar(require("mongoose"));
const database_1 = require("../../../config/database");
// Conexão com o banco de dados MongoDB
mongoose_1.default.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000, socketTimeoutMS: 45000, })
    .then(() => {
    console.log("Conectado ao MongoDB na base MapTopSeller");
})
    .catch((err) => {
    console.error("Erro ao conectar ao MongoDB:", err.message);
});
// Log de conexão
mongoose_1.default.connection.on("connected", () => {
    console.log("Conectado ao MongoDB na base MapTopSeller");
});
mongoose_1.default.connection.on("error", (err) => {
    console.error("Erro ao conectar ao MongoDB:", err.message);
});
const tokenSchema = new mongoose_1.Schema({
    access_token: { type: String, required: true },
    refresh_token: { type: String, required: true },
}, {
    collection: "MapTopSeller", // Nome fixo da coleção
});
const TokenModel = (0, mongoose_1.model)("MapTopSeller", tokenSchema);
// Função para carregar o token do banco de dados
function loadTokens() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, database_1.connectToDatabase)();
            return yield TokenModel.findOne(); // Carrega o primeiro documento
        }
        catch (err) {
            console.error("Erro ao conectar ao MongoDB:", err.message);
            return null;
        } // Carrega o primeiro documento
    });
}
// Função para salvar ou atualizar os tokens no banco
function saveTokens(tokens) {
    return __awaiter(this, void 0, void 0, function* () {
        const existingTokens = yield loadTokens();
        if (existingTokens) {
            // Atualizar tokens existentes
            existingTokens.access_token = tokens.access_token;
            existingTokens.refresh_token = tokens.refresh_token;
            yield existingTokens.save();
        }
        else {
            // Criar um novo documento com os tokens
            const newToken = new TokenModel(tokens);
            yield newToken.save();
        }
    });
}
// Função para renovar o token de acesso
function renewAccessToken() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const tokens = yield loadTokens();
        if (!tokens) {
            throw new Error("Tokens não encontrados no banco de dados.");
        }
        try {
            const response = yield axios_1.default.post("https://api.mercadolibre.com/oauth/token", null, {
                params: {
                    grant_type: "refresh_token",
                    client_id: process.env.CLIENT_ID_ML,
                    client_secret: process.env.CLIENT_SECRET_ML,
                    refresh_token: tokens.refresh_token,
                },
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            const { access_token, refresh_token } = response.data;
            // Salvar os novos tokens no banco de dados
            yield saveTokens({ access_token, refresh_token });
            return access_token;
        }
        catch (error) {
            console.error("Erro ao renovar o access token:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            throw new Error("Não foi possível renovar o access token.");
        }
    });
}
// Função para buscar dados com renovação de token automática
function fetchDataWithRetry(query_1) {
    return __awaiter(this, arguments, void 0, function* (query, retryCount = 1) {
        var _a;
        try {
            const tokens = yield loadTokens();
            if (!tokens) {
                throw new Error("Tokens não encontrados no banco de dados.");
            }
            let accessToken = tokens.access_token;
            const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&sort=sold_quantity_desc&limit=10`;
            const response = yield axios_1.default.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const filteredResults = response.data.results;
            const titles = [];
            const descriptions = [];
            const allKeywords = new Set();
            yield Promise.all(filteredResults.map((item) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const detailResponse = yield axios_1.default.get(`https://api.mercadolibre.com/items/${item.id}/description`, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });
                    const keywords = item.attributes
                        .filter((attr) => attr.id === "BRAND" || attr.id === "ITEM_CONDITION")
                        .map((attr) => attr.value_name);
                    keywords.forEach((keyword) => allKeywords.add(keyword));
                    titles.push(item.title);
                    descriptions.push(detailResponse.data.plain_text || "Descrição não disponível");
                }
                catch (error) {
                    console.error(`Erro ao obter descrição do item ${item.id}:`, error.message);
                    titles.push(item.title);
                    descriptions.push("Descrição não disponível");
                }
            })));
            return {
                titles,
                descriptions,
                keywords: Array.from(allKeywords),
            };
        }
        catch (error) {
            if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401 && retryCount > 0) {
                console.warn("Token expirado. Tentando renovar...");
                try {
                    yield renewAccessToken();
                    return fetchDataWithRetry(query, retryCount - 1);
                }
                catch (renewError) {
                    console.error("Erro ao renovar o token:", renewError.message);
                    throw new Error("Erro ao renovar o token.");
                }
            }
            throw error;
        }
    });
}
