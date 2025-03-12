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
const pagarmeService_1 = __importDefault(require("../services/pagarmeService"));
const tokenModel_1 = require("../models/tokenModel"); // Correct the import path
const plansController = {
    createPlan(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, amount, interval, intervalCount } = req.body;
                const createdPlan = yield pagarmeService_1.default.createPlan(name, amount, interval, intervalCount);
                console.log('Plano criado:', createdPlan);
                res.status(201).json({ message: 'Plano criado com sucesso', plan: createdPlan });
            }
            catch (error) {
                console.error('Erro ao criar plano:', error);
                res.status(500).json({ message: 'Erro ao criar plano', error: error.message });
            }
        });
    },
    createCustomer(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { name, email, document, phone, billing_address } = req.body;
                console.log('Dados recebidos para criar cliente:', { name, email, document, phone, billing_address });
                if (!name || !email || !document || !phone || !billing_address) {
                    throw new Error('Dados do cliente incompletos');
                }
                const createdCustomer = yield pagarmeService_1.default.createCustomer(name, email, document, phone, billing_address);
                console.log('Resposta da API ao criar cliente:', createdCustomer);
                console.log('Cliente criado:', createdCustomer);
                res.status(201).json({ message: 'Cliente criado com sucesso', customer: createdCustomer });
            }
            catch (error) {
                console.error('Erro ao criar cliente:', error);
                console.error('Detalhes do erro:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message); // Adicione este log
                res.status(500).json({ message: 'Erro ao criar cliente', error: error.message });
            }
        });
    },
    createCard(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { customerId } = req.params;
                const { card_number, card_holder_name, exp_month, exp_year, card_cvv, billing_address } = req.body;
                console.log('Dados recebidos para criar cartão:', { customerId, card_number, card_holder_name, exp_month, exp_year, card_cvv, billing_address });
                const createdCard = yield pagarmeService_1.default.createCard(customerId, card_number, card_holder_name, exp_month, exp_year, card_cvv, Object.assign(Object.assign({}, billing_address), { zip_code: billing_address.zipcode // Certifique-se de que o campo zip_code está presente
                 }));
                console.log('Resposta da API ao criar cartão:', createdCard);
                console.log('Cartão criado:', createdCard);
                res.status(201).json({ message: 'Cartão criado com sucesso', card: createdCard });
            }
            catch (error) {
                console.error('Erro ao criar cartão:', error);
                console.error('Detalhes do erro:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message); // Adicione este log
                res.status(500).json({ message: 'Erro ao criar cartão', error: error.message });
            }
        });
    },
    getPlans(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
            }
            catch (error) {
                console.error('Erro ao buscar planos:', error);
                res.status(500).json({ message: 'Erro ao buscar planos', error: error.message });
            }
        });
    },
    createSubscription(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { customerId, planId, cardId, finalAmount, planName } = req.body;
                console.log('Dados recebidos para criar assinatura:', { customerId, planId, cardId, finalAmount, planName });
                if (!customerId || !planId || !cardId || finalAmount === undefined || finalAmount === null || planName === undefined) {
                    throw new Error('Dados da assinatura incompletos');
                }
                const createdSubscription = yield pagarmeService_1.default.createSubscription(customerId, planId, cardId, finalAmount, planName);
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
            }
            catch (error) {
                console.error('Erro ao criar assinatura:', error);
                console.error('Detalhes do erro:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                res.status(500).json({ message: 'Erro ao criar assinatura', error: error.message });
            }
        });
    },
    generateToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { planId, planName, planAmount, planInterval, planIntervalCount, planDescription } = req.body;
                const tokenId = `${planId}-${Date.now()}`; // Generate a simple token ID
                // Save the token to the database
                const token = new tokenModel_1.TokenModel({
                    tokenId,
                    planId,
                    planName,
                    planAmount,
                    planInterval,
                    planIntervalCount,
                    planDescription,
                });
                yield token.save();
                res.status(200).json({ tokenId, planId, planName, planAmount, planInterval, planIntervalCount, planDescription });
            }
            catch (error) {
                console.error('Erro ao gerar token:', error);
                res.status(500).json({ error: 'Erro ao gerar token' });
            }
        });
    },
    getToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { tokenId } = req.params;
                const token = yield tokenModel_1.TokenModel.findOne({ tokenId });
                if (!token) {
                    return res.status(404).json({ error: 'Token not found' });
                }
                res.status(200).json(token);
            }
            catch (error) {
                console.error('Erro ao buscar token:', error);
                res.status(500).json({ error: 'Erro ao buscar token' });
            }
        });
    },
};
exports.default = plansController;
