import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import webhookRoutes, { setSocketIO } from './routes/webhookRoutes';
import plansRoutes from './routes/plansRoutes';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
  path: '/socket.io',
});

setSocketIO(io);

app.use(express.json());
app.use('/api', plansRoutes);
app.use('/webhook', webhookRoutes);

io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default server;
