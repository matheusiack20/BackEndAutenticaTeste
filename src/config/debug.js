// Configurações para debugging e desenvolvimento

// Ativa debugging específico de pagamento - simula recusa ou aprovação sem chamar API externa
process.env.DEBUG_PAYMENT = process.env.DEBUG_PAYMENT || 'false';

// Permite simular respostas de pagamento como sucesso sem chamar a API real
process.env.MOCK_PAYMENTS = process.env.MOCK_PAYMENTS || 'false';

// Log de configuração
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Configurações de depuração:');
  console.log(`- DEBUG_PAYMENT: ${process.env.DEBUG_PAYMENT}`);
  console.log(`- MOCK_PAYMENTS: ${process.env.MOCK_PAYMENTS}`);
  console.log('Para ativar funções de depuração, inicie o servidor com:');
  console.log('DEBUG_PAYMENT=true MOCK_PAYMENTS=true npm start');
}

// Exportar configurações para uso no código
module.exports = {
  debugPayment: process.env.DEBUG_PAYMENT === 'true',
  mockPayments: process.env.MOCK_PAYMENTS === 'true',
};
