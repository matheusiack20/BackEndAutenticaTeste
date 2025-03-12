"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSocketIO = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const router = express_1.default.Router();
router.use(body_parser_1.default.json());
let io;
const setSocketIO = (socketIO) => {
    io = socketIO;
};
exports.setSocketIO = setSocketIO;
router.post('/webhook/pagarme', (req, res) => {
    const event = req.body;
    switch (event.type) {
        case 'subscription.charges_paid':
            console.log('Pagamento confirmado:', event.data);
            // Simule a atualização do status da fatura no banco de dados
            console.log('Atualizando status da fatura no banco de dados...');
            io.emit('payment_status', { status: 'success', message: 'Pagamento confirmado' });
            break;
        case 'subscription.charges_failed':
            console.error('Pagamento falhou:', event.data);
            // Simule a notificação ao usuário sobre a falha no pagamento
            console.log('Notificando usuário sobre a falha no pagamento...');
            io.emit('payment_status', { status: 'failed', message: 'Pagamento falhou' });
            break;
        default:
            console.log('Evento não tratado:', event.type);
    }
    res.status(200).send('Webhook recebido com sucesso');
});
exports.default = router;
