/**
 * Script para diagnosticar problemas na busca de usuários no MongoDB
 * Uso: node debugMongoDBUser.js <userId>
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Configurar ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Função para conectar ao MongoDB
async function connectToDatabase() {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado ao MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    return false;
  }
}

// Função para buscar um usuário em ambas as bases de dados
async function findUserInBothDatabases(userId) {
  try {
    // Importar o modelo User da base principal
    const User = require('../models/User');
    
    console.log('🔍 Buscando usuário em ambas as bases de dados...');
    console.log(`ID fornecido: "${userId}"`);
    
    // Verificar na base principal (MapTopSeller)
    let mainUser = null;
    try {
      console.log('\n=== VERIFICANDO NA BASE PRINCIPAL (MapTopSeller) ===');
      mainUser = await User.findById(userId);
      console.log(mainUser ? '✅ Usuário encontrado na base principal!' : '❌ Usuário não encontrado na base principal');
    } catch (e) {
      console.error('Erro ao buscar na base principal:', e.message);
    }
    
    // Verificar na base secundária (myDatabase)
    let secondaryUser = null;
    try {
      console.log('\n=== VERIFICANDO NA BASE SECUNDÁRIA (myDatabase) ===');
      // Obter conexão secundária
      const database = require('../config/database');
      const secondConn = await database.connectToDatabase2();
      
      if (secondConn && secondConn.readyState === 1) {
        // Criar modelo na conexão secundária
        const SecondaryUser = secondConn.model('User', User.schema);
        secondaryUser = await SecondaryUser.findById(userId);
        console.log(secondaryUser ? '✅ Usuário encontrado na base secundária!' : '❌ Usuário não encontrado na base secundária');
      } else {
        console.error('❌ Não foi possível conectar à base secundária');
      }
    } catch (e) {
      console.error('Erro ao buscar na base secundária:', e.message);
    }
    
    // Retornar resultados
    return {
      mainUser,
      secondaryUser,
      foundInMain: !!mainUser,
      foundInSecondary: !!secondaryUser
    };
  } catch (error) {
    console.error('Erro geral:', error);
    return {
      mainUser: null,
      secondaryUser: null,
      foundInMain: false,
      foundInSecondary: false,
      error
    };
  }
}

// Função principal
async function main() {
  // Obter ID do usuário do argumento de linha de comando
  const userId = process.argv[2];
  if (!userId) {
    console.error('Por favor, forneça um ID de usuário: node debugMongoDBUser.js <userId>');
    process.exit(1);
  }
  
  // Conectar ao banco de dados
  const connected = await connectToDatabase();
  if (!connected) {
    console.error('Não foi possível conectar ao banco de dados. Encerrando...');
    process.exit(1);
  }
  
  // Buscar usuário em ambas as bases
  const result = await findUserInBothDatabases(userId);
  
  console.log('\n=== RESUMO DOS RESULTADOS ===');
  if (result.foundInMain) {
    console.log('✅ USUÁRIO ENCONTRADO NA BASE PRINCIPAL (MapTopSeller):');
    console.log(`ID: ${result.mainUser._id}`);
    console.log(`Nome: ${result.mainUser.name}`);
    console.log(`E-mail: ${result.mainUser.email}`);
    console.log(`Plano: ${result.mainUser.plan}`);
    console.log(`Status da assinatura: ${result.mainUser.subscription_status || 'N/A'}`);
  } else {
    console.log('❌ USUÁRIO NÃO ENCONTRADO NA BASE PRINCIPAL');
  }
  
  if (result.foundInSecondary) {
    console.log('\n✅ USUÁRIO ENCONTRADO NA BASE SECUNDÁRIA (myDatabase):');
    console.log(`ID: ${result.secondaryUser._id}`);
    console.log(`Nome: ${result.secondaryUser.name}`);
    console.log(`E-mail: ${result.secondaryUser.email}`);
    console.log(`Plano: ${result.secondaryUser.plan}`);
    console.log(`Status da assinatura: ${result.secondaryUser.subscription_status || 'N/A'}`);
  } else {
    console.log('\n❌ USUÁRIO NÃO ENCONTRADO NA BASE SECUNDÁRIA');
  }
  
  // Desconectar
  mongoose.disconnect();
  console.log('\nDesconectado do MongoDB');
}

// Executar o script
main().catch(console.error);
