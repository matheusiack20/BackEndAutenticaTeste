/**
 * Script para sincronizar usuários entre as bases de dados MapTopSeller e myDatabase
 * Copia usuários que existem na base principal para a base secundária
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Configurar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Função para verificar a string de conexão
function validateConnectionString(uri, name) {
  if (!uri) {
    console.error(`❌ URI de conexão "${name}" não encontrada no arquivo .env`);
    return false;
  }
  
  // Verificação básica do formato da URI
  if (!uri.startsWith('mongodb')) {
    console.error(`❌ URI de conexão "${name}" não parece ser uma string válida do MongoDB`);
    return false;
  }
  
  // Mostrar versão censurada da URI para debug
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  console.log(`✓ URI de conexão "${name}" parece válida: ${maskedUri}`);
  return true;
}

// Função para conectar às bases de dados
async function connectToDatabases() {
  try {
    // Validar URIs de conexão antes de prosseguir
    if (!validateConnectionString(process.env.MONGO_URI, 'MONGO_URI') || 
        !validateConnectionString(process.env.MONGO_URI_USER_BD, 'MONGO_URI_USER_BD')) {
      throw new Error('URIs de conexão inválidas ou ausentes');
    }
    
    console.log('Conectando à base principal (MapTopSeller)...');
    await mongoose.connect(process.env.MONGO_URI, {
      // Removidas opções depreciadas
      serverSelectionTimeoutMS: 30000 // 30 segundos
    });
    console.log('✅ Conectado à base principal');
    
    console.log('Conectando à base secundária (myDatabase)...');
    const database = require('../config/database');
    
    try {
      const secondConn = await database.connectToDatabase2();
      
      if (!secondConn) {
        throw new Error('Conexão secundária retornou nulo');
      }
      
      // Verificar se a conexão está pronta
      if (secondConn.readyState !== 1) {
        throw new Error(`Conexão secundária não está pronta: ${secondConn.readyState}`);
      }
      
      console.log('✅ Conectado à base secundária');
      return { mainConn: mongoose.connection, secondaryConn: secondConn };
    } catch (secondDbError) {
      console.error('❌ Erro específico ao conectar à base secundária:', secondDbError);
      
      // Tentar uma conexão direta para diagnóstico
      console.log('Tentando conexão direta à base secundária para diagnóstico...');
      const directConn = mongoose.createConnection(process.env.MONGO_URI_USER_BD, {
        serverSelectionTimeoutMS: 30000
      });
      
      // Aguardar algumas possíveis alterações de estado
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log(`Estado da conexão direta: ${directConn.readyState}`);
      
      throw new Error('Falha ao conectar à base secundária (mesmo com tentativa direta)');
    }
  } catch (error) {
    console.error('❌ Erro ao conectar às bases de dados:', error);
    return null;
  }
}

// Função principal
async function main() {
  // Conectar às bases de dados
  let connections = null;
  
  try {
    connections = await connectToDatabases();
  } catch (connError) {
    console.error('Erro durante conexão às bases de dados:', connError);
  }
  
  if (!connections) {
    console.error('Falha ao conectar às bases de dados. Encerrando...');
    process.exit(1);
  }
  
  try {
    // Obter modelo de usuário da base principal
    const User = require('../models/User');
    
    // Criar modelo de usuário na base secundária
    const SecondaryUser = connections.secondaryConn.model('User', User.schema);
    
    // Buscar todos os usuários da base principal
    console.log('Buscando usuários na base principal...');
    const mainUsers = await User.find();
    console.log(`Encontrados ${mainUsers.length} usuários na base principal`);
    
    // Verificar usuários na base secundária
    console.log('Buscando usuários na base secundária...');
    const secondaryUsers = await SecondaryUser.find();
    console.log(`Encontrados ${secondaryUsers.length} usuários na base secundária`);
    
    // Mapear usuários da base secundária por email para verificação rápida
    const secondaryUsersByEmail = {};
    secondaryUsers.forEach(user => {
      if (user.email) {
        secondaryUsersByEmail[user.email.toLowerCase()] = user;
      }
    });
    
    // Sincronizar/atualizar usuários
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const mainUser of mainUsers) {
      // Verificar se o usuário já existe na base secundária pelo email
      if (mainUser.email && secondaryUsersByEmail[mainUser.email.toLowerCase()]) {
        const secondaryUser = secondaryUsersByEmail[mainUser.email.toLowerCase()];
        console.log(`Usuário ${mainUser.email} já existe na base secundária com ID ${secondaryUser._id}`);
        
        // Atualizar informações de assinatura se tiver plano
        if (mainUser.plan || mainUser.subscription_id) {
          console.log(`Atualizando dados de assinatura do usuário ${mainUser.email} na base secundária`);
          
          // Preparar dados para atualização
          const updateData = {};
          if (mainUser.plan) updateData.plan = mainUser.plan;
          if (mainUser.plan_id) updateData.plan_id = mainUser.plan_id;
          if (mainUser.plan_name) updateData.plan_name = mainUser.plan_name;
          if (mainUser.plan_interval) updateData.plan_interval = mainUser.plan_interval;
          if (mainUser.subscription_id) updateData.subscription_id = mainUser.subscription_id;
          if (mainUser.subscription_status) updateData.subscription_status = mainUser.subscription_status;
          if (mainUser.subscription_price) updateData.subscription_price = mainUser.subscription_price;
          if (mainUser.subscription_created_at) updateData.subscription_created_at = mainUser.subscription_created_at;
          if (mainUser.subscription_expires_at) updateData.subscription_expires_at = mainUser.subscription_expires_at;
          
          // Atualizar na base secundária
          await SecondaryUser.updateOne({ _id: secondaryUser._id }, { $set: updateData });
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Criar usuário na base secundária
        console.log(`Criando usuário ${mainUser.email || '[sem email]'} na base secundária`);
        
        // Preparar dados para criação
        const userData = mainUser.toObject();
        delete userData._id; // Remover _id para que o MongoDB gere um novo
        
        // Criar na base secundária
        await new SecondaryUser(userData).save();
        created++;
      }
    }
    
    console.log('\n===== RESUMO DA SINCRONIZAÇÃO =====');
    console.log(`Usuários na base principal: ${mainUsers.length}`);
    console.log(`Usuários na base secundária: ${secondaryUsers.length}`);
    console.log(`Usuários criados: ${created}`);
    console.log(`Usuários atualizados: ${updated}`);
    console.log(`Usuários ignorados: ${skipped}`);
    
    // Verificar números após sincronização
    const finalCount = await SecondaryUser.countDocuments();
    console.log(`Total de usuários na base secundária após sincronização: ${finalCount}`);
    
  } catch (error) {
    console.error('Erro durante sincronização:', error);
  } finally {
    // Desconectar das bases de dados
    try {
      if (connections.secondaryConn && connections.secondaryConn.close) {
        await connections.secondaryConn.close();
      }
      await mongoose.disconnect();
      console.log('Desconectado das bases de dados');
    } catch (disconnectError) {
      console.error('Erro ao desconectar:', disconnectError);
    }
  }
}

// Executar o script
main().catch(error => {
  console.error('Erro geral na execução do script:', error);
  process.exit(1);
});
