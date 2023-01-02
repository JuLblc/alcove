const mongoose = require('mongoose');
const { Schema } = mongoose;


const userSchema = new Schema({
  email: {
    type: String,
    required: [true, "L'email est obligatoire."],
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire.'],
  },
  userNumber: String,
  // civility: {
  //   type: String,
  // },
  firstName: {
    type: String,
    required: [true, "Le prénom est obligatoire."],
  },
  lastName: {
    type: String,
    required: [true, "Le nom est obligatoire."],
  },
  street: {
    type: String,
  },
  supp: {
    type: String
  },
  zip: {
    type: String,
  },
  city: {
    type: String
  },
  telephone: {
    type: String,
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN'],
    default: 'USER',
  },
  token: String,
  isValid: {
    type: Boolean,
    default: false
  },
  resetPasswordToken:String,
  resetPasswordExpires:Date,
},
  {
    timestamps: true
  });

const User = mongoose.model('User', userSchema);

module.exports = User;