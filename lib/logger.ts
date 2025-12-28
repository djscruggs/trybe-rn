/**
 * Logger utility for development and production
 * Only logs in development mode to avoid performance issues and information leakage
 */

const isDev = __DEV__;

export const logger = {
  debug: (isDev ? console.log.bind(console) : () => {}) as typeof console.log,
  info: (isDev ? console.info.bind(console) : () => {}) as typeof console.info,
  warn: console.warn.bind(console), // Always show warnings
  error: console.error.bind(console), // Always show errors
};
