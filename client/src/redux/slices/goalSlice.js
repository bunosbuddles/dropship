import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Use environment variable or fallback to localhost:5001
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Fetch all goals
export const fetchGoals = createAsyncThunk(
  'goals/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/goals`);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to fetch goals'
      );
    }
  }
);

// Fetch goals for a specific product
export const fetchProductGoals = createAsyncThunk(
  'goals/fetchProductGoals',
  async (productId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/goals/product/${productId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to fetch product goals'
      );
    }
  }
);

// Fetch store-wide goals only
export const fetchStoreGoals = createAsyncThunk(
  'goals/fetchStoreGoals',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/goals/store`);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to fetch store goals'
      );
    }
  }
);

// Fetch goals with progress
export const fetchGoalsStatus = createAsyncThunk(
  'goals/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/goals/status`);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to fetch goals status'
      );
    }
  }
);

// Add goal
export const addGoal = createAsyncThunk(
  'goals/add',
  async (goalData, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/goals`, goalData);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to add goal'
      );
    }
  }
);

// Update goal
export const updateGoal = createAsyncThunk(
  'goals/update',
  async ({ id, goalData }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/goals/${id}`, goalData);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to update goal'
      );
    }
  }
);

// Delete goal
export const deleteGoal = createAsyncThunk(
  'goals/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/goals/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to delete goal'
      );
    }
  }
);

// Update goal progress
export const updateGoalProgress = createAsyncThunk(
  'goals/updateProgress',
  async ({ id, currentAmount }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/goals/${id}/update-progress`, { currentAmount });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to update goal progress'
      );
    }
  }
);

// Sync goals with dashboard metrics
export const syncGoalsWithDashboard = createAsyncThunk(
  'goals/syncWithDashboard',
  async (dashboardData, { getState, dispatch, rejectWithValue }) => {
    try {
      if (!dashboardData) {
        return { updated: false };
      }
      
      const { goals } = getState().goals;
      
      if (!goals || goals.length === 0) {
        return { updated: false };
      }
      
      const metrics = {
        revenue: dashboardData.totalRevenue || 0,
        sales: dashboardData.unitsSold || 0
      };
      
      console.log('Syncing goals with dashboard metrics:', metrics);
      
      // To avoid excessive backend updates, only update goals that have changed
      const updatedGoals = [];
      let hasUpdates = false;
      
      for (const goal of goals) {
        let shouldUpdate = false;
        let currentAmount = goal.currentAmount || 0;
        
        // Only update store-wide goals from dashboard metrics
        if (goal.isProductSpecific) {
          updatedGoals.push(goal);
          continue;
        }
        
        // Check if metric applies to this goal and if value has changed
        if (goal.type === 'revenue' && Math.abs(metrics.revenue - currentAmount) > 0.01) {
          currentAmount = metrics.revenue;
          shouldUpdate = true;
        } else if (goal.type === 'sales' && metrics.sales !== currentAmount) {
          currentAmount = metrics.sales;
          shouldUpdate = true;
        }
        
        if (shouldUpdate) {
          console.log(`Updating goal ${goal._id} with new amount: ${currentAmount}`);
          
          try {
            // Update the goal progress in the backend
            const res = await axios.put(`${API_BASE_URL}/api/goals/${goal._id}/update-progress`, {
              currentAmount
            });
            updatedGoals.push(res.data);
            hasUpdates = true;
          } catch (error) {
            console.error(`Failed to update goal ${goal._id}:`, error);
            updatedGoals.push(goal);
          }
        } else {
          updatedGoals.push(goal);
        }
      }
      
      return { goals: updatedGoals, updated: hasUpdates };
    } catch (err) {
      console.error('Error syncing goals with dashboard:', err);
      return rejectWithValue('Failed to sync goals with dashboard');
    }
  }
);

// Initial state
const initialState = {
  goals: [],
  goalsStatus: [],
  loading: false,
  error: null,
  lastSynced: null
};

// Goals slice
const goalSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    clearGoalError: (state) => {
      state.error = null;
    },
    // Update goals with dashboard metrics locally
    updateGoalsWithMetrics: (state, action) => {
      const { metrics } = action.payload;
      
      if (!metrics || !state.goals || state.goals.length === 0) {
        return;
      }
      
      // Create new array to avoid mutating state directly
      const updatedGoals = state.goals.map(goal => {
        // Skip product-specific goals
        if (goal.isProductSpecific) {
          return goal;
        }
        
        // Create a new goal object to avoid mutation
        const updatedGoal = { ...goal };
        
        if (goal.type === 'revenue' && metrics.revenue !== undefined) {
          updatedGoal.currentAmount = metrics.revenue;
        } else if (goal.type === 'sales' && metrics.sales !== undefined) {
          updatedGoal.currentAmount = metrics.sales;
        }
        
        return updatedGoal;
      });
      
      // Set the updated goals
      state.goals = updatedGoals;
      state.lastSynced = new Date().toISOString();
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all goals
      .addCase(fetchGoals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.loading = false;
        state.goals = action.payload;
        state.error = null;
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch product-specific goals
      .addCase(fetchProductGoals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductGoals.fulfilled, (state, action) => {
        state.loading = false;
        // Merge product goals with existing goals to avoid duplication
        const productGoals = action.payload;
        const existingIds = new Set(state.goals.map(g => g._id));
        const newGoals = productGoals.filter(g => !existingIds.has(g._id));
        
        // Replace any existing product goals
        const nonProductGoals = state.goals.filter(g => !productGoals.some(pg => pg._id === g._id));
        
        state.goals = [...nonProductGoals, ...productGoals];
        state.error = null;
      })
      .addCase(fetchProductGoals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch store-wide goals only
      .addCase(fetchStoreGoals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStoreGoals.fulfilled, (state, action) => {
        state.loading = false;
        // We're specifically fetching store goals - keep any product goals in state
        const productGoals = state.goals.filter(g => g.isProductSpecific);
        state.goals = [...productGoals, ...action.payload];
        state.error = null;
      })
      .addCase(fetchStoreGoals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch goals status
      .addCase(fetchGoalsStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGoalsStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.goalsStatus = action.payload;
        state.error = null;
      })
      .addCase(fetchGoalsStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add goal
      .addCase(addGoal.pending, (state) => {
        state.loading = true;
      })
      .addCase(addGoal.fulfilled, (state, action) => {
        state.loading = false;
        state.goals.push(action.payload);
        state.error = null;
      })
      .addCase(addGoal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update goal
      .addCase(updateGoal.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateGoal.fulfilled, (state, action) => {
        state.loading = false;
        state.goals = state.goals.map(goal => 
          goal._id === action.payload._id ? action.payload : goal
        );
        state.error = null;
      })
      .addCase(updateGoal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete goal
      .addCase(deleteGoal.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.loading = false;
        state.goals = state.goals.filter(goal => goal._id !== action.payload);
        state.error = null;
      })
      .addCase(deleteGoal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update goal progress
      .addCase(updateGoalProgress.fulfilled, (state, action) => {
        state.goals = state.goals.map(goal => 
          goal._id === action.payload._id ? action.payload : goal
        );
      })
      
      // Sync goals with dashboard
      .addCase(syncGoalsWithDashboard.fulfilled, (state, action) => {
        if (action.payload.updated && action.payload.goals) {
          state.goals = action.payload.goals;
          state.lastSynced = new Date().toISOString();
        }
      });
  }
});

export const { clearGoalError, updateGoalsWithMetrics } = goalSlice.actions;
export default goalSlice.reducer;