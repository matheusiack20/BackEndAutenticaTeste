import { Request, Response } from 'express';
import { getAccessToken, refreshTokens } from '../services/olistAuthService';
import { AuthTokens } from '../../../types/blingAuth';

const clientID = process.env.OLIST_CLIENT_ID;
const redirectURI =
  `${process.env.CALLBACK_URL}callback/olist`;

export const requestOlistAuthorization = (req: Request, res: Response) => {
  const authorizationURL = `https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/auth?client_id=${clientID}&redirect_uri=${redirectURI}&scope=openid&response_type=code`;
  res.redirect(authorizationURL);
};

export const getOlistTokens = async (req: Request, res: Response) => {
  const code = req.query.code as string;

  if (!code) {
    return res.send('Nenhum código de autorização fornecido.');
  }

  try {
    const tokens: AuthTokens = await getAccessToken(code);

    res.redirect(
      `${process.env.FRONTEND_CALLBACK}?olistAccessToken=${tokens.accessToken}&olistRefreshToken=${tokens.refreshToken}`,
    );
  } catch (error) {
    console.log('Erro ao obter tokens:', error.message);
    res.status(500).send(`Erro ao obter tokens: ${error.message}`);
  }
};

export const refreshOlistAccessToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).send('Nenhum refresh token fornecido');
  }

  try {
    const tokens = await refreshTokens(refreshToken as string);
    res.json(tokens);
  } catch (error) {
    res.status(500).send(error.message);
  }
};
