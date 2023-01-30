const express = require("express");
const authController = require("../controllers/auth");
const { body } = require("express-validator");
const User = require("../models/user");
const Router = express.Router();

Router.get("/login", authController.getLogin);

Router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid e-mail")
      .normalizeEmail(),
    body(
      "password",
      "Please enter a password that is 5 characters long and only contains alpha numeric characters"
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
  ],
  authController.postLogin
);

Router.get("/logout", authController.getLogout);

Router.get("/signup", authController.getSignup);

Router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid e-mail")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              "E-Mail already exists, please enter another e-mail"
            );
          }
          return true;
        });
      })
      .normalizeEmail(),
    body(
      "password",
      "Please enter a password that is 5 characters long and only contains alpha numeric characters"
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords needs to match");
        }
        return true;
      }),
  ],
  authController.postSignup
);

Router.get("/reset", authController.getReset);

Router.post("/reset", authController.postReset);

Router.get("/reset/:token", authController.getNewPassword);

Router.post("/new-password", authController.postNewPassword);

module.exports = Router;
