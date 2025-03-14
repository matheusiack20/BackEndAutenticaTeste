/**
 * Serviço para gerenciamento de tokens em memória.
 * Este serviço NÃO utiliza banco de dados para persistência.
 */

// Armazenamento temporário em memória
const tokenStorage = new Map();

// Configuração de tempo de expiração
const TOKEN_EXPIRY_HOURS = 24;

/**
 * Cria um novo token em memória
 * @param {object} data Dados do token
 * @returns {object} Token criado
 */
const createToken = (data) => {
  const tokenId = `${data.planId}-${Date.now()}`;
  
  const tokenData = {
    tokenId,
    ...data,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
  };
  
  tokenStorage.set(tokenId, tokenData);
  console.log(`Token ${tokenId} criado em memória`);
  
  return tokenData;
};

/**
 * Busca um token pelo ID
 * @param {string} tokenId ID do token
 * @returns {object|null} Token encontrado ou null
 */
const getToken = (tokenId) => {
  if (!tokenStorage.has(tokenId)) {
    return null;
  }
  
  const token = tokenStorage.get(tokenId);
  
  // Verificar expiração
  if (token.expiresAt < new Date()) {
    tokenStorage.delete(tokenId);
    return null;
  }
  
  return token;
};

/**
 * Limpa tokens expirados para prevenir vazamento de memória
 */
const cleanupExpiredTokens = () => {
  const now = new Date();
  let count = 0;
  
  tokenStorage.forEach((token, id) => {
    if (token.expiresAt < now) {
      tokenStorage.delete(id);
      count++;
    }
  });
  
  if (count > 0) {
    console.log(`${count} tokens expirados foram removidos da memória`);
  }
  
  return count;
};

// Executar limpeza periódica a cada hora
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

// Relatar estatísticas de uso de memória a cada 12 horas
setInterval(() => {
  console.log(`Estatísticas de tokens em memória: ${tokenStorage.size} tokens ativos`);
}, 12 * 60 * 60 * 1000);

module.exports = {
  createToken,
  getToken,
  cleanupExpiredTokens
};
