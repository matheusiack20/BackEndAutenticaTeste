import express from 'express';
import VerifyToken  from '../Controllers/authController'; // Importe o middleware de verificação de token

const router = express.Router();

router.use(VerifyToken);

// Rota protegida
router.get('/protected', (req, res) => {
  console.log('Acesso à rota protegida liberado');
  res.json({ message: 'Acesso à rota protegida liberado' });
});

export default router;