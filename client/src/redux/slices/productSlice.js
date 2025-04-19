import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Use environment variable or fallback to localhost:5001
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Fetch products
export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/products`);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to fetch products'
      );
    }
  }
);

// Fetch single product
export const fetchProduct = createAsyncThunk(
  'products/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/products/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to fetch product'
      );
    }
  }
);

// Add product
export const addProduct = createAsyncThunk(
  'products/add',
  async (productData, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/products`, productData);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to add product'
      );
    }
  }
);

// Update product
export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/products/${id}`, productData);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to update product'
      );
    }
  }
);

// Delete product
export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/products/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to delete product'
      );
    }
  }
);

// Add sales data for a product
export const addProductSales = createAsyncThunk(
  'products/addSales',
  async ({ productId, salesData }, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/products/${productId}/sales`, 
        salesData
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to add sales data'
      );
    }
  }
);

// Update sales data for a product
export const updateProductSales = createAsyncThunk(
  'products/updateSales',
  async ({ productId, transactionId, salesData }, { rejectWithValue }) => {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/products/${productId}/sales/${transactionId}`, 
        salesData
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to update sales data'
      );
    }
  }
);

// Delete sales data for a product
export const deleteProductSales = createAsyncThunk(
  'products/deleteSales',
  async ({ productId, transactionId }, { rejectWithValue }) => {
    try {
      const res = await axios.delete(
        `${API_BASE_URL}/api/products/${productId}/sales/${transactionId}`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to delete sales data'
      );
    }
  }
);

// Fetch sales history for a product
export const fetchProductSales = createAsyncThunk(
  'products/fetchSales',
  async (productId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/products/${productId}/sales`);
      return { productId, salesHistory: res.data };
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Failed to fetch sales history'
      );
    }
  }
);

// Initial state
const initialState = {
  products: [],
  product: null,
  salesHistory: {},  // Map of productId -> sales history array
  loading: false,
  error: null
};

// Products slice
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearProductError: (state) => {
      state.error = null;
    },
    clearCurrentProduct: (state) => {
      state.product = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch single product
      .addCase(fetchProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
        state.error = null;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add product
      .addCase(addProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
        state.error = null;
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.map(product => 
          product._id === action.payload._id ? action.payload : product
        );
        state.product = action.payload;
        state.error = null;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter(product => product._id !== action.payload);
        state.error = null;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add sales data
      .addCase(addProductSales.pending, (state) => {
        state.loading = true;
      })
      .addCase(addProductSales.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update the product in the products array
        state.products = state.products.map(product => 
          product._id === action.payload._id ? action.payload : product
        );
        
        // If this is the current product, update it too
        if (state.product && state.product._id === action.payload._id) {
          state.product = action.payload;
        }
        
        // Update the salesHistory for this product
        if (action.payload.salesHistory) {
          state.salesHistory[action.payload._id] = action.payload.salesHistory;
        }
        
        state.error = null;
      })
      .addCase(addProductSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update sales data
      .addCase(updateProductSales.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProductSales.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update the product in the products array
        state.products = state.products.map(product => 
          product._id === action.payload._id ? action.payload : product
        );
        
        // If this is the current product, update it too
        if (state.product && state.product._id === action.payload._id) {
          state.product = action.payload;
        }
        
        // Update the salesHistory for this product
        if (action.payload.salesHistory) {
          state.salesHistory[action.payload._id] = action.payload.salesHistory;
        }
        
        state.error = null;
      })
      .addCase(updateProductSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete sales data
      .addCase(deleteProductSales.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProductSales.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update the product in the products array
        state.products = state.products.map(product => 
          product._id === action.payload._id ? action.payload : product
        );
        
        // If this is the current product, update it too
        if (state.product && state.product._id === action.payload._id) {
          state.product = action.payload;
        }
        
        // Update the salesHistory for this product
        if (action.payload.salesHistory) {
          state.salesHistory[action.payload._id] = action.payload.salesHistory;
        }
        
        state.error = null;
      })
      .addCase(deleteProductSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch sales history
      .addCase(fetchProductSales.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductSales.fulfilled, (state, action) => {
        state.loading = false;
        // Store the sales history for this product
        state.salesHistory[action.payload.productId] = action.payload.salesHistory;
        state.error = null;
      })
      .addCase(fetchProductSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearProductError, clearCurrentProduct } = productSlice.actions;
export default productSlice.reducer;