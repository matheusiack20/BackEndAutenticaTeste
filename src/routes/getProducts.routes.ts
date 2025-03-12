import { Router } from 'express';
import cors from 'cors'
import { GetProductsController } from '../modules/getProducts/controllers/GetProductsController';

const getProducts = Router();
const getProductsController = new GetProductsController();
getProducts.use(cors())

getProducts.get('/', getProductsController.handleRequest);

export { getProducts };
