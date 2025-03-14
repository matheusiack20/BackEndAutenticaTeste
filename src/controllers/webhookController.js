const crypto = require('crypto');
const subscriptionService = require('../services/subscriptionService');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dirManager = require('../utils/dirManager');

/**
 * Processa webhooks do Pagar.me
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
exports.processPagarmeWebhook = async (req, res) => {
  try {
    // Garantir que os diretórios existem
    dirManager.initDirectories();
    
    // Salvar solicitação bruta para diagnóstico
    const webhookLogPath = dirManager.getLogFilePath(`webhook_${Date.now()}.json`);
    fs.writeFileSync(webhookLogPath, JSON.stringify({
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    // Verificar a assinatura do webhook (se configurada)
    if (process.env.PAGARME_WEBHOOK_SECRET) {
      const signature = req.headers['x-signature'] || req.headers['X-Signature'] || '';
      if (!verifyWebhookSignature(req.body, signature)) {
        console.error('Assinatura de webhook inválida');
        return res.status(401).json({ error: 'Assinatura inválida' });
      }
    }

    // Processar o evento
    const { event, data } = req.body;
    console.log(`Webhook recebido: ${event}`, JSON.stringify(data).substring(0, 200) + '...');

    if (!event || !data) {
      return res.status(400).json({ error: 'Payload inválido' });
    }

    // Processar diferentes tipos de eventos
    switch (event) {
      case 'subscription.created':
        // Registrar a criação da assinatura
        console.log('Nova assinatura criada:', data.id);
        await handleSubscriptionCreated(data);
        break;

      case 'subscription.paid':
        // Atualizar o status da assinatura para paga
        console.log('Assinatura paga:', data.id);
        await handleSubscriptionPaid(data);
        break;

      case 'subscription.payment_failed':
        // Atualizar o status da assinatura para não paga
        console.log('Falha no pagamento da assinatura:', data.id);
        await handleSubscriptionPaymentFailed(data);
        break;

      case 'subscription.canceled':
        // Atualizar o status da assinatura para cancelada
        console.log('Assinatura cancelada:', data.id);
        await handleSubscriptionCanceled(data);
        break;
        
      case 'invoice.paid':
        // Processar pagamento de fatura (renovação mensal)
        console.log('Fatura paga:', data.id);
        await handleInvoicePaid(data);
        break;
        
      case 'invoice.payment_failed':
        // Processar falha no pagamento de fatura
        console.log('Falha no pagamento da fatura:', data.id);
        await handleInvoicePaymentFailed(data);
        break;

      default:
        console.log(`Evento não processado: ${event}`);
    }

    // Sempre retornar 200 para o Pagar.me não retentar o webhook
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao processar webhook do Pagar.me:', error);
    
    // Salvar erro para diagnóstico
    try {
      const errorLogPath = dirManager.getLogFilePath(`webhook_error_${Date.now()}.json`);
      fs.writeFileSync(errorLogPath, JSON.stringify({
        error: error.message,
        stack: error.stack,
        body: req.body,
        timestamp: new Date().toISOString()
      }, null, 2));
    } catch (logError) {
      console.error('Erro ao salvar log de erro:', logError);
    }
    
    // Ainda retornamos 200 para evitar retentativas desnecessárias
    return res.status(200).json({ success: true, processed: false });
  }
};

/**
 * Processa o evento de assinatura criada
 * @param {Object} data - Dados do evento
 */
async function handleSubscriptionCreated(data) {
  try {
    const subscriptionId = data.id;
    if (!subscriptionId) {
      throw new Error('ID da assinatura não encontrado nos dados do evento');
    }

    // Verificar se esta assinatura já está associada a um usuário
    const User = require('../models/User');
    const existingUser = await User.findOne({ subscription_id: subscriptionId });
    
    if (existingUser) {
      console.log(`Assinatura ${subscriptionId} já associada ao usuário ${existingUser._id}`);
      return;
    }
    
    // Se a assinatura não estiver associada, salvar dados para processamento posterior
    const customerData = data.customer || {};
    const planData = data.plan || {};
    
    // Salvar dados para associação posterior com um usuário
    const pendingSubscriptionPath = dirManager.getPendingSubscriptionPath(`subscription_${subscriptionId}_${Date.now()}.json`);
    fs.writeFileSync(pendingSubscriptionPath, JSON.stringify({
      subscriptionId: subscriptionId,
      planId: planData.id,
      planName: planData.name,
      customerEmail: customerData.email,
      customerName: customerData.name,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    console.log(`Dados da assinatura ${subscriptionId} salvos para processamento posterior`);
  } catch (error) {
    console.error('Erro ao processar criação de assinatura:', error);
    throw error;
  }
}

/**
 * Processa o evento de assinatura paga
 * @param {Object} data - Dados do evento
 */
async function handleSubscriptionPaid(data) {
  try {
    const subscriptionId = data.id;
    if (!subscriptionId) {
      throw new Error('ID da assinatura não encontrado nos dados do evento');
    }

    // Atualizar o status da assinatura para 'paid'
    const updatedUser = await subscriptionService.updateSubscriptionStatus(subscriptionId, 'paid');
    
    // Atualizar também a data de expiração (a assinatura foi renovada)
    if (updatedUser && data.current_period_end) {
      try {
        // Converter timestamp para data e adicionar 1 dia de margem
        const expiresAt = new Date(data.current_period_end * 1000);
        expiresAt.setDate(expiresAt.getDate() + 1); // Adiciona 1 dia de margem
        
        await subscriptionService.updateSubscriptionExpiry(subscriptionId, expiresAt);
        console.log(`Data de expiração da assinatura ${subscriptionId} atualizada para ${expiresAt}`);
      } catch (expiryError) {
        console.error('Erro ao atualizar data de expiração:', expiryError);
      }
    }

    console.log(`Assinatura ${subscriptionId} marcada como paga`);
  } catch (error) {
    console.error('Erro ao processar pagamento de assinatura:', error);
    throw error;
  }
}

/**
 * Processa o evento de pagamento de fatura (para renovações mensais)
 * @param {Object} data - Dados do evento
 */
async function handleInvoicePaid(data) {
  try {
    // A fatura (invoice) está associada a uma assinatura
    const subscriptionId = data.subscription_id;
    if (!subscriptionId) {
      throw new Error('ID da assinatura não encontrado nos dados da fatura');
    }

    // Atualizar o status da assinatura para 'paid'
    const updatedUser = await subscriptionService.updateSubscriptionStatus(subscriptionId, 'paid');
    
    // Atualizar a data do último pagamento
    await subscriptionService.updateLastPaymentDate(subscriptionId, new Date());
    
    // Atualizar também a data de expiração (a assinatura foi renovada)
    if (data.due_at) {
      // Calcular nova data de expiração com base no vencimento da próxima fatura
      const expiresAt = new Date(data.due_at * 1000);
      
      await subscriptionService.updateSubscriptionExpiry(subscriptionId, expiresAt);
      console.log(`Data de expiração da assinatura ${subscriptionId} atualizada para ${expiresAt}`);
    }

    console.log(`Fatura paga para assinatura ${subscriptionId}. Status atualizado para paid.`);
  } catch (error) {
    console.error('Erro ao processar pagamento de fatura:', error);
    throw error;
  }
}

/**
 * Processa o evento de falha no pagamento da fatura
 * @param {Object} data - Dados do evento
 */
async function handleInvoicePaymentFailed(data) {
  try {
    const subscriptionId = data.subscription_id;
    if (!subscriptionId) {
      throw new Error('ID da assinatura não encontrado nos dados da fatura');
    }

    // Atualizar o status da assinatura para 'unpaid'
    await subscriptionService.updateSubscriptionStatus(subscriptionId, 'unpaid');

    console.log(`Falha no pagamento da fatura para assinatura ${subscriptionId}. Status atualizado para unpaid.`);
  } catch (error) {
    console.error('Erro ao processar falha de pagamento de fatura:', error);
    throw error;
  }
}

/**
 * Processa o evento de falha no pagamento da assinatura
 * @param {Object} data - Dados do evento
 */
async function handleSubscriptionPaymentFailed(data) {
  try {
    const subscriptionId = data.id;
    if (!subscriptionId) {
      throw new Error('ID da assinatura não encontrado nos dados do evento');
    }

    // Atualizar o status da assinatura para 'unpaid'
    await subscriptionService.updateSubscriptionStatus(subscriptionId, 'unpaid');

    console.log(`Assinatura ${subscriptionId} marcada como não paga`);
  } catch (error) {
    console.error('Erro ao processar falha de pagamento de assinatura:', error);
    throw error;
  }
}

/**
 * Processa o evento de assinatura cancelada
 * @param {Object} data - Dados do evento
 */
async function handleSubscriptionCanceled(data) {
  try {
    const subscriptionId = data.id;
    if (!subscriptionId) {
      throw new Error('ID da assinatura não encontrado nos dados do evento');
    }

    // Atualizar o status da assinatura para 'canceled'
    await subscriptionService.updateSubscriptionStatus(subscriptionId, 'canceled');

    console.log(`Assinatura ${subscriptionId} marcada como cancelada`);
  } catch (error) {
    console.error('Erro ao processar cancelamento de assinatura:', error);
    throw error;
  }
}

/**
 * Verifica a assinatura HMAC do webhook
 * @param {Object} payload - Conteúdo do webhook
 * @param {string} signature - Assinatura fornecida pelo Pagar.me
 * @returns {boolean} Verdadeiro se a assinatura for válida
 */
function verifyWebhookSignature(payload, signature) {
  if (!signature || !process.env.PAGARME_WEBHOOK_SECRET) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', process.env.PAGARME_WEBHOOK_SECRET);
  const calculatedSignature = hmac.update(JSON.stringify(payload)).digest('hex');

  // Comparação segura para evitar timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return false;
  }
}
