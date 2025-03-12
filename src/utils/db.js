import mongoose from "mongoose";

let isConnected = false;

export const connectOnce = async () => {
  if (isConnected) {
    console.log("Já está conectado ao MongoDB.");
    return;
  }

  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    console.log("Conexão MongoDB ativa detectada a partir de uma conexão existente.");
    return;
  }

  try {
    console.log("Tentando conectar ao MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false, // Desabilita o buffering de comandos para evitar timeouts
      serverSelectionTimeoutMS: 10000, // Timeout de 10 segundos para seleção do servidor
      ssl: true,  // Habilita SSL se necessário
      tlsAllowInvalidCertificates: true, // Permite certificados SSL inválidos (caso use certificado autoassinado)
    });
    isConnected = true;
    console.log("MongoDB conectado com sucesso!");
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error);
    // Retentar a conexão após 5 segundos
    setTimeout(connectOnce, 5000);
  }

  // Eventos de conexão
  mongoose.connection.on("connected", () => {
    isConnected = true;
    console.log("Conexão ao MongoDB estabelecida.");
  });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.log("Conexão com MongoDB perdida.");
    // Retentar a conexão quando for desconectado
    setTimeout(connectOnce, 5000);
  });

  mongoose.connection.on("error", (error) => {
    isConnected = false;
    console.error("Erro de conexão com MongoDB:", error);
    // Retentar a conexão em caso de erro
    setTimeout(connectOnce, 5000);
  });
};

export default connectOnce;
