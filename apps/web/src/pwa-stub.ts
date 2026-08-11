/**
 * Stands in for `virtual:pwa-register` in the single-file build, which has no service
 * worker to register: it is one HTML file opened straight from disk.
 */
export const registerSW = () => async () => {};
