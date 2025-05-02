// Service to handle authentication requests
// This will be replaced with real API calls in the future

import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

// For development, store users in localStorage
const getUsers = () => {
  const users = localStorage.getItem('users');
  return users ? JSON.parse(users) : [];
};

const saveUsers = (users) => {
  localStorage.setItem('users', JSON.stringify(users));
};

// Initialize with a test user if none exists
if (!localStorage.getItem('users')) {
  saveUsers([
    { id: 'test123', email: 'test@example.com', password: 'password' }
  ]);
}

export const authService = {
  // Register user
  async register(email, password) {
    try {
      const response = await axios.post(`${API_URL}/register`, {
        email,
        password,
      });
      
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      if (error.response && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  },
  
  // Login user
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });
      
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      if (error.response && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Login failed. Please check your credentials.');
      }
    }
  },
  
  // Logout user
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },
  
  // Get user data
  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'));
  },
  
  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
  
  // Get auth token
  getToken() {
    return localStorage.getItem('token');
  }
};

export default authService; 