const axios = require('axios');
const User = require('../models/User');
const mongoose = require('mongoose');

// Base URL para API do Pagar.me
const PAGARME_API_URL = 'https://api.pagar.me/core/v5';

// Importar a conexão secundária
const database = require('../config/database');
let secondaryConnection = null;

// Função para inicializar a conexão secundária (lazy loading)
async function getSecondaryConnection() {
  if (!secondaryConnection) {
    secondaryConnection = await database.connectToDatabase2();
  }
  return secondaryConnection;
}

/**
 * Mapeia os status do Pagar.me para os status internos
 * @param {string} pagarmeStatus - Status da assinatura no Pagar.me
 * @returns {string} Status interno correspondente
 */
function mapSubscriptionStatus(pagarmeStatus) {
  const statusMap = {
    'paid': 'paid',
    'active': 'paid', // Mapeamos 'active' para 'paid' em nosso sistema
    'unpaid': 'unpaid',
    'pending': 'unpaid',
    'canceled': 'canceled',
    'ended': 'expired',
    'expired': 'expired'
  };
  
  return statusMap[pagarmeStatus] || 'inactive';
}

/**
 * Salva os dados de assinatura para um usuário
 * @param {string} userId - ID do usuário
 * @param {string} subscriptionId - ID da assinatura no Pagar.me
 * @param {string} authToken - Token de autenticação da assinatura
 * @param {Object} subscriptionData - Dados adicionais da assinatura
 * @returns {Promise<Object>} Usuário atualizado (sem o auth_token)
 */
exports.saveUserSubscription = async (userId, subscriptionId, authToken, subscriptionData = {}) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('ID de usuário inválido');
    }
    
    if (!subscriptionId) {
      throw new Error('ID de assinatura não fornecido');
    }
    
    // Preparar dados para atualização
    const updateData = {
      subscription_id: subscriptionId,
      auth_token: authToken,
      subscription_status: 'paid', // Usar valor consistente com o enum
      updated_at: new Date(),
      last_payment_date: new Date()
    };
    
    // Adicionar campos extras se fornecidos
    if (subscriptionData.plan_id) updateData.plan_id = subscriptionData.plan_id;
    if (subscriptionData.plan_name) updateData.plan_name = subscriptionData.plan_name;
    if (subscriptionData.plan_interval) updateData.plan_interval = subscriptionData.plan_interval;
    if (subscriptionData.plan) updateData.plan = subscriptionData.plan;
    if (subscriptionData.price) updateData.subscription_price = subscriptionData.price;
    if (subscriptionData.expiry_date) updateData.subscription_expires_at = subscriptionData.expiry_date;
    if (subscriptionData.next_payment_date) updateData.next_payment_date = subscriptionData.next_payment_date;
    
    // Obter conexão secundária para myDatabase
    const secondConn = await getSecondaryConnection();
    const SecondaryUser = secondConn.model('User', require('../models/User').schema);
    
    console.log(`Atualizando assinatura na base secundária (myDatabase) para usuário ${userId}`);
    
    // Primeiro verificar se o usuário existe na base secundária
    let secondaryUser = await SecondaryUser.findById(userId);
    
    // Se não existir, buscar na base principal e criar na secundária
    if (!secondaryUser) {
      console.log('Usuário não encontrado na base secundária. Verificando na base principal...');
      
      // Verificar na base principal
      const User = require('../models/User');
      const mainUser = await User.findById(userId);
      
      if (mainUser) {
        // Copiar para a base secundária
        const userData = mainUser.toObject();
        delete userData._id; // Remover _id para que o MongoDB gere um novo
        
        // Aplicar os dados de atualização
        Object.assign(userData, updateData);
        
        // Criar na base secundária
        secondaryUser = await new SecondaryUser(userData).save();
        console.log(`Usuário criado na base secundária com ID: ${secondaryUser._id}`);
      } else {
        throw new Error('Usuário não encontrado em nenhuma base de dados');
      }
    } else {
      // Atualizar usuário existente na base secundária
      secondaryUser = await SecondaryUser.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true }
      );
    }
    
    // Tentar atualizar também na base principal para manter consistência
    try {
      const User = require('../models/User');
      await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true }
      );
      console.log('Assinatura também atualizada na base principal');
    } catch (mainDbError) {
      console.warn('⚠️ Não foi possível atualizar na base principal:', mainDbError.message);
      // Continuamos mesmo se falhar na base principal
    }
    
    if (!secondaryUser) {
      throw new Error('Usuário não encontrado após tentativa de atualização');
    }
    
    // Remover informações sensíveis antes de retornar
    const returnUser = secondaryUser.toObject();
    delete returnUser.auth_token;
    
    return returnUser;
  } catch (error) {
    console.error('Erro ao salvar assinatura do usuário:', error);
    throw error;
  }
};

/**
 * Atualiza o status de assinatura do usuário
 * @param {string} subscriptionId - ID da assinatura no Pagar.me
 * @param {string} status - Novo status da assinatura
 * @returns {Promise<Object>} Usuário atualizado ou null se não encontrado
 */
exports.updateSubscriptionStatus = async (subscriptionId, status) => {
  try {
    if (!subscriptionId) throw new Error('ID da assinatura não fornecido');
    if (!status) throw new Error('Status da assinatura não fornecido');

    // Mapear status do Pagar.me para o status interno do sistema
    const mappedStatus = mapSubscriptionStatus(status);

    const updateData = {
      subscription_status: mappedStatus,
      updated_at: new Date()
    };

    // Se o status for 'paid', atualizar a data do último pagamento
    if (mappedStatus === 'paid') {
      updateData.last_payment_date = new Date();
    }

    // Atualizar o usuário no banco de dados
    const updatedUser = await User.findOneAndUpdate(
      { subscription_id: subscriptionId },
      { $set: updateData },
      { 
        new: true,
        select: '-auth_token' // Nunca retornar o auth_token
      }
    );

    if (!updatedUser) {
      console.warn(`Assinatura não encontrada: ${subscriptionId}`);
      return null;
    }

    console.log(`Status da assinatura atualizado: ${subscriptionId} -> ${mappedStatus}`);
    return updatedUser;
  } catch (error) {
    console.error('Erro ao atualizar status da assinatura:', error);
    throw error;
  }
};

/**
 * Obtém os detalhes da assinatura de um usuário diretamente da API do Pagar.me
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object|null>} Detalhes da assinatura ou null se não encontrada
 */
exports.getUserSubscriptionDetails = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('ID de usuário inválido');
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Extrair detalhes da assinatura do usuário
    return {
      subscription_id: user.subscription_id,
      subscription_status: user.subscription_status,
      plan_id: user.plan_id,
      plan_name: user.plan_name,
      plan_interval: user.plan_interval,
      subscription_price: user.subscription_price,
      created_at: user.subscription_created_at,
      expires_at: user.subscription_expires_at,
      last_payment_date: user.last_payment_date,
      next_payment_date: user.next_payment_date,
      plan: user.plan
    };
  } catch (error) {
    console.error('Erro ao obter detalhes da assinatura do usuário:', error);
    throw error;
  }
};

/**
 * Verifica se a assinatura do usuário está paga
 * @param {string} userId - ID do usuário
 * @returns {Promise<boolean>} true se a assinatura estiver paga, false caso contrário
 */
exports.checkUserSubscription = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('ID de usuário inválido');
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Verificar se o usuário tem uma assinatura e se ela está ativa
    return user.subscription_status === 'paid';
  } catch (error) {
    console.error('Erro ao verificar assinatura do usuário:', error);
    return false;
  }
};

/**
 * Atualiza a data de expiração de uma assinatura
 * @param {string} subscriptionId - ID da assinatura no Pagar.me
 * @param {Date} expiryDate - Nova data de expiração
 * @returns {Promise<Object>} Usuário atualizado ou null se não encontrado
 */
exports.updateSubscriptionExpiry = async (subscriptionId, expiryDate) => {
  try {
    if (!subscriptionId) throw new Error('ID da assinatura não fornecido');
    if (!expiryDate) throw new Error('Data de expiração não fornecida');

    // Validar se expiryDate é um objeto Date válido
    if (!(expiryDate instanceof Date) || isNaN(expiryDate)) {
      throw new Error('Data de expiração inválida');
    }

    const updateData = {
      subscription_expires_at: expiryDate,
      updated_at: new Date()
    };

    // Obter conexão secundária para myDatabase
    const secondConn = await getSecondaryConnection();
    const SecondaryUser = secondConn.model('User', require('../models/User').schema);

    // Atualizar na base secundária
    const secondaryUser = await SecondaryUser.findOneAndUpdate(
      { subscription_id: subscriptionId },
      { $set: updateData },
      { new: true }
    );

    // Se encontrou na base secundária, atualizar também na base principal
    if (secondaryUser) {
      try {
        const User = require('../models/User');
        await User.findByIdAndUpdate(
          secondaryUser._id,
          { $set: updateData }
        );
        console.log('Data de expiração atualizada em ambas as bases de dados');
      } catch (error) {
        console.warn('⚠️ Não foi possível atualizar data de expiração na base principal:', error.message);
      }
      return secondaryUser;
    }

    // Se não encontrou na base secundária, tentar diretamente na base principal
    const User = require('../models/User');
    const updatedUser = await User.findOneAndUpdate(
      { subscription_id: subscriptionId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      console.warn(`Não foi possível encontrar assinatura: ${subscriptionId}`);
      return null;
    }

    return updatedUser;
  } catch (error) {
    console.error('Erro ao atualizar data de expiração da assinatura:', error);
    throw error;
  }
};

/**
 * Atualiza a data do último pagamento de uma assinatura
 * @param {string} subscriptionId - ID da assinatura
 * @param {Date} paymentDate - Data do pagamento
 * @returns {Promise<Object>} Usuário atualizado ou null se não encontrado
 */
exports.updateLastPaymentDate = async (subscriptionId, paymentDate) => {
  try {
    if (!subscriptionId) throw new Error('ID da assinatura não fornecido');
    if (!paymentDate) throw new Error('Data de pagamento não fornecida');

    // Validar se paymentDate é um objeto Date válido
    if (!(paymentDate instanceof Date) || isNaN(paymentDate)) {
      throw new Error('Data de pagamento inválida');
    }

    const updateData = {
      last_payment_date: paymentDate,
      updated_at: new Date()
    };

    // Obter conexão secundária para myDatabase
    const secondConn = await getSecondaryConnection();
    const SecondaryUser = secondConn.model('User', require('../models/User').schema);

    // Atualizar na base secundária
    const secondaryUser = await SecondaryUser.findOneAndUpdate(
      { subscription_id: subscriptionId },
      { $set: updateData },
      { new: true }
    );

    // Se encontrou na base secundária, atualizar também na base principal
    if (secondaryUser) {
      try {
        const User = require('../models/User');
        await User.findByIdAndUpdate(
          secondaryUser._id,
          { $set: updateData }
        );
        console.log('Data do último pagamento atualizada em ambas as bases de dados');
      } catch (error) {
        console.warn('⚠️ Não foi possível atualizar data de pagamento na base principal:', error.message);
      }
      return secondaryUser;
    }

    // Se não encontrou na base secundária, tentar diretamente na base principal
    const User = require('../models/User');
    const updatedUser = await User.findOneAndUpdate(
      { subscription_id: subscriptionId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      console.warn(`Não foi possível encontrar assinatura: ${subscriptionId}`);
      return null;
    }

    return updatedUser;
  } catch (error) {
    console.error('Erro ao atualizar data do último pagamento:', error);
    throw error;
  }
};

/**
 * Verifica se tem usuários com assinaturas expiradas e atualiza o status
 * Esta função deve ser executada diariamente por uma tarefa agendada
 * @returns {Promise<Object>} Estatísticas de processamento
 */
exports.processExpiredSubscriptions = async () => {
  try {
    const stats = {
      processed: 0,
      expired: 0,
      errors: 0
    };

    // Obter conexão secundária para myDatabase
    const secondConn = await getSecondaryConnection();
    const SecondaryUser = secondConn.model('User', require('../models/User').schema);

    // Buscar usuários com assinaturas pagas mas expiradas
    const now = new Date();
    const expiredUsers = await SecondaryUser.find({
      subscription_status: 'paid',
      subscription_expires_at: { $lt: now }
    });

    stats.processed = expiredUsers.length;
    console.log(`Encontrados ${stats.processed} usuários com assinaturas expiradas`);

    // Atualizar cada usuário expirado
    for (const user of expiredUsers) {
      try {
        await SecondaryUser.updateOne(
          { _id: user._id },
          { $set: {
            subscription_status: 'expired',
            updated_at: now
          }}
        );

        // Atualizar também na base principal
        try {
          const User = require('../models/User');
          await User.updateOne(
            { subscription_id: user.subscription_id },
            { $set: {
              subscription_status: 'expired',
              updated_at: now
            }}
          );
        } catch (mainDbError) {
          console.warn('⚠️ Erro ao atualizar na base principal:', mainDbError.message);
        }

        stats.expired++;
        console.log(`Assinatura ${user.subscription_id} marcada como expirada`);
      } catch (error) {
        console.error(`Erro ao processar usuário ${user._id}:`, error);
        stats.errors++;
      }
    }

    return stats;
  } catch (error) {
    console.error('Erro ao processar assinaturas expiradas:', error);
    throw error;
  }
};

module.exports = exports;
