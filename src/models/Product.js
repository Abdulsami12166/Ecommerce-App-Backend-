const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    brand: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    subCategory: { type: String, trim: true },
    type: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, min: 0, default: 0 },
    stock: { type: Number, default: 0 },
    images: [{ type: String }],
    sizes: [{ type: String, trim: true }],
    material: { type: String, trim: true },
    color: { type: String, trim: true },
    gender: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublished: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Product', productSchema);
