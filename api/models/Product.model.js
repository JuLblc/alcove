
const mongoose = require('mongoose');
const {Schema} = mongoose;


const productSchema = new Schema({
  unitPrice: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  advice: {
    type: String,
    required: true  
  },
  ingredients: {
    type: String,
    required: true 
  },
  category: {
    type: String,
    enum: ['NAIL', 'LASH', 'BASIC','CARTE'],
    default: 'BASIC',
  },
  imageUrl: { type: String, required: true }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;