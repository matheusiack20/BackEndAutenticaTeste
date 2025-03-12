"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const mongoose_1 = __importStar(require("mongoose"));
const argon2_1 = __importDefault(require("argon2"));
// Definição do Schema do User
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (v) {
                return /\S+@\S+\.\S+/.test(v); // Validação simples para o formato de email
            },
            message: props => `${props.value} não é um email válido!`
        }
    },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: "user" },
    image: { type: String, default: "/Generic_avatar.png" },
    announcementCount: { type: Number, default: 0 },
    isTrial: { type: Boolean, default: false },
    plan: { type: Number, default: null }, // Certifique-se de que o campo `plan` está presente e com valor padrão
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
}, {
    timestamps: true, // Cria os campos createdAt e updatedAt automaticamente
});
// Metodo para comparar a senha fornecida com a armazenada
userSchema.methods.comparePassword = function (password) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = this;
        return argon2_1.default.verify(user.password, password);
    });
};
// Função estática para encontrar o usuário e verificar a senha
userSchema.statics.findUserWithPassword = function (email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Procurando usuário com email:", email);
            const user = yield this.findOne({ email: email.trim() });
            if (!user) {
                console.log("Usuário não encontrado para email:", email);
                return null;
            }
            const isValid = yield argon2_1.default.verify(user.password, password.trim()); // Verifica se a senha fornecida é válida
            if (!isValid) {
                console.log("Senha incorreta para email:", email);
                return null;
            }
            console.log("Usuário encontrado e senha verificada para email:", email);
            return user;
        }
        catch (error) {
            console.error("Erro ao encontrar usuário com a senha:", error);
            return null; // Ou lançar erro dependendo da sua estratégia de tratamento de erro
        }
    });
};
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = this;
        if (user.isModified('password')) {
            const isAlreadyHashed = user.password.startsWith('$argon2');
            if (!isAlreadyHashed) {
                user.password = yield argon2_1.default.hash(user.password);
            }
        }
        next();
    });
});
// Verifica se o modelo já está registrado para evitar sobrescrever
const User = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
exports.default = User;
