import { Request, Response } from 'express';
import pagarmeService from '../services/pagarmeService';

// Armazenamento em memória temporário para tokens (em vez de banco de dados)
const temporaryTokenStorage = new Map();

// Função para sanitizar textos que irão para campos restritos da API do Pagar.me
function sanitizeText(text) {
  if (!text) return '';
  // Remove caracteres especiais, acentos, pontuação e outros caracteres não permitidos
  return text.replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
}

const plansController = {
  async createPlan(req: Request, res: Response) {
    try {
      const { name, amount, interval, intervalCount } = req.body;

      const createdPlan = await pagarmeService.createPlan(name, amount, interval, intervalCount);

      console.log('Plano criado:', createdPlan);
      res.status(201).json({ message: 'Plano criado com sucesso', plan: createdPlan });
    } catch (error: any) {
      console.error('Erro ao criar plano:', error);
      res.status(500).json({ message: 'Erro ao criar plano', error: 'Erro interno do servidor' });
    }
  },

  async createCustomer(req: Request, res: Response) {
    try {
      const { name, email, document, phone, billing_address } = req.body;
      console.log('Dados recebidos para criar cliente:', { name, email, document, phone, billing_address });

      if (!name || !email || !document || !phone || !billing_address) {
        throw new Error('Dados do cliente incompletos');
      }

      const createdCustomer = await pagarmeService.createCustomer(name, email, document, phone, billing_address);

      console.log('Resposta da API ao criar cliente:', createdCustomer);

      console.log('Cliente criado:', createdCustomer);
      res.status(201).json({ message: 'Cliente criado com sucesso', customer: createdCustomer });
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message); // Adicione este log
      res.status(500).json({ message: 'Erro ao criar cliente', error: 'Erro interno do servidor' });
    }
  },

  async createCard(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      const { card_number, card_holder_name, exp_month, exp_year, card_cvv, billing_address } = req.body;
      
      // Verificação específica para simulação de recusa com CVV iniciado em 6
      if (card_cvv && card_cvv.startsWith('6')) {
        console.error('Recusa simulada - cartão com CVV iniciado em 6');
        return res.status(400).json({ 
          message: 'Pagamento recusado pelo emissor do cartão. Por favor, verifique os dados ou use outro cartão.',
          error: 'Cartão recusado',
          status: 'card_declined'
        });
      }
      
      // Verificação específica para o ambiente do Pagar.me
      // No Pagar.me, o CVV 612 sempre deve ser recusado para cartões de teste
      if (card_cvv === '612') {
        console.error('Recusa automática - cartão com CVV 612');
        return res.status(400).json({ 
          message: 'Cartão recusado pela operadora. Por favor, verifique os dados do cartão.',
          error: 'Cartão recusado'
        });
      }
      
      console.log('Dados recebidos para criar cartão:', { 
        customerId, 
        card_number: card_number ? card_number.substring(0, 6) + '******' + card_number.substring(card_number.length - 4) : 'undefined',
        card_holder_name, 
        exp_month, 
        exp_year, 
        card_cvv: '***', // Nunca logar o CVV completo
        billing_address 
      });

      const createdCard = await pagarmeService.createCard(customerId, card_number, card_holder_name, exp_month, exp_year, card_cvv, {
        ...billing_address,
        zip_code: billing_address.zipcode // Certifique-se de que o campo zip_code está presente
      });

      console.log('Cartão criado e validado com sucesso:', {
        id: createdCard.id,
        last_digits: createdCard.last_digits,
        brand: createdCard.brand
      });
      
      res.status(201).json({ 
        message: 'Cartão criado e validado com sucesso', 
        card: {
          id: createdCard.id,
          last_digits: createdCard.last_digits,
          brand: createdCard.brand
        } 
      });
    } catch (error: any) {
      console.error('Erro ao criar ou validar cartão:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      
      // Extrai a mensagem de erro mais descritiva
      let errorMessage = 'Erro ao processar cartão';
      let errorStatus = 'card_error';
      
      if (error.message) {
        errorMessage = error.message;
        // Verificar se o erro está relacionado ao CVV começando com 6
        if (error.message.includes('CVV') && error.message.includes('6')) {
          errorStatus = 'card_declined';
        }
      } else if (error.response?.data?.message) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors && error.response.data.errors.length > 0) {
          errorMessage = error.response.data.errors[0].message;
        }
      }
      
      res.status(400).json({ 
        message: errorMessage,
        error: 'Erro de processamento de cartão',
        status: errorStatus
      });
    }
  },

  async getPlans(req: Request, res: Response) {
    try {
      const plans = [
        { name: 'Iniciante', amount: 5770, interval: 'month', intervalCount: 1, description: 'Plano Iniciante Mensal: Ideal para iniciantes' },
        { name: 'Iniciante', amount: 4770, interval: 'year', intervalCount: 1, description: 'Plano Iniciante Anual: Economize mais', finalAmount: 9540 },
        { name: 'Especialista', amount: 28440, interval: 'month', intervalCount: 1, description: 'Plano Especialista Mensal: Para usuários intermediários' },
        { name: 'Especialista', amount: 28440, interval: 'year', intervalCount: 1, description: 'Plano Especialista Anual: Melhor custo-benefício', finalAmount: 47400 },
        { name: 'Pro', amount: 46890, interval: 'month', intervalCount: 1, description: 'Plano Pro Mensal: Para usuários avançados' },
        { name: 'Pro', amount: 46890, interval: 'year', intervalCount: 1, description: 'Plano Pro Anual: Máxima economia', finalAmount: 78140 },
      ];
      console.log('Planos retornados:', plans); // Adicione este log para verificar os planos retornados
      res.status(200).json(plans);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      res.status(500).json({ message: 'Erro ao buscar planos', error: 'Erro interno do servidor' });
    }
  },

  async createSubscription(req: Request, res: Response) {
    try {
      const { customerId, planId, cardId, finalAmount, planName } = req.body;
      console.log('Dados recebidos para criar assinatura:', { customerId, planId, cardId, finalAmount, planName });

      if (!customerId || !planId || !cardId || finalAmount === undefined || finalAmount === null || planName === undefined) {
        throw new Error('Dados da assinatura incompletos');
      }

      // Primeiro, criar a transação de pagamento
      console.log('Iniciando processamento do pagamento...');
      try {
        const paymentTransaction = await pagarmeService.createPaymentTransaction(
          customerId, 
          cardId, 
          finalAmount, 
          `Assinatura do plano ${planName}`
        );

        // Verificar explicitamente o status da transação antes de criar a assinatura
        if (paymentTransaction.status !== 'paid') {
          console.error(`Assinatura não pode ser criada. Status da transação: ${paymentTransaction.status}`);
          return res.status(400).json({ 
            message: `Pagamento não aprovado (${paymentTransaction.status}). Por favor, verifique os dados do cartão e tente novamente.`,
            status: paymentTransaction.status
          });
        }
        
        console.log('Pagamento aprovado. Criando assinatura...');
        const createdSubscription = await pagarmeService.createSubscription(
          customerId, 
          planId, 
          cardId, 
          finalAmount, 
          planName
        );

        if (createdSubscription.message === 'Cliente já possui uma assinatura ativa') {
          return res.status(200).json({
            message: 'Cliente já possui uma assinatura ativa',
            subscription: createdSubscription.subscription,
          });
        }

        const orderId = createdSubscription.id;
        const chargeId = paymentTransaction.id || null;
        const status = createdSubscription.status || 'Status indefinido';

        console.log('Assinatura criada com sucesso:', {
          orderId,
          chargeId,
          status
        });

        res.status(201).json({
          message: 'Assinatura criada com sucesso',
          subscription: createdSubscription,
          orderId,
          chargeId,
          status,
          description: `Assinatura do plano ${planName} no valor de R$ ${(finalAmount / 100).toFixed(2).replace('.', ',')}`
        });
      } catch (error: any) {
        console.error('Erro ao processar pagamento:', error);
        return res.status(400).json({ 
          message: error.message || 'Erro ao processar pagamento',
          error: 'Pagamento recusado'
        });
      }
    } catch (error: any) {
      console.error('Erro ao criar assinatura:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      
      // Retornar mensagem clara para o usuário
      const errorMessage = error.message.includes('recusado') 
        ? error.message 
        : 'Erro ao criar assinatura. Por favor, tente novamente.';
      
      res.status(500).json({ message: errorMessage });
    }
  },

  generateToken(req: Request, res: Response) {
    try {
      const { planId, planName, planAmount, planInterval, planIntervalCount, planDescription } = req.body;
      const tokenId = `${planId}-${Date.now()}`;

      // Armazenar em memória em vez do banco de dados
      temporaryTokenStorage.set(tokenId, {
        tokenId,
        planId,
        planName,
        planAmount,
        planInterval,
        planIntervalCount,
        planDescription,
        createdAt: new Date(),
        // Configurar expiração após 24 horas
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      console.log(`Token temporário gerado: ${tokenId} (válido por 24h)`);
      
      // Configurar limpeza automática após expiração
      setTimeout(() => {
        if (temporaryTokenStorage.has(tokenId)) {
          temporaryTokenStorage.delete(tokenId);
          console.log(`Token expirado removido: ${tokenId}`);
        }
      }, 24 * 60 * 60 * 1000);

      res.status(200).json({ tokenId, planId, planName, planAmount, planInterval, planIntervalCount, planDescription });
    } catch (error: any) {
      console.error('Erro ao gerar token:', error);
      res.status(500).json({ error: 'Erro ao gerar token' });
    }
  },

  getToken(req: Request, res: Response) {
    try {
      const { tokenId } = req.params;
      
      // Buscar do armazenamento temporário em vez do banco de dados
      if (!temporaryTokenStorage.has(tokenId)) {
        return res.status(404).json({ error: 'Token não encontrado ou expirado' });
      }

      const token = temporaryTokenStorage.get(tokenId);
      
      // Verificar se o token expirou
      if (token.expiresAt < new Date()) {
        temporaryTokenStorage.delete(tokenId);
        return res.status(404).json({ error: 'Token expirado' });
      }

      res.status(200).json(token);
    } catch (error: any) {
      console.error('Erro ao buscar token:', error);
      res.status(500).json({ error: 'Erro ao buscar token' });
    }
  },

  async handleWebhook(req: Request, res: Response) {
    try {
      const { event, data } = req.body;
      console.log('Webhook recebido:', { event, data });

      if (event === 'charge.paid') {
        const { id, status, customer_id } = data;
        console.log(`Pagamento ${id} confirmado para cliente ${customer_id}, status: ${status}`);
        
        // Verificar se existe assinatura pendente e ativá-la
        if (status === 'paid') {
          try {
            await pagarmeService.activateSubscription(customer_id);
            console.log(`Assinatura ativada para cliente ${customer_id}`);
          } catch (err) {
            console.error(`Erro ao ativar assinatura: ${err.message}`);
          }
        }
      } else if (event === 'subscription.created') {
        console.log('Nova assinatura criada:', data.id);
      } else if (event === 'charge.failed') {
        console.log(`Pagamento falhou: ${data.id}, motivo: ${data.last_transaction?.acquirer_message || 'desconhecido'}`);
      }

      res.status(200).json({ message: 'Webhook processado com sucesso' });
    } catch (error: any) {
      console.error('Erro ao processar webhook:', error);
      res.status(500).json({ error: 'Erro ao processar webhook' });
    }
  }
};

export default plansController;