export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const SPICE_LEVELS = {
  0: { label: 'None', color: 'gray', emoji: '😐' },
  1: { label: 'Mild', color: 'green', emoji: '😊' },
  2: { label: 'Medium', color: 'yellow', emoji: '😋' },
  3: { label: 'Hot', color: 'orange', emoji: '🔥' },
  4: { label: 'Very Hot', color: 'red', emoji: '🌶️' },
  5: { label: 'Extreme', color: 'purple', emoji: '💀' },
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
  STAFF: 'staff',
  CUSTOMER: 'customer',
};

