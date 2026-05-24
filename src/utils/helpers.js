export const formatCurrency = value => `$${value.toFixed(2)}`;

export const getCartTotal = items =>
  items.reduce((total, item) => total + item.price * item.qty, 0);

export const getTotalCartCount = items =>
  items.reduce((count, item) => count + item.qty, 0);

export const optimizeImageUrl = (uri, width = 700) => {
  if (!uri) {
    return uri;
  }

  if (!uri.includes('images.unsplash.com')) {
    return uri;
  }

  if (uri.includes('w=')) {
    return uri.replace(/w=\d+/i, `w=${width}`).replace(/q=\d+/i, 'q=70');
  }

  const joiner = uri.includes('?') ? '&' : '?';
  return `${uri}${joiner}auto=format&fit=crop&w=${width}&q=70`;
};
