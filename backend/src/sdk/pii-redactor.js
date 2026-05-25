/**
 * PII Redactor — regex-based redaction of sensitive data from text.
 * Patterns: email, phone, SSN, credit card, IP addresses.
 */

const PII_PATTERNS = [
  { name: 'EMAIL', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
  { name: 'PHONE', regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, replacement: '[PHONE]' },
  { name: 'SSN', regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' },
  { name: 'CREDIT_CARD', regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, replacement: '[CREDIT_CARD]' },
  { name: 'IP_ADDRESS', regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replacement: '[IP_ADDR]' },
];

/**
 * Redact PII from a text string.
 * @param {string} text - Input text to redact
 * @returns {string} Redacted text
 */
function redactPII(text) {
  if (!text || typeof text !== 'string') return text;

  let redacted = text;
  for (const pattern of PII_PATTERNS) {
    redacted = redacted.replace(pattern.regex, pattern.replacement);
  }
  return redacted;
}

/**
 * Truncate text to a maximum length for preview storage.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
function truncatePreview(text, maxLength = 500) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Redact and truncate text for safe preview storage.
 */
function safePreview(text, maxLength = 500) {
  return truncatePreview(redactPII(text), maxLength);
}

module.exports = { redactPII, truncatePreview, safePreview };
