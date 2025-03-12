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
exports.connectToDatabase2 = exports.connectToDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectToDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000, // 30 segundos
        });
        console.log('Connected to MongoDB');
    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
});
exports.connectToDatabase = connectToDatabase;
const connectToDatabase2 = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const connection = mongoose_1.default.createConnection(process.env.MONGO_URI_USER_BD);
        connection.once('open', () => {
            console.log('Connected to MongoDB (Database 2)');
        });
        connection.on('error', (err) => {
            console.error('Error connecting to MongoDB (Database 2):', err);
        });
        return connection;
    }
    catch (error) {
        console.error('Error initializing connection to MongoDB (Database 2):', error);
    }
});
exports.connectToDatabase2 = connectToDatabase2;
