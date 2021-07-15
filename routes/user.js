const express = require("express");
const passport = require("passport");
const router = express.Router();
const users = require("../controllers/users");
const findOrCreate = require("mongoose-findorcreate");

const catchAsync = require("../utils/catchAsync");

router
  .route("/register")
  .get(users.renderRegister)
  .post(catchAsync(users.register));

router
  .route("/login")
  .get(users.renderLogin)
  .post(
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
    }),
    users.login
  );

// Google OAuth
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["openid", "email", "profile"] })
);

router.get(
  "/auth/google/YelpCamp",
  passport.authenticate("google", {
    failureRedirect: "/login",
    failureFlash: "Sucessfully logged in",
  }),
  users.googleRegisterSuccess
);

router.get("/logout", users.logout);

module.exports = router;
