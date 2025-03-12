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
exports.refreshOlistAccessToken = exports.getOlistTokens = exports.requestOlistAuthorization = void 0;
const olistAuthService_1 = require("../services/olistAuthService");
const clientID = process.env.OLIST_CLIENT_ID;
const redirectURI = `${process.env.CALLBACK_URL}callback/olist`;
const requestOlistAuthorization = (req, res) => {
    const authorizationURL = `https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/auth?client_id=${clientID}&redirect_uri=${redirectURI}&scope=openid&response_type=code`;
    res.redirect(authorizationURL);
};
exports.requestOlistAuthorization = requestOlistAuthorization;
const getOlistTokens = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const code = req.query.code;
    if (!code) {
        return res.send('Nenhum código de autorização fornecido.');
    }
    try {
        const tokens = yield (0, olistAuthService_1.getAccessToken)(code);
        res.redirect(`${process.env.FRONTEND_CALLBACK}?olistAccessToken=${tokens.accessToken}&olistRefreshToken=${tokens.refreshToken}`);
    }
    catch (error) {
        console.log('Erro ao obter tokens:', error.message);
        res.status(500).send(`Erro ao obter tokens: ${error.message}`);
    }
});
exports.getOlistTokens = getOlistTokens;
const refreshOlistAccessToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).send('Nenhum refresh token fornecido');
    }
    try {
        const tokens = yield (0, olistAuthService_1.refreshTokens)(refreshToken);
        res.json(tokens);
    }
    catch (error) {
        res.status(500).send(error.message);
    }
});
exports.refreshOlistAccessToken = refreshOlistAccessToken;
