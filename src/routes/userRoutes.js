const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas existentes
// ...

// Rota para obter dados do usuário atual (protegida por autenticação)
router.get('/current', authMiddleware, userController.getCurrentUser);

// Rota para obter dados do plano do usuário atual
router.get('/plan', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userService = require('../services/userService');
    
    // Obter detalhes do plano do usuário
    const planDetails = await userService.getUserPlanDetails(userId);
    
    res.status(200).json({
      success: true,
      plan: planDetails
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do plano:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar detalhes do plano',
      error: error.message
    });
  }
});

module.exports = router;
