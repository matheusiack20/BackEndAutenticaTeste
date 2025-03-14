/**
 * Configura diretórios necessários para a aplicação (logs, temp, etc)
 */
const fs = require('fs');
const path = require('path');

// Diretórios necessários
const requiredDirs = [
  path.resolve(__dirname, '../../logs'),
  path.resolve(__dirname, '../../temp')
];

// Criar diretórios se não existirem
for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Diretório criado: ${dir}`);
    } catch (err) {
      console.error(`Erro ao criar diretório ${dir}:`, err);
    }
  }
}

// Exportar caminhos
module.exports = {
  logsDir: requiredDirs[0],
  tempDir: requiredDirs[1]
};
