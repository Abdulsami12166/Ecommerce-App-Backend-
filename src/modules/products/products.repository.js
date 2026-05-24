const Product = require('../../models/Product');

const productsRepository = {
  findPublishedProducts: ({ filter, sortBy, page, limit }) =>
    Product.find(filter)
      .populate('seller', 'name')
      .collation({ locale: 'en', strength: 2 })
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit),
  countPublishedProducts: filter => Product.countDocuments(filter),
  findProductById: id => Product.findById(id).populate('seller', 'name email'),
};

module.exports = { productsRepository };
