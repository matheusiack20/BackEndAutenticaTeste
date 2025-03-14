const subscriptionService = require('../services/subscriptionService');

/**
 * Salva os dados de assinatura para um usuário
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
exports.saveUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { subscription_id, auth_token, subscription_data } = req.body;

    // Verificar se o usuário da requisição é o mesmo da URL ou se é admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    if (!subscription_id || !auth_token) {
      return res.status(400).json({ message: 'Dados de assinatura incompletos' });
    }

    // Salvar os dados da assinatura
    const updatedUser = await subscriptionService.saveUserSubscription(
      userId, 
      subscription_id, 
      auth_token, 
      subscription_data || {}
    );

    return res.status(200).json({ 
      message: 'Assinatura salva com sucesso', 
      subscription_id: updatedUser.subscription_id,
      subscription_status: updatedUser.subscription_status
    });
  } catch (error) {
    console.error('Erro ao salvar assinatura:', error);
    return res.status(500).json({ message: 'Erro ao salvar assinatura' });
  }
};

/**
 * Obtém os detalhes da assinatura de um usuário
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
exports.getSubscriptionDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar se o usuário da requisição é o mesmo da URL ou se é admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Obter detalhes da assinatura
    const subscriptionDetails = await subscriptionService.getUserSubscriptionDetails(userId);

    if (!subscriptionDetails) {
      return res.status(404).json({ message: 'Assinatura não encontrada' });
    }

    return res.status(200).json(subscriptionDetails);
  } catch (error) {
    console.error('Erro ao obter detalhes da assinatura:', error);
    return res.status(500).json({ message: 'Erro ao obter detalhes da assinatura' });
  }
};

/**
 * Verifica se a assinatura de um usuário está ativa
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
exports.checkSubscriptionStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar se o usuário da requisição é o mesmo da URL ou se é admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Verificar status da assinatura
    const isActive = await subscriptionService.checkUserSubscription(userId);

    return res.status(200).json({ active: isActive });
  } catch (error) {
    console.error('Erro ao verificar status da assinatura:', error);
    return res.status(500).json({ message: 'Erro ao verificar status da assinatura' });
  }
};
