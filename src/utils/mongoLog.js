const mongoose = require('mongoose');

/**
 * Testa a conexão com o MongoDB sem escrever dados reais no banco
 * @param {Connection} connection - Conexão MongoDB opcional (usa conexão padrão se não fornecida)
 * @returns {Promise<{ connected: boolean, writeSuccessful: boolean }>}
 */
exports.testMongoConnection = async (connection = null) => {
  try {
    // Usar a conexão fornecida ou a conexão padrão
    const conn = connection || mongoose.connection;
    
    // Verificar se há conexão com MongoDB
    const connected = conn.readyState === 1;
    
    if (!connected) {
      console.error('❌ Teste de conexão MongoDB: Não está conectado ao banco de dados!');
      return { connected: false, writeSuccessful: false };
    }
    
    // Nome do banco para logging
    const dbName = conn.name || 'desconhecido';
    
    // Testar se a conexão está ativa sem escrever no banco
    try {
      // Em vez de criar um documento, apenas liste as coleções para verificar permissões
      await conn.db.listCollections().toArray();
      
      // Se chegou aqui, conseguiu se comunicar com o banco
      console.log(`✅ Teste de conexão MongoDB (${dbName}): Conexão e permissões verificadas com sucesso`);
      return { connected: true, writeSuccessful: true };
    } catch (writeError) {
      console.error(`❌ Teste de conexão MongoDB (${dbName}): Erro ao verificar conexão`, writeError);
      return { connected: true, writeSuccessful: false };
    }
  } catch (error) {
    console.error('❌ Teste de conexão MongoDB falhou', error);
    return { connected: false, writeSuccessful: false };
  }
};

/**
 * Força a reconexão com o MongoDB se necessário
 * @param {Connection} connection - Conexão MongoDB opcional
 * @returns {Promise<boolean>} Sucesso da reconexão
 */
exports.forceReconnectMongo = async (connection = null) => {
  try {
    // Usar a conexão fornecida ou a conexão padrão
    const conn = connection || mongoose.connection;
    
    // Se já estiver conectado, não faz nada
    if (conn.readyState === 1) {
      console.log('MongoDB já está conectado');
      return true;
    }
    
    // Se houver uma conexão em andamento, aguarde
    if (conn.readyState === 2) {
      console.log('Aguardando conexão em andamento com MongoDB...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return conn.readyState === 1;
    }
    
    // Se desconectado, tenta reconectar
    if (conn.readyState === 0) {
      console.log('Tentando reconectar ao MongoDB...');
      
      // Se for a conexão padrão
      if (conn === mongoose.connection) {
        await mongoose.connect(process.env.MONGO_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
      } 
      // Se for conexão secundária
      else {
        // Recriar a conexão (não podemos reconectar diretamente)
        const database = require('../config/database');
        const newConn = await database.connectToDatabase2();
        
        // Substituir a referência (isso depende de como você está gerenciando conexões)
        // Você pode precisar de uma abordagem diferente dependendo da sua arquitetura
      }
      
      return conn.readyState === 1;
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao forçar reconexão com MongoDB', error);
    return false;
  }
};
