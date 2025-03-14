const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middlewares/authMiddleware');
const subscriptionMiddleware = require('../middlewares/subscriptionMiddleware');

// Rota para obter detalhes da assinatura do usuário atual
router.get('/me', 
  authMiddleware, 
  async (req, res) => {
    try {
      const userId = req.user.id;
      const subscriptionDetails = await subscriptionService.getUserSubscriptionDetails(userId);
      
      if (!subscriptionDetails) {
        return res.status(404).json({ 
          message: 'Assinatura não encontrada',
          hasSubscription: false
        });
      }
      
      return res.status(200).json({ 
        subscription: subscriptionDetails,
        hasSubscription: true 
      });
    } catch (error) {
      console.error('Erro ao obter detalhes da assinatura:', error);
      return res.status(500).json({ message: 'Erro ao obter detalhes da assinatura' });
    }
  }
);

// Rota para verificar se o usuário tem assinatura ativa
router.get('/status', 
  authMiddleware, 
  async (req, res) => {
    try {
      const userId = req.user.id;
      const isActive = await subscriptionService.checkUserSubscription(userId);
      
      return res.status(200).json({ 
        active: isActive,
        status: isActive ? 'paid' : 'unpaid'
      });
    } catch (error) {
      console.error('Erro ao verificar status da assinatura:', error);
      return res.status(500).json({ message: 'Erro ao verificar status da assinatura' });
    }
  }
);

// Exemplo de rota protegida que requer assinatura ativa
router.get('/protected-content', 
  authMiddleware, 
  subscriptionMiddleware.requireActiveSubscription,
  (req, res) => {
    res.status(200).json({ message: 'Conteúdo protegido acessado com sucesso' });
  }
);

module.exports = router;
