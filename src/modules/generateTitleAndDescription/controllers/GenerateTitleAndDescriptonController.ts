import { Request, Response } from 'express';
import { GenerativeContentService } from '../services/GenerativeContentService';
import { z } from 'zod';
import { incrementRequestCount } from '../../../utils/requestCounter';
import jwt from 'jsonwebtoken';

class GenerateTitleAndDescriptionController {
  private generativeContentService: GenerativeContentService;

  constructor(generativeContentService: GenerativeContentService) {
    this.generativeContentService = generativeContentService;
  }

  async handleRequest(req: Request, res: Response): Promise<Response> {
    console.log('Received request:', req.body);

    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    let userId: string;
    try {
      const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET);
      userId = decodedToken.id;
      console.log("ESSE É MEU USER ID: ", userId);
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const generateTitleAndDescriptionSchema = z.object({
      title: z.string(),
      characters: z.string(),
      description: z.string().optional(),
    });

    const result = generateTitleAndDescriptionSchema.safeParse(req.body);
    console.log("console do req.body", req.body);

    if (!result.success) {
      console.log('Validation failed:', result.error);
      return res.status(400).json({
        error: result.error.issues.map((issue) => ({
          code: issue.code,
          message: issue.message,
          path: issue.path,
        })),
      });
    }

    const { title, characters = '60', description } = result.data;
    const files = req.files || [];

    if (!title && files.length === 0) {
      console.log('Title and files are missing');
      return res.status(400).json({ error: 'You must provide a title' });
    }

    try {
      const promises = [];
      if (/^\s*$/.test(title) !== true || files.length !== 0) {
        if (/^\s*$/.test(title) && files.length !== 0) {
          const title_identified = await this.generativeContentService.generateTitleIdentifier(files);
          promises.push(
            this.generativeContentService.generateTitle(title_identified, description, characters, files),
          );
          promises.push(
            this.generativeContentService.generateDescription(title_identified, description, files),
          );
          promises.push(
            this.generativeContentService.generateMetadataTags(title_identified, files),
          );
        } else if (/^\s*$/.test(title) == false && files.length !== 0) {
          const title_identified = await this.generativeContentService.generateTitleIdentifier(files);
          const title_double = `${title_identified} com ênfase em: ${title}`;
          promises.push(
            this.generativeContentService.generateTitle(title_double, description, characters, files),
          );
          promises.push(
            this.generativeContentService.generateDescription(title_double, description, files),
          );
          promises.push(
            this.generativeContentService.generateMetadataTags(title_double, files),
          );
        } else {
          promises.push(
            this.generativeContentService.generateTitle(title, description, characters, files),
          );
          promises.push(
            this.generativeContentService.generateDescription(title, description, files),
          );
          promises.push(
            this.generativeContentService.generateMetadataTags(title, files),
          );
        }
      }

      const results = await Promise.all(promises);

      for (const result of results) {
        if (result.status && result.message) {
          console.log('Error in result:', result);
          return res.status(result.status).json({ error: result.message });
        }
      }

      const finalResult: { [key: string]: string[] | null } = {};
      if (title || files.length !== 0) {
        finalResult.title = results[0];
        finalResult.description = results[1];
        finalResult.metaTags = results[2];
        await incrementRequestCount(userId);
      } else {
        finalResult.title = null;
        finalResult.description = null;
        finalResult.metaTags = null;
      }

      await this.generativeContentService.deleteTemporaryFiles(files);
      return res.status(200).json(finalResult);
    } catch (error) {
      console.error('Error generating content:', error);
      await this.generativeContentService.deleteTemporaryFiles(files);
      return res.status(500).json({ error: 'Failed to generate content' });
    }
  }
}

export { GenerateTitleAndDescriptionController };