import jwt from 'jsonwebtoken';
import express, { Request as ExpressRequest, Response } from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import User from '../../../models/User'; // Importe o modelo de usuário do seu microsserviço
import { connectToDatabase, connectToDatabase2 } from '../../../config/database';
import axios from 'axios';

interface Request extends ExpressRequest {
  session: any;
}

session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 dia
  }
});

const router = express.Router();

// Endpoint para verificar o token e liberar o acesso
router.post('/register', async (req: Request & { session: any }, res) => {
  const { email, password, name } = req.body;
  try {
    console.log("Recebendo solicitação de registro para:", email);
    const userDBConnection = await connectToDatabase2();
    const UserModel = userDBConnection.model('User', User.schema);
    const user = await UserModel.findOne({ email: email });
    if (user) {
      console.log("Usuário já existe para:", email);
      return res.status(400).json({ message: 'Usuário já existe. Por favor, faça login.' });
    }
    const newUser = new UserModel({
      email,
      password,
      name,
    });
    await newUser.save();
    console.log("Usuário registrado com sucesso:", email);
    res.json({ message: 'Usuário registrado com sucesso.' });
  }
  catch (error) {
    console.error('Erro durante o registro:', error.message);
    res.status(500).json({ message: 'Erro durante o registro. Por favor, tente novamente.' });
  }
});

router.post('/login', async (req: Request & { session: any }, res: express.Response) => {
  const { email, password } = req.body;

  try {
    const userDBConnection = await connectToDatabase2();
    const UserModel = userDBConnection.model('User', User.schema);
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gerar JWT
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '5h'
    });

    res.cookie("authToken", token, {
      httpOnly: true,  // Impede acesso via JavaScript (proteção contra XSS)
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
      image: user.image || 'path_to_generic_avatar_image',  // Valor genérico se a imagem não estiver disponível
      authToken: token,  // O token gerado
      plan: user.plan,    // Plano do usuário
    });

    return res.status(200).json({
      message: 'Login bem-sucedido',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image || 'path_to_generic_avatar_image',  // Valor genérico se a imagem não estiver disponível
        authToken: token,  // O token gerado
        plan: user.plan,    // Plano do usuário
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro no login. Por favor, tente novamente.' });
  }
});

router.get('/verify-token', async (req: Request & { session: any }, res: Response) => {
  // Recupera o authToken dos headers da requisição
  const authToken = req.headers['authorization']?.split(' ')[1];

  // Verifica se o authToken existe
  if (!authToken) {
    return res.status(401).json({ message: "Token não encontrado" });
  }

  try {
    // Verifica se o token é válido
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!);
    
    const userDBConnection = await connectToDatabase2();
    const UserModel = userDBConnection.model('User', User.schema);
    const user = await UserModel.findOne({ email: decoded.email });

    // Se o token for válido, retorna as informações do usuário
    return res.json({ message: "Token válido", user: user });
  } catch (error) {
    return res.status(401).json({ message: "Token inválido", error: error.message });
  }
});

export default router;