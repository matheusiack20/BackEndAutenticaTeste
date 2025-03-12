import axios from 'axios';
import { Request, Response } from 'express';

const createOlistProduct = async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization;
  console.log('Token recebido:', accessToken);

  const productData = req.body;

  if (!accessToken) {
    return res.status(401).json({ error: 'Access token not found' });
  }

  const url = 'https://api.tiny.com.br/public-api/v3/produtos';

  try {
    console.log('Dados do produto recebidos no backend:', productData);

    const response = await axios.post(url, productData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${accessToken}`,
      },
    });

    console.log('Produto criado com sucesso:', response.data);
    res.json(response.data);
  } catch (error: any) {
    console.error('Erro ao criar o produto no Olist:', error.response?.data || error.message);

    if (error.response) {
      console.error('Status do erro:', error.response.status);
      console.error('Dados da resposta de erro:', error.response.data?.error?.fields || error.response.data);
    }

    res.status(error.response?.status || 500).json({ error: error.message });
  }
};

export { createOlistProduct };
