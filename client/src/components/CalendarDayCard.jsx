import React from 'react';
import { format, isToday } from 'date-fns';

const CalendarDayCard = ({ day, entries, products, isSelected, onSelect }) => {
  // Check if the day has entries - the entries are already filtered in ContentCalendar.jsx
  const hasEntries = entries && entries.length > 0;
  
  // Get product names for display
  const getProductNames = (entry) => {
    if (!entry.products || entry.products.length === 0) {
      return [];
    }
    
    return entry.products.map(product => {
      // Check if product is already populated (is an object with name)
      if (product && typeof product === 'object' && product.name) {
        return product.name;
      }
      
      // If it's just an ID string, find the product in the products array
      if (typeof product === 'string') {
        const foundProduct = products.find(p => String(p._id) === String(product));
        return foundProduct ? foundProduct.name : 'Unknown Product';
      }
      
      // Fallback
      return 'Unknown Product';
    });
  };
  
  // Format date as "DD"
  const dayNumber = format(day, 'd');
  
  // Check if it's today
  const dayIsToday = isToday(day);
  
  // Check if it's a weekend
  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
  
  // Determine background color based on status
  const getBgColor = () => {
    if (isSelected) return 'bg-blue-50';
    if (dayIsToday) return 'bg-yellow-50';
    if (isWeekend) return 'bg-gray-50';
    return 'bg-white';
  };
  
  return (
    <div 
      className={`h-24 rounded-md p-1 border border-gray-200 overflow-hidden ${getBgColor()} ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${dayIsToday ? 'font-bold' : ''} cursor-pointer`}
      onClick={onSelect}
    >
      {/* Day number */}
      <div className={`text-right mb-1 ${dayIsToday ? 'text-blue-600' : ''}`}>
        {dayNumber}
      </div>
      
      {/* Content indicators */}
      {hasEntries && (
        <div className="overflow-hidden">
          {entries.map(entry => (
            <div key={entry._id} className="mb-1">
              <div className="flex flex-wrap">
                {getProductNames(entry).map((name, idx) => (
                  <span 
                    key={idx} 
                    className="px-1 text-xs bg-blue-100 text-blue-800 rounded mr-1 mb-1 truncate max-w-full"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarDayCard;