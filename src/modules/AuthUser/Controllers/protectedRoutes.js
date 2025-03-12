"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = __importDefault(require("../Controllers/authController")); // Importe o middleware de verificação de token
const router = express_1.default.Router();
router.use(authController_1.default);
// Rota protegida
router.get('/protected', (req, res) => {
    console.log('Acesso à rota protegida liberado');
    res.json({ message: 'Acesso à rota protegida liberado' });
});
exports.default = router;
