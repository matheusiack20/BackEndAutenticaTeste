import { Request, Response } from 'express';
import { getTokens, refreshTokens } from '../services/blingAuthService';
import { AuthTokens } from '../../../types/blingAuth';

export const blingAuth = (req: Request, res: Response) => {
  const authorizationUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&state=a0424e40c7c59fd35040c25b396ee96c`;
  res.redirect(authorizationUrl);
};

export const callback = async (req: Request, res: Response) => {
  const code = req.query.code as string;

  if (!code) {
    return res.send('Nenhum código de autorização fornecido.');
  }

  try {
    const tokens: AuthTokens = await getTokens(code);

    // redirecionar para o front-end com os tokens como parâmetros de URL
    res.redirect(
      `${process.env.FRONTEND_CALLBACK}?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  } catch (error) {
    console.log('Erro ao obter tokens:', error.message);
    res.status(500).send(`Erro ao obter tokens: ${error.message}`);
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const tokens: AuthTokens = await refreshTokens(refreshToken);
    res.json(tokens); // Retorna os novos tokens para o front-end
  } catch (error) {
    console.log('Erro ao renovar access token:', error.message);
    res.status(500).send(`Erro ao renovar access token: ${error.message}`);
  }
};
