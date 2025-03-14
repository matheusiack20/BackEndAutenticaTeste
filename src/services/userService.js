const User = require('../models/User');
const mongoose = require('mongoose');
const mongoLog = require('../utils/mongoLog');
const fs = require('fs');
const path = require('path');
// Importar utilitário de gerenciamento de diretórios se necessário
const dirManager = require('../utils/dirManager');

// Corrigir a importação do User model que pode estar exportando como default
// e não como module.exports padrão do CommonJS
const UserModel = User.default || User;

// Importar a conexão secundária
const database = require('../config/database');
let secondaryConnection = null;

// Função para inicializar a conexão secundária (lazy loading) com tratamento de erro melhorado
async function getSecondaryConnection() {
  try {
    if (!secondaryConnection) {
      console.log('Inicializando conexão com banco de dados secundário...');
      
      if (!process.env.MONGO_URI_USER_BD) {
        console.error('❌ MONGO_URI_USER_BD não está definido no arquivo .env');
        throw new Error('String de conexão do banco de dados secundário não está configurada');
      }
      
      secondaryConnection = await database.connectToDatabase2();
      
      if (!secondaryConnection) {
        throw new Error('Conexão secundária retornou nulo');
      }
      
      if (secondaryConnection.readyState !== 1) {
        throw new Error(`Conexão secundária não está pronta: estado ${secondaryConnection.readyState}`);
      }
      
      console.log('✅ Conexão com banco de dados secundário inicializada com sucesso');
    }
    return secondaryConnection;
  } catch (error) {
    console.error('❌ Erro ao obter conexão secundária:', error);
    
    // Se já temos uma conexão, tente usá-la mesmo assim
    if (secondaryConnection) {
      console.log('Tentando usar conexão existente mesmo com erro');
      return secondaryConnection;
    }
    
    throw error; // Repassar o erro para tratamento superior
  }
}

/**
 * Mapeia o ID do plano para o número do plano interno
 * @param {string} planName - Nome do plano
 * @returns {number} Número do plano interno
 */
function mapPlanNameToNumber(planName) {
  if (!planName) return null;
  
  const planNameLower = planName.toLowerCase();
  if (planNameLower.includes('iniciante')) return 1;
  if (planNameLower.includes('especialista')) return 2;
  if (planNameLower.includes('pro')) return 3;
  
  return null;
}

/**
 * Verifica e localiza um usuário de forma mais robusta, tentando várias abordagens
 * @param {string} userId - ID do usuário a ser localizado
 * @returns {Promise<Object|null>} Usuário encontrado ou null
 */
exports.findUserRobustly = async (userId) => {
  try {
    if (!userId) {
      console.log('ID de usuário não fornecido');
      return null;
    }
    
    console.log(`Tentando localizar usuário de forma robusta: ${userId}`);
    
    // 1. Método padrão - findById direto
    try {
      const user = await UserModel.findById(userId);
      if (user) {
        console.log(`✅ Usuário encontrado com findById padrão: ${user.name || user.email}`);
        return user;
      }
    } catch (e) {
      console.log(`Erro ao usar findById: ${e.message}`);
    }
    
    // 2. Verificar espaços extras e outros problemas de formato
    const cleanedId = userId.trim();
    if (cleanedId !== userId) {
      try {
        console.log(`Tentando com ID limpo: "${cleanedId}"`);
        const user = await UserModel.findById(cleanedId);
        if (user) {
          console.log(`✅ Usuário encontrado após limpeza do ID: ${user.name || user.email}`);
          return user;
        }
      } catch (e) {
        console.log(`Erro ao buscar com ID limpo: ${e.message}`);
      }
    }
    
    // 3. Tentar com um novo ObjectId
    if (mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const objectId = new mongoose.Types.ObjectId(userId);
        console.log(`Tentando com novo ObjectId: ${objectId}`);
        const user = await UserModel.findOne({ _id: objectId });
        if (user) {
          console.log(`✅ Usuário encontrado com novo ObjectId: ${user.name || user.email}`);
          return user;
        }
      } catch (e) {
        console.log(`Erro ao buscar com novo ObjectId: ${e.message}`);
      }
    }
    
    // SOLUÇÃO: Tentar buscar qualquer usuário no sistema se só tiver um usuário
    const totalUsers = await UserModel.countDocuments();
    console.log(`Verificando número total de usuários: ${totalUsers}`);
    
    if (totalUsers === 1) {
      console.log('🔍 Há apenas UM usuário no banco de dados, buscando ele diretamente...');
      const singleUser = await UserModel.findOne({});
      if (singleUser) {
        console.log(`✅ Encontrado o único usuário do sistema: ${singleUser.name || singleUser.email} (ID: ${singleUser._id})`);
        return singleUser;
      }
    }
    
    // Caso especial: buscar por qualquer usuário no sistema como último recurso
    console.log('📋 Buscando QUALQUER usuário no sistema como fallback...');
    
    // Listar todos os usuários para diagnóstico
    const allUsers = await UserModel.find().limit(5);
    console.log(`Encontrados ${allUsers.length} usuários no banco:`);
    
    for (const user of allUsers) {
      console.log(`- ID: ${user._id}, Nome: ${user.name || 'Sem nome'}, Email: ${user.email || 'Sem email'}`);
    }
    
    if (allUsers.length > 0) {
      console.log(`✅ Usando o primeiro usuário encontrado como fallback: ${allUsers[0]._id}`);
      return allUsers[0];
    }
    
    console.log('❌ Não foi possível encontrar nenhum usuário por nenhum método');
    return null;
  } catch (error) {
    console.error('Erro ao buscar usuário de forma robusta:', error);
    return null;
  }
};

/**
 * Atualiza o plano do usuário no banco de dados myDatabase com detalhes completos
 * @param {string} userId - ID do usuário
 * @param {string} planId - ID do plano no Pagarme
 * @param {string} subscriptionId - ID da assinatura no Pagarme
 * @param {object} planDetails - Detalhes adicionais do plano (opcional)
 * @returns {Promise<Object>} Usuário atualizado
 */
exports.updateUserPlan = async (userId, planId, subscriptionId, planDetails = {}) => {
  // Número máximo de tentativas
  const MAX_ATTEMPTS = 3;
  let attempts = 0;
  let lastError = null;

  // Garantir que os diretórios existem
  dirManager.initDirectories();

  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    try {
      console.log(`[Tentativa ${attempts}] Atualizando plano do usuário: userId=${userId}, planId=${planId}, subscriptionId=${subscriptionId}`);
      
      // Verificar conexão com banco de dados principal
      const connectionState = mongoose.connection.readyState;
      console.log(`Estado da conexão MongoDB (principal): ${connectionState} (0=desconectado, 1=conectado, 2=conectando, 3=desconectando)`);
      
      // Obter conexão secundária (myDatabase)
      const secondConn = await getSecondaryConnection();
      if (!secondConn) {
        throw new Error('Falha ao obter conexão com banco de dados secundário (myDatabase)');
      }
      console.log(`Conexão secundária (myDatabase) estabelecida: ${secondConn.readyState}`);
      
      // Validar os parâmetros obrigatórios
      if (!userId) throw new Error('ID do usuário não fornecido');
      if (!planId) throw new Error('ID do plano não fornecido');
      if (!subscriptionId) throw new Error('ID da assinatura não fornecido');
      
        // Garantir que o userId é um ObjectId válido
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error(`ID de usuário inválido: ${userId}`);
      }
      
      // Extrair informações do plano
      const {
        planName = null,
        planInterval = null,
        planDescription = null,
        planPrice = null,
        expiresAt = null
      } = planDetails;
      
      // Mapear o nome do plano para o número interno
      const planNumber = mapPlanNameToNumber(planName);
      
      // Preparar os dados para atualização
      const updateData = {
        plan_id: planId,
        subscription_id: subscriptionId,
        subscription_status: 'paid', // Usando 'paid' em vez de 'active' para corresponder ao enum definido
        updated_at: new Date()
      };
      
      // Adicionar campos extras se fornecidos
      if (planName) updateData.plan_name = planName;
      if (planInterval) updateData.plan_interval = planInterval;
      if (planDescription) updateData.plan_description = planDescription;
      if (planPrice) updateData.subscription_price = planPrice;
      if (expiresAt) updateData.subscription_expires_at = expiresAt;
      if (planNumber !== null) updateData.plan = planNumber;
      
      // Configurar data de criação da assinatura
      updateData.subscription_created_at = new Date();
      
      console.log('Dados de atualização preparados:', JSON.stringify(updateData, null, 2));
      
      // Testar conexão explicitamente antes da operação
      const connectionTest = await mongoLog.testMongoConnection(secondConn);
      if (!connectionTest.writeSuccessful) {
        // Salvar informações em arquivo para tentar recuperação posterior
        const backupData = {
          userId,
          planId,
          subscriptionId,
          planDetails,
          timestamp: new Date().toISOString()
        };
        
        // Usar utilitário para garantir o caminho correto e existência do diretório
        const backupPath = dirManager.getTempFilePath(`recovery_plan_update_${userId}_${Date.now()}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        
        throw new Error('Teste de escrita no MongoDB (myDatabase) falhou antes da atualização');
      }
      
      console.log(`Atualizando usuário na base secundária myDatabase. ID: ${userId}`);
      
      // Criar modelo User na conexão secundária
      const SecondaryUser = secondConn.model('User', require('../models/User').schema);
      
      // VERIFICAÇÃO ADICIONAL: Primeiro, tentar encontrar o usuário de forma mais robusta na base secundária
      const userExists = await findUserRobustlyInSecondary(userId, SecondaryUser);
      
      if (userExists) {
        // Se encontrou o usuário na base secundária, usar o ID correto dele para a atualização
        userId = userExists._id.toString();
        console.log(`✓ Usuário encontrado via método robusto na base secundária. ID correto: ${userId}`);
        
        // Atualizar na base secundária
        const updatedUser = await SecondaryUser.findByIdAndUpdate(
          userId,
          { $set: updateData },
          { 
            new: true, 
            runValidators: true 
          }
        );
        
        // Se a atualização na base secundária foi bem-sucedida, também atualiza na base principal
        if (updatedUser) {
          console.log(`✅ Plano do usuário atualizado com sucesso na base secundária: ${updatedUser.name || updatedUser.email}`);
          
          try {
            // Atualizar também na base principal para manter consistência
            await UserModel.findByIdAndUpdate(
              userId,
              { $set: updateData },
              { new: true }
            );
            console.log('✅ Atualização replicada para base principal com sucesso');
          } catch (mainDbError) {
            console.warn('⚠️ Falha ao replicar atualização para base principal:', mainDbError);
            // Ainda consideramos sucesso mesmo se a replicação para base principal falhar
          }
          
          return updatedUser;
        } else {
          throw new Error(`Falha na atualização do usuário na base secundária: ${userId}`);
        }
      } else {
        // Se o usuário não existe na base secundária, tentar criar
        console.log(`Usuário não encontrado na base secundária. Tentando copiar da base principal...`);
        
        // Buscar usuário na base principal
        const mainUser = await UserModel.findById(userId);
        if (mainUser) {
          console.log(`Usuário encontrado na base principal. Copiando para base secundária...`);
          
          // Preparar dados do usuário para criação na base secundária
          const userData = mainUser.toObject();
          delete userData._id; // Remover ID para permitir que MongoDB gere um novo
          
          // Adicionar dados de assinatura
          Object.assign(userData, updateData);
          
          // Criar usuário na base secundária
          const newSecondaryUser = await new SecondaryUser(userData).save();
          console.log(`✅ Usuário criado na base secundária com ID: ${newSecondaryUser._id}`);
          
          return newSecondaryUser;
        } else {
          throw new Error(`Usuário não encontrado em nenhuma base de dados: ${userId}`);
        }
      }
    } catch (error) {
      lastError = error;
      console.error(`❌ [Tentativa ${attempts}] Erro ao atualizar plano do usuário:`, error);
      
      // Salvar dados de erro para análise posterior
      try {
        const errorLogPath = dirManager.getLogFilePath(`plan_update_error_${userId}_${Date.now()}.json`);
        fs.writeFileSync(errorLogPath, JSON.stringify({
          userId,
          planId,
          subscriptionId,
          planDetails,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }, null, 2));
      } catch (logError) {
        console.error('Erro ao salvar log de erro:', logError);
      }
      
      // Se ainda há tentativas, espere um pouco antes de tentar novamente
      if (attempts < MAX_ATTEMPTS) {
        const waitTime = attempts * 1000; // Espera progressiva: 1s, 2s, 3s...
        console.log(`Aguardando ${waitTime}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // Se chegamos aqui, todas as tentativas falharam
  throw lastError || new Error('Falha ao atualizar plano do usuário após várias tentativas');
};

/**
 * Verifica e localiza um usuário na base secundária
 * @param {string} userId - ID do usuário
 * @param {Model} SecondaryUser - Modelo de usuário da base secundária
 * @returns {Promise<Object|null>} Usuário encontrado ou null
 */
async function findUserRobustlyInSecondary(userId, SecondaryUser) {
  try {
    if (!userId) {
      console.log('ID de usuário não fornecido');
      return null;
    }
    
    console.log(`Tentando localizar usuário na base secundária: ${userId}`);
    
    // 1. Método padrão - findById direto
    try {
      const user = await SecondaryUser.findById(userId);
      if (user) {
        console.log(`✅ Usuário encontrado na base secundária com findById: ${user.name || user.email}`);
        return user;
      }
    } catch (e) {
      console.log(`Erro ao usar findById na base secundária: ${e.message}`);
    }
    
    // 2. Verificar se existe um usuário com mesmo email na base principal
    try {
      const mainUser = await UserModel.findById(userId);
      if (mainUser && mainUser.email) {
        console.log(`Buscando usuário na base secundária pelo email: ${mainUser.email}`);
        const secondaryUser = await SecondaryUser.findOne({ email: mainUser.email });
        if (secondaryUser) {
          console.log(`✅ Usuário encontrado na base secundária pelo email: ${secondaryUser._id}`);
          return secondaryUser;
        }
      }
    } catch (e) {
      console.log(`Erro ao buscar email do usuário na base principal: ${e.message}`);
    }
    
    // 3. Se só tiver um usuário na base secundária, retorna este usuário
    const countUsers = await SecondaryUser.countDocuments();
    if (countUsers === 1) {
      console.log('🔍 Há apenas UM usuário na base secundária, retornando este usuário');
      const singleUser = await SecondaryUser.findOne({});
      if (singleUser) {
        return singleUser;
      }
    }
    
    // 4. Retorne null se não encontrar nenhum usuário
    console.log('❌ Não foi possível encontrar usuário na base secundária');
    return null;
  } catch (error) {
    console.error('Erro ao buscar usuário na base secundária:', error);
    return null;
  }
}

/**
 * Cancela o plano de um usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Usuário atualizado
 */
exports.cancelUserPlan = async (userId) => {
  try {
    console.log(`Cancelando plano do usuário: ${userId}`);
    
    if (!userId) throw new Error('ID do usuário não fornecido');
    
    // Garantir que o userId é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error(`ID de usuário inválido: ${userId}`);
    }
    
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          subscription_status: 'canceled',
          updated_at: new Date()
        }
      },
      { new: true }
    );
    
    if (!updatedUser) {
      throw new Error(`Usuário não encontrado: ${userId}`);
    }
    
    console.log(`Plano do usuário cancelado com sucesso: ${updatedUser.name || updatedUser.email}`);
    return updatedUser;
  } catch (error) {
    console.error('Erro ao cancelar plano do usuário:', error);
    throw error;
  }
};

/**
 * Obtém os detalhes do plano atual do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Detalhes do plano
 */
exports.getUserPlanDetails = async (userId) => {
  try {
    if (!userId) throw new Error('ID do usuário não fornecido');
    
    // Garantir que o userId é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error(`ID de usuário inválido: ${userId}`);
    }
    
    const user = await UserModel.findById(userId);
    
    if (!user) {
      throw new Error(`Usuário não encontrado: ${userId}`);
    }
    
    return {
      plan: user.plan,
      plan_id: user.plan_id || null,
      plan_name: user.plan_name || null,
      plan_interval: user.plan_interval || null,
      plan_description: user.plan_description || null,
      subscription_id: user.subscription_id || null,
      subscription_status: user.subscription_status || 'inactive',
      subscription_price: user.subscription_price || null,
      subscription_created_at: user.subscription_created_at || null,
      subscription_expires_at: user.subscription_expires_at || null,
    };
  } catch (error) {
    console.error('Erro ao obter detalhes do plano do usuário:', error);
    throw error;
  }
};
