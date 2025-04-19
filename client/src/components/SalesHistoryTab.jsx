import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addProductSales, updateProductSales, deleteProductSales } from '../redux/slices/productSlice';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const SalesHistoryTab = ({ product }) => {
  const dispatch = useDispatch();
  const [salesHistory, setSalesHistory] = useState(product.salesHistory || []);
  
  // Get today's date in YYYY-MM-DD format
  const getTodayLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [formData, setFormData] = useState({
    date: getTodayLocalDate(),
    unitsSold: '',
    revenue: '',
    notes: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [useCustomRevenue, setUseCustomRevenue] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    unitsSold: '',
    revenue: '',
    notes: ''
  });
  const [editUseCustomRevenue, setEditUseCustomRevenue] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [chartData, setChartData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  
  // Update salesHistory when product changes
  useEffect(() => {
    if (product && product.salesHistory) {
      const history = [...product.salesHistory];
      
      // Sort by date (oldest to newest) for chart display
      history.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setSalesHistory(product.salesHistory);
      
      // Format data for the chart
      const formattedData = history.map(sale => {
        const date = new Date(sale.date);
        return {
          date: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substr(2, 2)}`,
          revenue: parseFloat(sale.revenue.toFixed(2)),
          fullDate: date // Keep the full date for sorting
        };
      });
      
      setChartData(formattedData);
      
      // Calculate total revenue
      const total = history.reduce((sum, sale) => sum + sale.revenue, 0);
      setTotalRevenue(parseFloat(total.toFixed(2)));
    }
  }, [product]);

  // Auto-calculate revenue based on unit price
  useEffect(() => {
    if (!useCustomRevenue && formData.unitsSold && product.basePrice) {
      const calculatedRevenue = (
        parseFloat(formData.unitsSold) * product.basePrice
      ).toFixed(2);
      
      setFormData(prev => ({
        ...prev,
        revenue: calculatedRevenue
      }));
    }
  }, [formData.unitsSold, product.basePrice, useCustomRevenue]);
  
  // Auto-calculate revenue in edit mode
  useEffect(() => {
    if (!editUseCustomRevenue && editFormData.unitsSold && product.basePrice) {
      const calculatedRevenue = (
        parseFloat(editFormData.unitsSold) * product.basePrice
      ).toFixed(2);
      
      setEditFormData(prev => ({
        ...prev,
        revenue: calculatedRevenue
      }));
    }
  }, [editFormData.unitsSold, product.basePrice, editUseCustomRevenue]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If manually changing revenue, enable custom revenue mode
    if (name === 'revenue') {
      setUseCustomRevenue(true);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    
    // If manually changing revenue, enable custom revenue mode
    if (name === 'revenue') {
      setEditUseCustomRevenue(true);
    }
    
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get the best identifier to use for a sale record
  const getSaleIdentifier = (sale) => {
    // Prefer MongoDB's _id for existing records (they all have this)
    return sale._id ? sale._id.toString() : (sale.transactionId || null);
  };

  const startEditing = (sale) => {
    // Get the identifier to use (either _id or transactionId)
    const idToUse = getSaleIdentifier(sale);
    
    if (!idToUse) {
      setErrorMessage('This sales record cannot be edited because it has no identifier.');
      return;
    }
    
    // Convert date to ISO string and extract just the date part (YYYY-MM-DD)
    const saleDate = new Date(sale.date);
    const formattedDate = saleDate.toISOString().split('T')[0];
    
    setEditFormData({
      date: formattedDate,
      unitsSold: sale.unitsSold,
      revenue: sale.revenue,
      notes: sale.notes || ''
    });
    
    setEditingId(idToUse);
    setEditMode(true);
    setEditUseCustomRevenue(false);
    setErrorMessage('');
  };

  const cancelEditing = () => {
    setEditMode(false);
    setEditingId(null);
    setEditFormData({
      date: '',
      unitsSold: '',
      revenue: '',
      notes: ''
    });
    setErrorMessage('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;
    
    setFormSubmitting(true);
    setErrorMessage('');

    try {
      // Create date from the form input
      const selectedDate = new Date(formData.date);
      
      // Add 24 hours to account for timezone issues
      selectedDate.setHours(24, 0, 0, 0);
      
      const salesData = {
        date: selectedDate,
        unitsSold: parseInt(formData.unitsSold, 10),
        revenue: parseFloat(formData.revenue),
        notes: formData.notes,
        // Generate a transaction ID on the client side
        transactionId: new Date().getTime().toString()
      };

      await dispatch(addProductSales({
        productId: product._id,
        salesData
      })).unwrap();

      // Reset form but keep today's date
      setFormData({
        date: getTodayLocalDate(),
        unitsSold: '',
        revenue: '',
        notes: ''
      });
      setUseCustomRevenue(false);
    } catch (error) {
      console.error('Failed to add sales:', error);
      setErrorMessage('Failed to add sales: ' + (error.message || 'Please try again.'));
    } finally {
      setFormSubmitting(false);
    }
  };
  
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;
    
    setFormSubmitting(true);
    setErrorMessage('');

    try {
      if (!editingId) {
        throw new Error('No identifier for update');
      }
      
      // Create date from the form input
      const selectedDate = new Date(editFormData.date);
      
      // Add 24 hours to account for timezone issues
      selectedDate.setHours(24, 0, 0, 0);
      
      const salesData = {
        date: selectedDate,
        unitsSold: parseInt(editFormData.unitsSold, 10),
        revenue: parseFloat(editFormData.revenue),
        notes: editFormData.notes || ''
      };

      await dispatch(updateProductSales({
        productId: product._id,
        transactionId: editingId, // Send the ID (_id or transactionId) we stored
        salesData
      })).unwrap();

      // Reset form and exit edit mode
      setEditMode(false);
      setEditingId(null);
      setEditFormData({
        date: '',
        unitsSold: '',
        revenue: '',
        notes: ''
      });
      setEditUseCustomRevenue(false);
    } catch (error) {
      console.error('Failed to update sales:', error);
      setErrorMessage('Failed to update sales: ' + (error.message || 'Please try again.'));
    } finally {
      setFormSubmitting(false);
    }
  };
  
  const handleDelete = async (idToDelete) => {
    if (!idToDelete) {
      setErrorMessage('This sales record cannot be deleted because it has no identifier.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this sales record? This action cannot be undone.')) {
      return;
    }
    
    setErrorMessage('');
    
    try {
      await dispatch(deleteProductSales({
        productId: product._id,
        transactionId: idToDelete // Use the ID (_id or transactionId)
      })).unwrap();
    } catch (error) {
      console.error('Failed to delete sales:', error);
      setErrorMessage('Failed to delete sales record: ' + (error.message || 'Please try again.'));
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-semibold">{label}</p>
          <p className="text-emerald-600">
            Revenue: ${payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Error Message Display */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{errorMessage}</p>
        </div>
      )}
      
      {/* Add Sales Form */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add Sales</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                max={getTodayLocalDate()}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Units Sold
              </label>
              <input
                type="number"
                name="unitsSold"
                value={formData.unitsSold}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                min="1"
                required
              />
            </div>
            
            <div>
              <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                <span>Revenue</span>
                <span className="text-xs text-blue-600">
                  {useCustomRevenue ? 
                    <button 
                      type="button" 
                      className="underline"
                      onClick={() => {
                        setUseCustomRevenue(false);
                        if (formData.unitsSold) {
                          setFormData(prev => ({
                            ...prev,
                            revenue: (parseFloat(formData.unitsSold) * product.basePrice).toFixed(2)
                          }));
                        }
                      }}
                    >
                      Auto-calculate
                    </button> 
                    : 
                    <span>Auto-calculated</span>
                  }
                </span>
              </label>
              <input
                type="number"
                name="revenue"
                value={formData.revenue}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                step="0.01"
                min="0"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g., Marketing campaign, Holiday sale"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
              disabled={formSubmitting}
            >
              {formSubmitting ? 'Adding...' : 'Add Sales Record'}
            </button>
          </div>
        </form>
      </div>

      {/* Edit Sales Form (conditionally rendered) */}
      {editMode && (
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mb-8">
          <h2 className="text-xl font-semibold mb-4">Edit Sales Record</h2>
          
          <form onSubmit={handleUpdate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={editFormData.date}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Units Sold
                </label>
                <input
                  type="number"
                  name="unitsSold"
                  value={editFormData.unitsSold}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                  <span>Revenue</span>
                  <span className="text-xs text-blue-600">
                    {editUseCustomRevenue ? 
                      <button 
                        type="button" 
                        className="underline"
                        onClick={() => {
                          setEditUseCustomRevenue(false);
                          if (editFormData.unitsSold) {
                            setEditFormData(prev => ({
                              ...prev,
                              revenue: (parseFloat(editFormData.unitsSold) * product.basePrice).toFixed(2)
                            }));
                          }
                        }}
                      >
                        Auto-calculate
                      </button> 
                      : 
                      <span>Auto-calculated</span>
                    }
                  </span>
                </label>
                <input
                  type="number"
                  name="revenue"
                  value={editFormData.revenue}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  name="notes"
                  value={editFormData.notes}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Marketing campaign, Holiday sale"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
                onClick={cancelEditing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-600 text-white rounded-md"
                disabled={formSubmitting}
              >
                {formSubmitting ? 'Updating...' : 'Update Record'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Sales History Chart */}
      {chartData.length > 0 && (
        <div className="mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Revenue Over Time</h2>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-600">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 20,
                    bottom: 30,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#666' }}
                    tickLine={{ stroke: '#666' }}
                    axisLine={{ stroke: '#666' }}
                  />
                  <YAxis 
                    tick={{ fill: '#666' }}
                    tickLine={{ stroke: '#666' }}
                    axisLine={{ stroke: '#666' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue" 
                    stroke="#10b981" 
                    fill="url(#colorRevenue)" 
                    strokeWidth={2}
                    activeDot={{ r: 6, stroke: '#047857', strokeWidth: 2, fill: '#ffffff' }}
                  />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Sales History Table */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Sales History</h2>
        
        {salesHistory && salesHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units Sold
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {salesHistory.map((sale, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(sale.date)}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {sale.unitsSold}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${sale.revenue.toFixed(2)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900">
                        {sale.notes}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditing(sale)}
                          className="text-blue-600 hover:text-blue-800"
                          disabled={editMode}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(getSaleIdentifier(sale))}
                          className="text-red-600 hover:text-red-800"
                          disabled={editMode}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg border border-gray-200 text-center mb-6">
            <p className="text-gray-500">No sales history found. Add your first sales record above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesHistoryTab;