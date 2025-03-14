/**
 * Utilitários para manipulação de strings no contexto de integrações de pagamento
 */

/**
 * Sanitiza texto removendo caracteres especiais, acentos e espaços extras
 * Ideal para campos como statement_descriptor que exigem formato específico
 * 
 * @param {string} text - O texto a ser sanitizado
 * @returns {string} - O texto sanitizado
 */
function sanitizeText(text) {
    if (!text) return '';
    
    // Remover acentos
    const withoutAccents = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Remover caracteres especiais e manter apenas letras, números e espaços
    const alphanumeric = withoutAccents.replace(/[^\w\s]/gi, '');
    
    // Remover espaços extras e trimmar
    const trimmed = alphanumeric.replace(/\s+/g, ' ').trim();
    
    // Limitar tamanho (muitas APIs limitam a 22 caracteres)
    return trimmed.substring(0, 22);
}

/**
 * Formata valor monetário para exibição
 * 
 * @param {number} cents - Valor em centavos
 * @returns {string} - Valor formatado como moeda brasileira
 */
function formatCurrency(cents) {
    const value = cents / 100;
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

module.exports = {
    sanitizeText,
    formatCurrency
};
