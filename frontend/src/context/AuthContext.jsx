import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext();
const TOKEN_KEY = 'elevora_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem(TOKEN_KEY) || localStorage.getItem('nexora_token')
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await API.get('/profile');
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user profile:', error.message);
        // Clear invalid token
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await API.post('/auth/login', { email, password });
      const { token: receivedToken, ...userData } = response.data;
      
      localStorage.setItem(TOKEN_KEY, receivedToken);
      localStorage.removeItem('nexora_token');
      setToken(receivedToken);
      setUser(userData);
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role) => {
    setLoading(true);
    try {
      const response = await API.post('/auth/register', { name, email, password, role });
      const { token: receivedToken, ...userData } = response.data;

      localStorage.setItem(TOKEN_KEY, receivedToken);
      localStorage.removeItem('nexora_token');
      setToken(receivedToken);
      setUser(userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('nexora_token');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  const updateProfileState = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfileState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
