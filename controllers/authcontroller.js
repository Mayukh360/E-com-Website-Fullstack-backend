const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const signup = async (req, res) => {
    const { name, email, password } = req.body;
  
    try {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({ name, email, password: hashedPassword });
  
      const token = jwt.sign(
        { userId: newUser.id, name: newUser.name },
        'your-secret-key',
        { expiresIn: '1h' }
      );
  
      res.json({ token, userId: newUser.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  };
  
  const login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email' });
      }
  
      const result = await bcrypt.compare(password, user.password);
      if (!result) {
        return res.status(401).json({ error: 'Invalid password' });
      }
  
      const token = jwt.sign(
        { userId: user.id, name: user.name },
        'your-secret-key',
        { expiresIn: '1h' }
      );
  
      res.json({ token, userId: user.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  module.exports={
    signup,
    login
  }