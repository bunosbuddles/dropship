import React from 'react';
import { format, isToday } from 'date-fns';

const ContentIdeasDayCard = ({ day, contentIdeas, isSelected, onSelect }) => {
  // Format date as "DD"
  const dayNumber = format(day, 'd');
  
  // Check if it's today
  const dayIsToday = isToday(day);
  
  // Check if it's a weekend
  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
  
  // Check if there are content ideas for this day
  const hasContentIdeas = contentIdeas && contentIdeas.length > 0;
  
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
      {hasContentIdeas && (
        <div className="overflow-hidden">
          {contentIdeas.map(idea => (
            <div key={idea._id} className="mb-1">
              <div className="flex items-center">
                <span className="px-1 text-xs bg-purple-100 text-purple-800 rounded mr-1 truncate max-w-full flex-1">
                  {idea.videoConcept}
                </span>
                {idea.syncToGoogle && (
                  <span className="flex-shrink-0 w-3 h-3 bg-green-400 rounded-full" title="Synced to Google Calendar"></span>
                )}
              </div>
            </div>
          ))}
          {contentIdeas.length > 2 && (
            <div className="text-xs text-gray-500 italic">+{contentIdeas.length - 2} more</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentIdeasDayCard; 