const express = require("express");
const path = require("path");
const { body } = require("express-validator");

const isAuth = require("../middleware/is-auth");
const adminController = require("../controllers/admin");

const Router = express.Router();

// /admin/add-product => GET
Router.get("/add-product", isAuth, adminController.getAddProduct);

// /admin/add-product => POST
Router.post(
  "/add-product",
  [
    body("title")
      .isString()
      .isLength({ min: 3 })
      .withMessage(
        "Please enter only alphanumeric characters and keep the title length greater than 3"
      )
      .trim(),
    body("price").isFloat().withMessage("Please enter a floating point price"),
    body("description")
      .isLength({ min: 8, max: 200 })
      .withMessage(
        "Please keep the description length between 8 and 200 characters long"
      )
      .trim(),
  ],
  isAuth,
  adminController.postAddProduct
);

// /admin/edit-product/:id => GET
Router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

// /admin/edit-product => POST
Router.post(
  "/edit-product",
  [
    body("title")
      .isString()
      .isLength({ min: 3 })
      .withMessage(
        "Please enter only alphanumeric characters and keep the title length greater than 3"
      )
      .trim(),
    body("price").isFloat().withMessage("Please enter a floating point price"),
    body("description")
      .isLength({ min: 8, max: 200 })
      .withMessage(
        "Please keep the description length between 8 and 200 characters long"
      )
      .trim(),
  ],
  isAuth,
  adminController.postEditProduct
);

// /admin/delete-product/:id => GET
Router.delete(
  "/product/:productId",
  isAuth,
  adminController.getDeleteProduct
);

// /admin/products => GET
Router.get("/products", isAuth, adminController.getProducts);

module.exports = Router;
