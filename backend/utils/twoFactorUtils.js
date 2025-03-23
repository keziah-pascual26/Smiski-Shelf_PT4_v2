const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/userModel');

/**
 * Generate a new secret for 2FA
 * @param {string} email - User's email for identification in authenticator app
 * @returns {Object} Secret and QR code data URL
 */
async function generateSecret(email) {
  // Generate a secret
  const secret = speakeasy.generateSecret({
    name: `SmiskiShelf:${email}`
  });

  // Generate QR code
  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCodeUrl
  };
}

/**
 * Verify a token against the user's secret
 * @param {string} token - Token provided by the user
 * @param {string} secret - User's 2FA secret
 * @returns {boolean} Whether the token is valid
 */
function verifyToken(token, secret) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1 // Allow 1 time step tolerance (30 seconds before/after)
  });
}

/**
 * Enable 2FA for a user
 * @param {string} userId - User's ID
 * @param {string} secret - Generated secret
 * @returns {Promise<Object>} Updated user
 */
async function enableTwoFactor(userId, secret) {
  return await User.findByIdAndUpdate(
    userId,
    { 
      twoFactorSecret: secret,
      twoFactorEnabled: true 
    },
    { new: true }
  );
}

/**
 * Disable 2FA for a user
 * @param {string} userId - User's ID
 * @returns {Promise<Object>} Updated user
 */
async function disableTwoFactor(userId) {
  return await User.findByIdAndUpdate(
    userId,
    { 
      twoFactorSecret: null,
      twoFactorEnabled: false 
    },
    { new: true }
  );
}

module.exports = {
  generateSecret,
  verifyToken,
  enableTwoFactor,
  disableTwoFactor
};
