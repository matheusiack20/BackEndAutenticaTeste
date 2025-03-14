const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper function to extract user data in consistent format
function formatUserData(user) {
  return {
    id: user._id,
    name: user.name || user.nome || null,
    email: user.email || null,
    document: user.document || user.cpf || null,
    phone: user.phone || user.celular || null,
    address: user.address || null,
    role: user.role || 'user',
    // Any other fields needed
  };
}

// Get current user data
exports.getCurrentUser = async (req, res) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Find user in database
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Return user data in consistent format
    return res.status(200).json(formatUserData(user));
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    
    return res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
  }
};

// Legacy endpoint compatibility - alias for getCurrentUser
exports.getMe = async (req, res) => {
  return this.getCurrentUser(req, res);
};
