import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchCalendarEntries, 
  addCalendarEntry, 
  updateCalendarEntry, 
  deleteCalendarEntry 
} from '../redux/slices/calendarSlice';
import { fetchProducts } from '../redux/slices/productSlice';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import CalendarDayCard from '../components/CalendarDayCard';

const ContentCalendar = () => {
  const dispatch = useDispatch();
  const { entries, loading: calendarLoading, error: calendarError } = useSelector((state) => state.calendar);
  const { products, loading: productsLoading, error: productsError } = useSelector((state) => state.products);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState(null);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Get first and last day of the month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Get all days in the month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // First load products, then calendar entries
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading products first...');
        await dispatch(fetchProducts()).unwrap();
        
        console.log('Now loading calendar entries...');
        await dispatch(fetchCalendarEntries()).unwrap();
        
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, [dispatch, currentDate.getMonth(), currentDate.getFullYear()]);

  // Find entry for the selected date - using string comparison
  useEffect(() => {
    const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
    console.log('Looking for entry with date:', selectedDateString);
    
    const entryForSelectedDate = entries.find(entry => entry.date === selectedDateString);
    
    if (entryForSelectedDate) {
      console.log('Found entry for selected date:', entryForSelectedDate);
      // Store the products array as is - could be objects or IDs
      setSelectedProducts(entryForSelectedDate.products);
      setNotes(entryForSelectedDate.notes || '');
      setIsEditing(true);
      setCurrentEntryId(entryForSelectedDate._id);
    } else {
      setSelectedProducts([]);
      setNotes('');
      setIsEditing(false);
      setCurrentEntryId(null);
    }
  }, [selectedDate, entries]);

  const handleProductSelect = (e) => {
    const productId = e.target.value;
    if (productId && !selectedProducts.includes(productId)) {
      console.log('Adding product ID to selection:', productId);
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const handleRemoveProduct = (productId) => {
    console.log('Removing product ID from selection:', productId);
    
    // First update the local state
    const updatedProducts = selectedProducts.filter(item => {
      // Handle both object and string cases
      if (typeof item === 'object' && item._id) {
        return String(item._id) !== String(productId);
      }
      return String(item) !== String(productId);
    });
    
    // Update the local state
    setSelectedProducts(updatedProducts);
    
    // If we're editing an existing entry, save the changes immediately
    if (isEditing && currentEntryId) {
      // Format date as string
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // Extract product IDs whether they're objects or strings
      const formattedProducts = updatedProducts.map(product => {
        if (typeof product === 'object' && product._id) {
          return String(product._id);
        }
        return String(product);
      });
      
      console.log('Auto-saving after product removal. Updated products:', formattedProducts);
      
      const entryData = {
        date: formattedDate,
        products: formattedProducts,
        notes: notes || ''
      };
      
      // Update the entry in the database
      dispatch(updateCalendarEntry({ 
        id: currentEntryId, 
        entryData 
      }))
        .unwrap()
        .then((updatedEntry) => {
          console.log('Auto-update after product removal successful:', updatedEntry);
          // Refresh calendar entries after update
          return dispatch(fetchCalendarEntries());
        })
        .catch((error) => {
          console.error('Auto-update after product removal failed:', error);
          alert('Failed to update entry after removing product: ' + (error.message || 'Unknown error'));
        });
    }
  };

  const handleSaveEntry = () => {
    try {
      // Format date as string
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      console.log('Saving entry with date:', formattedDate);
      console.log('Is editing:', isEditing);
      console.log('Current entry ID:', currentEntryId);
      
      // Extract product IDs whether they're objects or strings
      const formattedProducts = selectedProducts.map(product => {
        if (typeof product === 'object' && product._id) {
          return String(product._id);
        }
        return String(product);
      });
      
      console.log('Selected products (formatted):', formattedProducts);
      
      const entryData = {
        date: formattedDate,
        products: formattedProducts,
        notes: notes || ''
      };
      
      console.log('Entry data being sent:', JSON.stringify(entryData));

      if (isEditing && currentEntryId) {
        console.log('Updating entry with ID:', currentEntryId);
        
        // Add more verbose error handling and logging
        dispatch(updateCalendarEntry({ 
          id: currentEntryId, 
          entryData 
        }))
          .unwrap()
          .then((updatedEntry) => {
            console.log('Update successful:', updatedEntry);
            // Refresh calendar entries after update
            return dispatch(fetchCalendarEntries());
          })
          .catch((error) => {
            console.error('Update failed:', error);
            alert('Failed to update entry: ' + (error.message || 'Unknown error'));
          });
      } else {
        console.log('Adding new entry');
        dispatch(addCalendarEntry(entryData))
          .unwrap()
          .then(() => {
            // Refresh calendar entries after adding
            dispatch(fetchCalendarEntries());
          })
          .catch((error) => {
            console.error('Add failed:', error);
            alert('Failed to add entry: ' + (error.message || 'Unknown error'));
          });
      }
    } catch (error) {
      console.error('Error in handleSaveEntry:', error);
      alert('Error processing entry: ' + error.message);
    }
  };

  const handleDeleteEntry = () => {
    if (isEditing && currentEntryId) {
      dispatch(deleteCalendarEntry(currentEntryId))
        .unwrap()
        .then(() => {
          // Refresh calendar entries after delete
          dispatch(fetchCalendarEntries());
          
          setSelectedProducts([]);
          setNotes('');
          setIsEditing(false);
          setCurrentEntryId(null);
        })
        .catch((error) => {
          console.error('Delete failed:', error);
          alert('Failed to delete entry: ' + (error.message || 'Unknown error'));
        });
    }
  };

  // Combined loading state for both products and calendar
  const isLoading = productsLoading || calendarLoading || !dataLoaded;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <button 
        className="px-4 py-2 bg-gray-300 text-sm rounded absolute top-4 right-4"
        onClick={() => setShowAllEntries(!showAllEntries)}
      >
        {showAllEntries ? 'Hide Debug' : 'Show All Entries (Debug)'}
      </button>
      
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Content Calendar</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Month View */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <div className="flex space-x-2">
                <button 
                  className="px-4 py-2 bg-gray-200 rounded-md"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                >
                  Previous
                </button>
                <button
                  className="px-4 py-2 bg-gray-200 rounded-md"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </button>
                <button 
                  className="px-4 py-2 bg-gray-200 rounded-md"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                >
                  Next
                </button>
              </div>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day names */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-medium py-2">
                  {day}
                </div>
              ))}
              
              {/* Empty spaces for days before the start of the month */}
              {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                <div key={`empty-start-${index}`} className="h-24 bg-gray-50 rounded-md"></div>
              ))}
              
              {/* Days of the month */}
              {daysInMonth.map((day) => {
                // Find any entries for this day using string comparison
                const dayString = format(day, 'yyyy-MM-dd');
                const dayEntries = entries.filter(entry => entry.date === dayString);
                
                return (
                  <CalendarDayCard 
                    key={format(day, 'yyyy-MM-dd')}
                    day={day}
                    entries={dayEntries}
                    products={products}
                    isSelected={isSameDay(day, selectedDate)}
                    onSelect={() => setSelectedDate(day)}
                  />
                );
              })}
              
              {/* Empty spaces for days after the end of the month */}
              {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
                <div key={`empty-end-${index}`} className="h-24 bg-gray-50 rounded-md"></div>
              ))}
            </div>
            
            {/* Debug section to show all entries */}
            {showAllEntries && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-bold mb-2">All Available Entries (Debug View)</h3>
                <div className="mb-2">
                  <p><strong>Products count:</strong> {products.length}</p>
                  <p><strong>Entries count:</strong> {entries.length}</p>
                </div>
                {entries.length === 0 ? (
                  <p>No entries found in Redux store</p>
                ) : (
                  <ul className="list-disc pl-5">
                    {entries.map(entry => (
                      <li key={entry._id} className="mb-1">
                        Date: {entry.date}, Products: {entry.products.length}, ID: {entry._id}
                        <button 
                          className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
                          onClick={() => {
                            const [year, month, day] = entry.date.split('-').map(Number);
                            const entryDate = new Date(year, month - 1, day);
                            setCurrentDate(entryDate);
                            setSelectedDate(entryDate);
                          }}
                        >
                          Go to Date
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Day Detail & Entry Form */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              {format(selectedDate, 'MMMM d, yyyy')}
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Products for Content
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md"
                onChange={handleProductSelect}
                value=""
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Selected Products */}
            {selectedProducts.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Selected Products
                </h3>
                <div className="space-y-2">
                  {selectedProducts.map((productItem) => {
                    // Handle both object and string ID formats
                    const productId = typeof productItem === 'object' && productItem._id 
                      ? productItem._id 
                      : productItem;
                      
                    // Find the product by ID
                    const product = products.find(p => String(p._id) === String(productId));
                    
                    // If we have a product object directly
                    const displayName = typeof productItem === 'object' && productItem.name
                      ? productItem.name
                      : (product ? product.name : `Unknown Product (${String(productId).substring(0, 6)}...)`);
                    
                    return (
                      <div 
                        key={productId}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
                      >
                        <span>{displayName}</span>
                        <button 
                          className="text-red-500"
                          onClick={() => handleRemoveProduct(productId)}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
                onClick={handleSaveEntry}
              >
                {isEditing ? 'Update' : 'Save'}
              </button>
              
              {isEditing && (
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md"
                  onClick={handleDeleteEntry}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCalendar;