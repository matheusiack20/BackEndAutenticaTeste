/**
 * Utilitário para gerenciar diretórios do sistema
 * Garante que todos os diretórios necessários existam antes de tentar usá-los
 */
const fs = require('fs');
const path = require('path');

// Diretórios básicos do sistema
const BASE_DIR = path.resolve(__dirname, '../../');
const TEMP_DIR = path.join(BASE_DIR, 'temp');
const LOGS_DIR = path.join(BASE_DIR, 'logs');
const PENDING_SUBSCRIPTIONS_DIR = path.join(TEMP_DIR, 'pending_subscriptions');
const PROCESSED_DIR = path.join(TEMP_DIR, 'processed');

/**
 * Cria um diretório se ele não existir
 * @param {string} dirPath - Caminho do diretório
 * @param {boolean} recursive - Se deve criar diretórios pai se não existirem
 * @returns {boolean} Sucesso da operação
 */
function ensureDirectoryExists(dirPath, recursive = true) {
  try {
    if (!fs.existsSync(dirPath)) {
      console.log(`Criando diretório: ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive });
      return true;
    }
    return true;
  } catch (error) {
    console.error(`Erro ao criar diretório ${dirPath}:`, error);
    return false;
  }
}

/**
 * Inicializa todos os diretórios necessários para o sistema
 * @returns {boolean} Sucesso da operação
 */
function initDirectories() {
  let allCreated = true;
  
  // Criar diretórios base
  allCreated = ensureDirectoryExists(TEMP_DIR) && allCreated;
  allCreated = ensureDirectoryExists(LOGS_DIR) && allCreated;
  
  // Criar subdiretórios
  allCreated = ensureDirectoryExists(PENDING_SUBSCRIPTIONS_DIR) && allCreated;
  allCreated = ensureDirectoryExists(PROCESSED_DIR) && allCreated;
  
  if (allCreated) {
    console.log('✅ Todos os diretórios do sistema foram inicializados com sucesso');
  } else {
    console.warn('⚠️ Alguns diretórios não puderam ser criados');
  }
  
  return allCreated;
}

/**
 * Retorna o caminho para um arquivo no diretório temporário
 * @param {string} filename - Nome do arquivo 
 * @returns {string} Caminho completo
 */
function getTempFilePath(filename) {
  ensureDirectoryExists(TEMP_DIR);
  return path.join(TEMP_DIR, filename);
}

/**
 * Retorna o caminho para um arquivo no diretório de logs
 * @param {string} filename - Nome do arquivo 
 * @returns {string} Caminho completo
 */
function getLogFilePath(filename) {
  ensureDirectoryExists(LOGS_DIR);
  return path.join(LOGS_DIR, filename);
}

/**
 * Retorna o caminho para um arquivo no diretório de assinaturas pendentes
 * @param {string} filename - Nome do arquivo 
 * @returns {string} Caminho completo
 */
function getPendingSubscriptionPath(filename) {
  ensureDirectoryExists(PENDING_SUBSCRIPTIONS_DIR);
  return path.join(PENDING_SUBSCRIPTIONS_DIR, filename);
}

/**
 * Retorna o caminho para um arquivo no diretório de itens processados
 * @param {string} filename - Nome do arquivo 
 * @returns {string} Caminho completo
 */
function getProcessedPath(filename) {
  ensureDirectoryExists(PROCESSED_DIR);
  return path.join(PROCESSED_DIR, filename);
}

module.exports = {
  initDirectories,
  ensureDirectoryExists,
  getTempFilePath,
  getLogFilePath,
  getPendingSubscriptionPath,
  getProcessedPath,
  paths: {
    BASE_DIR,
    TEMP_DIR,
    LOGS_DIR,
    PENDING_SUBSCRIPTIONS_DIR,
    PROCESSED_DIR
  }
};
