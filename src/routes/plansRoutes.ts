import express from 'express';
import plansController from '../modules/Payments/controllers/plansController';

const router = express.Router();

router.post('/plans/create', plansController.createPlan);
router.get('/plans', plansController.getPlans);
router.post('/customers/create', plansController.createCustomer);
router.post('/customers/:customerId/cards/create', plansController.createCard);
router.post('/subscriptions/create', plansController.createSubscription);
router.post('/tokens/generate', plansController.generateToken);
router.get('/tokens/:tokenId', plansController.getToken);

export default router;
