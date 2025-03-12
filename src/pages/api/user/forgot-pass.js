import mailjet from "node-mailjet";
import dotenv from "dotenv";
import crypto from "crypto";
import User from "../../../models/User";
import htmlContent from "./indexEmail";
import { connectOnce } from "../../../utils/db"; // Certifique-se de que este caminho está correto

dotenv.config();

// Conexão com a api do MAILJET
const mailjetClient = mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);


export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, message: `Método ${req.method} não permitido.` });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "E-mail é obrigatório." });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "E-mail inválido." });
  }

  try{

    await connectOnce();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuário não encontrado." });
    }
    // Geração do token de recuperação e expiração
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora de validade
    await user.save();

    const resetUrl = `${process.env.CALLBACK_URL}/api/auth/reset-password`;
    // Substitui {{RESET_URL}} e {{TOKEN}} no conteúdo do e-mail
    const emailHtml = htmlContent
      .replace("{{RESET_URL}}", resetUrl)  // Link completo
      .replace("{{TOKEN}}", token);        // Token isolado

      const emailData = {
        Messages: [
          {
            From: {
              Email: process.env.MAILJET_SENDER_EMAIL,
              Name: process.env.MAILJET_SENDER_NAME,
            },
            To: [
              {
                Email: email,
                Name: user.name || "Usuário",
              },
            ],
            Subject: "Recuperação de Senha",
            HTMLPart: emailHtml,
          },
        ],
      };
    await mailjetClient.post("send", { version: "v3.1" }).request(emailData);
    return res.status(200).json({ success: true, message: "E-mail de recuperação enviado." });

  } catch (error) {
    console.error("Erro ao enviar o e-mail:", error);
    return res.status(500).json({ success: false, message: "Erro ao enviar o e-mail." });
  }
}
