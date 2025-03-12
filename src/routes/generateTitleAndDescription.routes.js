"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTitleAndDescription = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const GenerativeContentService_1 = require("../modules/generateTitleAndDescription/services/GenerativeContentService");
const GenerateTitleAndDescriptonController_1 = require("../modules/generateTitleAndDescription/controllers/GenerateTitleAndDescriptonController");
const path = require('path');
const generateTitleAndDescription = (0, express_1.Router)();
exports.generateTitleAndDescription = generateTitleAndDescription;
const generativeContentService = new GenerativeContentService_1.GenerativeContentService();
const generateTitleAndDescriptionController = new GenerateTitleAndDescriptonController_1.GenerateTitleAndDescriptionController(generativeContentService);
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
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
        }
        else {
            cb(null, true);
        }
    }
    else {
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
generateTitleAndDescription.post('/', upload.array('photos', 3), validationErrorMiddleware, generateTitleAndDescriptionController.handleRequest.bind(generateTitleAndDescriptionController));
