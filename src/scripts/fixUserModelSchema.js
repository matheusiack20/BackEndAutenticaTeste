/**
 * Script para verificar e corrigir inconsistências no esquema do modelo User
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Configurar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Função para conectar ao MongoDB
async function connectToMongoDB() {
  try {
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

// Função para verificar o esquema atual do modelo User
async function checkUserSchema() {
  try {
    // Importar o modelo User
    const User = require('../models/User');
    
    // Obter o esquema do modelo
    const userSchema = User.schema;
    
    // Verificar o enum de subscription_status
    const subscriptionStatusPath = userSchema.path('subscription_status');
    if (!subscriptionStatusPath) {
      console.error('Campo subscription_status não encontrado no esquema');
      return false;
    }
    
    const enumValues = subscriptionStatusPath.enumValues || [];
    console.log('Valores permitidos para subscription_status:', enumValues);
    
    // Verificar se 'active' está nos valores permitidos
    const hasActiveValue = enumValues.includes('active');
    console.log(`O valor 'active' ${hasActiveValue ? 'está' : 'não está'} no enum`);
    
    return { hasActiveValue, enumValues };
  } catch (error) {
    console.error('Erro ao verificar esquema do modelo User:', error);
    return null;
  }
}

// Função para verificar e reparar usuários com status inválido
async function fixInvalidStatusUsers() {
  try {
    // Importar o modelo User
    const User = mongoose.model('User');
    
    // Buscar usuários com status 'active'
    const usersWithActiveStatus = await User.find({ subscription_status: 'active' });
    console.log(`Encontrados ${usersWithActiveStatus.length} usuários com status 'active'`);
    
    if (usersWithActiveStatus.length > 0) {
      console.log('Atualizando usuários com status inválido...');
      
      // Atualizar status para 'paid'
      const result = await User.updateMany(
        { subscription_status: 'active' }, 
        { $set: { subscription_status: 'paid' } }
      );
      
      console.log(`${result.modifiedCount} usuários atualizados com sucesso`);
      
      // Salvar backup dos usuários atualizados
      const backupDir = path.resolve(__dirname, '../../temp');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const backupFile = path.join(backupDir, `users_status_fixed_${Date.now()}.json`);
      fs.writeFileSync(
        backupFile, 
        JSON.stringify(usersWithActiveStatus, null, 2)
      );
      
      console.log(`Backup dos usuários afetados salvo em ${backupFile}`);
    }
    
    return usersWithActiveStatus.length;
  } catch (error) {
    console.error('Erro ao corrigir usuários com status inválido:', error);
    return -1;
  }
}

// Função principal
async function main() {
  try {
    // Conectar ao MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('Não foi possível conectar ao MongoDB. Encerrando...');
      process.exit(1);
    }
    
    // Verificar e mostrar o esquema atual
    const schemaInfo = await checkUserSchema();
    if (!schemaInfo) {
      console.error('Erro ao verificar o esquema. Encerrando...');
      process.exit(1);
    }
    
    // Se 'active' não estiver nos valores permitidos, corrija os usuários existentes
    if (!schemaInfo.hasActiveValue) {
      console.log("O valor 'active' não está nos valores permitidos do enum. Corrigindo usuários afetados...");
      const fixedCount = await fixInvalidStatusUsers();
      console.log(`Correção concluída. ${fixedCount} usuários processados.`);
    }
    
    console.log('Verificação e correção concluídas.');
    mongoose.disconnect();
  } catch (error) {
    console.error('Erro durante a execução do script:', error);
    process.exit(1);
  }
}

// Executar o script
main();
