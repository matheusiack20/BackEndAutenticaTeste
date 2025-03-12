import express from 'express';
import jwt from 'jsonwebtoken';
import { connectOnce } from '../utils/db';
import User from '../models/User';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Recebendo solicitação de login para:", email);
    await connectOnce();
    const user = await User.findUserWithPassword(email, password);

    if (!user) {
      console.log("Usuário não encontrado ou senha incorreta para:", email);
      return res.status(401).json({ message: 'Credenciais inválidas. Por favor, tente novamente.' });
    }

    const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '5h' });

    console.log("Usuário autenticado com sucesso:", email);
    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image || '/Generic_avatar.png',
      authToken,
      plan: user.plan,
    });
  } catch (error) {
    console.error('Erro durante a autorização:', error.message);
    res.status(500).json({ message: 'Erro durante a autorização. Por favor, tente novamente.' });
  }
});

export default router;
