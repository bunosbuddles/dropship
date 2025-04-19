import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import productReducer from './slices/productSlice';
import calendarReducer from './slices/calendarSlice';
import goalReducer from './slices/goalSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    products: productReducer,
    calendar: calendarReducer,
    goals: goalReducer
  }
});

export default store;