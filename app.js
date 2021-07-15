if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const ejsMate = require("ejs-mate");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");

// DB Related
const mongoose = require("mongoose");
const User = require("./models/user");
const mongoSanitize = require("express-mongo-sanitize");
const session = require("express-session");
const MongoDBStore = require("connect-mongo")(session);
const findOrCreate = require("mongoose-findorcreate");

// Security related
const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const helmet = require("helmet");

//* Routes
const userRoutes = require("./routes/user");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
//  process.env.DB_URL ||
const dbUrl = "mongodb://localhost:27017/yelp-camp";
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const store = new MongoDBStore({
  url: dbUrl,
  secret: "mysecret",
  touchAfter: 24 * 60 * 60,
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});

const secret = process.env.SECRET || "mysecret";

const sessionConfig = {
  store,
  name: "session",
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());

// Security check
app.use(mongoSanitize());
app.use(helmet());

const {
  scriptSrcUrls,
  styleSrcUrls,
  connectSrcUrls,
  fontSrcUrls,
} = require("./srcAllowed");
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: [
        "'self'",
        "blob:",
        "data:",
        "https://res.cloudinary.com/shoeb/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
        "https://images.unsplash.com/",
        "https://source.unsplash.com/collection/483251",
        "https://source.unsplash.com/collection/483253",
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

// Authentication And Authorization
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

// We also need to create new strategy for GoogleStrategy similar
// to creating a new strategy for LocalStrategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      //callbackURL is what we provided as Authorized redirect URIs
      // while setting up our credentials
      callbackURL: "http://localhost:3000/auth/google/YelpCamp",
    },
    function (accessToken, refreshToken, profile, cb) {
      // profile contains the user google profile info we requested for
      console.log(profile);
      // findOrCreate is not a mongoose method but we can install
      // another package which is mongoose-findorcreate and use it.

      // We also need to add googleId in our user model so that we can
      // store user's profile.id so that we don't create a new user
      // everytime user log in.
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        // This allows us create a user when a user tries to login
        // but is not registered.
        return cb(err, user);
      });
    }
  )
);

// Middleware for flash to work and locals variabls
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  // Adds 'success' msg to locals so we dont have to explicitly pass them everytime
  res.locals.error = req.flash("error");
  next();
});

// Google OAuth
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/YelpCamp",
  passport.authenticate("google", {
    failureRedirect: "/login",
    failureFlash: "Sucessfully logged in",
  }),
  function (req, res) {
    req.flash("success", "Welcome back!");
    const redirectUrl = req.session.returnTo || "/campgrounds";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }
);

// Using Routes
app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.render("home");
});

app.all("*", (req, res, next) => {
  next(new ExpressError("Page not found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh BOY, Something went wrong!";
  console.log(statusCode, err.message);
  res.status(statusCode).render("error", { err });
});

// process.env.PORT;
let port = 3000;
// if (port == null || port == "") {
//   port = 3000;
// }
app.listen(port, () => {
  console.log(`Serving on port ${port}`);
});
