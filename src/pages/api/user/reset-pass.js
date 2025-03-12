import User from "../../../models/User";
import argon2 from "argon2";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { token, newPassword } = req.body;

    // Verifica se o token e a nova senha foram fornecidos
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "Token e nova senha são obrigatórios." });
    }

    try {
      // Procura o usuário com o token correspondente e verifica se ainda é válido
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }, // O token ainda deve estar válido
      });

      // Verifica se o usuário foi encontrado e se o token não está expirado
      if (!user) {
        return res.status(400).json({ success: false, message: "Token inválido ou expirado." });
      }

      // Hash da nova senha usando argon2 para garantir segurança
      const hashedPassword = await argon2.hash(newPassword);
      user.password = hashedPassword;

      // Remove o token e a data de expiração, pois já não são mais necessários
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      // Salva as atualizações no banco de dados
      await user.save();

      return res.status(200).json({ success: true, message: "Senha redefinida com sucesso." });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      return res.status(500).json({ success: false, message: "Erro interno do servidor." });
    }
  } else {
    // Define os métodos permitidos para essa rota como POST
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, message: `Método ${req.method} não permitido.` });
  }
}
