import axios from 'axios';
import { URLSearchParams } from 'url';
import { AuthTokens } from '../../../types/blingAuth';
import dotenv from 'dotenv';
dotenv.config();

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = `${process.env.CALLBACK_URL}callback`;

export const getTokens = async (code: string): Promise<AuthTokens> => {
    const tokenUrl = 'https://www.bling.com.br/Api/v3/oauth/token';

    const data = new URLSearchParams();
    data.append('grant_type', 'authorization_code');
    data.append('redirect_uri', redirectUri);
    data.append('code', code);

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
        const response = await axios.post(tokenUrl, data, {
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('Resposta do Bling:', response.data);

        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
        };
    } catch (error) {
        console.log('Erro ao chamar Bling API:', error.response ? error.response.data : error.message);
        throw new Error('Erro ao obter tokens');
    }
};

export const refreshTokens = async (refreshToken: string): Promise<AuthTokens> => {
    const tokenUrl = 'https://www.bling.com.br/Api/v3/oauth/token';

    const data = new URLSearchParams();
    data.append('grant_type', 'refresh_token');
    data.append('refresh_token', refreshToken);

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
        const response = await axios.post(tokenUrl, data, {
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('Resposta de renovação do Bling:', response.data);

        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token || refreshToken, // Caso não retorne um novo refreshToken, manter o antigo
        };
    } catch (error) {
        console.log('Erro ao renovar o access token:', error.response ? error.response.data : error.message);
        throw new Error('Erro ao renovar o access token');
    }
};
