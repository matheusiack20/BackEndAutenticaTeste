/**
 * Rotas para diagnóstico do sistema 
 * ATENÇÃO: NÃO usar estas rotas em produção ou em ambientes acessíveis publicamente
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkAdmin } = require('../middlewares/roleMiddleware');

// Rota para testar busca de usuário por ID
router.get('/find-user/:userId', authMiddleware, checkAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'ID de usuário inválido' });
    }
    
    // Importar modelo User
    const User = require('../models/User');
    
    // Buscar por diferentes métodos
    const results = {};
    
    // Método 1: findById
    try {
      results.findById = await User.findById(userId);
    } catch (e) {
      results.findByIdError = e.message;
    }
    
    // Método 2: findOne com _id
    try {
      results.findOne = await User.findOne({ _id: userId });
    } catch (e) {
      results.findOneError = e.message;
    }
    
    // Método 3: findOne com novo ObjectId
    try {
      const objectId = new mongoose.Types.ObjectId(userId);
      results.findOneWithNewObjectId = await User.findOne({ _id: objectId });
    } catch (e) {
      results.findOneWithNewObjectIdError = e.message;
    }
    
    // Adicionar informações sobre a conexão
    results.connectionState = mongoose.connection.readyState;
    results.databaseName = mongoose.connection.name;
    
    // Retornar resultados
    res.status(200).json(results);
    
  } catch (error) {
    console.error('Erro na rota de diagnóstico:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para obter estatísticas do banco de dados
router.get('/database-stats', authMiddleware, checkAdmin, async (req, res) => {
  try {
    // Importar modelo User
    const User = require('../models/User');
    
    // Estatísticas gerais
    const stats = {
      totalUsers: await User.countDocuments(),
      usersWithSubscriptions: await User.countDocuments({ subscription_id: { $ne: null } }),
      usersWithPaidStatus: await User.countDocuments({ subscription_status: 'paid' }),
      connectionState: mongoose.connection.readyState
    };
    
    // Retornar estatísticas
    res.status(200).json(stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para verificar se o usuário existe e realizar correções se necessário
router.get('/fix-user/:userId', authMiddleware, checkAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const User = require('../models/User');
    
    // Status inicial
    const result = {
      originalId: userId,
      checks: {}
    };
    
    // 1. Verificar se parece um ObjectId válido
    const isValidObjectId = mongoose.Types.ObjectId.isValid(userId);
    result.checks.isValidObjectId = isValidObjectId;
    
    // 2. Tentar encontrar por findById padrão
    try {
      const userById = await User.findById(userId);
      result.checks.findById = { 
        success: !!userById,
        user: userById ? { 
          _id: userById._id.toString(),
          name: userById.name,
          email: userById.email
        } : null
      };
      
      if (userById) {
        result.userFound = true;
        result.user = {
          _id: userById._id.toString(),
          name: userById.name,
          email: userById.email,
          status: userById.subscription_status || 'inactive'
        };
      }
    } catch (e) {
      result.checks.findById = { 
        success: false,
        error: e.message
      };
    }
    
    // 3. Se não encontrou, tentar com ID limpo
    if (!result.userFound) {
      const trimmedId = userId.trim();
      if (trimmedId !== userId) {
        try {
          const userByTrimmedId = await User.findById(trimmedId);
          result.checks.trimmedId = {
            attempted: true,
            trimmedId,
            success: !!userByTrimmedId,
            user: userByTrimmedId ? {
              _id: userByTrimmedId._id.toString(),
              name: userByTrimmedId.name,
              email: userByTrimmedId.email
            } : null
          };
          
          if (userByTrimmedId) {
            result.userFound = true;
            result.user = {
              _id: userByTrimmedId._id.toString(),
              name: userByTrimmedId.name,
              email: userByTrimmedId.email,
              status: userByTrimmedId.subscription_status || 'inactive'
            };
            result.correctedId = trimmedId;
          }
        } catch (e) {
          result.checks.trimmedId = {
            attempted: true,
            trimmedId,
            success: false,
            error: e.message
          };
        }
      } else {
        result.checks.trimmedId = {
          attempted: false,
          reason: 'ID já está limpo'
        };
      }
    }
    
    // 4. Se ainda não encontrou, tentar buscar por email (específico do caso)
    if (!result.userFound) {
      const pedroEmail = 'pedro.henrique_maciel@hotmail.com';
      
      try {
        const userByEmail = await User.findOne({ email: pedroEmail });
        result.checks.emailSearch = {
          attempted: true,
          email: pedroEmail,
          success: !!userByEmail,
          user: userByEmail ? {
            _id: userByEmail._id.toString(),
            name: userByEmail.name,
            email: userByEmail.email
          } : null
        };
        
        if (userByEmail) {
          result.userFound = true;
          result.user = {
            _id: userByEmail._id.toString(),
            name: userByEmail.name,
            email: userByEmail.email,
            status: userByEmail.subscription_status || 'inactive'
          };
          result.correctedId = userByEmail._id.toString();
        }
      } catch (e) {
        result.checks.emailSearch = {
          attempted: true,
          email: pedroEmail,
          success: false,
          error: e.message
        };
      }
    }
    
    // 5. Se encontrou o usuário, mas precisa atualizar a assinatura
    if (result.userFound && result.user.status !== 'paid') {
      // Opcionalmente, fornecer um plano de ação para correção
      result.needsSubscriptionUpdate = true;
      result.fixCommands = [
        `db.users.updateOne({ _id: ObjectId("${result.user._id}") }, { $set: { subscription_status: "paid", plan: 3 } })`
      ];
    } else if (result.userFound) {
      result.needsSubscriptionUpdate = false;
    }
    
    // 6. Estatísticas gerais do banco para diagnóstico
    result.stats = {
      totalUsers: await User.countDocuments(),
      usersWithActiveSubscriptions: await User.countDocuments({ subscription_status: 'paid' }),
      usersWithSubscriptionId: await User.countDocuments({ subscription_id: { $ne: null } })
    };
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Erro na rota de diagnóstico de usuário:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para aplicar a correção diretamente (com proteção extra)
router.post('/fix-user/:userId', authMiddleware, checkAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { targetId, action } = req.body;
    
    if (!targetId || !action) {
      return res.status(400).json({
        error: 'Dados incompletos',
        message: 'É necessário fornecer targetId e action'
      });
    }
    
    if (action !== 'update_subscription') {
      return res.status(400).json({
        error: 'Ação inválida',
        message: 'A única ação suportada é update_subscription'
      });
    }
    
    // Verificar se o usuário existe
    const User = require('../models/User');
    const targetUser = await User.findById(targetId);
    
    if (!targetUser) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        message: `Não foi possível encontrar usuário com ID ${targetId}`
      });
    }
    
    // Aplicar a atualização
    const result = await User.updateOne(
      { _id: targetUser._id },
      { $set: {
        subscription_status: 'paid',
        plan: 3,
        plan_name: 'Especialista',
        plan_interval: 'month',
        plan_id: 'plan_10VL47FPgiQK6bqw',
        subscription_id: 'sub_dwXrvOMhnxsJYGAJ',
        subscription_price: 28440,
        subscription_expires_at: new Date('2025-04-14T14:23:27.735Z')
      }}
    );
    
    res.status(200).json({
      success: true,
      message: `Atualização aplicada com sucesso: ${result.modifiedCount} documento(s) modificado(s)`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email
      },
      updateResult: result
    });
  } catch (error) {
    console.error('Erro ao aplicar correção ao usuário:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para corrigir o usuário Pedro especificamente
router.post('/fix-pedro-subscription', authMiddleware, checkAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Primeiro, tentar encontrar o usuário Pedro por email
    let user = await User.findOne({ email: 'pedro.henrique_maciel@hotmail.com' });
    
    // Se não encontrar, buscar pelo ID específico
    if (!user) {
      try {
        user = await User.findById('679a3f2580885bd7c8b7016c');
      } catch (idError) {
        console.error('Erro ao buscar por ID:', idError);
      }
    }
    
    // Se ainda não encontrou, pegar o primeiro usuário se houver apenas um
    if (!user) {
      const count = await User.countDocuments();
      if (count === 1) {
        user = await User.findOne();
      }
    }
    
    // Se não encontrou nenhum usuário
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Não foi possível encontrar o usuário Pedro'
      });
    }
    
    // Definir os valores da assinatura
    const subscriptionData = {
      plan: 1,
      plan_id: 'plan_axj7YDPiVfmlY6k0',
      subscription_id: 'sub_M8dADekF9IxEWbX5',
      plan_name: 'Iniciante',
      plan_interval: 'month',
      plan_description: 'Iniciante',
      subscription_status: 'paid',
      subscription_price: 5770,
      subscription_created_at: new Date(),
      subscription_expires_at: new Date(new Date().setMonth(new Date().getMonth() + 1))
    };
    
    // Atualizar o usuário
    const result = await User.updateOne(
      { _id: user._id },
      { $set: subscriptionData }
    );
    
    // Verificar o usuário atualizado
    const updatedUser = await User.findById(user._id);
    
    return res.status(200).json({
      success: true,
      message: 'Assinatura do Pedro corrigida com sucesso',
      originalUser: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      updateResult: result,
      currentStatus: {
        subscription_status: updatedUser.subscription_status,
        plan: updatedUser.plan,
        subscription_id: updatedUser.subscription_id
      }
    });
  } catch (error) {
    console.error('Erro ao corrigir assinatura do Pedro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao corrigir assinatura',
      error: error.message
    });
  }
});

// Rota para corrigir a assinatura do usuário autenticado
router.post('/fix-user-subscription', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Usar o usuário autenticado em vez de um email fixo
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuário não encontrado na requisição autenticada'
      });
    }
    
    // Tentar encontrar o usuário pelo ID
    let user = null;
    
    try {
      // Primeira tentativa: findById direto
      user = await User.findById(userId);
    } catch (idError) {
      console.error('Erro ao buscar por ID:', idError);
    }
    
    // Se não encontrou pelo ID, usar o método robusto
    if (!user) {
      const userService = require('../services/userService');
      user = await userService.findUserRobustly(userId);
    }
    
    // Se ainda não encontrou, buscar pelo email
    if (!user && req.user.email) {
      user = await User.findOne({ email: req.user.email });
    }
    
    // Se não encontrou nenhum usuário
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Não foi possível encontrar seu usuário no banco de dados'
      });
    }
    
    // Receber dados da assinatura do body (ou usar valores padrão)
    const { 
      plan = 1,
      planName = 'Iniciante',
      planInterval = 'month',
      planId = 'plan_axj7YDPiVfmlY6k0',
      subscriptionId = 'sub_M8dADekF9IxEWbX5',
      price = 5770
    } = req.body;
    
    // Definir os valores da assinatura
    const subscriptionData = {
      plan,
      plan_id: planId,
      subscription_id: subscriptionId,
      plan_name: planName,
      plan_interval: planInterval,
      plan_description: planName,
      subscription_status: 'paid',
      subscription_price: price,
      subscription_created_at: new Date(),
      subscription_expires_at: new Date(new Date().setMonth(new Date().getMonth() + 1))
    };
    
    // Atualizar o usuário
    const result = await User.updateOne(
      { _id: user._id },
      { $set: subscriptionData }
    );
    
    // Verificar o usuário atualizado
    const updatedUser = await User.findById(user._id);
    
    return res.status(200).json({
      success: true,
      message: 'Assinatura corrigida com sucesso',
      originalUser: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      updateResult: result,
      currentStatus: {
        subscription_status: updatedUser.subscription_status,
        plan: updatedUser.plan,
        subscription_id: updatedUser.subscription_id
      }
    });
  } catch (error) {
    console.error('Erro ao corrigir assinatura:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao corrigir assinatura',
      error: error.message
    });
  }
});

module.exports = router;
