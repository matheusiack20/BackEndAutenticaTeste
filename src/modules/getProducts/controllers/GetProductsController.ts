import { Request, Response } from 'express';
import { z } from 'zod';
import { GetProductsService } from '../services/GetProductsService';

class GetProductsController {
  async handleRequest(req: Request, res: Response): Promise<Response> {
    try {
      const accessToken = req.headers.authorization;
      const nameProduct = req.query.nameProduct as string;

      if (!accessToken) {
        return res.status(401).json({ error: 'Token de acesso não fornecido' });
      }

      if (!nameProduct) {
        return res.status(400).json({ error: 'Nome do produto não fornecido' });
      }

      const getProductsSchema = z.object({
        nameProduct: z.string().min(2),
      });

      const result = getProductsSchema.safeParse({ nameProduct });

      if (!result.success) {
        return res.status(400).json({
          error: result.error.issues.map((issue) => ({
            code: issue.code,
            message: issue.message,
            path: issue.path,
          })),
        });
      }

      const productService = new GetProductsService();
      const data = await productService.getProducts(nameProduct, accessToken);

      return res.status(200).json(data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to get products' });
    }
  }
}

export { GetProductsController };
