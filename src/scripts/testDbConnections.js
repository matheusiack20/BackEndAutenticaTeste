/**
 * Script para testar as conexões com os bancos de dados
 * Use para verificar se as strings de conexão estão corretas
 * Esta versão NÃO grava dados no banco durante os testes
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Testar conexão com o banco de dados principal
async function testMainDatabase() {
  console.log('\n=== TESTANDO CONEXÃO COM BANCO PRINCIPAL ===');
  console.log(`URI: ${process.env.MONGO_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
  
  if (!process.env.MONGO_URI) {
    console.error('❌ ERRO: Variável MONGO_URI não encontrada no arquivo .env');
    return false;
  }
  
  try {
    const connection = mongoose.createConnection(process.env.MONGO_URI);
    
    return new Promise((resolve) => {
      connection.once('open', async () => {
        console.log('✅ Conexão estabelecida com sucesso');
        
        // Verificar o nome da base de dados
        console.log(`Nome da base de dados: ${connection.db.databaseName}`);
        
        // Verificar permissões sem criar coleções
        try {
          // Listar coleções existentes (somente leitura)
          const collections = await connection.db.listCollections().toArray();
          console.log(`Coleções encontradas: ${collections.length}`);
          
          // Apenas mostrar algumas coleções para não sobrecarregar o console
          if (collections.length > 0) {
            console.log('Primeiras 5 coleções:');
            collections.slice(0, 5).forEach(collection => {
              console.log(`- ${collection.name}`);
            });
            
            if (collections.length > 5) {
              console.log(`...e mais ${collections.length - 5} coleções`);
            }
          }
          
          // Verificar se pode fazer consultas (operação de leitura)
          const testCollection = collections.length > 0 ? collections[0].name : 'users';
          const testQuery = await connection.db.collection(testCollection).findOne({}, { limit: 1, projection: { _id: 1 }});
          
          console.log(`Teste de consulta: ${testQuery ? '✅ Sucesso' : '⚠️ Sem dados (mas sem erro)'}`);
        } catch (e) {
          console.error('❌ Erro ao verificar permissões:', e.message);
        }
        
        await connection.close();
        resolve(true);
      });
      
      connection.on('error', (err) => {
        console.error('❌ Erro ao conectar:', err);
        resolve(false);
      });
      
      // Timeout
      setTimeout(() => {
        if (connection.readyState !== 1) {
          console.error('❌ Timeout - conexão não foi estabelecida em tempo hábil');
          resolve(false);
        }
      }, 5000);
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar conexão:', error);
    return false;
  }
}

// Testar conexão com o banco de dados secundário
async function testSecondaryDatabase() {
  console.log('\n=== TESTANDO CONEXÃO COM BANCO SECUNDÁRIO ===');
  console.log(`URI: ${process.env.MONGO_URI_USER_BD?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
  
  if (!process.env.MONGO_URI_USER_BD) {
    console.error('❌ ERRO: Variável MONGO_URI_USER_BD não encontrada no arquivo .env');
    return false;
  }
  
  try {
    const connection = mongoose.createConnection(process.env.MONGO_URI_USER_BD);
    
    return new Promise((resolve) => {
      connection.once('open', async () => {
        console.log('✅ Conexão estabelecida com sucesso');
        
        // Verificar o nome da base de dados
        console.log(`Nome da base de dados: ${connection.db.databaseName}`);
        
        // Verificar permissões sem criar coleções
        try {
          // Listar coleções existentes (somente leitura)
          const collections = await connection.db.listCollections().toArray();
          console.log(`Coleções encontradas: ${collections.length}`);
          
          // Apenas mostrar algumas coleções para não sobrecarregar o console
          if (collections.length > 0) {
            console.log('Primeiras 5 coleções:');
            collections.slice(0, 5).forEach(collection => {
              console.log(`- ${collection.name}`);
            });
            
            if (collections.length > 5) {
              console.log(`...e mais ${collections.length - 5} coleções`);
            }
          }
          
          // Verificar se pode fazer consultas (operação de leitura)
          if (collections.length > 0) {
            const testCollection = collections[0].name;
            const testQuery = await connection.db.collection(testCollection).findOne({}, { limit: 1, projection: { _id: 1 }});
            console.log(`Teste de consulta: ${testQuery ? '✅ Sucesso' : '⚠️ Sem dados (mas sem erro)'}`);
          }
        } catch (e) {
          console.error('❌ Erro ao verificar permissões:', e.message);
        }
        
        await connection.close();
        resolve(true);
      });
      
      connection.on('error', (err) => {
        console.error('❌ Erro ao conectar:', err);
        resolve(false);
      });
      
      // Timeout
      setTimeout(() => {
        if (connection.readyState !== 1) {
          console.error('❌ Timeout - conexão não foi estabelecida em tempo hábil');
          resolve(false);
        }
      }, 5000);
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar conexão:', error);
    return false;
  }
}

// Função principal
async function main() {
  console.log('Testando conexões com bancos de dados (SOMENTE LEITURA)...');
  
  const mainDbResult = await testMainDatabase();
  const secondaryDbResult = await testSecondaryDatabase();
  
  console.log('\n=== RESULTADO FINAL ===');
  console.log(`Banco Principal (MapTopSeller): ${mainDbResult ? '✅ OK' : '❌ FALHA'}`);
  console.log(`Banco Secundário (myDatabase): ${secondaryDbResult ? '✅ OK' : '❌ FALHA'}`);
  
  if (!mainDbResult || !secondaryDbResult) {
    console.log('\nVerifique as seguintes possíveis causas:');
    console.log('1. String de conexão incorreta no arquivo .env');
    console.log('2. Banco de dados não está acessível (firewall, rede, etc.)');
    console.log('3. Credenciais incorretas');
    console.log('4. Nome do banco de dados incorreto');
    
    process.exit(1);
  }
  
  console.log('\nTodas as conexões estão funcionando corretamente! ✅');
}

// Executar teste
main().catch(console.error);
