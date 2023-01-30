const express = require("express");
const path = require("path");

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

const Router = express.Router();

Router.get("/", shopController.getIndex);

Router.get("/products", shopController.getProducts);

Router.get("/products/:productId", shopController.getProduct);

Router.get("/cart", isAuth, shopController.getCart);

Router.post("/cart", isAuth, shopController.postCart);

Router.get("/orders", isAuth, shopController.getOrders);

Router.get("/orders/:orderId", isAuth, shopController.getInvoice);

Router.get('/checkout', isAuth, shopController.getCheckout);

Router.get('/checkout/success', isAuth, shopController.postOrder);

Router.get('/checkout/cancel', shopController.getCheckout);

Router.post("/cart-delete-item", isAuth, shopController.postCartDeleteItem);

module.exports = Router;
