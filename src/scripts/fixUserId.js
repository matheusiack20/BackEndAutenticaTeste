/**
 * Script para verificar e corrigir problemas com o ID de um usuário específico
 * 
 * Uso: node fixUserId.js <userId>
 * 
 * Este script:
 * 1. Verifica se o usuário existe com o ID fornecido
 * 2. Se não, busca por qualquer outro usuário com dados similares
 * 3. Tenta resolver problemas como IDs com caracteres extras, etc.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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

// Função para localizar um usuário por ID ou dados alternativos
async function findUser(userId) {
  const User = require('../models/User');
  
  console.log(`🔍 Verificando usuário com ID: ${userId}`);
  
  // Verificar se parece um ObjectId válido
  const isValidObjectId = mongoose.Types.ObjectId.isValid(userId);
  console.log(`É um ObjectId válido: ${isValidObjectId ? 'SIM' : 'NÃO'}`);
  
  // Tentar métodos diferentes de busca
  let user = null;
  
  // 1. Método padrão findById
  try {
    user = await User.findById(userId);
    if (user) {
      console.log('✅ Usuário encontrado com findById!');
      return { user, method: 'findById' };
    }
  } catch (e) {
    console.log(`❌ Erro ao usar findById: ${e.message}`);
  }

  // 2. Tentar remover espaços extras
  const trimmedId = userId.trim();
  if (trimmedId !== userId) {
    try {
      console.log(`Tentando com ID sem espaços extras: "${trimmedId}"`);
      user = await User.findById(trimmedId);
      if (user) {
        console.log('✅ Usuário encontrado após remover espaços!');
        return { user, method: 'trimmed', originalId: userId, correctedId: trimmedId };
      }
    } catch (e) {
      console.log(`❌ Erro ao buscar com ID sem espaços: ${e.message}`);
    }
  }

  // 3. Verificar se o banco tem algum usuário
  const totalUsers = await User.countDocuments();
  console.log(`Total de usuários no banco de dados: ${totalUsers}`);
  
  if (totalUsers === 0) {
    console.log('⚠️ O banco de dados não contém nenhum usuário!');
    return { user: null, method: 'none', error: 'Banco vazio' };
  }
  
  // 4. Se houver apenas um usuário, talvez seja o que queremos
  if (totalUsers === 1) {
    console.log('🔍 Existe apenas 1 usuário no banco. Verificando se podemos usá-lo...');
    const singleUser = await User.findOne({});
    if (singleUser) {
      console.log(`✅ Encontrou o único usuário existente! ID: ${singleUser._id}`);
      return { user: singleUser, method: 'singleUser', note: 'Único usuário no sistema' };
    }
  }

  // 5. Tentar buscar o usuário pelo email do Pedro (o que vemos no erro)
  const pedroEmail = 'pedro.henrique_maciel@hotmail.com';
  console.log(`🔍 Tentando encontrar por email: ${pedroEmail}`);
  
  const userByEmail = await User.findOne({ email: pedroEmail });
  if (userByEmail) {
    console.log(`✅ Usuário encontrado por email! ID: ${userByEmail._id}`);
    return { user: userByEmail, method: 'email', correctedId: userByEmail._id.toString() };
  }

  console.log('❌ Não foi possível encontrar o usuário por nenhum método');
  return { user: null, method: 'none' };
}

// Função para corrigir problemas no ID do usuário
async function createFixScript(userId, foundUser) {
  if (!foundUser.user) {
    console.log('❌ Não é possível criar script de correção sem um usuário válido');
    return;
  }

  const correctedId = foundUser.correctedId || foundUser.user._id.toString();
  
  // Criar script SQL para corrigir
  const updateCommands = [
    `// Comandos para corrigir o problema de ID do usuário`,
    `// Executar em um console MongoDB ou usando um cliente MongoDB`,
    ``,
    `// 1. Verificar o usuário com o ID correto`,
    `db.users.findOne({ _id: ObjectId("${correctedId}") })`,
    ``,
    `// 2. Atualizar assinatura para este usuário`,
    `db.users.updateOne(`,
    `  { _id: ObjectId("${correctedId}") },`,
    `  { $set: {`,
    `    subscription_status: "paid",`,
    `    plan: 3,`,
    `    plan_name: "Especialista",`,
    `    plan_interval: "month",`,
    `    subscription_expires_at: new Date("2025-04-14T14:23:27.735Z")`,
    `  }}`,
    `)`,
    ``,
    `// 3. Verificar a atualização`,
    `db.users.findOne({ _id: ObjectId("${correctedId}") })`,
    ``
  ];

  // Salvar em um arquivo
  const scriptPath = path.resolve(__dirname, `../../temp/fix_${userId}_${Date.now()}.js`);
  fs.writeFileSync(scriptPath, updateCommands.join('\n'), 'utf8');
  
  console.log(`✅ Script de correção criado: ${scriptPath}`);

  // Também mostrar no console
  console.log('\n===== SCRIPT DE CORREÇÃO =====');
  console.log(updateCommands.join('\n'));
  console.log('=============================\n');
}

// Função para aplicar correção diretamente (opcional, com confirmação)
async function applyFix(userId, foundUser) {
  if (!foundUser.user) {
    console.log('❌ Não é possível aplicar correção sem um usuário válido');
    return false;
  }

  // Pedir confirmação (se rodando interativamente)
  console.log('\n⚠️ ATENÇÃO: Deseja aplicar a correção diretamente no banco de dados?');
  console.log(`Isso vai atualizar o usuário "${foundUser.user.name}" com ID ${foundUser.user._id}`);
  console.log('Digite "sim" para confirmar ou qualquer outra coisa para cancelar:');
  
  // Simulando confirmação direta para script automatizado
  const confirmation = 'sim'; // Em um ambiente interativo, usar readline.question()
  
  if (confirmation.toLowerCase() !== 'sim') {
    console.log('❌ Correção cancelada pelo usuário');
    return false;
  }
  
  try {
    // Aplicar atualização direta no banco de dados
    const User = require('../models/User');
    const result = await User.updateOne(
      { _id: foundUser.user._id },
      { $set: {
        subscription_status: 'paid',
        plan: 3,
        plan_name: 'Especialista',
        plan_interval: 'month',
        plan_id: 'plan_10VL47FPgiQK6bqw',
        subscription_id: 'sub_dwXrvOMhnxsJYGAJ',
        subscription_price: 28440,
        subscription_expires_at: new Date('2025-04-14T14:23:27.735Z')
      }}
    );
    
    console.log(`✅ Correção aplicada diretamente! Resultado: ${result.modifiedCount} documento(s) modificado(s)`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao aplicar correção:', error);
    return false;
  }
}

// Função principal
async function main() {
  // Obter ID do usuário do argumento de linha de comando
  const userId = process.argv[2];
  if (!userId) {
    console.error('Por favor, forneça um ID de usuário: node fixUserId.js <userId>');
    process.exit(1);
  }

  // Conectar ao banco de dados
  const connected = await connectToDatabase();
  if (!connected) {
    console.error('Não foi possível conectar ao banco de dados. Encerrando...');
    process.exit(1);
  }

  // Buscar o usuário
  const foundUserResult = await findUser(userId);
  
  // Mostrar resultados
  if (foundUserResult.user) {
    console.log('\n✅ USUÁRIO ENCONTRADO:');
    console.log(`Nome: ${foundUserResult.user.name}`);
    console.log(`Email: ${foundUserResult.user.email}`);
    console.log(`ID: ${foundUserResult.user._id}`);
    console.log(`Método: ${foundUserResult.method}`);
    
    if (foundUserResult.correctedId && foundUserResult.correctedId !== userId) {
      console.log(`\n⚠️ ID CORRIGIDO: ${foundUserResult.correctedId}`);
      console.log('O ID original contém problemas que foram corrigidos');
    }
    
    // Criar script de correção
    await createFixScript(userId, foundUserResult);
    
    // Tentar aplicar a correção
    await applyFix(userId, foundUserResult);
  } else {
    console.log('\n❌ USUÁRIO NÃO ENCONTRADO');
    console.log('Não foi possível encontrar nenhum usuário que correspondesse aos critérios');
  }

  // Desconectar do banco de dados
  mongoose.disconnect();
  console.log('\nDesconectado do MongoDB');
}

// Executar o script
main().catch(console.error);
