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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const User_1 = __importDefault(require("../../../models/User")); // Importe o modelo de usuário do seu microsserviço
const database_1 = require("../../../config/database");
(0, express_session_1.default)({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: connect_mongo_1.default.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 dia
    }
});
const router = express_1.default.Router();
// Endpoint para verificar o token e liberar o acesso
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name } = req.body;
    try {
        console.log("Recebendo solicitação de registro para:", email);
        const userDBConnection = yield (0, database_1.connectToDatabase2)();
        const UserModel = userDBConnection.model('User', User_1.default.schema);
        const user = yield UserModel.findOne({ email: email });
        if (user) {
            console.log("Usuário já existe para:", email);
            return res.status(400).json({ message: 'Usuário já existe. Por favor, faça login.' });
        }
        const newUser = new UserModel({
            email,
            password,
            name,
        });
        yield newUser.save();
        console.log("Usuário registrado com sucesso:", email);
        res.json({ message: 'Usuário registrado com sucesso.' });
    }
    catch (error) {
        console.error('Erro durante o registro:', error.message);
        res.status(500).json({ message: 'Erro durante o registro. Por favor, tente novamente.' });
    }
}));
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const userDBConnection = yield (0, database_1.connectToDatabase2)();
        const UserModel = userDBConnection.model('User', User_1.default.schema);
        const user = yield UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }
        // Gerar JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '5h'
        });
        res.cookie("authToken", token, {
            httpOnly: true, // Impede acesso via JavaScript (proteção contra XSS)
            secure: true, // Apenas HTTPS em produção
            sameSite: "none", // Evita vazamento de cookies em requests cross-site
            maxAge: 60 * 60 * 1000, // 1 hora (em milissegundos)
            domain: ".mapmarketplaces.com", // Permite o uso correto do cookie em domínios
        });
        console.log('Cookie setado:', res.cookie);
        console.log('Cookie novo', req.cookies);
        console.log('Dados do usuário:', {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image || 'path_to_generic_avatar_image', // Valor genérico se a imagem não estiver disponível
            authToken: token, // O token gerado
            plan: user.plan, // Plano do usuário
        });
        return res.status(200).json({
            message: 'Login bem-sucedido',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image || 'path_to_generic_avatar_image', // Valor genérico se a imagem não estiver disponível
                authToken: token, // O token gerado
                plan: user.plan, // Plano do usuário
            }
        });
    }
    catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro no login. Por favor, tente novamente.' });
    }
}));
router.get('/verify-token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Recupera o authToken dos headers da requisição
    const authToken = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    // Verifica se o authToken existe
    if (!authToken) {
        return res.status(401).json({ message: "Token não encontrado" });
    }
    try {
        // Verifica se o token é válido
        const decoded = jsonwebtoken_1.default.verify(authToken, process.env.JWT_SECRET);
        const userDBConnection = yield (0, database_1.connectToDatabase2)();
        const UserModel = userDBConnection.model('User', User_1.default.schema);
        const user = yield UserModel.findOne({ email: decoded.email });
        // Se o token for válido, retorna as informações do usuário
        return res.json({ message: "Token válido", user: user });
    }
    catch (error) {
        return res.status(401).json({ message: "Token inválido", error: error.message });
    }
}));
exports.default = router;
