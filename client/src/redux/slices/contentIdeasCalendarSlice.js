import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Use environment variable or fallback to localhost:5001
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Fetch all content ideas for calendar view
export const fetchContentIdeasForCalendar = createAsyncThunk(
  'contentIdeasCalendar/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/content-ideas`);
      return res.data;
    } catch (err) {
      console.error('Error fetching content ideas for calendar:', err);
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to fetch content ideas'
      );
    }
  }
);

// Fetch content ideas for a specific date
export const fetchContentIdeasByDate = createAsyncThunk(
  'contentIdeasCalendar/fetchByDate',
  async (date, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/content-ideas/date/${date}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to fetch content ideas for this date'
      );
    }
  }
);

// Initial state
const initialState = {
  contentIdeas: [],
  selectedDateIdeas: [],
  loading: false,
  error: null,
  highlightedIdeaId: null
};

// Content ideas calendar slice
const contentIdeasCalendarSlice = createSlice({
  name: 'contentIdeasCalendar',
  initialState,
  reducers: {
    clearContentIdeasError: (state) => {
      state.error = null;
    },
    setHighlightedIdeaId: (state, action) => {
      state.highlightedIdeaId = action.payload;
    },
    clearHighlightedIdeaId: (state) => {
      state.highlightedIdeaId = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all content ideas
      .addCase(fetchContentIdeasForCalendar.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchContentIdeasForCalendar.fulfilled, (state, action) => {
        state.loading = false;
        state.contentIdeas = action.payload;
        state.error = null;
      })
      .addCase(fetchContentIdeasForCalendar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch content ideas by date
      .addCase(fetchContentIdeasByDate.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchContentIdeasByDate.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDateIdeas = action.payload;
        state.error = null;
      })
      .addCase(fetchContentIdeasByDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  clearContentIdeasError, 
  setHighlightedIdeaId, 
  clearHighlightedIdeaId 
} = contentIdeasCalendarSlice.actions;

export default contentIdeasCalendarSlice.reducer; 