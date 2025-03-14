/**
 * Script para processar assinaturas pendentes que não foram associadas a usuários
 * durante o processo de checkout
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userService = require('../services/userService');
// Importar utilitário de gerenciamento de diretórios
const dirManager = require('../utils/dirManager');

// Configurar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Garantir que os diretórios existem
dirManager.initDirectories();

// Caminho para a pasta de assinaturas pendentes
const PENDING_DIR = dirManager.paths.PENDING_SUBSCRIPTIONS_DIR;

// Conectar ao MongoDB
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

// Buscar todos os arquivos de assinaturas pendentes
function findPendingSubscriptions() {
  try {
    if (!fs.existsSync(PENDING_DIR)) {
      console.log(`O diretório ${PENDING_DIR} não existe`);
      return [];
    }

    const files = fs.readdirSync(PENDING_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    console.log(`Encontrados ${jsonFiles.length} arquivos de assinaturas pendentes`);
    return jsonFiles.map(file => path.join(PENDING_DIR, file));
  } catch (error) {
    console.error('Erro ao buscar arquivos de assinaturas pendentes:', error);
    return [];
  }
}

// Processar um arquivo de assinatura pendente
async function processSubscriptionFile(filePath) {
  try {
    console.log(`Processando arquivo: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Verificar se temos os dados necessários
    if (!data.subscriptionId || !data.planId) {
      console.error(`Arquivo ${filePath} não contém os dados necessários`);
      return false;
    }
    
    // Tentar encontrar o usuário pelo email
    if (data.customerEmail) {
      console.log(`Buscando usuário pelo email: ${data.customerEmail}`);
      const User = require('../models/User');
      const user = await User.findOne({ email: data.customerEmail });
      
      if (user) {
        console.log(`Usuário encontrado: ${user._id} (${user.name || user.email})`);
        
        // Preparar os detalhes do plano
        const planName = data.planName || 'Plano desconhecido';
        const isAnnual = planName.toLowerCase().includes('anual');
        
        const expiryDate = new Date();
        if (isAnnual) {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        } else {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        }
        
        const planDetails = {
          planName,
          planInterval: isAnnual ? 'year' : 'month',
          planDescription: planName,
          planPrice: null, // Não temos esse dado no arquivo
          expiresAt: expiryDate
        };
        
        // Atualizar o usuário com a assinatura
        console.log(`Atualizando usuário com a assinatura: ${data.subscriptionId}`);
        await userService.updateUserPlan(
          user._id.toString(), 
          data.planId, 
          data.subscriptionId, 
          planDetails
        );
        
        // Mover o arquivo para a pasta de processados
        const processedDir = dirManager.paths.PROCESSED_DIR;
        if (!fs.existsSync(processedDir)) {
          fs.mkdirSync(processedDir, { recursive: true });
        }
        
        const filename = path.basename(filePath);
        const processedPath = path.join(processedDir, filename);
        fs.renameSync(filePath, processedPath);
        console.log(`Arquivo movido para ${processedPath}`);
        
        return true;
      } else {
        console.log(`Nenhum usuário encontrado com o email: ${data.customerEmail}`);
      }
    } else {
      console.log('Arquivo não contém email do cliente');
    }
    
    return false;
  } catch (error) {
    console.error(`Erro ao processar arquivo ${filePath}:`, error);
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
    
    // Buscar arquivos pendentes
    const files = findPendingSubscriptions();
    if (files.length === 0) {
      console.log('Nenhuma assinatura pendente encontrada');
      mongoose.disconnect();
      return;
    }
    
    // Processar cada arquivo
    let processed = 0;
    for (const file of files) {
      const success = await processSubscriptionFile(file);
      if (success) {
        processed++;
      }
    }
    
    console.log(`Processamento concluído: ${processed}/${files.length} assinaturas associadas a usuários`);
    
    // Desconectar do banco de dados
    mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  } catch (error) {
    console.error('Erro durante a execução do script:', error);
  }
}

// Executar o script
main();
