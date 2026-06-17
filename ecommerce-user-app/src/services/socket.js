import { io } from 'socket.io-client';
import { getSocketBaseUrl } from '../config/apiConfig';

let socket = null;

export const connectStoreSocket = token => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(getSocketBaseUrl(), {
    transports: ['websocket', 'polling'],
    auth: token ? { token } : undefined,
    query: token ? { token } : undefined,
  });

  return socket;
};

export const subscribeStoreEvent = (event, listener) => {
  if (!socket) {
    return () => {};
  }

  socket.on(event, listener);
  return () => socket?.off(event, listener);
};

export const disconnectStoreSocket = () => {
  socket?.disconnect();
  socket = null;
};

// Support event listeners
export const subscribeTicketEvents = {
  onTicketCreated: (listener) => subscribeStoreEvent('support.ticket.created', listener),
  onTicketUpdated: (listener) => subscribeStoreEvent('support.ticket.updated', listener),
  onTicketMessageAdded: (listener) => subscribeStoreEvent('support.ticket.message_added', listener),
};

export const subscribeReturnEvents = {
  onReturnCreated: (listener) => subscribeStoreEvent('support.return.created', listener),
  onReturnUpdated: (listener) => subscribeStoreEvent('support.return.updated', listener),
};

export const subscribeRefundEvents = {
  onRefundCreated: (listener) => subscribeStoreEvent('support.refund.created', listener),
  onRefundUpdated: (listener) => subscribeStoreEvent('support.refund.updated', listener),
};

export const subscribeReplacementEvents = {
  onReplacementCreated: (listener) => subscribeStoreEvent('support.replacement.created', listener),
  onReplacementUpdated: (listener) => subscribeStoreEvent('support.replacement.updated', listener),
};

export const subscribeProductEvents = {
  onProductCreated: (listener) => subscribeStoreEvent('product.created', listener),
  onProductUpdated: (listener) => subscribeStoreEvent('product.updated', listener),
};

export const subscribeOrderEvents = {
  onOrderCreated: (listener) => subscribeStoreEvent('order.created', listener),
  onOrderUpdated: (listener) => subscribeStoreEvent('order.updated', listener),
};
