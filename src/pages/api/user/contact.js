import mailjet from "node-mailjet";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  try {
    const client = mailjet.apiConnect(
      process.env.MJ_APIKEY_PUBLIC,
      process.env.MJ_APIKEY_PRIVATE
    );

    const response = await client.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: process.env.RECIPIENT_EMAIL, // Substitua pelo email do seu domínio
            Name: "Contato MapMarketplaces",
          },
          To: [
            {
              Email: process.env.RECIPIENT_EMAIL, // Substitua pelo email do suporte ou destinatário
              Name: "Destinatário",
            },
          ],
          Subject: "Nova Mensagem de Contato",
          TextPart: `Mensagem de ${name} (${email}): ${message}`,
          HTMLPart: `<p><strong>Nome:</strong> ${name}</p>
                     <p><strong>Email:</strong> ${email}</p>
                     <p><strong>Mensagem:</strong> ${message}</p>`,
        },
      ],
    });

    console.log("Resposta do Mailjet:", response.body);

    res.status(200).json({ message: "Mensagem enviada com sucesso!" });
  } catch (error) {
    console.error("Erro no Mailjet:", error);
    res.status(500).json({ error: "Erro ao enviar mensagem." });
  }
}
