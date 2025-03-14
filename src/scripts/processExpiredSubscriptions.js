/**
 * Script para verificar e processar assinaturas expiradas
 * Este script deve ser executado diariamente através de um agendador como o cron
 * 
 * Exemplo de configuração no crontab:
 * 0 1 * * * node /path/to/processExpiredSubscriptions.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Configurar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Função para conectar ao MongoDB
async function connectToDatabase() {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Conectado ao MongoDB com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    return false;
  }
}

// Função principal
async function main() {
  try {
    // Conectar ao banco de dados
    const connected = await connectToDatabase();
    if (!connected) {
      console.error('Não foi possível conectar ao banco de dados. Encerrando...');
      process.exit(1);
    }

    // Importar serviço de assinatura
    const subscriptionService = require('../services/subscriptionService');
    
    // Processar assinaturas expiradas
    console.log('Processando assinaturas expiradas...');
    const result = await subscriptionService.processExpiredSubscriptions();
    
    console.log('\n===== RESUMO DO PROCESSAMENTO =====');
    console.log(`Total de assinaturas verificadas: ${result.processed}`);
    console.log(`Assinaturas marcadas como expiradas: ${result.expired}`);
    console.log(`Erros durante o processamento: ${result.errors}`);
    
    // Registrar execução em um log
    const logDir = path.resolve(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, 'subscription_expiry_check.log');
    const logEntry = `[${new Date().toISOString()}] Verificadas: ${result.processed}, Expiradas: ${result.expired}, Erros: ${result.errors}\n`;
    
    fs.appendFileSync(logFile, logEntry);
    
    // Desconectar do banco de dados
    mongoose.disconnect();
    console.log('Processamento concluído');
  } catch (error) {
    console.error('Erro durante execução do script:', error);
    process.exit(1);
  }
}

// Executar script
main();
