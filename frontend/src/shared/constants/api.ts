/**
 * Global API configuration
 * Set isMockApi = true to use mock data instead of real API calls
 */
export const isMockApi = true;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
