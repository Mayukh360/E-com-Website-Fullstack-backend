const Product = require("../models/product");

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
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
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // const { quantity } = req.body;

    // Find the product by ID
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ success: false, error: "Candy not found" });
    }

    if (product.quantity <= 0) {
      return res
        .status(404)
        .json({ success: false, error: "Candy quantity not enough" });
    } else {
      product.amount += 1; // Update the quantity of the product
    }
    await product.save(); // Save the updated product to the database

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update quantity" });
  }
};

const decreaseProduct = async (req, res) => {
    try {
      const { id } = req.params;
      // const { quantity } = req.body;
  
      // Find the product by ID
      const product = await Product.findByPk(id);
  
      if (!product) {
        return res.status(404).json({ success: false, error: "Candy not found" });
      }
  
      if (product.quantity <= 0) {
        return res
          .status(404)
          .json({ success: false, error: "Candy quantity not enough" });
      } else {
        product.amount -= 1; // Update the quantity of the product
      }
      await product.save(); // Save the updated product to the database
  
      res.status(200).json({ success: true, data: product });
    } catch (error) {
      console.error("Error updating quantity:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update quantity" });
    }
  };

const deleteProduct = async (req, res) => {
  console.log(req.body);
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    await product.destroy();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  decreaseProduct,
  deleteProduct,
};
