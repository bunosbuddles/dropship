import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductGoals, addGoal, updateGoal, deleteGoal } from '../redux/slices/goalSlice';
import { format, addMonths } from 'date-fns';
import axios from 'axios';

const ProductGoalTab = ({ product }) => {
  const dispatch = useDispatch();
  const { goals, loading } = useSelector((state) => state.goals);
  const [productGoals, setProductGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'revenue',
    targetAmount: '',
    startDate: new Date().toISOString().substr(0, 10),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().substr(0, 10)
  });
  const [editingGoalId, setEditingGoalId] = useState(null);
  
  // Use a ref to track if default goals have been created
  // This persists across re-renders but won't cause re-renders itself
  const defaultGoalsChecked = useRef(false);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Fetch product-specific goals
  useEffect(() => {
    if (product && product._id) {
      dispatch(fetchProductGoals(product._id));
    }
  }, [dispatch, product]);

  // Filter goals for this product
  useEffect(() => {
    if (goals && goals.length > 0) {
      const filtered = goals.filter(goal => 
        goal.product === product._id && goal.isProductSpecific === true
      );
      setProductGoals(filtered);
    }
  }, [goals, product]);

  // Check if we need to create default goals
  // This runs only once after the initial load
  useEffect(() => {
    const checkAndCreateDefaultGoals = async () => {
      // Only proceed if we haven't checked before and have a product ID
      if (!defaultGoalsChecked.current && product && product._id && !loading) {
        try {
          // Mark that we've checked, so we don't check again
          defaultGoalsChecked.current = true;
          
          // Direct API call to check if product has goals
          const response = await axios.get(
            `${API_BASE_URL}/api/goals/product/${product._id}`
          );
          
          // If there are no goals for this product, create the defaults
          if (response.data.length === 0) {
            await createDefaultGoals();
          }
        } catch (error) {
          console.error("Error checking/creating default goals:", error);
        }
      }
    };
    
    checkAndCreateDefaultGoals();
  }, [product, loading]);

  const createDefaultGoals = async () => {
    // Define default goal types with fixed values
    const defaultGoals = [
      {
        name: 'Monthly Revenue Target',
        type: 'revenue',
        targetAmount: 10000, // Fixed value of $10,000
      },
      {
        name: 'Monthly Sales Target',
        type: 'sales',
        targetAmount: 1000, // Fixed value of 1,000 units
      },
      {
        name: 'Monthly Profit Target',
        type: 'profit',
        targetAmount: 4000, // Fixed value of $4,000
      }
    ];

    // Set dates for all goals
    const startDate = new Date();
    const endDate = addMonths(startDate, 1);
    
    // Create each default goal
    for (const goal of defaultGoals) {
      const goalData = {
        ...goal,
        product: product._id,
        isProductSpecific: true,
        startDate: startDate.toISOString().substr(0, 10),
        endDate: endDate.toISOString().substr(0, 10)
      };
      
      try {
        await dispatch(addGoal(goalData)).unwrap();
      } catch (error) {
        console.error(`Failed to create default goal ${goal.name}:`, error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const goalData = {
      ...formData,
      product: product._id,
      isProductSpecific: true,
      targetAmount: parseFloat(formData.targetAmount)
    };

    if (editingGoalId) {
      dispatch(updateGoal({ id: editingGoalId, goalData }))
        .unwrap()
        .then(() => {
          setShowForm(false);
          setEditingGoalId(null);
          resetForm();
        });
    } else {
      dispatch(addGoal(goalData))
        .unwrap()
        .then(() => {
          setShowForm(false);
          resetForm();
        });
    }
  };

  const handleEdit = (goal) => {
    setFormData({
      name: goal.name,
      type: goal.type,
      targetAmount: goal.targetAmount.toString(),
      startDate: new Date(goal.startDate).toISOString().substr(0, 10),
      endDate: new Date(goal.endDate).toISOString().substr(0, 10)
    });
    setEditingGoalId(goal._id);
    setShowForm(true);
  };

  const handleDelete = (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      dispatch(deleteGoal(goalId));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'revenue',
      targetAmount: '',
      startDate: new Date().toISOString().substr(0, 10),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().substr(0, 10)
    });
  };

  // Calculate goal progress based on current product data
  const calculateProgress = (goal) => {
    let currentAmount = 0;
    
    if (goal.type === 'revenue') {
      currentAmount = product.totalSales || 0;
    } else if (goal.type === 'sales') {
      currentAmount = product.unitsSold || 0;
    } else if (goal.type === 'profit') {
      const profit = (product.basePrice - product.unitCost - (product.fees || 0)) * product.unitsSold;
      currentAmount = profit;
    } else if (goal.type === 'profit_margin') {
      if (product.basePrice > 0) {
        const margin = ((product.basePrice - product.unitCost - (product.fees || 0)) / product.basePrice * 100);
        currentAmount = margin;
      }
    }
    
    const progressPercentage = Math.min(100, (currentAmount / goal.targetAmount) * 100);
    return { currentAmount, progressPercentage };
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  // Get color based on progress
  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Format amount based on goal type
  const formatAmount = (amount, type) => {
    if (type === 'revenue' || type === 'profit') {
      return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (type === 'profit_margin') {
      return `${amount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
    }
    return amount.toLocaleString();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Product-Specific Goals</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setEditingGoalId(null);
              resetForm();
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          {showForm ? 'Cancel' : 'Add Goal'}
        </button>
      </div>

      {/* Info message about product goals vs store goals */}
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
        <p className="text-sm">
          <strong>Note:</strong> Goals set here apply only to this specific product. For store-wide goals, 
          please use the main Goals tab in the sidebar.
        </p>
      </div>

      {/* Add/Edit Goal Form */}
      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
          <h3 className="text-lg font-medium mb-4">{editingGoalId ? 'Edit Goal' : 'Add New Goal'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Q2 Revenue Target"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="revenue">Revenue</option>
                  <option value="sales">Sales (Units)</option>
                  <option value="profit">Profit</option>
                  <option value="profit_margin">Profit Margin (%)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Amount
                </label>
                <input
                  type="number"
                  name="targetAmount"
                  value={formData.targetAmount}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  step={formData.type === 'profit_margin' ? '0.1' : '1'}
                  min="0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.type === 'revenue' || formData.type === 'profit' ? 'In dollars ($)' : 
                   formData.type === 'profit_margin' ? 'In percentage (%)' : 'In units'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Period
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingGoalId(null);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                {editingGoalId ? 'Update Goal' : 'Add Goal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      {loading ? (
        <div className="text-center py-4">Loading goals...</div>
      ) : productGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productGoals.map(goal => {
            const { currentAmount, progressPercentage } = calculateProgress(goal);
            
            return (
              <div key={goal._id} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{goal.name}</h3>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 uppercase">
                    {goal.type.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Target:</span>{' '}
                    {formatAmount(goal.targetAmount, goal.type)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Current:</span>{' '}
                    {formatAmount(currentAmount, goal.type)}
                  </p>
                </div>
                
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${getProgressColor(progressPercentage)}`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-xs text-gray-600 mt-1">{progressPercentage.toFixed(0)}%</p>
                </div>
                
                <div className="text-xs text-gray-500 mb-4">
                  {formatDate(goal.startDate)} - {formatDate(goal.endDate)}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="px-3 py-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(goal._id)}
                    className="px-3 py-1 text-xs text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-500">Loading goals or creating default goals...</p>
        </div>
      )}
    </div>
  );
};

export default ProductGoalTab;