const express = require("express");
const ordersRoutes = express.Router();

const bcrypt = require("bcryptjs");

const Order = require("../../api/models/Order.model");

const passport = require("passport");
const transporter = require("../mailer");

//////////////////////////////// GET LISTING OF ORDERS ///////////////////////////////
ordersRoutes.get("/orders", (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ message: "Accès non authorisé" });
    return;
  }

  let cond;

  if (req.user.role === "ADMIN") {
    cond = {};
  } else {
    cond = { userId: req.user._id.toString() };
  }
  console.log("condition user:", cond);
  Order.find(cond)
    .sort({ createdAt: -1 })
    .then((ordersFromDB) => {
      console.log("orders touvées en base:", ordersFromDB);
      res.status(201).json(ordersFromDB);
    })
    .catch((err) => {
      res.status(400).json({
        message: "Une erreur lors de la création du produit s'est produite.",
      });
    });
});

//////////////////////////////// GET DETAILS OF ORDERS ///////////////////////////////
ordersRoutes.get("/orders/:id", (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ message: "Accès non authorisé" });
    return;
  }

  let cond;

  if (req.user.role === "ADMIN") {
    cond = { _id: req.params.id.toString() };
  } else {
    cond = { _id: req.params.id.toString(), userId: req.user._id.toString() };
  }

  Order.find(cond)
    .then((order) => {
      res.status(200).json(order[0]);
    })
    .catch((err) => {
      res.status(400).json({ message: err.message });
    });
});

//////////////////////////////// UPDATE STATUS OF ORDERS ///////////////////////////////
ordersRoutes.put("/orders/:id", (req, res, next) => {
  if (!req.isAuthenticated() || !req.user.role === "ADMIN") {
    res.status(401).json({ message: "Unauthorized" });
  }

  Order.findById(req.params.id)
    .populate("userId")
    .then((order) => {
      order.status = req.body.status;

      order
        .save()
        .then(() => {
          transporter
            .sendMail({
              from: process.env.EMAIL_ADRESS,
              to: order.addDelivery.email,
              subject: `Votre commande n°${order.orderNumber}`,
              text: `
        Bonjour ${order.userId.firstName},
        Le status de votre commande a été mis à jour.
        Status: ${order.status}
        Merci`,
            })
            .then(() =>
              res.status(200).json({
                message: "Un E-mail de confirmation vous a été envoyé.",
              })
            )
            .catch((err) => {
              res.status(400).json({
                message:
                  "Une erreur lors de l'envoi du mail de confirmation s'est produite.",
              });
            });

          res.status(200).json(order);
        })
        .catch((err) => {
          res.status(400).json({ message: err.message });
        });
    })
    .catch((err) => {
      res.status(400).json({ message: err.message });
    });
});

module.exports = ordersRoutes;
