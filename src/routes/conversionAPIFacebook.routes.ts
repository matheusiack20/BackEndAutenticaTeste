import { Router } from 'express';
import cors from 'cors'
import { PostEventConversionAPIController } from '../modules/ConversionAPI/controllers/ConversionAPIController';

const sendEventConversionRouter = Router();
const postEventConversionAPIController = new PostEventConversionAPIController()

sendEventConversionRouter.use(cors())

sendEventConversionRouter.post('/api/track-event/', postEventConversionAPIController.handleRequest);

export { sendEventConversionRouter };
