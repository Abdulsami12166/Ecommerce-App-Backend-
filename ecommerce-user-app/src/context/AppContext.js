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
  paymentMethods as initialPaymentMethods,
  products,
  reviews as initialReviews,
} from '../constants/mockData';
import { authApi, normalizeOrder, normalizeProduct, orderApi, productApi, userApi } from '../services/api';
import { showLocalNotification, initializeNotificationService, getFCMToken } from '../services/notificationService';
import { setupNotificationChannels } from '../services/notificationChannels';
import { connectStoreSocket, disconnectStoreSocket, subscribeStoreEvent } from '../services/socket';
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

// eslint-disable-next-line no-unused-vars
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

const normalizeWishlistIds = wishlist =>
  (wishlist || []).map(item => {
    if (typeof item === 'string') {
      return item;
    }

    return item?._id || item?.id || item?.productId;
  }).filter(Boolean);

const SESSION_STORAGE_KEY = '@ecommerce/session';
const CART_STORAGE_KEY = '@ecommerce/cart';
const ADDRESS_STORAGE_KEY = '@ecommerce/addresses';
const WALLET_BALANCE_KEY = '@ecommerce/wallet_balance';
const WALLET_TRANSACTIONS_KEY = '@ecommerce/wallet_transactions';

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

const buildSupportChatFromProduct = product => {
  const productId = String(product?.id || product?._id || product?.productId || `support-${Date.now()}`);
  const productTitle = product?.name || product?.title || 'Product';
  const category = product?.category || 'General';

  return {
    id: `support-${productId}`,
    productId,
    name: `${productTitle} Support`,
    role: `${category} • Product owner`,
    status: 'Online',
    phone: '+9118002109988',
    accent: '#5A2B12',
    productName: productTitle,
    productImage: product?.image || product?.images?.[0] || '',
    messages: [
      {
        id: `support-${productId}-1`,
        from: 'support',
        text: `Hi, this is support for ${productTitle}. Ask about delivery, sizing, refund, or product details here.`,
        timestamp: Date.now(),
      },
    ],
  };
};

export const AppProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [authToken, setAuthToken] = useState('');
  const [authRestoring, setAuthRestoring] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [themeMode, setThemeMode] = useState('light');
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [reviewsByProduct, setReviewsByProduct] = useState(buildInitialReviewsByProduct);
  const [supportChats, setSupportChats] = useState([]);
  const [activityFeed, setActivityFeed] = useState(buildInitialActivityFeed);
  const [walletBalance, setWalletBalance] = useState(2400.00);
  const [walletTransactions, setWalletTransactions] = useState([
    {
      id: 'wallet-1',
      title: 'Money Added to Wallet',
      meta: `${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' })} | 11:30 AM`,
      amount: '+ $250.00',
      balance: 'Balance $2400.00',
      positive: true,
      timestamp: Date.now() - 3600000 * 2,
    },
    {
      id: 'wallet-2',
      title: 'Order ID #FN845661',
      meta: `${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' })} | 10:30 AM`,
      amount: '- $50.00',
      balance: 'Balance $2150.00',
      positive: false,
      timestamp: Date.now() - 3600000 * 24,
    },
  ]);

  const pushActivity = useCallback(message => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      message,
      timestamp: Date.now(),
    };

    setActivityFeed(current => [entry, ...current].slice(0, 8));
  }, []);

  const syncUserState = useCallback(user => {
    setCurrentUser(user || null);
    setWishlistIds(normalizeWishlistIds(user?.wishlist));
  }, []);

  const setAuthSession = useCallback(({ token, user }) => {
    setAuthToken(token || '');
    syncUserState(user || null);
  }, [syncUserState]);

  useEffect(() => {
    const restoreCart = async () => {
      try {
        const rawCart = await AsyncStorage.getItem(CART_STORAGE_KEY);

        if (rawCart === null) {
          return;
        }

        const parsedCart = JSON.parse(rawCart);
        if (Array.isArray(parsedCart)) {
          const normalizedCart = parsedCart.map(withProductId);
          const hasLegacyMockItems = normalizedCart.some(
            item => item.productId && !isMongoId(item.productId),
          );

          if (hasLegacyMockItems) {
            setCartItems([]);
            await AsyncStorage.removeItem(CART_STORAGE_KEY);
            return;
          }

          setCartItems(normalizedCart);
        }
      } catch (error) {
        await AsyncStorage.removeItem(CART_STORAGE_KEY);
      }
    };

    restoreCart();
  }, []);

  useEffect(() => {
    const restoreAddresses = async () => {
      try {
        const rawAddresses = await AsyncStorage.getItem(ADDRESS_STORAGE_KEY);

        if (!rawAddresses) {
          return;
        }

        const parsedAddresses = JSON.parse(rawAddresses);
        if (Array.isArray(parsedAddresses)) {
          setSavedAddresses(parsedAddresses);
        }
      } catch (error) {
        await AsyncStorage.removeItem(ADDRESS_STORAGE_KEY);
      }
    };

    restoreAddresses();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems)).catch(() => {});
  }, [cartItems]);

  useEffect(() => {
    AsyncStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(savedAddresses)).catch(() => {});
  }, [savedAddresses]);

  useEffect(() => {
    const restoreWallet = async () => {
      try {
        const rawBalance = await AsyncStorage.getItem(WALLET_BALANCE_KEY);
        const rawTransactions = await AsyncStorage.getItem(WALLET_TRANSACTIONS_KEY);

        if (rawBalance !== null) {
          setWalletBalance(Number(rawBalance));
        }
        if (rawTransactions !== null) {
          setWalletTransactions(JSON.parse(rawTransactions));
        }
      } catch (error) {
        console.log('Error restoring wallet state:', error);
      }
    };

    restoreWallet();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(WALLET_BALANCE_KEY, String(walletBalance)).catch(() => {});
  }, [walletBalance]);

  useEffect(() => {
    AsyncStorage.setItem(WALLET_TRANSACTIONS_KEY, JSON.stringify(walletTransactions)).catch(() => {});
  }, [walletTransactions]);

  useEffect(() => {
    let mounted = true;
    let timeout;

    const restoreSession = async () => {
      try {
        const rawSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

        if (!rawSession) {
          if (mounted) {
            setAuthRestoring(false);
          }
          return;
        }

        const parsedSession = JSON.parse(rawSession);
        const token = parsedSession.token || '';
        const cachedUser = parsedSession.user || null;

        if (!token) {
          await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
          if (mounted) {
            setAuthRestoring(false);
          }
          return;
        }

        // Set token and cached user immediately (CRITICAL: Show home screen faster)
        if (mounted) {
          setAuthToken(token);
          syncUserState(cachedUser);
        }

        // Validate token asynchronously in background
        try {
          const response = await Promise.race([
            authApi.getMe(token),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Token validation timeout')), 8000)
            ),
          ]);
          const user = response.data?.data?.user || cachedUser || null;

          if (mounted) {
            syncUserState(user);
            // Update cached user with fresh data
            await AsyncStorage.setItem(
              SESSION_STORAGE_KEY,
              JSON.stringify({
                token,
                user,
              }),
            ).catch(() => {});
          }
        } catch (validationError) {
          // If token validation fails, invalidate session
          if (mounted) {
            await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
            setAuthToken('');
            setCurrentUser(null);
          }
        }
      } catch (error) {
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        if (mounted) {
          setAuthRestoring(false);
        }
      }
    };

    restoreSession();

    return () => {
      mounted = false;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [syncUserState]);

  useEffect(() => {
    const persistSession = async () => {
      if (authRestoring) {
        return;
      }

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
  }, [authRestoring, authToken, currentUser]);

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
      return nextOrders;
    } finally {
      setOrdersLoading(false);
    }
  }, [authToken]);

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
    // Setup notification channels for Android
    setupNotificationChannels().catch(() => {});

    // Initialize FCM and other notification services
    initializeNotificationService(
      // Foreground notification callback
      (notification) => {
        console.log('Foreground notification received:', notification);
        pushActivity('New notification received');
      },
      // Notification tapped callback (from status bar)
      (notification) => {
        console.log('Notification tapped:', notification);
      }
    ).catch(() => {});
  }, [pushActivity]);

  // Register FCM device token with backend whenever user logs in
  useEffect(() => {
    if (!authToken) return;
    const registerFcmToken = async () => {
      try {
        const token = await getFCMToken();
        if (token) {
          await userApi.updateFcmToken(token, authToken);
          console.log('[FCM] Token registered with backend.');
        }
      } catch (err) {
        console.log('[FCM] Token registration failed (non-fatal):', err?.message);
      }
    };
    registerFcmToken();
  }, [authToken]);

  useEffect(() => {
    connectStoreSocket(authToken);
    const cleanups = [
      subscribeStoreEvent('order.created', payload => {
        const orderId = payload?.orderId || payload?._id || payload?.id;

        pushActivity(`Order ${orderId ? `#${String(orderId).slice(-6).toUpperCase()}` : ''} was placed`);
        showLocalNotification({
          title: 'New order created',
          body: 'Your order was placed successfully.',
          data: { screen: 'TrackOrder', orderId },
        }).catch(() => {});
        fetchOrders().catch(() => {});
      }),
      subscribeStoreEvent('product.created', payload => {
        const productTitle = payload?.title || payload?.name || 'New product';
        const message = `${productTitle} is now live in the store`;

        pushActivity(message);
        showLocalNotification({
          title: 'New product added',
          body: message,
          data: { screen: 'ProductDetails', productId: payload?.productId || payload?._id || payload?.id },
        }).catch(() => {});
        fetchCatalogProducts().catch(() => {});
      }),
      subscribeStoreEvent('product.updated', payload => {
        const productTitle = payload?.title || payload?.name || 'Product';

        if (payload?.stock !== undefined) {
          showLocalNotification({
            title: 'Inventory updated',
            body: `${productTitle} stock is ${payload.stock}.`,
            data: { screen: 'ProductDetails', productId: payload?.productId || payload?._id || payload?.id },
          }).catch(() => {});
        }
        fetchCatalogProducts().catch(() => {});
      }),
      subscribeStoreEvent('order.updated', payload => {
        const status = String(payload?.orderStatus || 'updated').replace(/-/g, ' ');
        pushActivity(`Order ${payload?.orderId ? `#${String(payload.orderId).slice(-6).toUpperCase()}` : ''} is ${status}`);
        showLocalNotification({
          title: 'Order tracking updated',
          body: `Your order is now ${status}.`,
          data: {screen: 'TrackOrder', orderId: payload?.orderId},
        }).catch(() => {});
        fetchOrders().catch(() => {});
      }),
      subscribeStoreEvent('chat.message', payload => {
        const chatId = payload?.chatId || payload?.conversationId || payload?.productChatId;
        const productId = payload?.productId;
        const message = payload?.message || payload?.text || 'You have a new product chat message.';

        pushActivity('New product chat message');
        showLocalNotification({
          title: payload?.title || 'New chat message',
          body: message,
          data: { screen: 'SupportChat', chatId, productId },
        }).catch(() => {});
      }),
      subscribeStoreEvent('product.message', payload => {
        const productId = payload?.productId || payload?._id || payload?.id;
        const message = payload?.message || payload?.text || 'You have a new product message.';

        pushActivity('New product message');
        showLocalNotification({
          title: payload?.title || 'Product message',
          body: message,
          data: { screen: productId ? 'ProductDetails' : 'Notifications', productId },
        }).catch(() => {});
      }),
      subscribeStoreEvent('admin.broadcast', payload => {
        const message = payload?.message || payload?.body || 'A new store announcement is available.';

        pushActivity(message);
        showLocalNotification({
          title: payload?.title || 'Store announcement',
          body: message,
          data: { screen: 'Notifications' },
        }).catch(() => {});
      }),

      // ── Support: Tickets ─────────────────────────────────────────────
      subscribeStoreEvent('support.ticket.updated', payload => {
        const ticketId = payload?.ticketId || payload?._id;
        const status = payload?.status || 'updated';
        pushActivity(`Ticket ${ticketId ? `#${String(ticketId).slice(-6).toUpperCase()}` : ''} ${status}`);
        showLocalNotification({
          title: 'Ticket updated',
          body: `Your support ticket is now ${status}.`,
          data: { screen: 'TicketDetail', ticketId },
        }).catch(() => {});
      }),
      subscribeStoreEvent('support.ticket.message_added', payload => {
        const ticketId = payload?.ticketId || payload?._id;
        pushActivity('New reply on your support ticket');
        showLocalNotification({
          title: 'New ticket reply',
          body: 'Support team replied to your ticket.',
          data: { screen: 'TicketDetail', ticketId },
        }).catch(() => {});
      }),

      // ── Support: Refunds ──────────────────────────────────────────────
      subscribeStoreEvent('support.refund.updated', payload => {
        const refundId = payload?.refundId || payload?._id;
        const status = payload?.status || 'updated';
        pushActivity(`Refund ${status}`);
        showLocalNotification({
          title: 'Refund status update',
          body: `Your refund request is now ${status}.`,
          data: { screen: 'RefundTracking', refundId },
        }).catch(() => {});
      }),

      // ── Support: Returns ──────────────────────────────────────────────
      subscribeStoreEvent('support.return.updated', payload => {
        const returnId = payload?.returnId || payload?._id;
        const status = payload?.status || 'updated';
        pushActivity(`Return ${status}`);
        showLocalNotification({
          title: 'Return status update',
          body: `Your return request is now ${status}.`,
          data: { screen: 'ReturnTracking', returnId },
        }).catch(() => {});
      }),

      // ── Support: Replacements ─────────────────────────────────────────
      subscribeStoreEvent('support.replacement.updated', payload => {
        const replacementId = payload?.replacementId || payload?._id;
        const status = payload?.status || 'updated';
        pushActivity(`Replacement ${status}`);
        showLocalNotification({
          title: 'Replacement status update',
          body: `Your replacement request is now ${status}.`,
          data: { screen: 'ReplacementTracking', replacementId },
        }).catch(() => {});
      }),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
      disconnectStoreSocket();
    };
  }, [authToken, fetchCatalogProducts, fetchOrders, pushActivity]);

  useEffect(() => {
    if (!authToken) {
      return;
    }

    fetchOrders().catch(() => {
      setOrders([]);
    });
  }, [authToken, fetchOrders]);

  // Fetch products on app initialization (products are public, no auth required)
  useEffect(() => {
    // Fetch products immediately on app load, regardless of auth state
    fetchCatalogProducts().catch(() => {
      setCatalogProducts([]);
    });
  }, [fetchCatalogProducts]);

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
          sku: product.sku || '',
          variantId: product.variantId || '',
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
      showLocalNotification({
        title: 'New chat message',
        body: reply.text,
        data: { screen: 'SupportChat', chatId },
      }).catch(() => {});
    }, 400);
  }, [pushActivity]);

  const openSupportChatForProduct = useCallback(product => {
    const nextChat = buildSupportChatFromProduct(product);

    setSupportChats(current => {
      const existing = current.find(item => item.id === nextChat.id);
      if (existing) {
        return current.map(item =>
          item.id === existing.id
            ? {
                ...item,
                role: nextChat.role,
                productImage: nextChat.productImage,
                productName: nextChat.productName,
              }
            : item,
        );
      }

      return [nextChat, ...current];
    });

    pushActivity(`Opened support for ${nextChat.productName}`);
    return nextChat.id;
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
      const normalizedAddress = {
        ...address,
        title: address.title?.trim() || 'Address',
        house: address.house?.trim() || '',
        street: address.street?.trim() || '',
        town: address.town?.trim() || '',
        pincode: address.pincode?.trim() || '',
        preciseLocation: address.preciseLocation?.trim() || '',
      };
      const addressLine = [
        normalizedAddress.house,
        normalizedAddress.street,
        normalizedAddress.town,
        normalizedAddress.pincode,
      ].filter(Boolean).join(', ');
      const nextAddress = {
        ...normalizedAddress,
        address: addressLine,
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
          variant: item.size,
          variantId: item.variantId,
          sku: item.sku,
          price: item.price,
          image: item.image,
        })),
      },
      authToken,
    );

    const nextOrder = normalizeOrder(response.data?.data?.order || {});
    setOrders(current => [nextOrder, ...current]);
    clearCart();
    pushActivity(`Order ${nextOrder.code} placed successfully`);
    return nextOrder;
  }, [authToken, cartItems, clearCart, pushActivity]);

  const placePrototypeOrder = useCallback(payload => {
    const now = new Date();
    const prototypeOrder = normalizeOrder({
      _id: `prototype-${Date.now()}`,
      items: cartItems.map(item => ({
        product: item.productId,
        title: item.name,
        quantity: item.qty,
        selectedSize: item.size,
        selectedVariant: item.size,
        variantId: item.variantId,
        sku: item.sku,
        price: item.price,
        image: item.image,
      })),
      totalAmount: cartTotal + Number(payload?.shippingFee || 0),
      orderStatus: 'order-confirmed',
      paymentStatus: payload?.paymentStatus || 'pending',
      paymentMethod: payload?.paymentMethod || 'Prototype checkout',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      statusHistory: [{
        status: 'order-confirmed',
        label: 'Order Confirmed',
        timestamp: now.toISOString(),
      }],
    });
    setOrders(current => [prototypeOrder, ...current]);
    clearCart();
    pushActivity(`Prototype order ${prototypeOrder.code} created`);
    return prototypeOrder;
  }, [cartItems, cartTotal, clearCart, pushActivity]);

  const toggleTheme = useCallback(() => {
    setThemeMode(current => (current === 'light' ? 'dark' : 'light'));
  }, []);

  const addWalletMoney = useCallback((amountValue) => {
    const parsedAmount = Number(amountValue);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    setWalletBalance(prevBalance => {
      const nextBalance = prevBalance + parsedAmount;
      const now = new Date();
      const newTransaction = {
        id: `wallet-${Date.now()}`,
        title: 'Money Added to Wallet',
        meta: `${now.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })} | ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        amount: `+ $${parsedAmount.toFixed(2)}`,
        balance: `Balance $${nextBalance.toFixed(2)}`,
        positive: true,
        timestamp: Date.now(),
      };
      setWalletTransactions(prevTx => [newTransaction, ...prevTx]);
      return nextBalance;
    });

    pushActivity(`Added $${parsedAmount.toFixed(2)} to wallet`);
  }, [pushActivity]);

  const deductWalletMoney = useCallback((amountValue, reason) => {
    const parsedAmount = Number(amountValue);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    setWalletBalance(prevBalance => {
      const nextBalance = Math.max(prevBalance - parsedAmount, 0);
      const now = new Date();
      const newTransaction = {
        id: `wallet-${Date.now()}`,
        title: reason || 'Purchase Deduction',
        meta: `${now.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })} | ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        amount: `- $${parsedAmount.toFixed(2)}`,
        balance: `Balance $${nextBalance.toFixed(2)}`,
        positive: false,
        timestamp: Date.now(),
      };
      setWalletTransactions(prevTx => [newTransaction, ...prevTx]);
      return nextBalance;
    });

    pushActivity(`Deducted $${parsedAmount.toFixed(2)} from wallet for ${reason}`);
  }, [pushActivity]);

  const signOut = useCallback(async () => {
    if (authToken) {
      try {
        await authApi.logout(authToken);
      } catch (error) {
      }
    }

    setAuthToken('');
    setCurrentUser(null);
    setCartItems([]);
    setOrders([]);
    setWishlistIds([]);
    setSavedAddresses([]);
    setPaymentMethods(initialPaymentMethods);
    setReviewsByProduct(buildInitialReviewsByProduct);
    setSupportChats([]);
    setActivityFeed(buildInitialActivityFeed());
  }, [authToken]);

  const cartCount = useMemo(() => getTotalCartCount(cartItems), [cartItems]);
  const cartTotal = useMemo(() => getCartTotal(cartItems), [cartItems]);
  const latestActivity = activityFeed[0] || null;

  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      cartTotal,
      authToken,
      authRestoring,
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
      addProductToCart,
      increaseCartItem,
      decreaseCartItem,
      removeCartItem,
      toggleWishlist,
      addReview,
      addChatMessage,
      openSupportChatForProduct,
      pushActivity,
      setAuthSession,
      refreshProfile,
      fetchCatalogProducts,
      fetchOrders,
      placeOrder,
      placePrototypeOrder,
      clearCart,
      setCurrentUser,
      saveAddress,
      selectAddress,
      savePaymentMethod,
      selectPaymentMethod,
      toggleTheme,
      setThemeMode,
      signOut,
      walletBalance,
      walletTransactions,
      addWalletMoney,
      deductWalletMoney,
    }),
    [
      activityFeed,
      addReview,
      addProductToCart,
      addChatMessage,
      openSupportChatForProduct,
      authToken,
      authRestoring,
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
      latestActivity,
      orders,
      ordersLoading,
      paymentMethods,
      placeOrder,
      placePrototypeOrder,
      pushActivity,
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
      supportChats,
      themeMode,
      toggleTheme,
      toggleWishlist,
      wishlistIds,
      walletBalance,
      walletTransactions,
      addWalletMoney,
      deductWalletMoney,
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
