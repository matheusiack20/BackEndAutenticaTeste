/**
 * Script de emergência para corrigir problemas de assinatura para um usuário
 * Este script identifica o usuário e atualiza diretamente no banco de dados
 * 
 * Uso: node emergencyUserFix.js <userId ou email>
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Conectar ao MongoDB
async function connectToDb() {
  try {
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

// Função principal
async function main() {
  // Obter ID ou email do usuário a partir dos argumentos
  const userIdentifier = process.argv[2];
  
  if (!userIdentifier) {
    console.log('Por favor, forneça um ID de usuário ou email: node emergencyUserFix.js <userId ou email>');
    process.exit(1);
  }

  if (!(await connectToDb())) {
    console.log('Falha ao conectar ao banco de dados. Abortando.');
    process.exit(1);
  }

  try {
    // Carregar o modelo User
    const User = require('../models/User');
    
    // Log da quantidade de usuários no sistema
    const totalUsers = await User.countDocuments();
    console.log(`Total de usuários no banco de dados: ${totalUsers}`);
    
    if (totalUsers === 0) {
      console.log('Nenhum usuário encontrado no banco de dados!');
      process.exit(1);
    }
    
    // Tentar encontrar o usuário pelo ID ou email fornecido
    let user = null;
    
    // Verificar se o parâmetro é um ObjectId válido
    if (mongoose.Types.ObjectId.isValid(userIdentifier)) {
      console.log(`Tentando encontrar usuário pelo ID: ${userIdentifier}`);
      user = await User.findById(userIdentifier);
    }
    
    // Se não encontrou por ID ou não era um ID válido, tentar por email
    if (!user) {
      console.log(`Tentando encontrar usuário pelo email: ${userIdentifier}`);
      user = await User.findOne({ email: userIdentifier });
    }
    
    // Se não encontrou por ID ou email, e só tem um usuário no sistema, usar esse
    if (!user && totalUsers === 1) {
      console.log('Usando o único usuário do sistema...');
      user = await User.findOne({});
    }
    
    if (!user) {
      console.log(`Nenhum usuário encontrado com o ID/email: ${userIdentifier}. Abortando operação.`);
      process.exit(1);
    }
    
    // Mostrar informações do usuário encontrado
    console.log('\n=== USUÁRIO ENCONTRADO ===');
    console.log(`ID: ${user._id}`);
    console.log(`Nome: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Status atual: ${user.subscription_status || 'Nenhum'}`);
    console.log(`Plano atual: ${user.plan || 'Nenhum'}`);
    
    // Obter informações do plano desejado
    console.log('\nQual plano deseja aplicar?');
    console.log('1 - Iniciante');
    console.log('2 - Especialista');
    console.log('3 - Pro');
    
    // Em um ambiente interativo, você solicitaria entrada do usuário aqui
    const planOption = process.argv[3] || '1';
    
    // Determinar valores do plano com base na opção escolhida
    let planName, planId, subscriptionId, subscriptionPrice;
    
    switch (planOption) {
      case '1':
      case 'iniciante':
        planName = 'Iniciante';
        planId = 'plan_axj7YDPiVfmlY6k0';
        subscriptionId = `sub_ini_${Date.now()}`;
        subscriptionPrice = 5770;
        break;
      case '2':
      case 'especialista':
        planName = 'Especialista';
        planId = 'plan_10VL47FPgiQK6bqw';
        subscriptionId = `sub_esp_${Date.now()}`;
        subscriptionPrice = 28440;
        break;
      case '3':
      case 'pro':
        planName = 'Pro';
        planId = 'plan_pro_id';
        subscriptionId = `sub_pro_${Date.now()}`;
        subscriptionPrice = 46890;
        break;
      default:
        planName = 'Iniciante';
        planId = 'plan_axj7YDPiVfmlY6k0';
        subscriptionId = `sub_ini_${Date.now()}`;
        subscriptionPrice = 5770;
    }
    
    // Definir novos valores para atualização
    const updateValues = {
      plan: Number(planOption) || 1,
      plan_id: planId,
      subscription_id: subscriptionId,
      plan_name: planName,
      plan_interval: 'month',
      plan_description: planName,
      subscription_status: 'paid',
      subscription_price: subscriptionPrice,
      subscription_created_at: new Date(),
      subscription_expires_at: new Date(new Date().setMonth(new Date().getMonth() + 1))
    };
    
    // Atualizar o usuário
    console.log('\n=== ATUALIZANDO USUÁRIO ===');
    console.log('Aplicando plano:', planName);
    console.log('Novos valores de assinatura:', JSON.stringify(updateValues, null, 2));
    
    // Confirmar a operação
    console.log('\nATENÇÃO: Esta operação modificará diretamente o banco de dados.');
    
    // Em um script interativo, você pediria confirmação aqui:
    // const readline = require('readline');
    // const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    // const answer = await new Promise(resolve => rl.question('Confirmar atualização? (S/N): ', resolve));
    // if (answer.toLowerCase() !== 's') process.exit(0);
    
    // Realizar a atualização no banco
    try {
      const result = await User.updateOne(
        { _id: user._id },
        { $set: updateValues }
      );
      
      console.log('Resultado da atualização:', result);
      console.log(`✅ Usuário atualizado com sucesso! Documentos modificados: ${result.modifiedCount}`);
      
      // Verificar se a atualização foi bem-sucedida
      const updatedUser = await User.findById(user._id);
      console.log('\n=== USUÁRIO APÓS ATUALIZAÇÃO ===');
      console.log(`Status: ${updatedUser.subscription_status}`);
      console.log(`Plano: ${updatedUser.plan}`);
      console.log(`Nome do plano: ${updatedUser.plan_name}`);
      console.log(`ID da assinatura: ${updatedUser.subscription_id}`);
      
    } catch (updateError) {
      console.error('❌ Erro ao atualizar usuário:', updateError);
    }
    
  } catch (error) {
    console.error('Erro ao executar script:', error);
  } finally {
    // Desconectar do banco
    mongoose.disconnect();
    console.log('Desconectado do banco de dados');
  }
}

// Executar script
main().catch(console.error);
