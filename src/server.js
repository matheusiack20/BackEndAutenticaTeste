"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = require("./routes");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const authController_1 = __importDefault(require("./modules/AuthUser/Controllers/authController"));
const database_1 = require("./config/database");
const plansRoutes_1 = __importDefault(require("./routes/plansRoutes"));
const mongoose_1 = __importDefault(require("mongoose"));
const app = (0, express_1.default)();
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use(body_parser_1.default.json()); // Add this line
app.use(body_parser_1.default.urlencoded({ extended: true }));
// Configurações de CORS
const allowedOrigins = [
    'https://saa-s-create-ads-with-ai-back-end.vercel.app',
    'https://saas-frontend-nuvercelapp.vercel.app',
    'https://autentifica-anunc-ia-eight.vercel.app',
    'https://anuncia.mapmarketplaces.com',
    'https://api.mapmarketplaces.com',
    'https://geradoranuncia.mapmarketplaces.com',
];
const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    methods: allowedMethods,
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
(0, database_1.connectToDatabase)();
(0, database_1.connectToDatabase2)();
app.get('/', (_req, res) => {
    res.json({ message: 'Hello World' });
});
app.use('/auth', authController_1.default);
app.use('/api', plansRoutes_1.default);
app.use(routes_1.router);
// Middleware para capturar erros de rotas não encontradas
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});
// Middleware para capturar erros de banco de dados
app.use((err, req, res, next) => {
    if (err instanceof mongoose_1.default.Error) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
    else {
        next(err);
    }
});
// Middleware para capturar erros não tratados
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).send('Something broke!');
});
const PORT = process.env.PORT || 3000; // Alterar a porta para 3000 ou outra disponível
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
