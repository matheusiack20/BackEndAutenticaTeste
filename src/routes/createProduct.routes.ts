import { Router } from 'express';
import createProduct from '../modules/blingCreateProduct/controllers/blingCreateProduct'
import cors from 'cors'

const createProductRoute = Router();

createProductRoute.use(cors())

createProductRoute.post('/', createProduct);

export { createProductRoute };
