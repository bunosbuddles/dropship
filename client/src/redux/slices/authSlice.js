import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Use environment variable or fallback to localhost:5001
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Set auth token for all requests
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
    localStorage.removeItem('token');
  }
};

// Load user from token
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      setAuthToken(token);
      
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth`);
        return res.data;
      } catch (err) {
        setAuthToken(null);
        return rejectWithValue(
          err.response && err.response.data.message 
            ? err.response.data.message 
            : 'Failed to authenticate'
        );
      }
    }
    
    return rejectWithValue('No token found');
  }
);

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('Attempting to register user:', userData.email);
      const res = await axios.post(`${API_BASE_URL}/api/users`, userData);
      console.log('Registration response:', res.data);
      return res.data;
    } catch (err) {
      console.error('Registration error:', err.response ? err.response.data : err.message);
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Registration failed'
      );
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth`, userData);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Invalid credentials'
      );
    }
  }
);

// Initial state
const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  user: null,
  error: null
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      setAuthToken(null);
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Load user
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(loadUser.rejected, (state, action) => {
        setAuthToken(null);
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = action.payload;
      })
      
      // Register user
      .addCase(register.pending, (state) => {
        state.loading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        setAuthToken(action.payload.token);
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Login user
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        setAuthToken(action.payload.token);
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;