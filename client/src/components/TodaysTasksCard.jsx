import React from 'react';
import { Link } from 'react-router-dom';

const TodaysTasksCard = ({ task }) => {
  // Helper function to get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'negotiation':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'MOQ required':
        return 'bg-orange-100 text-orange-800';
      case 'price':
        return 'bg-yellow-100 text-yellow-800';
      case 'calendar':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get link destination based on task type
  const getTaskLink = () => {
    if (task.type === 'calendar') {
      return `/calendar`;
    }
    return `/products`;
  };

  // Get task label based on type
  const getTaskLabel = () => {
    if (task.type === 'calendar') {
      return 'View Calendar';
    }
    return 'View Details';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900">{task.productName}</h3>
          {task.variant && <p className="text-sm text-gray-600">{task.variant}</p>}
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.sourcingStatus)}`}>
          {task.type === 'calendar' ? 'Content' : task.sourcingStatus}
        </span>
      </div>
      
      {task.supplier && (
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium">Supplier:</span> {task.supplier}
        </p>
      )}
      
      {task.notes && (
        <div className="mt-2">
          <p className="text-sm text-gray-500 line-clamp-2">{task.notes}</p>
        </div>
      )}
      
      <div className="mt-3 flex justify-end">
        <Link
          to={getTaskLink()}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {getTaskLabel()}
        </Link>
      </div>
    </div>
  );
};

export default TodaysTasksCard;