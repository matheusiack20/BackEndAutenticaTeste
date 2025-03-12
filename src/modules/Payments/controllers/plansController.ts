import { Request, Response } from 'express';
import pagarmeService from '../services/pagarmeService';
import { TokenModel } from '../models/tokenModel'; // Correct the import path

const plansController = {
  async createPlan(req: Request, res: Response) {
    try {
      const { name, amount, interval, intervalCount } = req.body;

      const createdPlan = await pagarmeService.createPlan(name, amount, interval, intervalCount);

      console.log('Plano criado:', createdPlan);
      res.status(201).json({ message: 'Plano criado com sucesso', plan: createdPlan });
    } catch (error) {
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
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message); // Adicione este log
      res.status(500).json({ message: 'Erro ao criar cliente', error: 'Erro interno do servidor' });
    }
  },

  async createCard(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      const { card_number, card_holder_name, exp_month, exp_year, card_cvv, billing_address } = req.body;
      console.log('Dados recebidos para criar cartão:', { customerId, card_number, card_holder_name, exp_month, exp_year, card_cvv, billing_address });

      const createdCard = await pagarmeService.createCard(customerId, card_number, card_holder_name, exp_month, exp_year, card_cvv, {
        ...billing_address,
        zip_code: billing_address.zipcode // Certifique-se de que o campo zip_code está presente
      });

      console.log('Resposta da API ao criar cartão:', createdCard);

      console.log('Cartão criado:', createdCard);
      res.status(201).json({ message: 'Cartão criado com sucesso', card: createdCard });
    } catch (error) {
      console.error('Erro ao criar cartão:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message); // Adicione este log
      res.status(500).json({ message: 'Erro ao criar cartão', error: 'Erro interno do servidor' });
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

      const createdSubscription = await pagarmeService.createSubscription(customerId, planId, cardId, finalAmount, planName);

      if (createdSubscription.message === 'Cliente já possui uma assinatura ativa') {
        return res.status(200).json({
          message: 'Cliente já possui uma assinatura ativa',
          subscription: createdSubscription.subscription,
        });
      }

      console.log('Assinatura criada:', createdSubscription);

      const orderId = createdSubscription.id;
      const chargeId = createdSubscription.charges && createdSubscription.charges.length > 0 ? createdSubscription.charges[0].id : null;
      const status = createdSubscription.status || 'Status indefinido';

      if (chargeId) {
        console.log('Charge ID:', chargeId);
      }

      res.status(201).json({
        message: 'Assinatura criada com sucesso',
        subscription: createdSubscription,
        orderId: orderId,
        chargeId: chargeId,
        status: status,
        description: `Assinatura do plano ${planName} no valor de R$ ${(finalAmount / 100).toFixed(2).replace('.', ',')}`
      });
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      res.status(500).json({ message: 'Erro ao criar assinatura', error: 'Erro interno do servidor' });
    }
  },

  async generateToken(req: Request, res: Response) {
    try {
      const { planId, planName, planAmount, planInterval, planIntervalCount, planDescription } = req.body;
      const tokenId = `${planId}-${Date.now()}`; // Generate a simple token ID

      // Save the token to the database
      const token = new TokenModel({
        tokenId,
        planId,
        planName,
        planAmount,
        planInterval,
        planIntervalCount,
        planDescription,
      });
      await token.save();

      res.status(200).json({ tokenId, planId, planName, planAmount, planInterval, planIntervalCount, planDescription });
    } catch (error) {
      console.error('Erro ao gerar token:', error);
      res.status(500).json({ error: 'Erro ao gerar token' });
    }
  },

  async getToken(req: Request, res: Response) {
    try {
      const { tokenId } = req.params;
      const token = await TokenModel.findOne({ tokenId });

      if (!token) {
        return res.status(404).json({ error: 'Token not found' });
      }

      res.status(200).json(token);
    } catch (error) {
      console.error('Erro ao buscar token:', error);
      res.status(500).json({ error: 'Erro ao buscar token' });
    }
  },
};

export default plansController;