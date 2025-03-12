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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostEventConversionAPIController = void 0;
const ConversionAPIService_1 = require("../services/ConversionAPIService");
class PostEventConversionAPIController {
    handleRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(req.body);
                const { event_name, user_data, custom_data, event_source_url } = req.body;
                const conversionAPIService = new ConversionAPIService_1.ConversionAPIService();
                const data = yield conversionAPIService.postSendEvent(event_name, user_data, custom_data, event_source_url);
                return res.status(200).json(data);
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ error: 'Failed to send event' });
            }
        });
    }
}
exports.PostEventConversionAPIController = PostEventConversionAPIController;
