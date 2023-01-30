const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const sendgrid = require("@sendgrid/Mail");
const { validationResult } = require("express-validator");

const User = require("../models/user");
const user = require("../models/user");

sendgrid.setApiKey(
  "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"
);

exports.getLogin = (req, res, next) => {
  let errMessage = req.flash("error");
  if (errMessage.length > 0) {
    errMessage = errMessage[0];
  } else {
    errMessage = null;
  }
  res.render("auth/login", {
    docTitle: "Login",
    path: "/login",
    errorMessage: errMessage,
    oldInput: {
      email: "",
      password: "",
    },
    errorValidationCheck: [],
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      docTitle: "Login",
      path: "/login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      errorValidationCheck: errors.array(),
    });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          docTitle: "Login",
          path: "/login",
          errorMessage: "Invalid Email",
          oldInput: {
            email: email,
            password: password,
          },
          errorValidationCheck: [{ param: "email" }],
        });
      }
      bcrypt
        .compare(password, user.password)
        .then((result) => {
          if (result) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          }
          return res.status(422).render("auth/login", {
            docTitle: "Login",
            path: "/login",
            errorMessage: "Invalid Password",
            oldInput: {
              email: email,
              password: password,
            },
            errorValidationCheck: [{ param: "password" }],
          });
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getLogout = (req, res, next) => {
  req.session.destroy((err) => {
    res.redirect("/");
  });
};

exports.getSignup = (req, res, next) => {
  let errMessage = req.flash("error");
  if (errMessage.length > 0) {
    errMessage = errMessage[0];
  } else {
    errMessage = null;
  }
  res.render("auth/signup", {
    docTitle: "Sign-Up",
    path: "/signup",
    errorMessage: errMessage,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    errorValidationCheck: [],
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      docTitle: "Sign-Up",
      path: "/signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword,
      },
      errorValidationCheck: errors.array(),
    });
  }

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: [],
      });
      return user.save();
    })
    .then((result) => {
      res.redirect("/login");
      return sendgrid.send({
        to: email,
        from: "turkmenc844@gmail.com",
        subject: "Successful Sign-Up",
        text: "You have been signed-up to Node-JS Shop.",
        html: "<h1>Succesfully Signed-Up !</h1>",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getReset = (req, res, next) => {
  let errMessage = req.flash("error");
  if (errMessage.length > 0) {
    errMessage = errMessage[0];
  } else {
    errMessage = null;
  }

  res.render("auth/reset", {
    docTitle: "Reset Password",
    path: "/reset",
    errorMessage: errMessage,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    // Error check
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }

    // Assign the token value from the buffer.
    const token = buffer.toString("hex");

    // Attach the reset token to the user in the database
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash(
            "error",
            "The E-Mail you have entered was not found, please enter another E-Mail."
          );
          return res.redirect("/reset");
        }

        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        sendgrid.send({
          to: req.body.email,
          from: "turkmenc844@gmail.com",
          subject: "Password Reset",
          html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
          `,
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      let errMessage = req.flash("error");
      if (errMessage.length > 0) {
        errMessage = errMessage[0];
      } else {
        errMessage = null;
      }

      res.render("auth/new-password", {
        docTitle: "New Password",
        path: "/new-password",
        errorMessage: errMessage,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      return bcrypt
        .hash(newPassword, 12)
        .then((hashedPassword) => {
          user.password = hashedPassword;
          user.resetToken = undefined;
          user.resetTokenExpiration = undefined;
          return user.save();
        })
        .then((result) => res.redirect("/login"))
        .catch((err) => console.log(err));
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
