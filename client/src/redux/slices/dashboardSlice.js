import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { format } from 'date-fns';

// Use environment variable or fallback to localhost:5001
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Fetch dashboard data
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (timeframe = 'month', { rejectWithValue }) => {
    try {
      // Add timestamp as cache-busting parameter
      const timestamp = new Date().getTime();
      const res = await axios.get(
        `${API_BASE_URL}/api/dashboard?timeframe=${timeframe}&_t=${timestamp}`
      );
      
      // Log the response data to help debug
      console.log('Dashboard data received:', res.data);
      
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to fetch dashboard data'
      );
    }
  }
);

// Fetch today's tasks
export const fetchTodaysTasks = createAsyncThunk(
  'dashboard/fetchTodaysTasks',
  async (_, { rejectWithValue }) => {
    try {
      // Add timestamp as cache-busting parameter
      const timestamp = new Date().getTime();
      
      // Fetch regular tasks
      const tasksRes = await axios.get(`${API_BASE_URL}/api/dashboard/today-tasks?_t=${timestamp}`);
      
      return tasksRes.data;
    } catch (err) {
      console.error('Error fetching today\'s tasks:', err);
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to fetch today\'s tasks'
      );
    }
  }
);

// Fetch statistics for timeframe
export const fetchStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (timeframe = 'month', { rejectWithValue }) => {
    try {
      // Add timestamp as cache-busting parameter
      const timestamp = new Date().getTime();
      const res = await axios.get(`${API_BASE_URL}/api/dashboard/stats/${timeframe}?_t=${timestamp}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to fetch statistics'
      );
    }
  }
);

// Initial state
const initialState = {
  dashboardData: null,
  todaysTasks: [],
  stats: null,
  loading: false,
  error: null
};

// Dashboard slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardData: (state) => {
      state.dashboardData = null;
      state.todaysTasks = [];
      state.stats = null;
      state.error = null;
    },
    // Add action to force refresh
    forceDashboardRefresh: (state) => {
      // This action doesn't actually change state but can be used to trigger a re-fetch
      console.log('Forcing dashboard refresh');
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard data
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        
        // Preserve null values, only convert strings to numbers
        if (action.payload) {
          // Only convert to number if not null and is a string
          if (action.payload.revenueChange !== null && typeof action.payload.revenueChange === 'string') {
            action.payload.revenueChange = Number(action.payload.revenueChange);
          }
          
          if (action.payload.profitChange !== null && typeof action.payload.profitChange === 'string') {
            action.payload.profitChange = Number(action.payload.profitChange);
          }
          
          if (action.payload.unitsChange !== null && typeof action.payload.unitsChange === 'string') {
            action.payload.unitsChange = Number(action.payload.unitsChange);
          }
        }
        
        state.dashboardData = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch today's tasks
      .addCase(fetchTodaysTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTodaysTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.todaysTasks = action.payload;
        state.error = null;
      })
      .addCase(fetchTodaysTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch statistics
      .addCase(fetchStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearDashboardData, forceDashboardRefresh } = dashboardSlice.actions;
export default dashboardSlice.reducer;