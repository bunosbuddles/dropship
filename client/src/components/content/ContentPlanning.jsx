import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfToday, parseISO } from 'date-fns';
import LoadingSpinner from '../LoadingSpinner';
import { useSelector, useDispatch } from 'react-redux';
import { clearHighlightedIdeaId } from '../../redux/slices/contentIdeasCalendarSlice';
import { useAxiosWithImpersonation } from '../../utils/axiosWithImpersonation';
import { useImpersonation } from '../../context/ImpersonationContext';

// Use environment variable or fallback to localhost:5001
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// ContentIdeaCard component
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
      className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
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
        
        <h3 className="text-lg font-semibold text-gray-800 mb-2 cursor-pointer" onClick={onToggleExpand}>
          {idea.videoConcept}
          <span className="ml-1 text-gray-400 text-sm">
            {expanded ? '▼' : '▶'}
          </span>
        </h3>
        
        <div className="border-t border-gray-100 pt-3 mt-2">
          <div className="mb-2">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Hook</h4>
            <p className={`text-sm text-gray-600 ${expanded ? '' : 'line-clamp-2'}`}>
              {idea.hook || "—"}
            </p>
          </div>
          
          {expanded && (
            <>
              {idea.script && (
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Script</h4>
                  <p className="text-sm text-gray-600">{idea.script}</p>
                </div>
              )}
              
              {idea.sound && (
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Sound</h4>
                  <p className="text-sm text-gray-600">{idea.sound}</p>
                </div>
              )}
              
              {idea.props && (
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Props</h4>
                  <p className="text-sm text-gray-600">{idea.props}</p>
                </div>
              )}
            </>
          )}
        </div>

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
  );
};

const ContentPlanning = () => {
  const [contentIdeas, setContentIdeas] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [sortBy, setSortBy] = useState('postDateNeeded');
  const [sortOrder, setSortOrder] = useState('asc');
  const [formData, setFormData] = useState({
    product: '',
    postDateNeeded: '',
    status: 'Not Started',
    videoConcept: '',
    hook: '',
    script: '',
    sound: '',
    props: '',
    sequence: 1,
    url: '',
    finishedURL: ''
  });
  
  // Google Calendar integration
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncResults, setSyncResults] = useState(null);

  const dispatch = useDispatch();
  const { highlightedIdeaId } = useSelector((state) => state.contentIdeasCalendar);
  const axiosInstance = useAxiosWithImpersonation();
  const { impersonatedUserId } = useImpersonation();

  // Helper function to get date in local timezone using date-fns
  const formatDateForInput = (dateString) => {
    if (!dateString) {
      // Get today's date using date-fns
      return format(startOfToday(), 'yyyy-MM-dd');
    }
    
    // Parse date and ensure it's treated as UTC to avoid timezone shifts
    const date = parseISO(dateString);
    return format(date, 'yyyy-MM-dd');
  };

  // Check Google Calendar connection status
  useEffect(() => {
    const checkGoogleStatus = async () => {
      try {
        const res = await axiosInstance.get(`${API_BASE_URL}/api/google-calendar/status`);
        setIsGoogleConnected(res.data.connected);
      } catch (err) {
        console.error('Failed to check Google Calendar status', err);
      }
    };
    
    checkGoogleStatus();
  }, [axiosInstance]);

  // Fetch products on component mount or when impersonatedUserId changes
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axiosInstance.get(`${API_BASE_URL}/api/products`);
        setProducts(res.data);
        if (res.data.length > 0) {
          setSelectedProduct(res.data[0]._id);
          setFormData(prev => ({ ...prev, product: res.data[0]._id }));
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
      }
    };
    fetchProducts();
  }, [axiosInstance, impersonatedUserId]);

  // Fetch content ideas when selected product or impersonatedUserId changes
  useEffect(() => {
    const fetchContentIdeas = async () => {
      if (!selectedProduct) return;
      setLoading(true);
      try {
        const res = await axiosInstance.get(`${API_BASE_URL}/api/content-ideas/product/${selectedProduct}`);
        setContentIdeas(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch content ideas', err);
        setLoading(false);
      }
    };
    fetchContentIdeas();
  }, [selectedProduct, axiosInstance, impersonatedUserId]);

  // Add this useEffect to scroll to and highlight the idea
  useEffect(() => {
    if (highlightedIdeaId) {
      // Find the idea in the list
      const idea = contentIdeas.find(idea => idea._id === highlightedIdeaId);
      
      if (idea) {
        // If the idea is for a different product, switch to that product
        if (idea.product && idea.product !== selectedProduct) {
          setSelectedProduct(idea.product);
        }
        
        // Set a small timeout to allow the DOM to update
        setTimeout(() => {
          // Find the element in the DOM
          const element = document.getElementById(`content-idea-${highlightedIdeaId}`);
          
          if (element) {
            // Scroll to the element
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add a highlight class
            element.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50');
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
              if (element) {
                element.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50');
                // Clear the highlighted ID
                dispatch(clearHighlightedIdeaId());
              }
            }, 3000);
          }
        }, 100);
      }
    }
  }, [highlightedIdeaId, contentIdeas, selectedProduct, dispatch]);

  const handleProductChange = (e) => {
    setSelectedProduct(e.target.value);
    setFormData(prev => ({ ...prev, product: e.target.value }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingIdea) {
        // Update existing idea
        await axiosInstance.put(`${API_BASE_URL}/api/content-ideas/${editingIdea._id}`, formData);
      } else {
        // Create new idea
        await axiosInstance.post(`${API_BASE_URL}/api/content-ideas`, formData);
      }
      setShowForm(false);
      setEditingIdea(null);
      // Refresh content ideas
      const res = await axiosInstance.get(`${API_BASE_URL}/api/content-ideas/product/${formData.product}`);
      setContentIdeas(res.data);
    } catch (err) {
      console.error('Failed to save content idea', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (idea) => {
    setEditingIdea(idea);
    setFormData({
      product: idea.product,
      postDateNeeded: formatDateForInput(idea.postDateNeeded),
      status: idea.status,
      videoConcept: idea.videoConcept,
      hook: idea.hook,
      script: idea.script || '',
      sound: idea.sound || '',
      props: idea.props || '',
      sequence: idea.sequence || 1,
      url: idea.url || '',
      finishedURL: idea.finishedURL || ''
    });
    setShowForm(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axiosInstance.delete(`${API_BASE_URL}/api/content-ideas/${id}`);
      // Refresh content ideas
      const res = await axiosInstance.get(`${API_BASE_URL}/api/content-ideas/product/${selectedProduct}`);
      setContentIdeas(res.data);
    } catch (err) {
      console.error('Failed to delete content idea', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingIdea(null);
    setFormData({
      product: selectedProduct,
      postDateNeeded: '',
      status: 'Not Started',
      videoConcept: '',
      hook: '',
      script: '',
      sound: '',
      props: '',
      sequence: 1,
      url: '',
      finishedURL: ''
    });
    setShowForm(false);
  };

  const toggleCardExpand = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Google Calendar functions
  const handleConnectGoogle = async () => {
    try {
      const res = await axiosInstance.get(`${API_BASE_URL}/api/google-calendar/auth`);
      window.open(res.data.authUrl, '_blank');
    } catch (err) {
      console.error('Failed to get Google auth URL', err);
    }
  };

  const handleSyncToGoogle = async () => {
    try {
      setSyncInProgress(true);
      const res = await axiosInstance.post(`${API_BASE_URL}/api/google-calendar/sync`);
      setSyncResults(res.data.results);
      
      // Refresh content ideas to get updated sync status
      if (selectedProduct) {
        const response = await axiosInstance.get(`${API_BASE_URL}/api/content-ideas/product/${selectedProduct}`);
        setContentIdeas(response.data);
      }
    } catch (err) {
      console.error('Failed to sync to Google Calendar', err);
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleSyncToggle = async (ideaId) => {
    try {
      await axiosInstance.put(`${API_BASE_URL}/api/google-calendar/toggle-sync/${ideaId}`);
      setContentIdeas(prev => prev.map(idea => idea._id === ideaId ? { ...idea, syncToGoogle: !idea.syncToGoogle } : idea));
    } catch (err) {
      console.error('Error toggling sync:', err);
    }
  };

  // Sort content ideas
  const sortedContentIdeas = [...contentIdeas].sort((a, b) => {
    if (sortBy === 'postDateNeeded') {
      const dateA = new Date(a.postDateNeeded);
      const dateB = new Date(b.postDateNeeded);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortBy === 'status') {
      const statusOrder = { 'Not Started': 1, 'Edited': 2, 'Posted': 3 };
      const orderA = statusOrder[a.status];
      const orderB = statusOrder[b.status];
      return sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
    } else {
      // Default sort by video concept
      return sortOrder === 'asc' 
        ? a.videoConcept.localeCompare(b.videoConcept)
        : b.videoConcept.localeCompare(a.videoConcept);
    }
  });

  const formatDate = (dateString) => {
    // Parse the ISO date string
    const date = new Date(dateString);
    
    // Get year, month, day components in UTC
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    
    // Create a new date with those components in local time
    const localDate = new Date(year, month, day);
    
    // Format the date for display
    return localDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

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

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="w-full md:w-64 mb-4 md:mb-0">
          <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Product
          </label>
          <select
            id="product-select"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={selectedProduct}
            onChange={handleProductChange}
          >
            {products.map(product => (
              <option key={product._id} value={product._id}>
                {product.name} {product.variant ? `- ${product.variant}` : ''}
              </option>
            ))}
          </select>
        </div>
        
        {!showForm && (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setShowForm(true)}
          >
            Add Content Idea
          </button>
        )}
      </div>

      {/* Google Calendar integration UI */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Google Calendar Integration</h3>
        
        {!isGoogleConnected ? (
          <div>
            <p className="text-sm text-blue-600 mb-3">
              Connect your Google Calendar to sync your content ideas.
            </p>
            <button
              onClick={handleConnectGoogle}
              className="px-4 py-2 bg-white border border-blue-300 rounded-md text-blue-700 hover:bg-blue-50"
            >
              Connect Google Calendar
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-blue-600 mb-3">
              Google Calendar connected. Select which content ideas to sync using the checkboxes below, then click "Sync Now".
            </p>
            <button
              onClick={handleSyncToGoogle}
              disabled={syncInProgress}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {syncInProgress ? "Syncing..." : "Sync Selected Ideas to Google Calendar"}
            </button>
            
            {syncResults && (
              <div className="mt-3 text-sm">
                <p className="font-medium text-blue-700">Sync Results:</p>
                <p>Created: {syncResults.filter(r => r.action === 'created' && r.success).length}</p>
                <p>Updated: {syncResults.filter(r => r.action === 'updated' && r.success).length}</p>
                {syncResults.filter(r => !r.success).length > 0 && (
                  <p className="text-red-600">
                    Failed: {syncResults.filter(r => !r.success).length}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="mb-8 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">
            {editingIdea ? 'Edit Content Idea' : 'New Content Idea'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Post Date Needed
                </label>
                <input
                  type="date"
                  name="postDateNeeded"
                  value={formData.postDateNeeded}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="Edited">Edited</option>
                  <option value="Posted">Posted</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video Concept
                </label>
                <input
                  type="text"
                  name="videoConcept"
                  value={formData.videoConcept}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hook
                </label>
                <input
                  type="text"
                  name="hook"
                  value={formData.hook}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Script
                </label>
                <textarea
                  name="script"
                  value={formData.script}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sound
                </label>
                <input
                  type="text"
                  name="sound"
                  value={formData.sound}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Props
                </label>
                <input
                  type="text"
                  name="props"
                  value={formData.props}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sequence
                </label>
                <input
                  type="text"
                  name="sequence"
                  value={formData.sequence}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Finished URL
                </label>
                <input
                  type="text"
                  name="finishedURL"
                  value={formData.finishedURL}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {editingIdea ? 'Update' : 'Save'} Content Idea
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : contentIdeas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No content ideas found for this product.</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setShowForm(true)}
          >
            Create Your First Content Idea
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <button 
              onClick={() => handleSort('postDateNeeded')}
              className={`px-3 py-1 text-sm rounded-full ${
                sortBy === 'postDateNeeded' 
                  ? 'bg-blue-100 text-blue-800 font-medium' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sort by Date {sortBy === 'postDateNeeded' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              onClick={() => handleSort('status')}
              className={`px-3 py-1 text-sm rounded-full ${
                sortBy === 'status' 
                  ? 'bg-blue-100 text-blue-800 font-medium' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sort by Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              onClick={() => handleSort('videoConcept')}
              className={`px-3 py-1 text-sm rounded-full ${
                sortBy === 'videoConcept' 
                  ? 'bg-blue-100 text-blue-800 font-medium' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sort by Concept {sortBy === 'videoConcept' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedContentIdeas.map((idea) => (
              <ContentIdeaCard
                key={idea._id}
                idea={idea}
                expanded={expandedCards[idea._id]}
                onToggleExpand={() => toggleCardExpand(idea._id)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleSync={handleSyncToggle}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ContentPlanning;