const subscriptionService = require('../services/subscriptionService');

/**
 * Middleware para verificar se o usuário tem uma assinatura ativa
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Função next do Express
 */
exports.requireActiveSubscription = async (req, res, next) => {
  try {
    // Verificar se o usuário está autenticado e se req.user existe
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const userId = req.user.id;
    
    // Verificar se o usuário tem uma assinatura ativa
    const isSubscriptionActive = await subscriptionService.checkUserSubscription(userId);
    
    if (!isSubscriptionActive) {
      return res.status(403).json({ 
        message: 'Acesso negado. Assinatura pendente.',
        code: 'subscription_required'
      });
    }

    // Usuário tem assinatura ativa, continuar
    next();
  } catch (error) {
    console.error('Erro ao verificar assinatura do usuário:', error);
    return res.status(500).json({ message: 'Erro ao verificar status da assinatura' });
  }
};

/**
 * Middleware para anexar o status da assinatura ao request sem bloquear
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Função next do Express
 */
exports.attachSubscriptionStatus = async (req, res, next) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.user || !req.user.id) {
      req.hasActiveSubscription = false;
      return next();
    }

    const userId = req.user.id;
    
    // Verificar se o usuário tem uma assinatura ativa
    const isSubscriptionActive = await subscriptionService.checkUserSubscription(userId);
    
    // Anexar o status ao objeto req para uso nas rotas
    req.hasActiveSubscription = isSubscriptionActive;
    
    next();
  } catch (error) {
    console.error('Erro ao verificar assinatura do usuário:', error);
    req.hasActiveSubscription = false;
    next();
  }
};
