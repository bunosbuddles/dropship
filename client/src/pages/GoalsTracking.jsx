import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format, startOfToday, parseISO, addMonths } from 'date-fns';
import { fetchGoals, addGoal, updateGoal, deleteGoal, syncGoalsWithDashboard } from '../redux/slices/goalSlice';
import { fetchDashboardData } from '../redux/slices/dashboardSlice';
import GoalCard from '../components/GoalCard';
import LoadingSpinner from '../components/LoadingSpinner';

const GoalsTracking = () => {
  const dispatch = useDispatch();
  const { goals, loading, error, lastSynced } = useSelector((state) => state.goals);
  const { dashboardData } = useSelector((state) => state.dashboard);
  const [showGoalForm, setShowGoalForm] = useState(false);
  
  // Helper function to get date in local timezone using date-fns
  const formatDateForInput = (dateString) => {
    if (!dateString) {
      // Get today's date using date-fns
      return format(startOfToday(), 'yyyy-MM-dd');
    }
    
    // Format existing date using date-fns
    return format(parseISO(dateString), 'yyyy-MM-dd');
  };
  
  // Get default end date (1 month from today) using date-fns
  const getDefaultEndDate = () => {
    const today = startOfToday();
    const nextMonth = addMonths(today, 1);
    return format(nextMonth, 'yyyy-MM-dd');
  };
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'revenue',
    targetAmount: '',
    startDate: formatDateForInput(),
    endDate: getDefaultEndDate()
  });
  
  const [editingGoalId, setEditingGoalId] = useState(null);

  // Fetch ALL goals and dashboard data - THE KEY CHANGE IS HERE
  useEffect(() => {
    dispatch(fetchGoals()); // Using fetchGoals instead of fetchStoreGoals
    dispatch(fetchDashboardData());
  }, [dispatch]);

  // Sync goals with dashboard metrics when dashboard data changes
  useEffect(() => {
    if (dashboardData && goals.length > 0) {
      dispatch(syncGoalsWithDashboard(dashboardData));
    }
  }, [dispatch, dashboardData, goals.length]);

  // Filter out product-specific goals
  const storeGoals = goals.filter(goal => !goal.isProductSpecific);

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
      targetAmount: parseFloat(formData.targetAmount),
      isProductSpecific: false // Ensure this is a store-wide goal
    };
    
    if (editingGoalId) {
      dispatch(updateGoal({ id: editingGoalId, goalData }))
        .then(() => {
          setShowGoalForm(false);
          setEditingGoalId(null);
          resetForm();
        });
    } else {
      dispatch(addGoal(goalData))
        .then(() => {
          setShowGoalForm(false);
          resetForm();
        });
    }
  };

  const handleEditGoal = (goal) => {
    setFormData({
      name: goal.name,
      type: goal.type,
      targetAmount: goal.targetAmount.toString(),
      startDate: formatDateForInput(goal.startDate),
      endDate: formatDateForInput(goal.endDate)
    });
    setEditingGoalId(goal._id);
    setShowGoalForm(true);
  };

  const handleDeleteGoal = (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      dispatch(deleteGoal(goalId));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'revenue',
      targetAmount: '',
      startDate: formatDateForInput(),
      endDate: getDefaultEndDate()
    });
  };

  // Manual sync with dashboard
  const handleManualSync = () => {
    if (dashboardData) {
      dispatch(syncGoalsWithDashboard(dashboardData));
    }
  };

  if (loading && storeGoals.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Store-Wide Goals Tracking</h1>
      <button
        onClick={() => setShowGoalForm(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md"
      >
        Add Store Goal
      </button>
    </div>

      {/* Info message about store goals vs product goals */}
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
        <p className="text-sm">
          <strong>Note:</strong> Goals set here apply to your entire store. To set goals for specific products, 
          navigate to a product detail page and use the Goals tab there.
        </p>
      </div>

      {lastSynced && (
        <div className="text-xs text-gray-500 mb-4">
          Last synchronized: {new Date(lastSynced).toLocaleString()}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {showGoalForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-medium mb-4">{editingGoalId ? 'Edit Goal' : 'Add New Goal'}</h2>
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
                  placeholder="e.g., Monthly Revenue Target"
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
                  Date Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-1/2 p-2 border border-gray-300 rounded-md"
                    required
                  />
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-1/2 p-2 border border-gray-300 rounded-md"
                    min={formData.startDate}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Start date - End date</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowGoalForm(false);
                  if (editingGoalId) {
                    setEditingGoalId(null);
                    resetForm();
                  }
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                {editingGoalId ? 'Update Goal' : 'Create Goal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Analytics Summary */}
      {dashboardData && storeGoals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Revenue</h3>
            <p className="text-2xl font-bold">${dashboardData.totalRevenue?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Units Sold</h3>
            <p className="text-2xl font-bold">{dashboardData.unitsSold || '0'}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Overall Profit</h3>
            <p className="text-2xl font-bold">${dashboardData.totalProfit?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {storeGoals.map(goal => (
          <GoalCard
            key={goal._id}
            goal={goal}
            onEdit={() => handleEditGoal(goal)}
            onDelete={() => handleDeleteGoal(goal._id)}
          />
        ))}
        
        {storeGoals.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">You haven't set any store-wide goals yet.</p>
            <button
              onClick={() => setShowGoalForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Create Your First Goal
            </button>
          </div>
        )}
      </div>
      
      {storeGoals.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleManualSync}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync with Latest Data
          </button>
        </div>
      )}
    </div>
  );
};

export default GoalsTracking;