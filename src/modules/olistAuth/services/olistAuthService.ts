import axios from 'axios';
import { URLSearchParams } from 'url';
import { AuthTokens } from '../../../types/blingAuth';
import dotenv from 'dotenv';
dotenv.config();

const clientID = process.env.OLIST_CLIENT_ID;
const clientSecret = process.env.OLIST_CLIENT_SECRET;
const redirectURI =
  `${process.env.CALLBACK_URL}callback/olist`;

export const getAccessToken = async (
  authorizationCode: string,
): Promise<AuthTokens> => {
  const tokenUrl =
    'https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token';

  const data = new URLSearchParams();
  data.append('grant_type', 'authorization_code');
  data.append('redirect_uri', redirectURI);
  data.append('code', authorizationCode);

  const basicAuth = Buffer.from(`${clientID}:${clientSecret}`).toString(
    'base64',
  );

  try {
    const response = await axios.post(tokenUrl, data, {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('Resposta da Tiny API:', response.data);

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    };
  } catch (error) {
    console.error(
      'Erro ao obter os tokens:',
      error.response ? error.response.data : error.message,
    );
    throw new Error('Erro ao obter os tokens de autenticação');
  }
};

export const refreshTokens = async (
  refreshToken: string,
): Promise<AuthTokens> => {
  const tokenUrl =
    'https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token';
  const data = new URLSearchParams();
  data.append('grant_type', 'refresh_token');
  data.append('refresh_token', refreshToken);

  const basicAuth = Buffer.from(`${clientID}:${clientSecret}`).toString(
    'base64',
  );

  try {
    const response = await axios.post(tokenUrl, data, {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || refreshToken, // Mantém o refresh token atual se um novo não for fornecido
    };
  } catch (error) {
    console.error('Erro ao renovar o access token:', error.message);
    throw new Error('Erro ao renovar o access token');
  }
};
