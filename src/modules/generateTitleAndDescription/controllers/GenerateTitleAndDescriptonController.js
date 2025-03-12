"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateTitleAndDescriptionController = void 0;
const zod_1 = require("zod");
const requestCounter_1 = require("../../../utils/requestCounter");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class GenerateTitleAndDescriptionController {
    constructor(generativeContentService) {
        this.generativeContentService = generativeContentService;
    }
    handleRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
            let userId;
            try {
                const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                userId = decodedToken.id;
                console.log("ESSE É MEU USER ID: ", userId);
            }
            catch (error) {
                return res.status(401).json({ error: 'Token inválido' });
            }
            const generateTitleAndDescriptionSchema = zod_1.z.object({
                title: zod_1.z.string(),
                characters: zod_1.z.string(),
                description: zod_1.z.string().optional(),
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
                        const title_identified = yield this.generativeContentService.generateTitleIdentifier(files);
                        promises.push(this.generativeContentService.generateTitle(title_identified, description, characters, files));
                        promises.push(this.generativeContentService.generateDescription(title_identified, description, files));
                        promises.push(this.generativeContentService.generateMetadataTags(title_identified, files));
                    }
                    else if (/^\s*$/.test(title) == false && files.length !== 0) {
                        const title_identified = yield this.generativeContentService.generateTitleIdentifier(files);
                        const title_double = `${title_identified} com ênfase em: ${title}`;
                        promises.push(this.generativeContentService.generateTitle(title_double, description, characters, files));
                        promises.push(this.generativeContentService.generateDescription(title_double, description, files));
                        promises.push(this.generativeContentService.generateMetadataTags(title_double, files));
                    }
                    else {
                        promises.push(this.generativeContentService.generateTitle(title, description, characters, files));
                        promises.push(this.generativeContentService.generateDescription(title, description, files));
                        promises.push(this.generativeContentService.generateMetadataTags(title, files));
                    }
                }
                const results = yield Promise.all(promises);
                for (const result of results) {
                    if (result.status && result.message) {
                        console.log('Error in result:', result);
                        return res.status(result.status).json({ error: result.message });
                    }
                }
                const finalResult = {};
                if (title || files.length !== 0) {
                    finalResult.title = results[0];
                    finalResult.description = results[1];
                    finalResult.metaTags = results[2];
                    yield (0, requestCounter_1.incrementRequestCount)(userId);
                }
                else {
                    finalResult.title = null;
                    finalResult.description = null;
                    finalResult.metaTags = null;
                }
                yield this.generativeContentService.deleteTemporaryFiles(files);
                return res.status(200).json(finalResult);
            }
            catch (error) {
                console.error('Error generating content:', error);
                yield this.generativeContentService.deleteTemporaryFiles(files);
                return res.status(500).json({ error: 'Failed to generate content' });
            }
        });
    }
}
exports.GenerateTitleAndDescriptionController = GenerateTitleAndDescriptionController;
