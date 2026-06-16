import axios from 'axios';
import { JWT_TOKENS } from '../config/api';

type Role = keyof typeof JWT_TOKENS;

/**
 * Returns an axios instance pre-configured with the JWT for the given role.
 * Usage:
 *   const api = createApiClient('manager');
 *   const api = createApiClient('employee');
 */
export const createApiClient = (role: Role) =>
  axios.create({
    headers: { Authorization: `Bearer ${JWT_TOKENS[role]}` },
    withCredentials: true,
  });