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
exports.ConversionAPIService = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const FACEBOOK_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID;
class ConversionAPIService {
    postSendEvent(event_name, user_data, custom_data, event_source_url) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const eventData = {
                    data: [
                        {
                            event_name: event_name,
                            event_time: Math.floor(Date.now() / 1000),
                            user_data,
                            custom_data,
                            event_source_url,
                            action_source: "website"
                        }
                    ]
                };
                const response = yield axios_1.default.post(`https://graph.facebook.com/v22.0/${FACEBOOK_PIXEL_ID}/events`, eventData, {
                    headers: { 'Content-Type': 'application/json' },
                    params: { access_token: FACEBOOK_ACCESS_TOKEN }
                });
                return response.data;
            }
            catch (error) {
                throw new Error(((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            }
        });
    }
}
exports.ConversionAPIService = ConversionAPIService;
