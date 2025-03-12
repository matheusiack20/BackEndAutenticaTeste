import express, { Request, Response, NextFunction } from 'express';
import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import { router } from './routes';
import bodyParser from 'body-parser';
import cors from 'cors';
import authController from './modules/AuthUser/Controllers/authController';
import protectedRoutes from './modules/AuthUser/Controllers/protectedRoutes';
import { connectToDatabase, connectToDatabase2 } from './config/database';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import plansRoutes from './routes/plansRoutes';
import mongoose from 'mongoose';

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: allowedMethods,
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

connectToDatabase();
connectToDatabase2();

app.get('/', (_req, res) => {
  res.json({ message: 'Hello World' });
});

app.use('/auth', authController);
 app.use('/api', plansRoutes);
app.use(router);

// Middleware para capturar erros de rotas não encontradas
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Middleware para capturar erros de banco de dados
app.use((err: mongoose.Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof mongoose.Error) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  } else {
    next(err);
  }
});

// Middleware para capturar erros não tratados
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});