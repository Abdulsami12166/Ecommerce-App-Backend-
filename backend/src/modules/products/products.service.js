const { productsRepository } = require('./products.repository');
const { AppError } = require('../../shared/utils/appError');

const listProducts = async query => {
  const {
    page = 1, limit = 20, search, category, minPrice, maxPrice, sort,
  } = query;

  const filter = { isPublished: true };
  if (search) filter.title = { $regex: search, $options: 'i' };
  if (category) filter.category = { $regex: new RegExp(category, 'i') };
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
  }

  const sortBy = {};
  if (sort === 'price_asc') sortBy.price = 1;
  else if (sort === 'price_desc') sortBy.price = -1;
  else sortBy.createdAt = -1;

  const normalizedPage = parseInt(page, 10);
  const normalizedLimit = parseInt(limit, 10);

  const [products, total] = await Promise.all([
    productsRepository.findPublishedProducts({
      filter,
      sortBy,
      page: normalizedPage,
      limit: normalizedLimit,
    }),
    productsRepository.countPublishedProducts(filter),
  ]);

  return {
    products,
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      pages: Math.ceil(total / normalizedLimit),
    },
  };
};

const getProduct = async productId => {
  const product = await productsRepository.findProductById(productId);
  if (!product) throw new AppError('Product not found', 404);
  return { product };
};

module.exports = { listProducts, getProduct };
