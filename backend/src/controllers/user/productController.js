const Product = require('../../models/Product');
const { sendSuccess, sendError } = require('../../utils/responseHandler');
const { logger } = require('../../utils/logger');

const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, search, category, minPrice, maxPrice, sort,
    } = req.query;

    const filter = { isPublished: true };

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = { $regex: new RegExp(category, 'i') };
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
    }

    const sortBy = {};
    if (sort === 'price_asc') sortBy.price = 1;
    else if (sort === 'price_desc') sortBy.price = -1;
    else if (sort === 'newest') sortBy.createdAt = -1;
    else sortBy.createdAt = -1;

    const products = await Product.find(filter)
      .populate('seller', 'name')
      .collation({ locale: 'en', strength: 2 })
      .sort(sortBy)
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .limit(parseInt(limit, 10));

    const total = await Product.countDocuments(filter);

    return sendSuccess(res, 200, 'Products fetched successfully', {
      products,
      pagination: {
        page: parseInt(page, 10), limit: parseInt(limit, 10), total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (e) {
    next(e);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email');

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    return sendSuccess(res, 200, 'Product fetched successfully', { product });
  } catch (e) {
    next(e);
  }
};

module.exports = { getProducts, getProductById };
