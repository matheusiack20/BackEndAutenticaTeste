import { Request, Response } from 'express';
import { GetCategoryShopService } from '../services/GetCategoryShopService';

class GetCategoryShopController {
  async handleRequest(req: Request, res: Response): Promise<Response> {
    try {
      const accessToken = req.headers.authorization;

      if (!accessToken) {
        return res.status(401).json({ error: 'Token de acesso não fornecido' });
      }

      const categoryService = new GetCategoryShopService();
      const data = await categoryService.getCategory(accessToken);

      return res.status(200).json(data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to get category' });
    }
  }
}

export { GetCategoryShopController };
