const { sendSuccess } = require('../../shared/utils/apiResponse');
const productsService = require('./products.service');

const getProducts = async (req, res, next) => {
  try {
    const data = await productsService.listProducts(req.query);
    return sendSuccess(res, 200, 'Products fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const data = await productsService.getProduct(req.params.id);
    return sendSuccess(res, 200, 'Product fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

module.exports = { getProducts, getProductById };
