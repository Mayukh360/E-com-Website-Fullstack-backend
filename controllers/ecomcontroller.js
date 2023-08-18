const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sequelize = require('../database/database');
const Product = require('../models/product');
const User = require('../models/user');
const stripe = require('stripe')(process.env.STRIPE_KEY);


const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { title, price, imageUrl, amount } = req.body;
    const product = await req.user.createProduct({
      title,
      price,
      imageUrl,
      amount,
    });
    res.json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

  
      product.amount += 1;
    
    await product.save();

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('Error updating quantity:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to update quantity' });
  }
};

const decreaseProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Candy not found' });
    }

    if (product.quantity <= 0) {
      return res
        .status(404)
        .json({ success: false, error: 'Candy quantity not enough' });
    } else {
      product.amount -= 1;
    }
    await product.save();

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('Error updating quantity:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to update quantity' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// const signup = async (req, res) => {
//   const { name, email, password } = req.body;

//   try {
//     const existingUser = await User.findOne({ where: { email } });
//     if (existingUser) {
//       return res.status(400).json({ error: 'Email already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = await User.create({ name, email, password: hashedPassword });

//     const token = jwt.sign(
//       { userId: newUser.id, name: newUser.name },
//       'your-secret-key',
//       { expiresIn: '1h' }
//     );

//     res.json({ token, userId: newUser.id });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to create user' });
//   }
// };

// const login = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ where: { email } });
//     if (!user) {
//       return res.status(401).json({ error: 'Invalid email' });
//     }

//     const result = await bcrypt.compare(password, user.password);
//     if (!result) {
//       return res.status(401).json({ error: 'Invalid password' });
//     }

//     const token = jwt.sign(
//       { userId: user.id, name: user.name },
//       'your-secret-key',
//       { expiresIn: '1h' }
//     );

//     res.json({ token, userId: user.id });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

const checkout = async (req, res) => {
  try {
    const { paymentMethodId, items } = req.body;
    const userIds = Array.from(new Set(items.map((item) => item.userId)));

    const users = await User.findAll({
      where: {
        id: userIds,
      },
    });

    if (users.length !== userIds.length) {
      return res.status(404).json({ error: 'One or more users not found' });
    }

    const totalAmount = items.reduce((total, item) => total + item.price * item.amount, 0);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item) => ({
        price_data: {
          currency: 'inr',
          product_data: {
            name: item.title,
          },
          unit_amount: item.price * 100,
        },
        quantity: item.amount,
      })),
      mode: 'payment',
      success_url: 'http://localhost:3001/success',
      cancel_url: 'http://localhost:3000/cancel',
      metadata: {
        userIds: userIds.join(','),
      },
    });

    if (session.id) {
      await Product.destroy({
        where: {},
        truncate: true,
      });

      return res.status(200).json({ sessionId: session.id });
    } else {
      return res.status(400).json({ error: 'Payment failed' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  decreaseProduct,
  deleteProduct,
  signup,
  login,
  checkout,
};
