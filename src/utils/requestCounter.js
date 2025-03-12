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
exports.incrementRequestCount = void 0;
const User_1 = __importDefault(require("../models/User"));
const database_1 = require("../config/database");
const incrementRequestCount = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Connect to MongoDB and update announcementCount
    const userDBConnection = yield (0, database_1.connectToDatabase2)();
    const UserModel = userDBConnection.model('User', User_1.default.schema);
    yield UserModel.findByIdAndUpdate(userId, {
        $inc: { announcementCount: 1 },
    });
    console.log(`User ${userId} announcementCount incremented`);
});
exports.incrementRequestCount = incrementRequestCount;
