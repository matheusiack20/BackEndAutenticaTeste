"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.r2 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
exports.r2 = new client_s3_1.S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_ENDPOINT,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    },
});
