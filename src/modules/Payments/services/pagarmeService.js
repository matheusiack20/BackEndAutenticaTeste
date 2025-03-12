"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const PAGARME_API_KEY = process.env.PAGARME_API_KEY || '';
const PAGARME_URL = 'https://api.pagar.me/core/v5';
console.log('PAGARME_API_KEY:', PAGARME_API_KEY); // Verifica a chave de API
const pagarmeService = {
    createPlan(name, amount, interval, intervalCount) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                console.log('Tentando criar plano com os seguintes dados:', { name, amount, interval, intervalCount });
                const isAnnual = interval.toLowerCase() === 'year';
                const adjustedAmount = isAnnual ? amount * 0.5 * 12 : amount;
                const response = yield axios_1.default.post(`${PAGARME_URL}/plans`, {
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
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
                    },
                });
                console.log('Resposta da API do Pagar.me:', response.data);
                return response.data;
            }
            catch (error) {
                console.error('Erro ao criar plano:', error);
                console.error('Detalhes do erro:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message;
            }
        });
    },
    createCustomer(name, email, document, phone, billing_address) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                if (!name || !email || !document || !phone || !billing_address) {
                    throw new Error('Dados do cliente incompletos');
                }
                console.log('Dados enviados para criar cliente:', { name, email, document, phone, billing_address });
                const response = yield axios_1.default.post(`${PAGARME_URL}/customers`, {
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
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
                    },
                });
                console.log('Resposta da API do Pagar.me ao criar cliente:', response.data);
                return response.data;
            }
            catch (error) {
                console.error('Erro ao criar cliente:', error);
                console.error('Detalhes do erro:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message;
            }
        });
    },
    createCard(customerId, number, holder_name, exp_month, exp_year, cvv, billing_address) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                console.log('Dados enviados para criar cartão:', { customerId, number, holder_name, exp_month, exp_year, cvv, billing_address });
                const response = yield axios_1.default.post(`${PAGARME_URL}/customers/${customerId}/cards`, {
                    number,
                    holder_name,
                    exp_month,
                    exp_year,
                    cvv,
                    billing_address: Object.assign(Object.assign({}, billing_address), { zip_code: billing_address.zipcode }),
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
                    },
                });
                console.log('Resposta da API do Pagar.me ao criar cartão:', response.data);
                return response.data;
            }
            catch (error) {
                console.error('Erro ao criar cartão:', error);
                console.error('Detalhes do erro:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message;
            }
        });
    },
    getPlans() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const response = yield axios_1.default.get(`${PAGARME_URL}/plans`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
                    },
                });
                console.log('Dados dos planos retornados pela API do Pagar.me:', response.data);
                return response.data;
            }
            catch (error) {
                console.error('Erro ao buscar planos:', error);
                console.error('Detalhes do erro:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message;
            }
        });
    },
    createSubscription(customerId, planId, cardId, finalAmount, planName) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
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
                const response = yield axios_1.default.post(`${PAGARME_URL}/subscriptions`, {
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
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
                    },
                });
                console.log('Resposta da API do Pagar.me ao criar assinatura:', response.data);
                return response.data;
            }
            catch (error) {
                console.error('Erro ao criar assinatura:', error);
                console.error('Detalhes do erro:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message;
            }
        });
    },
    getActivePlan(customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`${PAGARME_URL}/customers/${customerId}/subscriptions`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
                    },
                });
                const activeSubscription = response.data.data.find((subscription) => subscription.status === 'active');
                return activeSubscription || null;
            }
            catch (error) {
                console.error('Erro ao buscar plano ativo:', error);
                throw error;
            }
        });
    },
};
exports.default = pagarmeService;
