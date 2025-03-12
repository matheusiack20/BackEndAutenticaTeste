import User from '../../../models/User'; // Certifique-se de que o caminho está correto

const loginHandler = async (req, res) => {
  if (req.method === 'POST') {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    try {
      // Utilizando o método estático findUserWithPassword
      const user = await User.findUserWithPassword(email, password);

      if (!user) {
        return res.status(401).json({ message: 'Email ou senha inválidos' });
      }

      // Se o usuário for encontrado e a senha for válida
      return res.status(200).json({ message: 'Login bem-sucedido', user });

    } catch (error) {
      return res.status(500).json({ message: 'Erro ao processar o login', error });
    }
  } else {
    // Retorna um erro se o método não for POST
    res.status(405).json({ message: 'Método não permitido' });
  }
};

export default loginHandler;
