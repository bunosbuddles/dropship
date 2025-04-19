import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateProduct } from '../redux/slices/productSlice';

const ProductSourcingTab = ({ product }) => {
  const dispatch = useDispatch();
  // Initialize with empty array if suppliers doesn't exist in product
  const [suppliers, setSuppliers] = useState(product.suppliers || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    moq: '',
    shippingTime: '',
    status: 'researching',
    notes: ''
  });
  const [editingIndex, setEditingIndex] = useState(null);

  // Update suppliers when product changes
  useEffect(() => {
    setSuppliers(product.suppliers || []);
  }, [product]);

  // Status options
  const statusOptions = [
    { value: 'researching', label: 'Researching' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'negotiating', label: 'Negotiating' },
    { value: 'samples', label: 'Samples Ordered' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'researching':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'negotiating':
        return 'bg-purple-100 text-purple-800';
      case 'samples':
        return 'bg-indigo-100 text-indigo-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSupplier = (e) => {
    e.preventDefault();
    
    // Format price as number
    const supplierData = {
      ...formData,
      price: parseFloat(formData.price),
      moq: parseInt(formData.moq, 10) || 0,
      date: new Date().toISOString()
    };
    
    let updatedSuppliers;
    
    if (editingIndex !== null) {
      // Edit existing supplier
      updatedSuppliers = [...suppliers];
      updatedSuppliers[editingIndex] = supplierData;
    } else {
      // Add new supplier
      updatedSuppliers = [...suppliers, supplierData];
    }
    
    setSuppliers(updatedSuppliers);
    
    // Update product in Redux and backend
    dispatch(updateProduct({
      id: product._id,
      productData: { suppliers: updatedSuppliers }
    }));
    
    // Reset form
    setFormData({
      name: '',
      price: '',
      moq: '',
      shippingTime: '',
      status: 'researching',
      notes: ''
    });
    setShowAddForm(false);
    setEditingIndex(null);
  };

  const handleEditSupplier = (index) => {
    const supplier = suppliers[index];
    setFormData({
      name: supplier.name,
      price: supplier.price.toString(),
      moq: supplier.moq ? supplier.moq.toString() : '',
      shippingTime: supplier.shippingTime || '',
      status: supplier.status || 'researching',
      notes: supplier.notes || ''
    });
    setEditingIndex(index);
    setShowAddForm(true);
  };

  const handleDeleteSupplier = (index) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      const updatedSuppliers = suppliers.filter((_, i) => i !== index);
      setSuppliers(updatedSuppliers);
      
      // Update product in Redux and backend
      dispatch(updateProduct({
        id: product._id,
        productData: { suppliers: updatedSuppliers }
      }));
    }
  };

  const handleSetPrimarySupplier = (index) => {
    const updatedSuppliers = suppliers.map((supplier, i) => ({
      ...supplier,
      isPrimary: i === index
    }));
    
    setSuppliers(updatedSuppliers);
    
    // Update product in Redux and backend with both suppliers and primary supplier
    const primarySupplier = updatedSuppliers[index];
    dispatch(updateProduct({
      id: product._id,
      productData: { 
        suppliers: updatedSuppliers,
        supplier: primarySupplier.name,
        unitCost: primarySupplier.price
      }
    }));
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingIndex(null);
    setFormData({
      name: '',
      price: '',
      moq: '',
      shippingTime: '',
      status: 'researching',
      notes: ''
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Supplier & Sourcing</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Add Supplier
          </button>
        )}
      </div>

      {/* Add/Edit Supplier Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <h3 className="text-lg font-medium mb-3">
            {editingIndex !== null ? 'Edit Supplier' : 'Add New Supplier'}
          </h3>
          <form onSubmit={handleAddSupplier}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MOQ (Minimum Order Quantity)
                </label>
                <input
                  type="number"
                  name="moq"
                  value={formData.moq}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Time
                </label>
                <input
                  type="text"
                  name="shippingTime"
                  value={formData.shippingTime}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. 15-20 days"
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
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="3"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                {editingIndex !== null ? 'Update Supplier' : 'Add Supplier'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Suppliers List */}
      {suppliers && suppliers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MOQ
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shipping
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {suppliers.map((supplier, index) => (
                <tr key={index} className={supplier.isPrimary ? 'bg-blue-50' : ''}>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {supplier.name}
                      </div>
                      {supplier.isPrimary && (
                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Primary
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${supplier.price && supplier.price.toFixed(2)}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {supplier.moq}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {supplier.shippingTime}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(supplier.status)}`}>
                      {statusOptions.find(option => option.value === supplier.status)?.label || 'Researching'}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {!supplier.isPrimary && (
                        <button
                          onClick={() => handleSetPrimarySupplier(index)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        onClick={() => handleEditSupplier(index)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-500">No suppliers added yet. Click "Add Supplier" to get started.</p>
        </div>
      )}

      {/* Notes about primary supplier */}
      {suppliers && suppliers.length > 0 && (
        <div className="mt-4 bg-blue-50 p-3 rounded text-sm text-blue-800">
          <p>The primary supplier's information will be used as the default unit cost and supplier for this product.</p>
        </div>
      )}
    </div>
  );
};

export default ProductSourcingTab;