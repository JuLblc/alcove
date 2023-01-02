const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  orderDate: { type: Date, default: Date.now },
  orderNumber: String,
  items: [{
    product: { type: Schema.Types.Object, ref: 'Product' },
    quantity: Number
  }],
  status: { type: String, enum: ['En attente de validation', 'Validée', 'Expédiée'], default: 'En attente de validation' },
  shippingDate: Date,
  deliveryMode: { type: String, enum: ['Retrait en boutique', 'Livraison à domicile'] },
  deliveryCost: Number,
  addDelivery: {
    // civility: {
    //   type: String,
    //   required: true
    // },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    street: {
      type: String,
      required: true
    },
    supp: String,
    zip: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    telephone: {
      type: String,
    },
    email: {
      type: String,
    }
  },
  addBilling: {
    // civility: {
    //   type: String,
    //   required: true
    // },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    street: {
      type: String,
      required: true
    },
    supp: String,
    zip: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    }
  }
},
  {
    timestamps: true
  });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;