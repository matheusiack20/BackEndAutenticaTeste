"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const plansController_1 = __importDefault(require("../modules/Payments/controllers/plansController"));
const router = express_1.default.Router();
router.post('/plans/create', plansController_1.default.createPlan);
router.get('/plans', plansController_1.default.getPlans);
router.post('/customers/create', plansController_1.default.createCustomer);
router.post('/customers/:customerId/cards/create', plansController_1.default.createCard);
router.post('/subscriptions/create', plansController_1.default.createSubscription);
router.post('/tokens/generate', plansController_1.default.generateToken);
router.get('/tokens/:tokenId', plansController_1.default.getToken);
exports.default = router;
