const { findOneAndUpdate } = require("../models/user");
const User = require("../models/user");

module.exports.renderRegister = (req, res) => {
  res.render("users/register");
};

module.exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ email, username });
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, err => {
      if (err) return next(err);
      req.flash("success", "Welcome to YelpCamp");
      res.redirect("/campgrounds");
    });
    console.log(registeredUser);
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/register");
  }
};

module.exports.googleOauthRegister = (
  accessToken,
  refreshToken,
  profile,
  cb
) => {
  // profile contains the user google profile info we requested for
  console.log(profile);
  console.log(profile._json.email);
  // findOrCreate is not a mongoose method but we can install
  // another package which is mongoose-findorcreate and use it.
  // We also need to add googleId in our user model so that we can
  // store user's profile.id so that we don't create a new user
  // everytime user log in.
  User.findOrCreate(
    {
      googleId: profile.id,
    },
    { email: profile._json.email, username: profile.displayName },
    function (err, user) {
      // This allows us create a user when a user tries to login
      // but is not registered.
      return cb(err, user);
    }
  );
};

module.exports.googleRegisterSuccess = (req, res) => {
  req.flash("success", "Welcome back!");
  const redirectUrl = req.session.returnTo || "/campgrounds";
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};

module.exports.renderLogin = (req, res) => {
  res.render("users/login");
};

module.exports.login = (req, res) => {
  req.flash("success", "Welcome back!");
  const redirectUrl = req.session.returnTo || "/campgrounds";
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res) => {
  req.logout();
  req.flash("success", "Goodbye!");
  res.redirect("/campgrounds");
};
