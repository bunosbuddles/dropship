import React, { useState } from 'react';
import axios from 'axios';

// Get API URL from environment or use a fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://dropship-api.onrender.com';

const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('bug');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/feedback`, {
        type: feedbackType,
        message,
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        }
      });
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };
  
  const testEmailSystem = async () => {
    setIsTestingEmail(true);
    setTestResult(null);
    try {
      console.log('Sending test request to:', `${API_BASE_URL}/api/feedback/test-email`);
      const response = await axios.get(`${API_BASE_URL}/api/feedback/test-email`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        }
      });
      console.log('Email test response:', response.data);
      setTestResult({
        success: true,
        message: 'Test email sent successfully!',
        details: response.data.details
      });
    } catch (error) {
      console.error('Email test failed:', error);
      setTestResult({
        success: false,
        message: 'Test email failed to send',
        details: error.response?.data || error.message
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 flex flex-col items-end space-y-2">
        <button
          onClick={testEmailSystem}
          disabled={isTestingEmail}
          className="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-green-700 transition-colors"
          aria-label="Test email system"
        >
          {isTestingEmail ? (
            <span className="animate-spin h-5 w-5 border-t-2 border-white rounded-full"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
        </button>
        
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Provide feedback"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </button>
      </div>

      {/* Test Result Modal */}
      {testResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setTestResult(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Email Test Result</h3>
              <button onClick={() => setTestResult(null)} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className={`p-4 mb-4 rounded ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <p className="font-medium">{testResult.message}</p>
            </div>
            <div className="mt-4 bg-gray-100 p-4 rounded overflow-auto max-h-60">
              <pre className="text-xs">{JSON.stringify(testResult.details, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            {submitted ? (
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="text-xl font-semibold mt-4">Thanks for your feedback!</h3>
                <p className="text-gray-600 mt-2">Your input helps us improve the app.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Share your feedback</h3>
                  <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Feedback Type</label>
                    <select
                      value={feedbackType}
                      onChange={(e) => setFeedbackType(e.target.value)}
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="bug">Bug Report</option>
                      <option value="feature">Feature Request</option>
                      <option value="improvement">Improvement Suggestion</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Your Feedback</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Please describe your feedback in detail..."
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="mr-2 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackButton; 