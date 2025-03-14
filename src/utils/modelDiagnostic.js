/**
 * Utilitário para diagnóstico de modelos Mongoose
 */
const mongoose = require('mongoose');

/**
 * Verifica se um modelo específico está disponível e funcional
 * @param {string} modelName - Nome do modelo a ser verificado
 * @returns {Object} Resultado do diagnóstico
 */
exports.checkModel = (modelName) => {
  try {
    // Verificar se o modelo está registrado
    const isRegistered = mongoose.modelNames().includes(modelName);
    
    let model = null;
    let methods = [];
    let hasValidFindById = false;
    
    if (isRegistered) {
      // Tentar obter o modelo
      try {
        model = mongoose.model(modelName);
        methods = Object.getOwnPropertyNames(model).filter(
          prop => typeof model[prop] === 'function'
        );
        
        // Verificar se findByIdAndUpdate está disponível
        hasValidFindById = typeof model.findByIdAndUpdate === 'function';
      } catch (e) {
        console.error(`Erro ao acessar modelo ${modelName}:`, e);
      }
    }
    
    return {
      name: modelName,
      isRegistered,
      model: model ? `[Mongoose Model: ${modelName}]` : null,
      connectionState: mongoose.connection.readyState,
      methods,
      hasValidFindById
    };
  } catch (error) {
    console.error(`Erro ao diagnosticar modelo ${modelName}:`, error);
    return { 
      name: modelName, 
      error: error.message, 
      connectionState: mongoose.connection.readyState 
    };
  }
};

/**
 * Lista todos os modelos registrados no Mongoose
 * @returns {Array} Lista de modelos disponíveis e seus métodos
 */
exports.listAllModels = () => {
  try {
    const modelNames = mongoose.modelNames();
    
    return modelNames.map(name => {
      return this.checkModel(name);
    });
  } catch (error) {
    console.error('Erro ao listar modelos:', error);
    return [];
  }
};

/**
 * Executa um diagnóstico completo da conexão e modelos
 * @returns {Object} Resultado do diagnóstico
 */
exports.runDiagnostic = () => {
  return {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    mongooseVersion: mongoose.version,
    connectionState: mongoose.connection.readyState,
    connectionString: mongoose.connection.name,
    models: this.listAllModels()
  };
};
