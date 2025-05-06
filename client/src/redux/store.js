import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import productReducer from './slices/productSlice';
import goalReducer from './slices/goalSlice';
import contentIdeasCalendarReducer from './slices/contentIdeasCalendarSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    products: productReducer,
    goals: goalReducer,
    contentIdeasCalendar: contentIdeasCalendarReducer
  }
});

export default store;