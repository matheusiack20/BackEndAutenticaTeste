/**
 * Este arquivo NÃO cria um modelo Mongoose.
 * Ele apenas define a interface para os tipos de dados sem persistência.
 * 
 * O armazenamento é feito completamente em memória através de um Map no controller,
 * sem persistir dados no banco MongoDB.
 */

// Interface para o token em memória
export interface TokenData {
  tokenId: string;
  planId: string;
  planName: string;
  planAmount: number | string;
  planInterval: string;
  planIntervalCount: number | string;
  planDescription: string;
  createdAt: Date;
  expiresAt: Date;
}

// NÃO exportar um modelo Mongoose, apenas a interface
// Não há persistência no banco de dados
export type TokenModel = TokenData;
