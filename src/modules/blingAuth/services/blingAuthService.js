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
exports.refreshTokens = exports.getTokens = void 0;
const axios_1 = __importDefault(require("axios"));
const url_1 = require("url");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = `${process.env.CALLBACK_URL}callback`;
const getTokens = (code) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenUrl = 'https://www.bling.com.br/Api/v3/oauth/token';
    const data = new url_1.URLSearchParams();
    data.append('grant_type', 'authorization_code');
    data.append('redirect_uri', redirectUri);
    data.append('code', code);
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    try {
        const response = yield axios_1.default.post(tokenUrl, data, {
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log('Resposta do Bling:', response.data);
        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
        };
    }
    catch (error) {
        console.log('Erro ao chamar Bling API:', error.response ? error.response.data : error.message);
        throw new Error('Erro ao obter tokens');
    }
});
exports.getTokens = getTokens;
const refreshTokens = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenUrl = 'https://www.bling.com.br/Api/v3/oauth/token';
    const data = new url_1.URLSearchParams();
    data.append('grant_type', 'refresh_token');
    data.append('refresh_token', refreshToken);
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    try {
        const response = yield axios_1.default.post(tokenUrl, data, {
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log('Resposta de renovação do Bling:', response.data);
        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token || refreshToken, // Caso não retorne um novo refreshToken, manter o antigo
        };
    }
    catch (error) {
        console.log('Erro ao renovar o access token:', error.response ? error.response.data : error.message);
        throw new Error('Erro ao renovar o access token');
    }
});
exports.refreshTokens = refreshTokens;
