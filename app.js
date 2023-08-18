require('dotenv').config();
const Express = require("express");
const jwt = require("jsonwebtoken");
const helmet=require('helmet')
const compression=require('compression')

const sequelize = require("./database/database");
const ecomController = require("./controllers/ecomcontroller");
const authcontroller=require('./controllers/authcontroller')
const cors = require("cors");
const Product = require("./models/product");
const User = require("./models/user");

const app = Express();
app.use(cors());
app.use(Express.json());
app.use(helmet());
app.use(compression());

app.use((req, res, next) => {
  const token = req.headers.authorization;
  // console.log(token);
  if (token) {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;
    // console.log("USERID", userId);
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

app.get("/getData", ecomController.getAllProducts);
app.post("/getData", ecomController.createProduct);
app.put("/addData/:id", ecomController.updateProduct);
app.put("/removeData/:id", ecomController.decreaseProduct);
app.delete("/getData/:id", ecomController.deleteProduct);
app.post("/signup", authcontroller.signup);
app.post("/login", authcontroller.login);
app.post("/checkout", ecomController.checkout);

User.hasMany(Product);
Product.belongsTo(User);

console.log('USERNAME',process.env.DB_PASSWORD)
sequelize
  .sync()
  .then((result) => {
    console.log("Database synced");
    return User.findByPk(1);
  })
  .then((user) => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
