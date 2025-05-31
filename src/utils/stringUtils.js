/**
 * Utility functions for safely handling string operations
 */

/**
 * Safely trims a string value
 * @param {any} value - The value to trim
 * @returns {string} - The trimmed string or empty string if input is not a string
 */
const safeTrim = (value) => {
  // Check if value is a string before calling trim
  if (typeof value === 'string') {
    return value.trim();
  }
  // Return empty string for null/undefined or convert non-string to string
  return value ? String(value) : '';
};

/**
 * Safely processes an array of values, trimming string values
 * @param {Array} array - Array to process
 * @returns {Array} - Processed array with trimmed strings
 */
const safeArrayTrim = (array) => {
  if (!Array.isArray(array)) {
    return [];
  }
  return array.filter(item => item != null).map(item => 
    typeof item === 'string' ? item.trim() : item
  );
};

/**
 * Safely converts a value to a JSON string
 * @param {any} value - The value to stringify
 * @returns {string} - The stringified value or empty string if there's an error
 */
const safeStringify = (value) => {
  try {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  } catch (error) {
    console.error('Error in safeStringify:', error);
    return '';
  }
};

export { safeTrim, safeArrayTrim, safeStringify };
