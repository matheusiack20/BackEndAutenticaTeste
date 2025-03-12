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
exports.refreshAccessToken = exports.callback = exports.blingAuth = void 0;
const blingAuthService_1 = require("../services/blingAuthService");
const blingAuth = (req, res) => {
    const authorizationUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&state=a0424e40c7c59fd35040c25b396ee96c`;
    res.redirect(authorizationUrl);
};
exports.blingAuth = blingAuth;
const callback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const code = req.query.code;
    if (!code) {
        return res.send('Nenhum código de autorização fornecido.');
    }
    try {
        const tokens = yield (0, blingAuthService_1.getTokens)(code);
        // redirecionar para o front-end com os tokens como parâmetros de URL
        res.redirect(`${process.env.FRONTEND_CALLBACK}?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
    }
    catch (error) {
        console.log('Erro ao obter tokens:', error.message);
        res.status(500).send(`Erro ao obter tokens: ${error.message}`);
    }
});
exports.callback = callback;
const refreshAccessToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
    }
    try {
        const tokens = yield (0, blingAuthService_1.refreshTokens)(refreshToken);
        res.json(tokens); // Retorna os novos tokens para o front-end
    }
    catch (error) {
        console.log('Erro ao renovar access token:', error.message);
        res.status(500).send(`Erro ao renovar access token: ${error.message}`);
    }
});
exports.refreshAccessToken = refreshAccessToken;
