const express = require('express');
const authRoutes = express.Router();

const bcrypt = require('bcryptjs');

const User = require('../models/User.model');

const passport = require('passport');

///////////////////////////////////////////////////// CREATION USER ACCOUNT //////////////////////////////////////////////////

authRoutes.post('/users', (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  // 1. Check username and password are not empty
  if (!email || !password) {
    res.status(400).json({ message: 'Merci de saisir une adresse E-mail et un mot de passe' });
    return;
  }

  const regexEmail = /^([\w-\.]+)@((?:[\w]+\.)+)([a-zA-Z]{2,4})/i;
  
  if (!regexEmail.test(email)) {
    res.status(403).json({ message: "L'adresse E-mail saisie n'est pas valide" });
    return;
  }

  const regexPassword = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;

  if (!regexPassword.test(password)) {
    res.status(403).json({ message: 'Le mot de passe doit contenir au moins 6 charactères, un chiffre et une minuscule et une majuscule' });
    return;
  }

  User.findOne({ email })
    .then(foundUser => {
      if (foundUser) {
        res.status(409).json({ message: 'Cette adresse E-mail est déjà utilisée' });
        return;
      }

      const salt = bcrypt.genSaltSync(10);
      const hashPass = bcrypt.hashSync(password, salt);

      const aNewUser = new User({
        email: email,
        password: hashPass
      });

      aNewUser.save()
        .then(() => {
          // Persist our new user into session
          // req.session.currentUser = aNewUser

          res.status(201).json(aNewUser);
        })
        .catch(err => {
          res.status(400).json({ message: "Une erreur lors de la création du compte s'est produite."});
        });
    })
    .catch(err => {
      res.status(500).json({ message: "Adresse E-mail non reconnue."});
    });
})


///////////////////////////////////////////////////// CREATION SESSION //////////////////////////////////////////////////
authRoutes.post('/sessions', (req, res, next) => {

  passport.authenticate('local', (err, theUser, failureDetails) => {
    if (err) {
      // Something went wrong authenticating user
      return next(err);
    }
 
    if (!theUser) {
      // Unauthorized, `failureDetails` contains the error messages from our logic in "LocalStrategy" {message: '…'}.
      res.status(403).json({ message: "L'adresse E-mail et le mot de passe ne correspondent pas."});
      return;
    }
 
    // save user in session: req.user
    req.login(theUser, err => {
      if (err) {
        // Session save went bad
        return next(err);
      }
 
      // All good, we are now logged in and `req.user` is now set
      res.status(201).json(theUser);;
    });
  })(req, res, next);
});

module.exports = authRoutes;