// routes/api/dashboard.js
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const impersonation = require('../../middleware/impersonation');
const Product = require('../../models/product');
const Goal = require('../../models/goal');

// Helper function to get date ranges
const getDateRange = (timeframe) => {
  const now = new Date();
  const startDate = new Date();
  
  switch (timeframe) {
    case 'day':
      // Set to beginning of current day
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      // Change from beginning of week to past 7 days
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      // Change from beginning of month to past 30 days
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'quarter':
      // Change from beginning of quarter to past 90 days
      startDate.setDate(now.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'year':
      // Change from beginning of year to past 365 days
      startDate.setDate(now.getDate() - 365);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      // Default to last 30 days
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
  }
  
  return {
    startDate,
    endDate: now
  };
};

// Helper function to format date for display
const formatDateForDisplay = (date, timeframe) => {
  if (timeframe === 'day') {
    // For daily view, format as hours (e.g. "9 AM")
    return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
  } else if (timeframe === 'week') {
    // For weekly view, format as day name (e.g. "Mon")
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else if (timeframe === 'month') {
    // For monthly view, format as day of month (e.g. "15")
    return date.toLocaleDateString('en-US', { day: 'numeric' });
  } else if (timeframe === 'quarter') {
    // For quarterly view, format as month abbreviation (e.g. "Jan")
    return date.toLocaleDateString('en-US', { month: 'short' });
  } else if (timeframe === 'year') {
    // For yearly view, format as month abbreviation (e.g. "Jan")
    return date.toLocaleDateString('en-US', { month: 'short' });
  }
  
  // Default fallback to ISO date
  return date.toISOString().split('T')[0];
};

// Helper to get the effective user ID (impersonated or real)
function getEffectiveUserId(req) {
  return req.impersonatedUserId || req.user.id;
}

// @route    GET api/dashboard
// @desc     Get dashboard overview data
// @access   Private
router.get('/', auth, impersonation, async (req, res) => {
  try {
    // Get timeframe from query (default to month)
    const timeframe = req.query.timeframe || 'month';
    const { startDate, endDate } = getDateRange(timeframe);
    
    // Get all products with sales history
    const products = await Product.find({ user: getEffectiveUserId(req) });
    
    // Filter sales data for current period
    const currentPeriodSales = [];
    products.forEach(product => {
      product.salesHistory.forEach(entry => {
        const saleDate = new Date(entry.date);
        if (saleDate >= startDate && saleDate <= endDate) {
          currentPeriodSales.push({
            productId: product._id,
            productName: product.name,
            date: saleDate,
            unitsSold: entry.unitsSold,
            revenue: entry.revenue,
            profit: entry.revenue - (product.unitCost * entry.unitsSold) - (product.fees * entry.unitsSold)
          });
        }
      });
    });

    // Calculate totals for current period from sales history
    const totalRevenue = currentPeriodSales.reduce((sum, sale) => sum + sale.revenue, 0);
    const totalUnitsSold = currentPeriodSales.reduce((sum, sale) => sum + sale.unitsSold, 0);
    const totalProfit = currentPeriodSales.reduce((sum, sale) => sum + sale.profit, 0);
    
    // Get previous period dates
    const prevPeriodLength = endDate.getTime() - startDate.getTime();
    const prevPeriodStart = new Date(startDate.getTime() - prevPeriodLength);
    const prevPeriodEnd = new Date(startDate);

    // Filter sales data for previous period
    const prevPeriodSales = [];
    products.forEach(product => {
      product.salesHistory.forEach(entry => {
        const saleDate = new Date(entry.date);
        if (saleDate >= prevPeriodStart && saleDate < prevPeriodEnd) {
          prevPeriodSales.push({
            productId: product._id,
            productName: product.name,
            date: saleDate,
            unitsSold: entry.unitsSold,
            revenue: entry.revenue,
            profit: entry.revenue - (product.unitCost * entry.unitsSold) - (product.fees * entry.unitsSold)
          });
        }
      });
    });

    // Calculate totals for previous period
    const prevTotalRevenue = prevPeriodSales.reduce((sum, sale) => sum + sale.revenue, 0);
    const prevTotalUnitsSold = prevPeriodSales.reduce((sum, sale) => sum + sale.unitsSold, 0);
    const prevTotalProfit = prevPeriodSales.reduce((sum, sale) => sum + sale.profit, 0);

    // Log the values for debugging
    console.log('Current period:', { totalRevenue, totalProfit, totalUnitsSold });
    console.log('Previous period:', { prevTotalRevenue, prevTotalProfit, prevTotalUnitsSold });

    // Check if we have enough data for meaningful comparisons
    const hasEnoughData = prevTotalRevenue > 0 || prevTotalProfit > 0 || prevTotalUnitsSold > 0;

    // Calculate change percentages
    let revenueChange = null; // Use null to indicate "no data" instead of 0
    let profitChange = null;
    let unitsChange = null;

    // Determine trends
    let revenueTrend = 'neutral';
    let profitTrend = 'neutral';
    let unitsTrend = 'neutral';

    // Only calculate changes if we have enough data
    if (hasEnoughData) {
      if (prevTotalRevenue > 0) {
        revenueChange = Math.round((totalRevenue - prevTotalRevenue) / prevTotalRevenue * 100);
        revenueTrend = revenueChange > 0 ? 'up' : (revenueChange < 0 ? 'down' : 'neutral');
      }
      
      if (prevTotalProfit > 0) {
        profitChange = Math.round((totalProfit - prevTotalProfit) / prevTotalProfit * 100);
        profitTrend = profitChange > 0 ? 'up' : (profitChange < 0 ? 'down' : 'neutral');
      }
      
      if (prevTotalUnitsSold > 0) {
        unitsChange = Math.round((totalUnitsSold - prevTotalUnitsSold) / prevTotalUnitsSold * 100);
        unitsTrend = unitsChange > 0 ? 'up' : (unitsChange < 0 ? 'down' : 'neutral');
      }
    }
    
    // Set up data grouping based on timeframe
    const salesByDate = {};
    
    // Determine the appropriate interval for grouping data
    let interval = 'day';
    
    if (timeframe === 'day') {
      interval = 'hour';
    } else if (timeframe === 'week') {
      interval = 'day';
    } else if (timeframe === 'month') {
      interval = 'day';
    } else if (timeframe === 'quarter') {
      interval = 'month';
    } else if (timeframe === 'year') {
      interval = 'month';
    }
    
    // Initialize with empty data for each interval in the range
    if (interval === 'hour') {
      // For daily view, create 24 hourly buckets
      for (let hour = 0; hour < 24; hour++) {
        const date = new Date(startDate);
        date.setHours(hour, 0, 0, 0);
        const dateStr = formatDateForDisplay(date, timeframe);
        salesByDate[dateStr] = {
          date: dateStr,
          revenue: 0,
          profit: 0,
          timestamp: date.getTime() // for sorting
        };
      }
    } else if (interval === 'day') {
      // For weekly or monthly view, create daily buckets
      const dayCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      for (let i = 0; i < dayCount; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = formatDateForDisplay(date, timeframe);
        salesByDate[dateStr] = {
          date: dateStr,
          revenue: 0,
          profit: 0,
          timestamp: date.getTime() // for sorting
        };
      }
    } else if (interval === 'month') {
      // For quarterly or yearly view, create monthly buckets
      const startMonth = startDate.getMonth();
      const endMonth = endDate.getMonth() + (endDate.getFullYear() - startDate.getFullYear()) * 12;
      
      for (let i = 0; i <= endMonth - startMonth; i++) {
        const date = new Date(startDate);
        date.setMonth(startMonth + i);
        const dateStr = formatDateForDisplay(date, timeframe);
        salesByDate[dateStr] = {
          date: dateStr,
          revenue: 0,
          profit: 0,
          timestamp: date.getTime() // for sorting
        };
      }
    }
    
    // Fill with actual data, grouping by the appropriate interval
    currentPeriodSales.forEach(sale => {
      let dateStr;
      
      if (interval === 'hour') {
        // Create a new date object and properly set minutes to zero
        const hourDate = new Date(sale.date);
        hourDate.setMinutes(0, 0, 0);
        dateStr = formatDateForDisplay(hourDate, timeframe);
      } 
      else if (interval === 'day') {
        dateStr = formatDateForDisplay(sale.date, timeframe);
      } 
      else if (interval === 'month') {
        dateStr = formatDateForDisplay(sale.date, timeframe);
      }
      
      if (!salesByDate[dateStr]) {
        // If somehow the date is outside our initialized range, create a bucket for it
        const date = new Date(sale.date);
        salesByDate[dateStr] = { 
          date: dateStr, 
          revenue: 0, 
          profit: 0,
          timestamp: date.getTime()
        };
      }
      
      salesByDate[dateStr].revenue += sale.revenue;
      salesByDate[dateStr].profit += sale.profit;
    });
    
    // Convert to array and sort by date
    let salesData = Object.values(salesByDate).sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove the timestamp property from the final output
    salesData = salesData.map(({ timestamp, ...rest }) => rest);
    
    // If we have no sales data but have totals from products, generate sample data
    if (salesData.length === 0 || salesData.every(day => day.revenue === 0)) {
      console.log('No sales history data available, generating sample data');
      
      // Generate sample data based on timeframe
      let daysToShow = 30; // default
      let sampleInterval = 'day';
      
      if (timeframe === 'day') {
        daysToShow = 24; // 24 hours
        sampleInterval = 'hour';
      } else if (timeframe === 'week') {
        daysToShow = 7; // 7 days
        sampleInterval = 'day';
      } else if (timeframe === 'month') {
        daysToShow = 30; // ~30 days
        sampleInterval = 'day';
      } else if (timeframe === 'quarter') {
        daysToShow = 3; // 3 months
        sampleInterval = 'month';
      } else if (timeframe === 'year') {
        daysToShow = 12; // 12 months
        sampleInterval = 'month';
      }
      
      // Calculate average values per time unit
      const avgRevenue = totalRevenue / daysToShow;
      const avgProfit = totalProfit / daysToShow;
      
      // Track totals to ensure sum matches
      let runningRevenue = 0;
      let runningProfit = 0;
      
      salesData = [];
      
      if (sampleInterval === 'hour') {
        for (let i = 0; i < 24; i++) {
          const date = new Date(startDate);
          date.setHours(i, 0, 0, 0);
          
          let isLastItem = i === 23;
          let itemRevenue, itemProfit;
          
          if (isLastItem) {
            itemRevenue = totalRevenue - runningRevenue;
            itemProfit = totalProfit - runningProfit;
          } else {
            const varianceFactor = 0.85 + (Math.random() * 0.3);
            itemRevenue = Math.round(avgRevenue * varianceFactor);
            itemProfit = Math.round(avgProfit * varianceFactor);
            
            itemProfit = Math.min(itemProfit, itemRevenue * 0.7);
            
            runningRevenue += itemRevenue;
            runningProfit += itemProfit;
          }
          
          salesData.push({
            date: formatDateForDisplay(date, timeframe),
            revenue: itemRevenue,
            profit: itemProfit
          });
        }
      } else if (sampleInterval === 'day') {
        for (let i = 0; i < daysToShow; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          
          let isLastItem = i === daysToShow - 1;
          let itemRevenue, itemProfit;
          
          if (isLastItem) {
            itemRevenue = totalRevenue - runningRevenue;
            itemProfit = totalProfit - runningProfit;
          } else {
            const varianceFactor = 0.85 + (Math.random() * 0.3);
            itemRevenue = Math.round(avgRevenue * varianceFactor);
            itemProfit = Math.round(avgProfit * varianceFactor);
            
            itemProfit = Math.min(itemProfit, itemRevenue * 0.7);
            
            runningRevenue += itemRevenue;
            runningProfit += itemProfit;
          }
          
          salesData.push({
            date: formatDateForDisplay(date, timeframe),
            revenue: itemRevenue,
            profit: itemProfit
          });
        }
      } else { // month
        for (let i = 0; i < daysToShow; i++) {
          const date = new Date(startDate);
          date.setMonth(startDate.getMonth() + i);
          
          let isLastItem = i === daysToShow - 1;
          let itemRevenue, itemProfit;
          
          if (isLastItem) {
            itemRevenue = totalRevenue - runningRevenue;
            itemProfit = totalProfit - runningProfit;
          } else {
            const varianceFactor = 0.85 + (Math.random() * 0.3);
            itemRevenue = Math.round(avgRevenue * varianceFactor);
            itemProfit = Math.round(avgProfit * varianceFactor);
            
            itemProfit = Math.min(itemProfit, itemRevenue * 0.7);
            
            runningRevenue += itemRevenue;
            runningProfit += itemProfit;
          }
          
          salesData.push({
            date: formatDateForDisplay(date, timeframe),
            revenue: itemRevenue,
            profit: itemProfit
          });
        }
      }
    }
    
    // Ensure chart data matches the totals
    const revenueSum = salesData.reduce((sum, item) => sum + item.revenue, 0);
    const profitSum = salesData.reduce((sum, item) => sum + item.profit, 0);

    // Check if we need to scale the data
    if (Math.abs(revenueSum - totalRevenue) > 1 || Math.abs(profitSum - totalProfit) > 1) {
      console.log('Adjusting chart data to match totals');
      console.log(`Revenue: Chart sum=${revenueSum}, Total=${totalRevenue}, Diff=${revenueSum - totalRevenue}`);
      console.log(`Profit: Chart sum=${profitSum}, Total=${totalProfit}, Diff=${profitSum - totalProfit}`);
      
      // We'll adjust the data to match the totals while preserving the curve shape
      const revenueScale = revenueSum > 0 ? totalRevenue / revenueSum : 1;
      const profitScale = profitSum > 0 ? totalProfit / profitSum : 1;
      
      // Create new scaled data set
      const scaledData = [];
      let scaledRevenueSum = 0;
      let scaledProfitSum = 0;
      
      for (let i = 0; i < salesData.length; i++) {
        const isLast = i === salesData.length - 1;
        let scaledRevenue, scaledProfit;
        
        if (isLast) {
          // Make the last item ensure exact total
          scaledRevenue = totalRevenue - scaledRevenueSum;
          scaledProfit = totalProfit - scaledProfitSum;
        } else {
          // Scale other items
          scaledRevenue = Math.round(salesData[i].revenue * revenueScale);
          scaledProfit = Math.round(salesData[i].profit * profitScale);
          
          scaledRevenueSum += scaledRevenue;
          scaledProfitSum += scaledProfit;
        }
        
        scaledData.push({
          date: salesData[i].date,
          revenue: scaledRevenue,
          profit: scaledProfit
        });
      }
      
      // Replace the original data with the scaled data
      salesData = scaledData;
      
      // Verify our fix worked
      const newRevenueSum = salesData.reduce((sum, item) => sum + item.revenue, 0);
      const newProfitSum = salesData.reduce((sum, item) => sum + item.profit, 0);
      console.log(`After scaling: Revenue sum=${newRevenueSum}, Profit sum=${newProfitSum}`);
    }
    
    // Return dashboard data
    res.json({
      totalRevenue,
      totalProfit,
      unitsSold: totalUnitsSold,
      revenueChange,
      profitChange,
      unitsChange,
      revenueTrend,
      profitTrend,
      unitsTrend,
      salesData,
      productCount: products.length,
      timeframe, // Include the timeframe in the response
      topProducts: products
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 5)
        .map(p => ({
          id: p._id,
          name: p.name,
          revenue: p.totalSales,
          profit: p.totalSales - (p.unitCost * p.unitsSold) - (p.fees * p.unitsSold)
        }))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/dashboard/today-tasks
// @desc     Get today's content tasks
// @access   Private
router.get('/today-tasks', auth, async (req, res) => {
  try {
    // Return empty array since we no longer have calendar entries
    return res.json([]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/dashboard/stats/:timeframe
// @desc     Get statistics for a specific timeframe
// @access   Private
router.get('/stats/:timeframe', auth, async (req, res) => {
  try {
    const { timeframe } = req.params;
    const { startDate, endDate } = getDateRange(timeframe);
    
    // Get products
    const products = await Product.find({ user: getEffectiveUserId(req) });
    
    // Filter sales data for timeframe
    const periodSales = [];
    products.forEach(product => {
      product.salesHistory.forEach(entry => {
        const saleDate = new Date(entry.date);
        if (saleDate >= startDate && saleDate <= endDate) {
          periodSales.push({
            productId: product._id,
            date: saleDate,
            unitsSold: entry.unitsSold,
            revenue: entry.revenue,
            profit: entry.revenue - (product.unitCost * entry.unitsSold) - (product.fees * entry.unitsSold)
          });
        }
      });
    });

    // Calculate metrics from filtered data
    const totalRevenue = periodSales.reduce((sum, sale) => sum + sale.revenue, 0);
    const totalUnitsSold = periodSales.reduce((sum, sale) => sum + sale.unitsSold, 0);
    const totalProfit = periodSales.reduce((sum, sale) => sum + sale.profit, 0);
    
    // Get product categories based on sourcing status
    const productsByStatus = {};
    products.forEach(product => {
      if (!productsByStatus[product.sourcingStatus]) {
        productsByStatus[product.sourcingStatus] = 0;
      }
      productsByStatus[product.sourcingStatus]++;
    });
    
    // Get goals for the period
    const goals = await Goal.find({
      user: getEffectiveUserId(req),
      endDate: { $gte: startDate }
    });
    
    // Calculate goal progress
    const revenueGoals = goals.filter(goal => goal.type === 'revenue');
    const salesGoals = goals.filter(goal => goal.type === 'sales');
    
    const revenueGoalProgress = revenueGoals.length > 0 
      ? Math.min(100, (totalRevenue / revenueGoals[0].targetAmount) * 100) 
      : null;
    
    const salesGoalProgress = salesGoals.length > 0 
      ? Math.min(100, (totalUnitsSold / salesGoals[0].targetAmount) * 100) 
      : null;
    
    res.json({
      timeframe,
      period: {
        start: startDate,
        end: endDate
      },
      metrics: {
        revenue: totalRevenue,
        profit: totalProfit,
        unitsSold: totalUnitsSold,
        profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0,
        averageOrderValue: totalUnitsSold > 0 ? (totalRevenue / totalUnitsSold).toFixed(2) : 0
      },
      products: {
        total: products.length,
        byStatus: productsByStatus
      },
      goals: {
        revenue: {
          goal: revenueGoals.length > 0 ? revenueGoals[0].targetAmount : null,
          current: totalRevenue,
          progress: revenueGoalProgress
        },
        sales: {
          goal: salesGoals.length > 0 ? salesGoals[0].targetAmount : null,
          current: totalUnitsSold,
          progress: salesGoalProgress
        }
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;