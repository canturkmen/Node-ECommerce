const http = require("http");
const https = require("https");
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const dotenv = require('dotenv');
dotenv.config();

const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const errorController = require("./controllers/errors");
const mongoConnect = require("./util/database").mongoConnect;

const User = require("./models/user");

const MONGODB_URL = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.t76i6e6.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

// Instantiate the app
const app = express();

const csrfProtection = csrf();

const store = new MongoDBStore({
  uri: MONGODB_URL,
  collection: "sessions",
});
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + "-" + file.originalname);
  },
});
const filter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Set the template engine configurations
app.set("view engine", "ejs");
app.set("views", "views");

const authRoute = require("./routes/auth");
const adminRoute = require("./routes/admin");
const shopRoute = require("./routes/shop");

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: filter }).single("image"));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "my secret session",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

// Handle form data
app.use("/admin", adminRoute);

// Render the form data
app.use(shopRoute);

// Handle authentication
app.use(authRoute);

// Return a 500 page if there is an error on the server
app.get(errorController.show500Error);

// Return a 404 page if no request reached to any middleware
app.use(errorController.show404Error);

app.use((error, req, res, next) => {
  res.status(500).render("500", { docTitle: "500 Page", path: "/500" });
});

mongoose
  .connect(MONGODB_URL)
  .then((result) => {
    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => console.log(err));

// mongoConnect(() => {
//   app.listen(3000);
// })
