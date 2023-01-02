const express = require("express");
const cartsRoutes = express.Router();

const Product = require("../../api/models/Product.model");
const Order = require("../../api/models/Order.model");

const transporter = require("../mailer");

//////////////////////////////// ADD PRODUCT THE CART ///////////////////////////////
cartsRoutes.put("/cart/add", (req, res, next) => {
  const { productId, quantity } = req.body;
  if (!productId || Number(quantity) === 0) {
    res.status(400).json({
      message: "please provide product id and quantity to add to the cart",
    });
    return;
  }

  Product.findById(productId)
    .then((productFromDB) => {
      const item = {
        product: productFromDB,
        quantity: quantity,
      };
      req.session.cart.push(item);
      res.status(200).json({ cart: req.session.cart });
    })
    .catch((err) => next(err));
});
//////////////////////////////// EDIT QTY OF PRODUCT ALREADY IN THE CART ////////////////////////
cartsRoutes.put("/cart/updateQty", (req, res, next) => {
  const { productId, quantity } = req.body;
  // console.log('cart ', req.session.cart)

  req.session.cart = req.session.cart.map((obj) => {
    if (obj.product._id === productId) {
      obj.quantity = Number(quantity);
    }
    return obj;
  });

  res.status(200).json({ cart: req.session.cart });
});

//////////////////////////////// GET LISTING OF ITEM IN THE CART ///////////////////////////////
cartsRoutes.get("/cart", (req, res, next) => {
  res.status(200).json({ cart: req.session.cart });
});

//////////////////////////////// REMOVE ITEM FROM THE CART ///////////////////////////////
cartsRoutes.put("/cart/remove", (req, res, next) => {
  const { productId } = req.body;
  req.session.cart = req.session.cart.filter(
    (obj) => obj.product._id !== productId
  );
  res.status(200).json({ cart: req.session.cart });
});

//////////////////////////////// CREATION OF AN ORDER ///////////////////////////////
cartsRoutes.post("/cart/checkout", (req, res, next) => {
  if (!req.isAuthenticated()) {
    res
      .status(401)
      .json({ message: "Veuillez vous connecter pour valider la commande" });
    return;
  }

  const { addBilling, addDelivery, deliveryMode, deliveryCost, orderNumber } =
    req.body;
  const userId = req.user.id;
  const items = req.session.cart;

  Order.create({
    userId,
    orderNumber,
    items,
    deliveryMode,
    deliveryCost,
    addDelivery,
    addBilling,
  })
    .then((newOrder) => {
      req.session.cart = []; //On vide le panier suite à la passation de la commande

      transporter
        .sendMail({
          from: process.env.EMAIL_ADRESS,
          to: newOrder.addDelivery.email,
          subject: `Votre commande n°${newOrder.orderNumber}`,
          text: `
        Bonjour ${req.user.firstName},
        Votre commande n°${newOrder.orderNumber} nous a bien été transmise.
        Statut: En attente de validation
        Nous vous tiendrons au courant de son évolution.
        Merci`,
        })
        .then(() => res.status(201).json(newOrder))
        .catch((err) => {
          res.status(400).json({
            message:
              "Une erreur lors de l'envoi du mail de confirmation s'est produite.",
          });
        });
    })
    .catch((err) => res.status(400).json({ message: err.message }));
});

module.exports = cartsRoutes;
