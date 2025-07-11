import React from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useAxiosWithImpersonation } from '../../utils/axiosWithImpersonation';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const ContentIdeaCard = ({ idea, onEdit, onDelete, onToggleSync, expanded, onToggleExpand }) => {
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Posted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Edited':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBgClass = (status) => {
    switch(status) {
      case 'Posted':
        return 'bg-green-100';
      case 'Edited':
        return 'bg-yellow-100';
      default:
        return 'bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    // Parse the date and ensure it's treated as UTC
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      timeZone: 'UTC' // Force UTC interpretation to avoid timezone shifts
    });
  };

  const axiosInstance = useAxiosWithImpersonation();

  const handleSyncToggle = async () => {
    try {
      await axiosInstance.put(`${API_BASE_URL}/api/google-calendar/toggle-sync/${idea._id}`);
      onToggleSync(idea._id);
    } catch (err) {
      console.error('Error toggling sync:', err);
    }
  };

  return (
    <div 
      id={`content-idea-${idea._id}`}
      className={`rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 ${getStatusBgClass(idea.status)}`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(idea.status)}`}>
            {idea.status}
          </span>
          <span className="text-sm text-gray-500 font-medium">
            {formatDate(idea.postDateNeeded)}
          </span>
        </div>
        {/* New field order display */}
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Film Date</h4>
          <p className="text-sm text-gray-600">{idea.filmDate ? formatDate(idea.filmDate) : ''}</p>
        </div>
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Post Date</h4>
          <p className="text-sm text-gray-600">{idea.postDateNeeded ? formatDate(idea.postDateNeeded) : ''}</p>
        </div>
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Text Hook</h4>
          <p className="text-sm text-gray-600">{idea.textHook || ''}</p>
        </div>
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Visual Hook</h4>
          <p className="text-sm text-gray-600">{idea.visualHook || ''}</p>
        </div>
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Script</h4>
          <p className="text-sm text-gray-600">{idea.script || ''}</p>
        </div>
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Sound</h4>
          <p className="text-sm text-gray-600">{idea.sound || ''}</p>
        </div>
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Props</h4>
          <p className="text-sm text-gray-600">{idea.props || ''}</p>
        </div>
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Ref URL</h4>
          <p className="text-sm text-gray-600">{idea.refUrl || ''}</p>
        </div>
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Finished URL</h4>
          <p className="text-sm text-gray-600">{idea.finishedURL || ''}</p>
        </div>
        <div className="border-t border-gray-100 pt-3 mt-2">
          {/* Google Calendar Toggle */}
          <div className="flex items-center mt-3 pt-2 border-t border-gray-100">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                checked={idea.syncToGoogle || false}
                onChange={handleSyncToggle}
              />
              <span className="ml-2 text-sm text-gray-600">
                Sync to Google Calendar
              </span>
              {idea.googleCalendarEventId && (
                <span className="ml-1 text-xs text-green-600">
                  (Synced)
                </span>
              )}
            </label>
          </div>
          
          <div className="flex justify-end mt-3 pt-2 border-t border-gray-100">
            <button 
              onClick={() => onEdit(idea)}
              className="mr-2 px-3 py-1 text-xs text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
            <button 
              onClick={() => onDelete(idea._id)}
              className="px-3 py-1 text-xs text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentIdeaCard; 