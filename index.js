const Express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sequelize = require('./database/database');
 const ecomController = require('./controllers/ecomcontroller');
const cors = require('cors');
const Product=require('./models/product');
const User=require('./models/user');
const stripe= require('stripe')('sk_test_51NMoiWSIM6RPcgbriUaPlT49JYQIfnVWVxk1zaooqNBW1cLqKEe1wPjXivYfNemPWm9WO5EjEmfc1zWg9IJgrxN800kL7BH5Qo') 

const app = Express();
app.use(cors());
app.use(Express.json());



app.use((req, res, next) => {
  // console.log("REq",req)
  const token = req.headers.authorization;
  console.log(token);
  if (token) {
    const decodedToken = jwt.verify(token, 'your-secret-key');
    const userId = decodedToken.userId;
    console.log('USERID',userId);
    User.findByPk(userId)
      .then((user) => {
        req.user = user;
        next();
      })
      .catch((err) => {
        console.log(err);
        next();
      });
  } else {
    next();
  }
});


app.get('/getData', ecomController.getAllProducts);
app.post('/getData', ecomController.createProduct);
app.put('/addData/:id', ecomController.updateProduct);
app.put('/removeData/:id', ecomController.decreaseProduct);
app.delete('/getData/:id', ecomController.deleteProduct);



// *** For SignUp ***
app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;

  // Check if the email already exists in the database
  User.findOne({ where: { email } })
    .then((existingUser) => {
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Hash the password
      bcrypt.hash(password, 10)
        .then((hashedPassword) => {
          // Create a new user with the hashed password
          User.create({ name, email, password: hashedPassword })
            .then((newUser) => {
              // Generate a JWT token for the new user
              const token = jwt.sign(
                { userId: newUser.id, name: newUser.name },
                'your-secret-key',
                { expiresIn: '1h' }
              );

              res.json({ token, userId: newUser.id });
            })
            .catch((error) => {
              console.error(error);
              res.status(500).json({ error: 'Failed to create user' });
            });
        })
        .catch((error) => {
          console.error(error);
          res.status(500).json({ error: 'Internal server error' });
        });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    });
});


// *** Login ***
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Find the user in the database (using your Sequelize model)
  User.findOne({ where: { email } })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: 'Invalid email' });
      }

      // Compare the provided password with the hashed password
      bcrypt.compare(password, user.password)
        .then((result) => {
          if (!result) {
            return res.status(401).json({ error: 'Invalid password' });
          }

          // Generate a JWT token
          const token = jwt.sign(
            { userId: user.id, name: user.name },
            'your-secret-key',
            {
              expiresIn: '1h', // Token expiration time
            }
          );

          // Return the token and userId in the response
          res.json({ token, userId: user.id });
        })
        .catch((error) => {
          console.error(error);
          res.status(500).json({ error: 'Internal server error' });
        });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    });
});


app.post('/checkout', async (req, res) => {
  try {
    const { paymentMethodId, items } = req.body;
    const userIds = Array.from(new Set(items.map((item) => item.userId))); // Extract unique user IDs from the items array

    // Fetch the users' information
    const users = await User.findAll({
      where: {
        id: userIds,
      },
    });

    if (users.length !== userIds.length) {
      return res.status(404).json({ error: 'One or more users not found' });
    }

    // Calculate the total amount to charge
    const totalAmount = items.reduce((total, item) => total + item.price * item.amount, 0);

    // Create a payment intent with Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item) => ({
        price_data: {
          currency: 'inr',
          product_data: {
            name: item.title,
          },
          unit_amount: item.price * 100, // Convert price to cents
        },
        quantity: item.amount,
      })),
      mode: 'payment',
      success_url: 'http://localhost:3001/success',
      cancel_url: 'http://localhost:3000/cancel',
      metadata: {
        userIds: userIds.join(','), // Store the user IDs as a comma-separated string in the metadata
      },
    });

    // Handle successful payment
    if (session.id) {
      // Update the order status in your database or perform any other necessary actions
      // ...

      // Delete all products from the database
      await Product.destroy({
        where: {},
        truncate: true,
      });

      return res.status(200).json({ sessionId: session.id });
    } else {
      // Handle payment failure
      return res.status(400).json({ error: 'Payment failed' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});





User.hasMany(Product);
Product.belongsTo(User)

sequelize
  .sync()
  .then((result) => {
    console.log('Database synced');
        return User.findByPk(1);
  })
  .then(user=>{
    // console.log(user);
    app.listen(3000, () => {
      console.log('Server running');
    });
  })
  .catch((err) => {
    console.log(err);
  });
