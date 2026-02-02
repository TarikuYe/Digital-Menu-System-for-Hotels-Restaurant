export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const SPICE_LEVELS = {
  0: { label: 'None', color: 'gray', emoji: '😐', warning: false },
  1: { label: 'Mild', color: 'green', emoji: '😊', warning: false },
  2: { label: 'Medium', color: 'yellow', emoji: '😋', warning: false },
  3: { label: 'Hot', color: 'orange', emoji: '🔥', warning: true },
  4: { label: 'Very Hot', color: 'red', emoji: '🌶️', warning: true },
  5: { label: 'Extreme', color: 'purple', emoji: '💀', warning: true },
};


export const ORDER_STATUS = {
  pending: { label: 'Pending', color: 'yellow' },
  confirmed: { label: 'Confirmed', color: 'blue' },
  preparing: { label: 'Preparing', color: 'orange' },
  ready: { label: 'Ready', color: 'green' },
  served: { label: 'Served', color: 'gray' },
  cancelled: { label: 'Cancelled', color: 'red' },
};

export const USER_ROLES = {
  ADMIN: 'admin',
  OWNER: 'owner',
  MANAGER: 'manager',
  STAFF: 'staff',
  KITCHEN: 'kitchen',
  CASHIER: 'cashier',
  CUSTOMER: 'customer',
};
