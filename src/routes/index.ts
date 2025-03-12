import { Router } from 'express';
import { blingAuthRouter } from './blingAuth.routes';
import { olistAuthRouter } from './olistAuth.routes';
import { sendEventConversionRouter} from './conversionAPIFacebook.routes'
import { generateTitleAndDescription } from './generateTitleAndDescription.routes';
import cors from 'cors';
import { createProductRoute } from './createProduct.routes';
import { getProducts } from './getProducts.routes';
import { getCategory } from './getCategoryShop.routes';
const router = Router();

router.use(cors());

router.use(blingAuthRouter);
router.use(olistAuthRouter);
router.use('/createProduct', createProductRoute);
router.use('/generateTitleAndDescription', generateTitleAndDescription);
router.use('/getProducts', getProducts);
router.use('/getCategory', getCategory);
router.use(sendEventConversionRouter);
export { router };
