import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const SourcingTab = () => {
  const { user } = useSelector((state) => state.auth);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [sourcingAgents, setSourcingAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    baseCost: '',
    totalCost: '',
    shippingTime: '',
    notes: ''
  });

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/products`);
        setProducts(res.data);
        if (res.data.length > 0) {
          setSelectedProductId(res.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch sourcing agents when selected product changes
  useEffect(() => {
    if (!selectedProductId) return;
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/products/${selectedProductId}/sourcing-agents`);
        setSourcingAgents(res.data);
      } catch (err) {
        setSourcingAgents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, [selectedProductId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrEditAgent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAgent) {
        // Update
        await axios.put(`${API_BASE_URL}/api/products/${selectedProductId}/sourcing-agents/${editingAgent._id}`, formData);
      } else {
        // Add
        await axios.post(`${API_BASE_URL}/api/products/${selectedProductId}/sourcing-agents`, formData);
      }
      // Refresh
      const res = await axios.get(`${API_BASE_URL}/api/products/${selectedProductId}/sourcing-agents`);
      setSourcingAgents(res.data);
      setShowForm(false);
      setEditingAgent(null);
      setFormData({ name: '', baseCost: '', totalCost: '', shippingTime: '', notes: '' });
    } catch (err) {
      alert('Failed to save sourcing agent.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      baseCost: agent.baseCost,
      totalCost: agent.totalCost,
      shippingTime: agent.shippingTime || '',
      notes: agent.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (agentId) => {
    if (!window.confirm('Delete this sourcing agent?')) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/products/${selectedProductId}/sourcing-agents/${agentId}`);
      setSourcingAgents((prev) => prev.filter((a) => a._id !== agentId));
    } catch (err) {
      alert('Failed to delete sourcing agent.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAgent(null);
    setFormData({ name: '', baseCost: '', totalCost: '', shippingTime: '', notes: '' });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Sourcing Agents</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
        <select
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
        >
          {products.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name} {product.variant ? `- ${product.variant}` : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Sourcing Agents for this Product</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
          onClick={() => { setShowForm(true); setEditingAgent(null); setFormData({ name: '', baseCost: '', totalCost: '', shippingTime: '', notes: '' }); }}
        >
          Add Sourcing Agent
        </button>
      </div>
      {loading && <div className="text-blue-600 mb-4">Loading...</div>}
      {!loading && sourcingAgents.length === 0 && <div className="text-gray-500 mb-4">No sourcing agents found for this product.</div>}
      {!loading && sourcingAgents.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full w-full divide-y divide-gray-200 mb-6">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Base Cost</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shipping Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Notes</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sourcingAgents.map((agent) => (
                <tr key={agent._id}>
                  <td className="px-4 py-2">{agent.name}</td>
                  <td className="px-4 py-2">{agent.baseCost}</td>
                  <td className="px-4 py-2">{agent.totalCost}</td>
                  <td className="px-4 py-2">{agent.shippingTime}</td>
                  <td className="px-4 py-2 hidden md:table-cell">{agent.notes}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button className="text-blue-600 hover:underline" onClick={() => handleEdit(agent)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(agent._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <h3 className="text-lg font-medium mb-3">{editingAgent ? 'Edit Sourcing Agent' : 'Add New Sourcing Agent'}</h3>
          <form onSubmit={handleAddOrEditAgent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Cost</label>
              <input type="number" name="baseCost" value={formData.baseCost} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
              <input type="number" name="totalCost" value={formData.totalCost} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Time</label>
              <input type="text" name="shippingTime" value={formData.shippingTime} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" rows={2} />
            </div>
            <div className="md:col-span-2 flex gap-2 mt-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">{editingAgent ? 'Update' : 'Add'} Agent</button>
              <button type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SourcingTab; 