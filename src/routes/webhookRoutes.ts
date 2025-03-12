import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';

const router = express.Router();
router.use(bodyParser.json());

let io: Server;

export const setSocketIO = (socketIO: Server) => {
  io = socketIO;
};

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

export default router;
