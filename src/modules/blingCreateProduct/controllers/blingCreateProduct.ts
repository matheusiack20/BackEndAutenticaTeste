import axios from 'axios';
import { Request, Response } from 'express';

const createProduct = async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization;
  const productData = req.body;

  if (!accessToken) {
    return res.status(401).json({ error: 'Access token not found' });
  }

  const url = 'https://bling.com.br/Api/v3/produtos';

  try {
    const response = await axios.post(url, productData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${accessToken}`,
      },
    });

    res.json(response.data);
  } catch (error: any) {
    console.error(
      'Erro ao criar o produto:',
      error.response?.data || error.message,
    );

    if (error.response) {
      console.error('Status do erro:', error.response.status);
      console.error(
        'Dados da resposta de erro:',
        error.response.data?.error?.fields || error.response.data,
      );
    }

    res.status(error.response?.status || 500).json({ error: error.message });
  }
};

export default createProduct;
