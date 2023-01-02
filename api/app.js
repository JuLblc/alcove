require("dotenv").config();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const favicon = require("serve-favicon");
const mongoose = require("mongoose");
const logger = require("morgan");
const path = require("path");
const cors = require("cors");

const session = require("express-session");
const MongoStore = require("connect-mongo")(session);

const bcrypt = require("bcryptjs");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const User = require("./models/User.model");

const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then((x) => {
    console.log(
      `Connected to Mongo! Database name: "${x.connections[0].name}"`
    );
  })
  .catch((err) => {
    console.error("Error connecting to mongo", err);
  });

const app = express();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
    }),
    resave: true,
    saveUninitialized: false, // <== false if you don't want to save empty session object to the store
  })
);

app.use(function (req, res, next) {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  next();
});
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, cb) => cb(null, user._id));

passport.deserializeUser((id, cb) => {
  User.findById(id)
    .then((user) => cb(null, user))
    .catch((err) => cb(err));
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email", // by default
      passwordField: "password", // by default
    },
    (email, password, done) => {
      User.findOne({ email })
        .then((user) => {
          if (!user) {
            return done(null, false, { message: "Incorrect username" });
          }

          if (!bcrypt.compareSync(password, user.password)) {
            return done(null, false, { message: "Incorrect password" });
          }

          done(null, user);
        })
        .catch((err) => done(err));
    }
  )
);

// Middleware Setup
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(cookieParser());

app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));

// default value for title local
app.locals.title = "Express - Generated with IronGenerator";

//Lien API /REACT
app.use(
  cors({
    credentials: true,
    origin: [process.env.NOM_DOMAINE],
  })
);

const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);
const productsRoutes = require("./routes/products");
app.use("/api", productsRoutes);
const ordersRoutes = require("./routes/orders");
app.use("/api", ordersRoutes);
const cartsRoutes = require("./routes/carts");
app.use("/api", cartsRoutes);

// Serve static files from client/build folder
app.use(express.static("alcove-react/build"));

// For any other routes: serve client/build/index.html SPA
app.use((req, res, next) => {
  res.sendFile(`${__dirname}/alcove-react/build/index.html`, (err) => {
    if (err) next(err);
  });
});

module.exports = app;
