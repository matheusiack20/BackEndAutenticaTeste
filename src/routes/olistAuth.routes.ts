import { Router } from 'express';
import { requestOlistAuthorization, getOlistTokens, refreshOlistAccessToken } from '../modules/olistAuth/controllers/olistAuthController';
import { createOlistProduct } from '../modules/olistCreateProduct/controllers/olistCreateProductController';

const olistAuthRouter = Router();

olistAuthRouter.get('/auth/olist', requestOlistAuthorization);
olistAuthRouter.get('/callback/olist', getOlistTokens);

olistAuthRouter.post('/olist-refresh-token', refreshOlistAccessToken);
olistAuthRouter.post('/createOlistProduct', createOlistProduct);

export {olistAuthRouter}
