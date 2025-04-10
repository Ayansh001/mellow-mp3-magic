
/**
 * Utility function to safely check if code is running in browser environment
 */
export const isBrowser = typeof window !== "undefined";

/**
 * Safe way to access window object
 * @param callback Function that uses window object
 */
export const withBrowser = <T>(callback: () => T): T | undefined => {
  if (isBrowser) {
    return callback();
  }
  return undefined;
};

/**
 * Safe way to access browser APIs like AudioContext
 */
export const getBrowserAPI = <T>(name: string): T | undefined => {
  return withBrowser(() => (window as unknown as Record<string, unknown>)[name] as T);
};

/**
 * Safely gets AudioContext
 */
export const getAudioContext = (): typeof window.AudioContext | undefined => {
  return withBrowser(() => window.AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext as typeof window.AudioContext);
};
