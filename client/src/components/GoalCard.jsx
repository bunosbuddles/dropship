import React from 'react';
import { format } from 'date-fns';

const GoalCard = ({ goal, onEdit, onDelete }) => {
  // Calculate progress percentage
  const progressPercentage = Math.min(100, ((goal.currentAmount || 0) / goal.targetAmount) * 100);
  
  // Determine progress color
  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Format dates
  const startDate = format(new Date(goal.startDate), 'MMM d, yyyy');
  const endDate = format(new Date(goal.endDate), 'MMM d, yyyy');
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium text-gray-900">{goal.name}</h3>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 uppercase">
          {goal.type}
        </span>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Target:</span>{' '}
          {goal.type === 'revenue' ? `$${goal.targetAmount.toLocaleString()}` : goal.targetAmount.toLocaleString()}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Current:</span>{' '}
          {goal.type === 'revenue' 
            ? `$${(goal.currentAmount || 0).toLocaleString()}` 
            : (goal.currentAmount || 0).toLocaleString()}
        </p>
      </div>
      
      <div className="mb-2">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${getProgressColor(progressPercentage)}`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <p className="text-right text-xs text-gray-600 mt-1">{progressPercentage.toFixed(0)}%</p>
      </div>
      
      <div className="text-xs text-gray-500 mb-4">
        {startDate} - {endDate}
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          onClick={onEdit}
          className="px-3 py-1 text-xs text-blue-600 hover:text-blue-800"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1 text-xs text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default GoalCard;