import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const FACEBOOK_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID;

export class ConversionAPIService {

    async postSendEvent(event_name, user_data, custom_data, event_source_url) {
        try {
            const eventData = {
                data: [
                    {
                        event_name: event_name,
                        event_time: Math.floor(Date.now() / 1000),
                        user_data,
                        custom_data,
                        event_source_url,
                        action_source: "website"
                    }
                ]
            };

            const response = await axios.post(
                `https://graph.facebook.com/v22.0/${FACEBOOK_PIXEL_ID}/events`,
                eventData,
                {
                    headers: { 'Content-Type': 'application/json' },
                    params: { access_token: FACEBOOK_ACCESS_TOKEN }
                }
            );

            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || error.message);
        }
    }
}