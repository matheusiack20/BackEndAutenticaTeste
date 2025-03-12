import { Request, Response } from 'express';
import { ConversionAPIService } from '../services/ConversionAPIService';

class PostEventConversionAPIController {

    async handleRequest(req: Request, res: Response): Promise<Response> {
        try {
            console.log(req.body)
            const { event_name, user_data, custom_data, event_source_url } = req.body;

            const conversionAPIService = new ConversionAPIService()
            
            const data = await conversionAPIService.postSendEvent(event_name, user_data, custom_data, event_source_url);

            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to send event' });
        }
    }
}

export { PostEventConversionAPIController };
