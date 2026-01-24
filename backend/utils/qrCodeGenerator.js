
import crypto from 'crypto';

// Generate a random token
export const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Generate QR Code URL (This would be used by Admin/Manager)
export const generateQRCodeUrl = (baseUrl, token) => {
    return `${baseUrl}/guest/scan/${token}`;
};
