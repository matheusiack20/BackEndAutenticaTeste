import { Router } from 'express';
import cors from 'cors'
import { GetCategoryShopController } from '../modules/getCategoryShop/controllers/GetCategoryShopController';

const getCategory = Router();
const getCategoryShopController = new GetCategoryShopController();
getCategory.use(cors())

getCategory.get('/', getCategoryShopController.handleRequest);

export { getCategory };
