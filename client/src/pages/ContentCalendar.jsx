import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isValid, parseISO } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchProducts } from '../redux/slices/productSlice';
import { fetchContentIdeasForCalendar } from '../redux/slices/contentIdeasCalendarSlice';
import ContentIdeasDayCard from '../components/content/ContentIdeasDayCard';
import ContentIdeasDayDetail from '../components/content/ContentIdeasDayDetail';

const ContentCalendar = () => {
  const dispatch = useDispatch();
  const { products, loading: productsLoading } = useSelector((state) => state.products);
  const { contentIdeas, loading: contentIdeasLoading } = useSelector((state) => state.contentIdeasCalendar);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedContentDate, setSelectedContentDate] = useState(null);

  // Get first and last day of the month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Get all days in the month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate padding for the first week
  const firstDayOfWeek = monthStart.getDay(); // 0 (Sun) - 6 (Sat)
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`pad-${i}`}></div>);

  // Load products and content ideas
  useEffect(() => {
    const loadData = async () => {
      try {
        await dispatch(fetchProducts()).unwrap();
        await dispatch(fetchContentIdeasForCalendar()).unwrap();
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, [dispatch, currentDate.getMonth(), currentDate.getFullYear()]);

  // Get content ideas for a specific day - with error handling for invalid dates
  const getContentIdeasForDay = (day) => {
    // Format the calendar day using local timezone
    const formattedDay = format(day, 'yyyy-MM-dd');
    
    return contentIdeas.filter(idea => {
      try {
        // Use filmDate for calendar mapping
        if (!idea.filmDate) return false;
        let ideaDate;
        if (typeof idea.filmDate === 'string') {
          ideaDate = parseISO(idea.filmDate);
        } else {
          ideaDate = new Date(idea.filmDate);
        }
        if (!isValid(ideaDate)) return false;
        const year = ideaDate.getUTCFullYear();
        const month = ideaDate.getUTCMonth();
        const dayOfMonth = ideaDate.getUTCDate();
        const normalizedIdeaDate = new Date(year, month, dayOfMonth);
        const formattedIdeaDate = format(normalizedIdeaDate, 'yyyy-MM-dd');
        return formattedIdeaDate === formattedDay;
      } catch (error) {
        console.error('Error processing filmDate for content idea:', idea._id, error);
        return false;
      }
    });
  };

  // Handle content idea day selection
  const handleContentDateSelect = (day) => {
    setSelectedContentDate(day);
    setShowDetailModal(true);
  };

  // Combined loading state
  const isLoading = productsLoading || contentIdeasLoading || !dataLoaded;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
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
            
            {/* Content Ideas Calendar */}
            <div>
              <div className="grid grid-cols-7 gap-1">
                {/* Day of week headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="h-10 flex items-center justify-center font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                
                {/* Render content idea day cards */}
                {/* Add padding for the first week */}
                {paddingDays}
                {daysInMonth.map((day) => (
                  <ContentIdeasDayCard
                    key={day.toISOString()}
                    day={day}
                    contentIdeas={getContentIdeasForDay(day)}
                    isSelected={selectedContentDate && isSameDay(day, selectedContentDate)}
                    onSelect={() => handleContentDateSelect(day)}
                  />
                ))}
              </div>
              
              {/* Detail modal for selected date */}
              {showDetailModal && selectedContentDate && (
                <ContentIdeasDayDetail
                  date={selectedContentDate}
                  contentIdeas={getContentIdeasForDay(selectedContentDate)}
                  onClose={() => setShowDetailModal(false)}
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Right Side Information Panel */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Content Calendar</h2>
            <p className="text-gray-700 mb-4">
              This calendar displays your content ideas. Click on a day to view details or navigate to the content dashboard.
            </p>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-700 mb-2">Quick Tips:</h3>
              <ul className="list-disc pl-5 text-blue-800 text-sm">
                <li className="mb-1">Click on any day with content ideas to view details</li>
                <li className="mb-1">Green indicators show ideas synced with Google Calendar</li>
                <li className="mb-1">Add new content ideas from the Content Dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCalendar;