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
exports.refreshTokens = exports.getAccessToken = void 0;
const axios_1 = __importDefault(require("axios"));
const url_1 = require("url");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const clientID = process.env.OLIST_CLIENT_ID;
const clientSecret = process.env.OLIST_CLIENT_SECRET;
const redirectURI = `${process.env.CALLBACK_URL}callback/olist`;
const getAccessToken = (authorizationCode) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenUrl = 'https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token';
    const data = new url_1.URLSearchParams();
    data.append('grant_type', 'authorization_code');
    data.append('redirect_uri', redirectURI);
    data.append('code', authorizationCode);
    const basicAuth = Buffer.from(`${clientID}:${clientSecret}`).toString('base64');
    try {
        const response = yield axios_1.default.post(tokenUrl, data, {
            headers: {
                Authorization: `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        console.log('Resposta da Tiny API:', response.data);
        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
        };
    }
    catch (error) {
        console.error('Erro ao obter os tokens:', error.response ? error.response.data : error.message);
        throw new Error('Erro ao obter os tokens de autenticação');
    }
});
exports.getAccessToken = getAccessToken;
const refreshTokens = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenUrl = 'https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token';
    const data = new url_1.URLSearchParams();
    data.append('grant_type', 'refresh_token');
    data.append('refresh_token', refreshToken);
    const basicAuth = Buffer.from(`${clientID}:${clientSecret}`).toString('base64');
    try {
        const response = yield axios_1.default.post(tokenUrl, data, {
            headers: {
                Authorization: `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token || refreshToken, // Mantém o refresh token atual se um novo não for fornecido
        };
    }
    catch (error) {
        console.error('Erro ao renovar o access token:', error.message);
        throw new Error('Erro ao renovar o access token');
    }
});
exports.refreshTokens = refreshTokens;
