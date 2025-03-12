import axios from 'axios';

const PAGARME_API_KEY = process.env.PAGARME_API_KEY || '';
const PAGARME_URL = 'https://api.pagar.me/core/v5';

console.log('PAGARME_API_KEY:', PAGARME_API_KEY); // Verifica a chave de API

const pagarmeService = {
  async createPlan(name: string, amount: number, interval: string, intervalCount: number) {
    try {
      console.log('Tentando criar plano com os seguintes dados:', { name, amount, interval, intervalCount });

      const isAnnual = interval.toLowerCase() === 'year';
      const adjustedAmount = isAnnual ? amount * 0.5 * 12 : amount;

      const response = await axios.post(
        `${PAGARME_URL}/plans`,
        {
          name,
          payment_methods: ['credit_card'],
          installments: isAnnual ? [12] : [1],
          interval: 'month', // Define a periodicidade como mensal
          interval_count: isAnnual ? 12 : intervalCount,
          billing_type: 'prepaid',
          pricing_scheme: {
            price: adjustedAmount,
            scheme_type: 'unit',
          },
          quantity: 1,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
          },
        }
      );

      console.log('Resposta da API do Pagar.me:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      throw new Error('Erro ao criar plano. Por favor, tente novamente.');
    }
  },

  async createCustomer(name: string, email: string, document: string, phone: string, billing_address: any) {
    try {
      if (!name || !email || !document || !phone || !billing_address) {
        throw new Error('Dados do cliente incompletos');
      }
      console.log('Dados enviados para criar cliente:', { name, email, document, phone, billing_address });

      const response = await axios.post(
        `${PAGARME_URL}/customers`,
        {
          name,
          email,
          type: 'individual',
          document,
          phones: {
            mobile_phone: {
              country_code: '55',
              area_code: phone.slice(0, 2),
              number: phone.slice(2),
            },
          },
          billing_address,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
          },
        }
      );

      console.log('Resposta da API do Pagar.me ao criar cliente:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      throw new Error('Erro ao criar cliente. Por favor, tente novamente.');
    }
  },

  async createCard(customerId: string, number: string, holder_name: string, exp_month: string, exp_year: string, cvv: string, billing_address: any) {
    try {
      console.log('Dados enviados para criar cartão:', { customerId, number, holder_name, exp_month, exp_year, cvv, billing_address });

      const response = await axios.post(
        `${PAGARME_URL}/customers/${customerId}/cards`,
        {
          number,
          holder_name,
          exp_month,
          exp_year,
          cvv,
          billing_address: {
            ...billing_address,
            zip_code: billing_address.zipcode,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
          },
        }
      );

      console.log('Resposta da API do Pagar.me ao criar cartão:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar cartão:', error);
      const errorMessage = (error as any).response?.data || (error as any).message;
      console.error('Detalhes do erro:', errorMessage);

      // Tratamento de recusas reais baseadas no refuse_reason
      if (error.response && error.response.data && error.response.data.refuse_reason) {
        switch (error.response.data.refuse_reason) {
          case 'insufficient_funds':
            throw new Error('Fundos insuficientes.');
          case 'expired_card':
            throw new Error('Cartão expirado.');
          case 'acquirer':
            throw new Error('Erro no adquirente.');
          case 'antifraud':
            throw new Error('Transação recusada por antifraude.');
          default:
            throw new Error('Transação recusada por motivo desconhecido.');
        }
      } else {
        throw new Error('Erro ao criar cartão. Por favor, tente novamente.');
      }
    }
  },

  async getPlans() {
    try {
      const response = await axios.get(`${PAGARME_URL}/plans`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
        },
      });
      console.log('Dados dos planos retornados pela API do Pagar.me:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      throw new Error('Erro ao buscar planos. Por favor, tente novamente.');
    }
  },

  async createSubscription(
    customerId: string,
    planId: string,
    cardId: string,
    finalAmount: number,
    planName: string
  ) {
    try {
      console.log('Dados enviados para criar assinatura:', {
        customerId,
        planId,
        cardId,
        finalAmount,
        planName
      });
  
      if (!planId) {
        throw new Error('O planId não pode ser nulo ou indefinido.');
      }
  
      if (finalAmount === null || finalAmount === undefined) {
        throw new Error('O valor final não pode ser nulo ou indefinido.');
      }
  
      const isAnnual = planName.toLowerCase().includes('anual');
      const totalAmount = isAnnual ? finalAmount * 0.5 * 12 : finalAmount;
  
      const item = {
        name: planName,
        description: `Assinatura do plano ${planName}`,
        quantity: 1,
        pricing_scheme: {
          price: totalAmount,
        },
      };
  
      console.log('Items enviados na assinatura:', JSON.stringify([item], null, 2));
  
      const response = await axios.post(
        `${PAGARME_URL}/subscriptions`,
        {
          customer_id: customerId,
          plan_id: planId,
          payment_method: 'credit_card',
          card_id: cardId,
          metadata: {
            plan_name: planName,
            plan_interval: isAnnual ? 'Anual' : 'Mensal',
          },
          interval: 'month', // Define a periodicidade como mensal
          interval_count: isAnnual ? 12 : 1, // Define a contagem do intervalo
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
          },
        }
      );
  
      console.log('Resposta da API do Pagar.me ao criar assinatura:', response.data);
  
      return response.data;
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      throw new Error('Erro ao criar assinatura. Por favor, tente novamente.');
    }
  },

  async getActivePlan(customerId: string) {
    try {
      const response = await axios.get(`${PAGARME_URL}/customers/${customerId}/subscriptions`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
        },
      });

      const activeSubscription = response.data.data.find((subscription: any) => subscription.status === 'active');

      return activeSubscription || null;
    } catch (error) {
      console.error('Erro ao buscar plano ativo:', error);
      throw new Error('Erro ao buscar plano ativo. Por favor, tente novamente.');
    }
  },

  handleRefuseReason(refuseReason: string) {
    switch (refuseReason) {
      case 'insufficient_funds':
        throw new Error('Fundos insuficientes.');
      case 'expired_card':
        throw new Error('Cartão expirado.');
      case 'acquirer':
        throw new Error('Erro no adquirente.');
      case 'antifraud':
        throw new Error('Transação recusada por antifraude.');
      default:
        throw new Error('Transação recusada por motivo desconhecido.');
    }
  }
};

export default pagarmeService;