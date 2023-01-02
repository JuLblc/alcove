const express = require("express");
const authRoutes = express.Router();

const bcrypt = require("bcryptjs");

const User = require("../../api/models/User.model");

const passport = require("passport");
const transporter = require("../mailer");

/* Documentations:
https://safwan-du16.medium.com/email-verification-with-node-js-and-nodemailer-3a6363b31060
https://alto-palo.com/blogs/nodejs-authentication-with-passportjs-passport-local-mongoose/
https://itnext.io/password-reset-emails-in-your-react-app-made-easy-with-nodemailer-bb27968310d7
https://stackoverflow.com/questions/46044678/passport-local-mongoose-changepassword-function
*/

// Fonction utilitaire
function generate_token(length) {
  //edit the token allowed characters
  var a =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
  var b = [];
  for (var i = 0; i < length; i++) {
    var j = (Math.random() * (a.length - 1)).toFixed(0);
    b[i] = a[j];
  }
  return b.join("");
}

///////////////////////////////////////////////////// CREATION USER ACCOUNT //////////////////////////////////////////////////

authRoutes.post("/users", (req, res, next) => {
  const { email, password, firstName, lastName } = req.body;

  // 1. Check username and password are not empty
  if (!email || !password) {
    res.status(400).json({
      message: "Merci de saisir une adresse E-mail et un mot de passe",
    });
    return;
  }

  if (!firstName || !lastName) {
    res
      .status(400)
      .json({ message: "Merci de saisir votre nom et votre prénom" });
    return;
  }

  const regexEmail = /^([\w-\.]+)@((?:[\w]+\.)+)([a-zA-Z]{2,4})/i;

  if (!regexEmail.test(email)) {
    res
      .status(403)
      .json({ message: "L'adresse E-mail saisie n'est pas valide" });
    return;
  }

  const regexPassword = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;

  if (!regexPassword.test(password)) {
    res.status(403).json({
      message:
        "Le mot de passe doit contenir au moins 6 charactères, un chiffre et une minuscule et une majuscule",
    });
    return;
  }

  User.findOne({ email })
    .then((foundUser) => {
      if (foundUser) {
        res
          .status(409)
          .json({ message: "Cette adresse E-mail est déjà utilisée" });
        return;
      }

      const salt = bcrypt.genSaltSync(10);
      const hashPass = bcrypt.hashSync(password, salt);
      const token = generate_token(32);
      const aNewUser = new User({
        email: email,
        password: hashPass,
        firstName: firstName,
        lastName: lastName,
        token: token,
      });

      // Query sur tous les user pour obtenir le nbr de user en base
      User.find({})
        .then((response) => {
          // userNumber pour création n° de commande
          const userNumbers = response.map((user) => user.userNumber);
          aNewUser.userNumber = Math.max(...userNumbers) + 1;

          aNewUser
            .save()
            .then(() => {
              // Persist our new user into session
              req.session.currentUser = aNewUser;

              //Envoi email pour confirmer l'adresse
              transporter
                .sendMail({
                  from: process.env.EMAIL_ADRESS,
                  to: email,
                  subject: "Validation de votre adresse E-mail",
                  html: `
                Bienvenue ${aNewUser.firstName},</br>
                cliquez sur le lien suivant pour valider votre adresse E-Mail</br>
                <a href=${process.env.NOM_DOMAINE}/verify/${token}> Valider </a></br>
                Merci`,
                })
                .then(() =>
                  res.status(200).json({
                    message:
                      "Un E-mail pour valider votre adresse vous a été envoyé.",
                  })
                )
                .catch((err) => {
                  res.status(400).json({
                    message:
                      "Une erreur lors de l'envoi du mail de validation s'est produite.",
                  });
                });
            })
            .catch((err) => {
              res.status(400).json({
                message:
                  "Une erreur lors de la création du compte s'est produite.",
              });
            });
        })
        .catch((err) => {
          res.status(400).json({
            message: "Une erreur lors de la création du compte s'est produite.",
          });
        });
    })
    .catch((err) => {
      res.status(500).json({ message: "Adresse E-mail non reconnue." });
    });
});
//////////////////////////////////////////////////// VERIFY EMAIL ADRESS //////////////////////////////////////////////////
authRoutes.get("/verify/:token", (req, res, next) => {
  const token = req.params.token;

  User.findOne({ token })
    .then((foundUser) => {
      foundUser.isValid = true;
      foundUser.token = undefined;
      foundUser
        .save()
        .then(() => res.status(200).json({ message: "isValid = true en base" }))
        .catch((err) => next(err));
    })
    .catch((err) => {
      res
        .status(400)
        .json({ message: "Lien de validation d'adresse E-mail non valide" });
    });
});

///////////////////////////////////////////////////// CREATION SESSION //////////////////////////////////////////////////
authRoutes.post("/sessions", (req, res, next) => {
  passport.authenticate("local", (err, theUser, failureDetails) => {
    if (err) {
      // Something went wrong authenticating user
      res.status(400).json({ message: err });
      return;
    }

    if (!theUser) {
      // Unauthorized, `failureDetails` contains the error messages from our logic in "LocalStrategy" {message: '…'}.
      res.status(403).json({
        message: "L'adresse E-mail et le mot de passe ne correspondent pas.",
      });
      return;
    }

    if (!theUser.isValid) {
      // Unauthorized, `failureDetails` contains the error messages from our logic in "LocalStrategy" {message: '…'}.
      res
        .status(403)
        .json({ message: "L'adresse E-mail n'a pas été validée." });
      return;
    }

    // save user in session: req.user
    req.login(theUser, (err) => {
      if (err) {
        // Session save went bad
        res.status(400).json({ message: err });
        return;
      }

      // All good, we are now logged in and `req.user` is now set
      res.status(201).json(theUser);
    });
  })(req, res, next);
});

//////////////////////////////////// CHECK IF LOGGED IN ////////////////////////////////

authRoutes.get("/session", (req, res, next) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ user: req.user });
    return;
  }
  res.status(401).json({ message: "Unauthorized" });
});

///////////////////////////////////// DELETE SESSION ///////////////////////////////////

authRoutes.delete("/session", (req, res, next) => {
  req.logout();
  res.status(204).send();
});

////////////////////////////////// UPDATE USER DATA ////////////////////////////////////
authRoutes.put("/user", (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  User.findByIdAndUpdate(req.user._id, req.body)
    .then(() => {
      res.status(200).json({ user: req.user });
    })
    .catch((error) => {
      res.json(error);
    });
});

//////////////////////////////// UPDATE USER PWD ////////////////////////////////////////
authRoutes.put("/user/update-password", (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Check currentPassword and newPassword are not empty
  if (!currentPassword || !newPassword) {
    res.status(400).json({
      message:
        "Merci de saisir votre mot de passe actuel et votre nouveau mot de passe",
    });
    return;
  }

  const regexPassword = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;

  if (!regexPassword.test(newPassword)) {
    res.status(403).json({
      message:
        "Le mot de passe doit contenir au moins 6 charactères, un chiffre et une minuscule et une majuscule",
    });
    return;
  }

  User.findById(req.user._id)
    .then((foundUser) => {
      let pwdFromDb = foundUser.password;

      bcrypt.compare(currentPassword, pwdFromDb, function (err, isMatch) {
        // console.log('bcrypt compare:', currentPassword, pwdFromDb, err, isMatch)

        if (!isMatch) {
          // Unauthorized
          res
            .status(403)
            .json({ message: "Ancien mot de passe ne correspond pas." });
          return;
        }

        const salt = bcrypt.genSaltSync(10);
        const hashPass = bcrypt.hashSync(newPassword, salt);
        foundUser.password = hashPass;
        foundUser
          .save()
          .then(() => {
            res.status(200).json(foundUser);
          })
          .catch((err) => {
            console.log("err:", err);
            res.status(400).json({
              message:
                "Une erreur lors de la modification du mot de passe s'est produite.",
            });
          });
      });
    })
    .catch((error) => {
      res.status(400).json(error);
    });
});

//////////////////////////////////// FORGOT PWD /////////////////////////////////////////////
authRoutes.put("/user/forgot-password", (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: "Merci de saisir une adresse E-mail" });
    return;
  }

  const regexEmail = /^([\w-\.]+)@((?:[\w]+\.)+)([a-zA-Z]{2,4})/i;

  if (!regexEmail.test(email)) {
    res
      .status(403)
      .json({ message: "L'adresse E-mail saisie n'est pas valide" });
    return;
  }

  User.findOne({
    email: email,
    isValid: true,
  })
    .then((foundUser) => {
      foundUser.resetPasswordToken = generate_token(32);
      foundUser.resetPasswordExpires = Date.now() + 360000; //Token valide 1h

      foundUser
        .save()
        .then(
          transporter
            .sendMail({
              from: process.env.EMAIL_ADRESS,
              to: email,
              subject: "Récupération mot de passe oublié",
              html: `
            Bonjour ${foundUser.firstName},</br>
            nous avons reçu une demande de récupération de mot de passe.</br>
            Le lien suivant est valide 1 heure, cliquez pour redéfinir votre mot de passe.</br>
            <a href=${process.env.NOM_DOMAINE}/reset-password/${foundUser.resetPasswordToken}>Accèder à mon compte</a></br>
            Si vous n'êtes pas à l'origine de cette demande, merci d'ignorer cet E-mail.`,
            })
            .then(() =>
              res.status(200).json({ message: "Un E-mail vous a été envoyé." })
            )
            .catch((err) => {
              res.status(400).json({
                message:
                  "Une erreur lors de l'envoi du mail de récupération s'est produite.",
              });
            })
        )
        .catch((err) => {
          res.status(400).json({
            message:
              "Une erreur lors de la sauvegarde dans la base de donnée s'est produite.",
          });
        });
    })
    .catch((err) => {
      res.status(400).json({ message: "Adresse E-mail non trouvée." });
    });
});

//////////////////////////////////// RESET PWD /////////////////////////////////////////////
authRoutes.get("/user/reset-password/:resetPasswordToken", (req, res, next) => {
  const resetPasswordToken = req.params.resetPasswordToken;

  User.findOne({ resetPasswordToken })
    .then((foundUser) => {
      let dateNow = Date.now();
      let datePasswordExpires = Date.parse(foundUser.resetPasswordExpires);

      if (dateNow > datePasswordExpires) {
        res.status(200).json({ message: "La validité de ce lien a expiré" });
        return;
      }
      res.status(200).json(foundUser);
    })
    .catch((err) => {
      res.status(400).json({ message: "Ce lien n'est pas valide." });
    });
});

//////////////////////////////// UPDATE FORGOTTEN USER PWD ////////////////////////////////////////
authRoutes.put("/user/update-forgotten-password", (req, res, next) => {
  const { email, newPassword } = req.body;
  // console.log('newPassword', newPassword, 'email', email)

  // Check currentPassword and newPassword are not empty
  if (!newPassword) {
    res
      .status(400)
      .json({ message: "Merci de saisir votre nouveau mot de passe" });
    return;
  }

  const regexPassword = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;

  if (!regexPassword.test(newPassword)) {
    res.status(403).json({
      message:
        "Le mot de passe doit contenir au moins 6 charactères, un chiffre et une minuscule et une majuscule",
    });
    return;
  }

  User.findOne({ email })
    .then((foundUser) => {
      // console.log('foundUser put update', foundUser)

      const salt = bcrypt.genSaltSync(10);
      const hashPass = bcrypt.hashSync(newPassword, salt);
      foundUser.password = hashPass;

      //RAZ dans DB
      foundUser.resetPasswordToken = undefined;
      foundUser.resetPasswordExpires = undefined;

      foundUser
        .save()
        .then(() => {
          res
            .status(200)
            .json({ message: "Mot de passe modifié avec succès." });
        })
        .catch((err) => {
          console.log("err save:", err);
          res.status(400).json({
            message:
              "Une erreur lors de la réinitialisation du mot de passe s'est produite.",
          });
        });
    })
    .catch((error) => {
      res.status(400).json(error);
    });
});

//////////////////////////////// DELETE USER ACCOUNT ////////////////////////////////////////
authRoutes.delete("/user", (req, res, next) => {
  User.findByIdAndRemove(req.session.passport.user)
    .then(() => {
      req.logout();
      res.status(204).send();
    })
    .catch((err) => next(err));
});

module.exports = authRoutes;
