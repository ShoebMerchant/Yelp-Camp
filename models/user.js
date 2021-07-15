const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;
const findOrCreate = require("mongoose-findorcreate");

const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
  },
  googleId: String,
});

UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);

module.exports = mongoose.model("User", UserSchema);
