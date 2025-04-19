import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Use environment variable or fallback to localhost:5001
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Fetch calendar entries - simplified to get all entries
export const fetchCalendarEntries = createAsyncThunk(
  'calendar/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // Use the base URL to get all entries
      const url = `${API_BASE_URL}/api/calendar`;
      
      console.log('Fetching all calendar entries from:', url);
      const res = await axios.get(url);
      console.log('Response data:', res.data);
      return res.data;
    } catch (err) {
      console.error('Error fetching calendar entries:', err);
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to fetch calendar entries'
      );
    }
  }
);

// Fetch entry for specific date
export const fetchCalendarDate = createAsyncThunk(
  'calendar/fetchDate',
  async (date, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/calendar/date/${date}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to fetch calendar entry'
      );
    }
  }
);

// Add calendar entry
export const addCalendarEntry = createAsyncThunk(
  'calendar/add',
  async (entryData, { rejectWithValue }) => {
    try {
      console.log('Adding calendar entry with data:', entryData);
      const res = await axios.post(`${API_BASE_URL}/api/calendar`, entryData);
      console.log('Add response:', res.data);
      return res.data;
    } catch (err) {
      console.error('Error adding calendar entry:', err);
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to add calendar entry'
      );
    }
  }
);

// Update calendar entry
export const updateCalendarEntry = createAsyncThunk(
  'calendar/update',
  async ({ id, entryData }, { rejectWithValue }) => {
    try {
      console.log('Updating calendar entry with ID:', id);
      console.log('Data being sent:', JSON.stringify(entryData));
      
      if (!id || id === 'undefined') {
        console.error('Invalid ID provided for calendar update:', id);
        return rejectWithValue('Invalid entry ID');
      }
      
      const url = `${API_BASE_URL}/api/calendar/${id}`;
      console.log('Making PUT request to:', url);
      
      const res = await axios.put(url, entryData);
      console.log('Update response:', res.data);
      return res.data;
    } catch (err) {
      console.error('Error updating calendar entry:', err);
      console.error('Error details:', err.response?.data || err.message);
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to update calendar entry: ' + err.message
      );
    }
  }
);

// Delete calendar entry
export const deleteCalendarEntry = createAsyncThunk(
  'calendar/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/calendar/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to delete calendar entry'
      );
    }
  }
);

// Initial state
const initialState = {
  entries: [],
  currentEntry: null,
  loading: false,
  error: null
};

// Calendar slice
const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    clearCalendarError: (state) => {
      state.error = null;
    },
    clearCurrentEntry: (state) => {
      state.currentEntry = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all entries
      .addCase(fetchCalendarEntries.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCalendarEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
        state.error = null;
      })
      .addCase(fetchCalendarEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch entry by date
      .addCase(fetchCalendarDate.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCalendarDate.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEntry = action.payload.length > 0 ? action.payload[0] : null;
        state.error = null;
      })
      .addCase(fetchCalendarDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add entry
      .addCase(addCalendarEntry.pending, (state) => {
        state.loading = true;
      })
      .addCase(addCalendarEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.entries.push(action.payload);
        state.currentEntry = action.payload;
        state.error = null;
      })
      .addCase(addCalendarEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update entry
      .addCase(updateCalendarEntry.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCalendarEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = state.entries.map(entry => 
          entry._id === action.payload._id ? action.payload : entry
        );
        state.currentEntry = action.payload;
        state.error = null;
      })
      .addCase(updateCalendarEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete entry
      .addCase(deleteCalendarEntry.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteCalendarEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = state.entries.filter(entry => entry._id !== action.payload);
        state.currentEntry = null;
        state.error = null;
      })
      .addCase(deleteCalendarEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearCalendarError, clearCurrentEntry } = calendarSlice.actions;
export default calendarSlice.reducer;