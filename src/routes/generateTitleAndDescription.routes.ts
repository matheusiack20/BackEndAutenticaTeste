import { v4 as uuidv4 } from 'uuid';
import { Router } from 'express';
import multer from 'multer';
import { GenerativeContentService } from '../modules/generateTitleAndDescription/services/GenerativeContentService';
import { GenerateTitleAndDescriptionController } from '../modules/generateTitleAndDescription/controllers/GenerateTitleAndDescriptonController';

const path = require('path');
const generateTitleAndDescription = Router();
const generativeContentService = new GenerativeContentService();
const generateTitleAndDescriptionController =
  new GenerateTitleAndDescriptionController(generativeContentService);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fieldSize: 12 * 1024 * 1024 }, //12MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb, req);
  },
});

function checkFileType(file, cb, req) {
  const filetypes = /jpeg|jpg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    if (file.size > 25 * 1024 * 1024) {
      cb(null, false);
      req.fileValidationError = {
        code: 'FILE_TOO_LARGE',
        message: `O arquivo deve conter até 25MB.`,
      };
    } else {
      cb(null, true);
    }
  } else {
    cb(null, false);
    req.fileValidationError = {
      code: 'INVALID_FILE_FORMAT',
      message: `O arquivo enviado não é um formato válido. Os formatos permitidos são JPEG, JPG, PNG e WebP.`,
    };
  }
}

const validationErrorMiddleware = (req, res, next) => {
  if (req.fileValidationError) {
    const error = req.fileValidationError;
    return res.status(400).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }
  next();
};

generateTitleAndDescription.post(
  '/',
  upload.array('photos', 3),
  validationErrorMiddleware,
  generateTitleAndDescriptionController.handleRequest.bind(
    generateTitleAndDescriptionController,
  ),
);

export { generateTitleAndDescription };
