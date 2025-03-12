import { Router } from 'express';
import { blingAuth, callback, refreshAccessToken } from '../modules/blingAuth/controllers/blingAuthController';
import createProduct from '../modules/blingCreateProduct/controllers/blingCreateProduct'
import cors from 'cors'

const blingAuthRouter = Router();

blingAuthRouter.use(cors())

blingAuthRouter.get('/blingAuth', blingAuth);
blingAuthRouter.get('/callback', callback);
blingAuthRouter.post('/refresh-token', refreshAccessToken);

export { blingAuthRouter };
