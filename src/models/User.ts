import mongoose, { Schema, Document, Model } from "mongoose";
import argon2 from "argon2";

// Interface para tipagem do documento User
interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: string;
  image: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  announcementCount: number;
  isTrial: boolean;
  authToken: string;
  plan: number | null; // Certifique-se de que o campo `plan` está presente
  comparePassword: (password: string) => Promise<boolean>;
}

// Interface para o modelo User, que inclui o metodo estático
interface IUserModel extends Model<IUser> {
  findUserWithPassword: (email: string, password: string) => Promise<IUser | null>;
}

// Definição do Schema do User
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v: string) {
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
  },
  {
    timestamps: true, // Cria os campos createdAt e updatedAt automaticamente
  }
);

// Metodo para comparar a senha fornecida com a armazenada
userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  const user = this as IUser;
  return argon2.verify(user.password, password);
};

// Função estática para encontrar o usuário e verificar a senha
userSchema.statics.findUserWithPassword = async function (
  email: string,
  password: string
): Promise<IUser | null> {
  try {
    console.log("Procurando usuário com email:", email);
    const user = await this.findOne({ email: email.trim() });
    if (!user) {
      console.log("Usuário não encontrado para email:", email);
      return null;
    }

    const isValid = await argon2.verify(user.password, password.trim()); // Verifica se a senha fornecida é válida
    if (!isValid) {
      console.log("Senha incorreta para email:", email);
      return null;
    }

    console.log("Usuário encontrado e senha verificada para email:", email);
    return user;
  } catch (error) {
    console.error("Erro ao encontrar usuário com a senha:", error);
    return null; // Ou lançar erro dependendo da sua estratégia de tratamento de erro
  }
};

userSchema.pre('save', async function (next) {
  const user = this as IUser;
  if (user.isModified('password')) {
    const isAlreadyHashed = user.password.startsWith('$argon2');
    if (!isAlreadyHashed) {
      user.password = await argon2.hash(user.password);
    }
  }
  next();
});

// Verifica se o modelo já está registrado para evitar sobrescrever
const User = (mongoose.models.User as IUserModel) || mongoose.model<IUser, IUserModel>("User", userSchema);

export default User;