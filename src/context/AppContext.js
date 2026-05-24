import React, {
  createContext,
  useEffect,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cartItems as initialCartItems,
  paymentMethods as initialPaymentMethods,
  orders as initialOrders,
  products,
  reviews as initialReviews,
  savedAddresses as initialSavedAddresses,
} from '../constants/mockData';
import { normalizeOrder, normalizeProduct, orderApi, productApi, userApi } from '../services/api';
import { getCartTotal, getTotalCartCount } from '../utils/helpers';

const AppContext = createContext(null);

const withProductId = item => ({
  ...item,
  productId: item.productId || item.id,
});

const buildInitialReviewsByProduct = () =>
  products.reduce((accumulator, product) => {
    accumulator[product.id] = initialReviews.map(review => ({ ...review }));
    return accumulator;
  }, {});

const initialSupportChats = [
  {
    id: 'support-sophia',
    name: 'Sophia',
    role: 'Owner • Brown Winter Jacket',
    status: 'Online',
    phone: '+9118002109988',
    accent: '#5A2B12',
    messages: [
      {
        id: 'support-sophia-1',
        from: 'support',
        text: 'Hi Olivia, I am the product owner for the Brown Winter Jacket. Need any order help?',
        timestamp: Date.now() - 300000,
      },
      {
        id: 'support-sophia-2',
        from: 'support',
        text: 'I can help with tracking, sizing, delivery notes, or urgent SMS support.',
        timestamp: Date.now() - 240000,
      },
    ],
  },
  {
    id: 'support-mia',
    name: 'Mia',
    role: 'Owner • Elegant Long Coat',
    status: 'Away',
    phone: '+9118002109988',
    accent: '#8A5A3B',
    messages: [
      {
        id: 'support-mia-1',
        from: 'support',
        text: 'I handle Long Coat orders. Message me for returns, exchange, or fit guidance.',
        timestamp: Date.now() - 180000,
      },
    ],
  },
  {
    id: 'support-aarav',
    name: 'Aarav',
    role: 'Owner • Leather Cross Bag',
    status: 'Online',
    phone: '+9118002109988',
    accent: '#C89A67',
    messages: [
      {
        id: 'support-aarav-1',
        from: 'support',
        text: 'Your bag order can be tracked here. I am available on chat, voice call, or video call.',
        timestamp: Date.now() - 120000,
      },
    ],
  },
];

const buildInitialActivityFeed = () => [
  {
    id: 'activity-init',
    message: 'Store loaded successfully',
    timestamp: Date.now(),
  },
];

const ADMIN_EMAIL = 'admin@fashionstore.com';
const ADMIN_PASSWORD = 'admin123';

const createAdminEvent = (type, title, detail, meta = {}) => ({
  id: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  title,
  detail,
  timestamp: Date.now(),
  ...meta,
});

const buildInitialAdminFeed = () => [
  createAdminEvent(
    'system',
    'Admin monitor ready',
    'Realtime order tracking is prepared for incoming purchases.',
  ),
  createAdminEvent(
    'login',
    'Olivia Carter logged in',
    'Customer session opened from Bengaluru using olivia@example.com.',
    {
      userName: 'Olivia Carter',
      userEmail: 'olivia@example.com',
      userPhone: '+91 98765 00001',
      source: 'seed-session',
    },
  ),
  ...initialOrders.slice(0, 3).map(order =>
    createAdminEvent(
      'order',
      `${order.code} is ${order.status}`,
      `${order.items} item(s) worth $${order.total} currently marked as ${order.statusGroup}.`,
      { orderId: order.id },
    ),
  ),
];

const statusFlow = [
  { status: 'Processing', statusGroup: 'current', eta: 'Warehouse queue updated just now' },
  { status: 'Packed', statusGroup: 'current', eta: 'Packed and ready for courier pickup' },
  { status: 'Out for delivery', statusGroup: 'current', eta: 'Courier is heading to customer' },
  { status: 'Delivered', statusGroup: 'completed', eta: 'Delivered successfully a moment ago' },
];

const getNextOrderStage = currentStatus => {
  const currentIndex = statusFlow.findIndex(step => step.status === currentStatus);

  if (currentIndex === -1) {
    return statusFlow[0];
  }

  return statusFlow[Math.min(currentIndex + 1, statusFlow.length - 1)];
};

const normalizeWishlistIds = wishlist =>
  (wishlist || []).map(item => {
    if (typeof item === 'string') {
      return item;
    }

    return item?._id || item?.id || item?.productId;
  }).filter(Boolean);

const SESSION_STORAGE_KEY = '@ecommerce/session';
const CART_STORAGE_KEY = '@ecommerce/cart';

const buildInitialOrders = () => initialOrders.map(order => ({ ...order }));
const isMongoId = value => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const reconcileCartItemsWithCatalog = (items, catalogItems) =>
  items.map(item => {
    const matchedProduct =
      catalogItems.find(product => product.id === item.productId) ||
      catalogItems.find(product => product.name?.toLowerCase() === item.name?.toLowerCase());

    if (!matchedProduct) {
      return item;
    }

    return {
      ...item,
      productId: matchedProduct.id,
      name: matchedProduct.name,
      price: matchedProduct.price,
      image: matchedProduct.image,
    };
  });

const getDisplayUserName = user =>
  user?.name || user?.fullName || user?.username || user?.email?.split('@')[0] || 'Customer';

const getDisplayUserEmail = user => user?.email || 'No email shared';

const getDisplayUserPhone = user => user?.phone || user?.mobile || 'No phone shared';

export const AppProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(initialCartItems.map(withProductId));
  const [wishlistIds, setWishlistIds] = useState([]);
  const [authToken, setAuthToken] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [themeMode, setThemeMode] = useState('light');
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [orders, setOrders] = useState(buildInitialOrders);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState(initialSavedAddresses);
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [reviewsByProduct, setReviewsByProduct] = useState(buildInitialReviewsByProduct);
  const [supportChats, setSupportChats] = useState(initialSupportChats);
  const [activityFeed, setActivityFeed] = useState(buildInitialActivityFeed);
  const [adminFeed, setAdminFeed] = useState(buildInitialAdminFeed);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);

  const pushActivity = useCallback(message => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      message,
      timestamp: Date.now(),
    };

    setActivityFeed(current => [entry, ...current].slice(0, 8));
  }, []);

  const recordAdminEvent = useCallback((type, title, detail, meta = {}) => {
    const event = createAdminEvent(type, title, detail, meta);
    setAdminFeed(current => [event, ...current].slice(0, 24));
    return event;
  }, []);

  const syncUserState = useCallback(user => {
    setCurrentUser(user || null);
    setWishlistIds(normalizeWishlistIds(user?.wishlist));
  }, []);

  const setAuthSession = useCallback(({ token, user, source = 'auth' }) => {
    setAuthToken(token || '');
    syncUserState(user || null);
    if (user) {
      const name = getDisplayUserName(user);
      recordAdminEvent(
        'login',
        `${name} logged in`,
        `Customer session opened through ${source} using ${getDisplayUserEmail(user)}.`,
        {
          userName: name,
          userEmail: getDisplayUserEmail(user),
          userPhone: getDisplayUserPhone(user),
          source,
        },
      );
    }
  }, [recordAdminEvent, syncUserState]);

  useEffect(() => {
    const restoreCart = async () => {
      try {
        const rawCart = await AsyncStorage.getItem(CART_STORAGE_KEY);

        if (rawCart === null) {
          return;
        }

        const parsedCart = JSON.parse(rawCart);
        if (Array.isArray(parsedCart)) {
          setCartItems(parsedCart.map(withProductId));
        }
      } catch (error) {
        await AsyncStorage.removeItem(CART_STORAGE_KEY);
      }
    };

    restoreCart();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems)).catch(() => {});
  }, [cartItems]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const rawSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

        if (!rawSession) {
          return;
        }

        const parsedSession = JSON.parse(rawSession);
        setAuthToken(parsedSession.token || '');
        syncUserState(parsedSession.user || null);
      } catch (error) {
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      }
    };

    restoreSession();
  }, [syncUserState]);

  useEffect(() => {
    const persistSession = async () => {
      if (!authToken || !currentUser) {
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
        return;
      }

      await AsyncStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          token: authToken,
          user: currentUser,
        }),
      );
    };

    persistSession().catch(() => {});
  }, [authToken, currentUser]);

  const refreshProfile = useCallback(async () => {
    if (!authToken) {
      return null;
    }

    const response = await userApi.getProfile(authToken);
    const user = response.data?.data?.user || null;
    syncUserState(user);
    return user;
  }, [authToken, syncUserState]);

  const fetchOrders = useCallback(async () => {
    if (!authToken) {
      return [];
    }

    setOrdersLoading(true);

    try {
      const response = await orderApi.getOrders(authToken);
      const nextOrders = (response.data?.data?.orders || []).map(normalizeOrder);
      setOrders(nextOrders);
      recordAdminEvent(
        'sync',
        'Orders synced from backend',
        `${nextOrders.length} order(s) refreshed for the admin timeline.`,
      );
      return nextOrders;
    } finally {
      setOrdersLoading(false);
    }
  }, [authToken, recordAdminEvent]);

  const fetchCatalogProducts = useCallback(async () => {
    setCatalogLoading(true);

    try {
      const response = await productApi.getProducts();
      const catalogItems = (response.data?.data?.products || []).map(normalizeProduct);
      setCatalogProducts(catalogItems);
      setCartItems(current => reconcileCartItemsWithCatalog(current, catalogItems));
      return catalogItems;
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogProducts().catch(() => {
      setCatalogProducts([]);
    });
  }, [fetchCatalogProducts]);

  useEffect(() => {
    if (!authToken) {
      return;
    }

    fetchOrders().catch(() => {
      setOrders([]);
    });
  }, [authToken, fetchOrders]);

  const addProductToCart = useCallback((product, selectedSize = 'M') => {
    setCartItems(current => {
      const existingIndex = current.findIndex(
        item => item.productId === product.id && item.size === selectedSize,
      );

      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + 1,
        };
        return updated;
      }

      return [
        ...current,
        {
          id: `cart-${product.id}-${selectedSize}`,
          productId: product.id,
          name: product.name,
          size: selectedSize,
          price: product.price,
          qty: 1,
          image: product.image,
        },
      ];
    });

    pushActivity(`${product.name} added to cart`);
  }, [pushActivity]);

  const increaseCartItem = useCallback(itemId => {
    let itemName = '';

    setCartItems(current =>
      current.map(item => {
        if (item.id !== itemId) {
          return item;
        }

        itemName = item.name;
        return { ...item, qty: item.qty + 1 };
      }),
    );

    if (itemName) {
      pushActivity(`Increased quantity for ${itemName}`);
    }
  }, [pushActivity]);

  const decreaseCartItem = useCallback(itemId => {
    let itemName = '';
    let removed = false;

    setCartItems(current =>
      current
        .map(item => {
          if (item.id !== itemId) {
            return item;
          }

          itemName = item.name;
          removed = item.qty === 1;
          return { ...item, qty: item.qty - 1 };
        })
        .filter(item => item.qty > 0),
    );

    if (itemName) {
      pushActivity(
        removed ? `${itemName} removed from cart` : `Decreased quantity for ${itemName}`,
      );
    }
  }, [pushActivity]);

  const removeCartItem = useCallback(itemId => {
    let itemName = '';

    setCartItems(current =>
      current.filter(item => {
        if (item.id === itemId) {
          itemName = item.name;
          return false;
        }

        return true;
      }),
    );

    if (itemName) {
      pushActivity(`${itemName} removed from cart`);
    }
  }, [pushActivity]);

  const toggleWishlist = useCallback(async (productId, productName = 'Item') => {
    let added = false;

    setWishlistIds(current => {
      if (current.includes(productId)) {
        return current.filter(id => id !== productId);
      }

      added = true;
      return [productId, ...current];
    });

    pushActivity(
      added ? `${productName} added to wishlist` : `${productName} removed from wishlist`,
    );

    if (!authToken) {
      return;
    }

    try {
      const response = await userApi.toggleWishlist({ productId }, authToken);
      const nextWishlist = response.data?.data?.wishlist || [];
      setWishlistIds(normalizeWishlistIds(nextWishlist));
      setCurrentUser(current =>
        current
          ? {
              ...current,
              wishlist: nextWishlist,
            }
          : current,
      );
    } catch (error) {
      setWishlistIds(current => {
        if (added) {
          return current.filter(id => id !== productId);
        }

        return current.includes(productId) ? current : [productId, ...current];
      });
    }
  }, [authToken, pushActivity]);

  const addChatMessage = useCallback((chatId, text) => {
    const userMessage = {
      id: `chat-${Date.now()}`,
      from: 'user',
      text,
      timestamp: Date.now(),
    };

    setSupportChats(current =>
      current.map(chat => {
        if (chat.id !== chatId) {
          return chat;
        }

        return {
          ...chat,
          status: 'Typing...',
          messages: [...chat.messages, userMessage].slice(-30),
        };
      }),
    );
    pushActivity('Message sent to support');

    const reply = {
      id: `chat-reply-${Date.now()}`,
      from: 'support',
      text: 'Thanks, our support team is reviewing your message now.',
      timestamp: Date.now() + 1,
    };

    setTimeout(() => {
      setSupportChats(current =>
        current.map(chat => {
          if (chat.id !== chatId) {
            return chat;
          }

          return {
            ...chat,
            status: 'Online',
            messages: [...chat.messages, reply].slice(-30),
          };
        }),
      );
    }, 400);
  }, [pushActivity]);

  const addReview = useCallback((productId, review) => {
    const nextReview = {
      id: `review-${Date.now()}`,
      name: review.name?.trim() || 'You',
      rating: review.rating,
      text: review.text.trim(),
    };

    setReviewsByProduct(current => ({
      ...current,
      [productId]: [nextReview, ...(current[productId] || [])],
    }));

    pushActivity(`New review added for ${review.productName || 'product'}`);
  }, [pushActivity]);

  const saveAddress = useCallback(address => {
    setSavedAddresses(current => {
      const hasSelected = address.selected ?? current.every(item => !item.selected);
      const nextAddress = {
        ...address,
        selected: hasSelected,
      };
      const exists = current.some(item => item.id === address.id);
      const nextItems = exists
        ? current.map(item => {
            if (item.id !== address.id) {
              return hasSelected ? { ...item, selected: false } : item;
            }

            return nextAddress;
          })
        : [
            ...current.map(item => (hasSelected ? { ...item, selected: false } : item)),
            {
              ...nextAddress,
              id: address.id || `addr-${Date.now()}`,
            },
          ];

      return nextItems;
    });

    pushActivity(`${address.title || 'Address'} saved`);
  }, [pushActivity]);

  const selectAddress = useCallback(addressId => {
    setSavedAddresses(current =>
      current.map(item => ({ ...item, selected: item.id === addressId })),
    );
    pushActivity('Delivery address updated');
  }, [pushActivity]);

  const savePaymentMethod = useCallback(method => {
    setPaymentMethods(current => {
      const shouldSelect = method.selected ?? current.every(item => !item.selected);
      const nextMethod = {
        type: method.type || 'card',
        ...method,
        selected: shouldSelect,
      };
      const exists = current.some(item => item.id === method.id);
      const nextItems = exists
        ? current.map(item => {
            if (item.id !== method.id) {
              return shouldSelect ? { ...item, selected: false } : item;
            }

            return nextMethod;
          })
        : [
            ...current.map(item => (shouldSelect ? { ...item, selected: false } : item)),
            {
              ...nextMethod,
              id: method.id || `pay-${Date.now()}`,
            },
          ];

      return nextItems;
    });

    pushActivity(`${method.title || 'Payment method'} saved`);
  }, [pushActivity]);

  const selectPaymentMethod = useCallback(methodId => {
    setPaymentMethods(current =>
      current.map(item => ({ ...item, selected: item.id === methodId })),
    );
    pushActivity('Preferred payment method updated');
  }, [pushActivity]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const placeOrder = useCallback(async payload => {
    if (!authToken) {
      throw new Error('Please sign in to place an order.');
    }

    if (!cartItems.length) {
      throw new Error('Your cart is empty. Add a product before placing the order.');
    }

    const invalidCartItem = cartItems.find(item => !isMongoId(item.productId));
    if (invalidCartItem) {
      throw new Error(`"${invalidCartItem.name}" is not synced with the live catalog yet. Please remove it and add it again.`);
    }

    const response = await orderApi.createOrder(
      {
        ...payload,
        items: cartItems.map(item => ({
          productId: item.productId,
          title: item.name,
          quantity: item.qty,
          size: item.size,
          price: item.price,
          image: item.image,
        })),
      },
      authToken,
    );

    const nextOrder = normalizeOrder(response.data?.data?.order || {});
    const buyerName = getDisplayUserName(currentUser);
    const buyerEmail = getDisplayUserEmail(currentUser);
    const buyerPhone = getDisplayUserPhone(currentUser);
    setOrders(current => [nextOrder, ...current]);
    clearCart();
    pushActivity(`Order ${nextOrder.code} placed successfully`);
    recordAdminEvent(
      'purchase',
      `New purchase: ${nextOrder.code}`,
      `${buyerName} purchased ${nextOrder.items || nextOrder.products?.length || 0} item(s) for $${nextOrder.total || 0}.`,
      {
        orderId: nextOrder.id,
        userName: buyerName,
        userEmail: buyerEmail,
        userPhone: buyerPhone,
      },
    );
    return nextOrder;
  }, [authToken, cartItems, clearCart, currentUser, pushActivity, recordAdminEvent]);

  const adminSignIn = useCallback(async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (normalizedEmail !== ADMIN_EMAIL || normalizedPassword !== ADMIN_PASSWORD) {
      throw new Error('Use the demo admin credentials to open the live dashboard.');
    }

    const admin = {
      name: 'Store Admin',
      email: ADMIN_EMAIL,
      role: 'operations-admin',
      live: true,
    };

    setIsAdminAuthenticated(true);
    setAdminProfile(admin);
    recordAdminEvent(
      'system',
      'Admin logged in',
      'Live purchase monitoring is now active on this device.',
    );

    return admin;
  }, [recordAdminEvent]);

  const adminSignOut = useCallback(() => {
    setIsAdminAuthenticated(false);
    setAdminProfile(null);
    recordAdminEvent(
      'system',
      'Admin logged out',
      'Realtime monitoring was paused on this device.',
    );
  }, [recordAdminEvent]);

  const simulateIncomingOrder = useCallback(() => {
    const sourceProducts = catalogProducts.length ? catalogProducts : products;
    const product = sourceProducts[Math.floor(Math.random() * sourceProducts.length)];
    const qty = Math.floor(Math.random() * 2) + 1;
    const nextOrder = {
      id: `order-${Date.now()}`,
      code: `#FAS-${Math.floor(30000 + Math.random() * 50000)}`,
      status: 'Processing',
      statusGroup: 'current',
      eta: 'Incoming now from checkout',
      trackingTitle: `Processing ${product.name} order`,
      total: Number((product.price * qty).toFixed(2)),
      date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      items: qty,
      hero: product.image,
      customerName: ['Aarav', 'Maya', 'Riya', 'Kabir', 'Anika'][Math.floor(Math.random() * 5)],
      customerEmail: `shopper${Math.floor(100 + Math.random() * 900)}@mail.com`,
      customerPhone: `+91 98${Math.floor(10000000 + Math.random() * 89999999)}`,
      productName: product.name,
    };

    setOrders(current => [nextOrder, ...current]);
    pushActivity(`Simulated purchase received for ${product.name}`);
    recordAdminEvent(
      'purchase',
      `New purchase: ${nextOrder.code}`,
      `${nextOrder.customerName} bought ${qty} x ${product.name} for $${nextOrder.total}.`,
      {
        orderId: nextOrder.id,
        userName: nextOrder.customerName,
        userEmail: nextOrder.customerEmail,
        userPhone: nextOrder.customerPhone,
      },
    );

    return nextOrder;
  }, [catalogProducts, pushActivity, recordAdminEvent]);

  useEffect(() => {
    if (!isAdminAuthenticated) {
      return undefined;
    }

    const interval = setInterval(() => {
      let changedOrder = null;

      setOrders(current =>
        current.map(order => {
          if (changedOrder || order.statusGroup !== 'current') {
            return order;
          }

          const nextStage = getNextOrderStage(order.status);
          if (nextStage.status === order.status) {
            return order;
          }

          changedOrder = {
            ...order,
            status: nextStage.status,
            statusGroup: nextStage.statusGroup,
            eta: nextStage.eta,
          };

          return changedOrder;
        }),
      );

      if (changedOrder) {
        recordAdminEvent(
          'tracking',
          `${changedOrder.code} moved to ${changedOrder.status}`,
          `${changedOrder.trackingTitle || 'Order status'} updated in realtime for admin monitoring.`,
          { orderId: changedOrder.id },
        );
      }
    }, 9000);

    return () => clearInterval(interval);
  }, [isAdminAuthenticated, recordAdminEvent]);

  const toggleTheme = useCallback(() => {
    setThemeMode(current => (current === 'light' ? 'dark' : 'light'));
  }, []);

  const signOut = useCallback(() => {
    setAuthToken('');
    setCurrentUser(null);
    setCartItems([]);
    setOrders(buildInitialOrders());
    setWishlistIds([]);
    setSavedAddresses(initialSavedAddresses);
    setPaymentMethods(initialPaymentMethods);
    setReviewsByProduct(buildInitialReviewsByProduct);
    setSupportChats(initialSupportChats);
    setActivityFeed(buildInitialActivityFeed());
    setAdminFeed(buildInitialAdminFeed());
    setIsAdminAuthenticated(false);
    setAdminProfile(null);
  }, []);

  const cartCount = useMemo(() => getTotalCartCount(cartItems), [cartItems]);
  const cartTotal = useMemo(() => getCartTotal(cartItems), [cartItems]);
  const latestActivity = activityFeed[0] || null;
  const adminOverview = useMemo(() => {
    const liveOrders = orders.filter(order => order.statusGroup === 'current');
    const completedOrders = orders.filter(order => order.statusGroup === 'completed');
    const cancelledOrders = orders.filter(order => order.statusGroup === 'cancelled');
    const revenue = orders
      .filter(order => order.statusGroup !== 'cancelled')
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    return {
      totalOrders: orders.length,
      liveOrders: liveOrders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      revenue,
      recentPurchases: adminFeed.filter(item => item.type === 'purchase').slice(0, 6),
      recentLogins: adminFeed.filter(item => item.type === 'login').slice(0, 6),
    };
  }, [adminFeed, orders]);

  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      cartTotal,
      authToken,
      currentUser,
      themeMode,
      catalogProducts,
      catalogLoading,
      orders,
      ordersLoading,
      savedAddresses,
      paymentMethods,
      wishlistIds,
      reviewsByProduct,
      supportChats,
      activityFeed,
      latestActivity,
      adminFeed,
      adminOverview,
      isAdminAuthenticated,
      adminProfile,
      addProductToCart,
      increaseCartItem,
      decreaseCartItem,
      removeCartItem,
      toggleWishlist,
      addReview,
      addChatMessage,
      pushActivity,
      recordAdminEvent,
      setAuthSession,
      refreshProfile,
      fetchCatalogProducts,
      fetchOrders,
      placeOrder,
      adminSignIn,
      adminSignOut,
      simulateIncomingOrder,
      clearCart,
      setCurrentUser,
      saveAddress,
      selectAddress,
      savePaymentMethod,
      selectPaymentMethod,
      toggleTheme,
      setThemeMode,
      signOut,
    }),
    [
      activityFeed,
      adminFeed,
      adminOverview,
      adminProfile,
      adminSignIn,
      adminSignOut,
      addReview,
      addProductToCart,
      addChatMessage,
      authToken,
      catalogLoading,
      catalogProducts,
      cartCount,
      cartItems,
      cartTotal,
      clearCart,
      currentUser,
      decreaseCartItem,
      removeCartItem,
      fetchCatalogProducts,
      fetchOrders,
      increaseCartItem,
      isAdminAuthenticated,
      latestActivity,
      orders,
      ordersLoading,
      paymentMethods,
      placeOrder,
      pushActivity,
      recordAdminEvent,
      refreshProfile,
      reviewsByProduct,
      saveAddress,
      savePaymentMethod,
      savedAddresses,
      selectAddress,
      selectPaymentMethod,
      setAuthSession,
      setCurrentUser,
      signOut,
      simulateIncomingOrder,
      supportChats,
      themeMode,
      toggleTheme,
      toggleWishlist,
      wishlistIds,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppStore = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppStore must be used inside AppProvider');
  }

  return context;
};
