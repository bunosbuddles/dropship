import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProduct, updateProduct } from '../redux/slices/productSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductSourcingTab from '../components/ProductSourcingTab';
import SalesHistoryTab from '../components/SalesHistoryTab';
import ProductGoalTab from '../components/ProductGoalTab'; // Add this import

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { product, loading, error } = useSelector((state) => state.products);
  const [activeTab, setActiveTab] = useState('details');
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (id && !initialLoadDone.current) {
      dispatch(fetchProduct(id)).then(() => {
        initialLoadDone.current = true;
      });
    }
  }, [dispatch, id]);

  // Early return with loading spinner before initial load
  if (loading && !initialLoadDone.current) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  // Calculate profit
  const profit = (product.basePrice - product.unitCost - (product.fees || 0)) * product.unitsSold;
  const profitMargin = product.basePrice > 0 
    ? ((product.basePrice - product.unitCost - (product.fees || 0)) / product.basePrice * 100).toFixed(1) 
    : 0;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {product.name} {product.variant ? `(${product.variant})` : ''}
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/products/${id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Edit Product
          </button>
          <button
            onClick={() => navigate('/products')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
          >
            Back to List
          </button>
        </div>
      </div>
      
      {/* Status Badge */}
      <div className="mb-6">
        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Status: {product.sourcingStatus || 'In progress'}
        </span>
      </div>
      
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            className={`mr-8 py-4 px-1 font-medium text-sm ${
              activeTab === 'details'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('details')}
          >
            Product Details
          </button>
          
          <button
            className={`mr-8 py-4 px-1 font-medium text-sm ${
              activeTab === 'sourcing'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('sourcing')}
          >
            Sourcing
          </button>
          
          <button
            className={`mr-8 py-4 px-1 font-medium text-sm ${
              activeTab === 'salesHistory'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('salesHistory')}
          >
            Sales History
          </button>
          
          {/* Add Goals Tab */}
          <button
            className={`mr-8 py-4 px-1 font-medium text-sm ${
              activeTab === 'goals'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('goals')}
          >
            Goals
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Information */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Product Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm text-gray-500">Base Price</h3>
                <p className="font-medium">${product.basePrice.toFixed(2)}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Unit Cost</h3>
                <p className="font-medium">${product.unitCost.toFixed(2)}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Fees (per unit)</h3>
                <p className="font-medium">${(product.fees || 0).toFixed(2)}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Supplier</h3>
                <p className="font-medium">{product.supplier || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Created</h3>
                <p className="font-medium">{formatDate(product.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Last Updated</h3>
                <p className="font-medium">{formatDate(product.updatedAt)}</p>
              </div>
            </div>
          </div>
          
          {/* Sales Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Sales Performance</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm text-gray-500">Units Sold</h3>
                <p className="font-medium">{product.unitsSold}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Total Revenue</h3>
                <p className="font-medium">${(product.basePrice * product.unitsSold).toFixed(2)}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Total Profit</h3>
                <p className="font-medium">${profit.toFixed(2)}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Profit Margin</h3>
                <p className="font-medium">{profitMargin}%</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'sourcing' && (
        <div className="lg:col-span-3">
          <ProductSourcingTab product={product} />
        </div>
      )}
      
      {activeTab === 'salesHistory' && (
        <div className="lg:col-span-3">
          <SalesHistoryTab product={product} />
        </div>
      )}
      
      {/* Goals Tab Content */}
      {activeTab === 'goals' && (
        <div className="lg:col-span-3">
          <ProductGoalTab product={product} />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;