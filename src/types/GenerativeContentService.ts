interface IGenerativeContentService {
  generateTitle(title: string, description: string, characters: string, files: Express.Multer.File[] | {
    [fieldname: string]: Express.Multer.File[];
}): Promise<string[]>;
  generateDescription(title: string, description: string, files: Express.Multer.File[] | {
    [fieldname: string]: Express.Multer.File[];
}): Promise<string[]>;
  generateMetadataTags(title: string, files: Express.Multer.File[] | {
    [fieldname: string]: Express.Multer.File[];
}): Promise<string[]>;
generateTitleIdentifier(files: Express.Multer.File[] | { 
  [fieldname: string]: Express.Multer.File[] 
}): Promise<string>;
  deleteTemporaryFiles(files: TemporaryFiles | Express.Multer.File[]): Promise<void>
}