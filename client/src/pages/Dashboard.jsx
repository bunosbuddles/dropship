import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDashboardData, fetchTodaysTasks } from '../redux/slices/dashboardSlice';
import { fetchGoals, updateGoalsWithMetrics, syncGoalsWithDashboard } from '../redux/slices/goalSlice';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StoreMetricsCard from '../components/StoreMetricsCard';
import TodaysTasksCard from '../components/TodaysTasksCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const dispatch = useDispatch();
  const dashboardData = useSelector((state) => state.dashboard.dashboardData);
  const todaysTasks = useSelector((state) => state.dashboard.todaysTasks);
  const loading = useSelector((state) => state.dashboard.loading);
  const error = useSelector((state) => state.dashboard.error);
  const goals = useSelector((state) => state.goals.goals);
  const goalsLoading = useSelector((state) => state.goals.loading);

  const [timeRange, setTimeRange] = useState('week'); // day, week, month, quarter, year
  const [goalsSynced, setGoalsSynced] = useState(false);
  const initialLoadCompleted = useRef(false);

  // Load dashboard data and goals
  useEffect(() => {
    // Prevent re-running this effect multiple times
    if (initialLoadCompleted.current) return;
    
    async function loadDashboardData() {
      try {
        console.log('Initial loading of dashboard and goals data');
        
        // First load the goals
        await dispatch(fetchGoals()).unwrap();
        
        // Then fetch dashboard data
        const dashboardResult = await dispatch(fetchDashboardData(timeRange)).unwrap();
        
        // Then fetch today's tasks
        await dispatch(fetchTodaysTasks()).unwrap();
        
        console.log('Dashboard data loaded successfully');
        
        // Sync goals with dashboard data
        if (dashboardResult) {
          // Create metrics object for goal syncing
          const metrics = {
            revenue: dashboardResult.totalRevenue || 0,
            sales: dashboardResult.unitsSold || 0
          };
          
          console.log('Initial update of goals with dashboard metrics:', metrics);
          
          // Only update the Redux store without triggering the backend sync
          dispatch(updateGoalsWithMetrics({ metrics }));
          
          initialLoadCompleted.current = true;
          setGoalsSynced(true);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        initialLoadCompleted.current = true; // Mark as completed even on error to prevent infinite retries
      }
    }
    
    loadDashboardData();
  }, [dispatch]); // No dependencies that would cause re-runs

  // Separate effect for time range changes
  useEffect(() => {
    // Skip the initial load since it's handled by the first effect
    if (!initialLoadCompleted.current) return;
    
    async function reloadOnTimeRangeChange() {
      console.log(`Reloading dashboard data for timeRange: ${timeRange}`);
      setGoalsSynced(false);
      
      try {
        // Just reload the dashboard data, don't touch goals yet
        const dashboardResult = await dispatch(fetchDashboardData(timeRange)).unwrap();
        
        // Then fetch today's tasks again
        await dispatch(fetchTodaysTasks()).unwrap();
        
        console.log('Dashboard data reloaded for new time range');
      } catch (error) {
        console.error('Error reloading dashboard data:', error);
      }
    }
    
    reloadOnTimeRangeChange();
  }, [dispatch, timeRange]);

  // This effect will run once to sync goals after dashboard data has changed due to timeRange change
  useEffect(() => {
    // Skip if we haven't loaded yet or already synced for this dashboard data
    if (!initialLoadCompleted.current || goalsSynced || !dashboardData) return;
    
    console.log('Syncing goals after dashboard data change');
    
    // Create metrics object for goal syncing
    const metrics = {
      revenue: dashboardData.totalRevenue || 0,
      sales: dashboardData.unitsSold || 0
    };
    
    // Only update the Redux store
    dispatch(updateGoalsWithMetrics({ metrics }));
    setGoalsSynced(true);
  }, [dispatch, dashboardData, goalsSynced]);

  if (loading || goalsLoading) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      {/* Time Range Selector */}
      <div className="mb-6">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              timeRange === 'day' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setTimeRange('day')}
          >
            Daily
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              timeRange === 'week' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setTimeRange('week')}
          >
            Past 7 Days
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              timeRange === 'month' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setTimeRange('month')}
          >
            Past 30 Days
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              timeRange === 'quarter' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setTimeRange('quarter')}
          >
            Past Quarter
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              timeRange === 'year' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setTimeRange('year')}
          >
            Past Year
          </button>
        </div>
      </div>

      {/* Store Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StoreMetricsCard
          title="Total Revenue"
          value={`$${dashboardData?.totalRevenue?.toFixed(2) || 0}`}
          icon="revenue"
          change={dashboardData?.revenueChange || 0}
          trend={dashboardData?.revenueTrend || 'neutral'}
        />
        <StoreMetricsCard
          title="Total Profit"
          value={`$${dashboardData?.totalProfit?.toFixed(2) || 0}`}
          icon="profit"
          change={dashboardData?.profitChange || 0}
          trend={dashboardData?.profitTrend || 'neutral'}
        />
        <StoreMetricsCard
          title="Units Sold"
          value={dashboardData?.unitsSold || 0}
          icon="units"
          change={dashboardData?.unitsChange || 0}
          trend={dashboardData?.unitsTrend || 'neutral'}
        />
      </div>

      {/* Revenue & Profit Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Revenue & Profit Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={dashboardData?.salesData || []}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#4F46E5" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="profit" stroke="#10B981" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Today's Tasks */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Content Tasks</h2>
        {todaysTasks && todaysTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaysTasks.map((task) => (
              <TodaysTasksCard key={task._id} task={task} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No content tasks scheduled for today.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;