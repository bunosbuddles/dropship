import React, { useState, useEffect } from 'react';

const ProductModal = ({ product, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    unitCost: '',
    basePrice: '',
    fees: '',
    variant: '',
    unitsSold: '',
    supplier: '',
    sourcingStatus: 'in progress'
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        unitCost: product.unitCost || '',
        basePrice: product.basePrice || '',
        fees: product.fees || '',
        variant: product.variant || '',
        unitsSold: product.unitsSold || '',
        supplier: product.supplier || '',
        sourcingStatus: product.sourcingStatus || 'in progress'
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert numeric fields to numbers
    const productData = {
      ...formData,
      unitCost: parseFloat(formData.unitCost),
      basePrice: parseFloat(formData.basePrice),
      fees: formData.fees ? parseFloat(formData.fees) : 0,
      unitsSold: 0 // We don't use this field directly anymore since we track sales history
    };
    
    onSave(productData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name*
            </label>
            <input
              type="text"
              name="name"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Cost*
              </label>
              <input
                type="number"
                name="unitCost"
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.unitCost}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Price*
              </label>
              <input
                type="number"
                name="basePrice"
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.basePrice}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fees (per unit)
            </label>
            <input
              type="number"
              name="fees"
              step="0.01"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={formData.fees}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              Platform fees, shipping costs, etc. per unit
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant
            </label>
            <input
              type="text"
              name="variant"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={formData.variant}
              onChange={handleChange}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <input
              type="text"
              name="supplier"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={formData.supplier}
              onChange={handleChange}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sourcing Status
            </label>
            <select
              name="sourcingStatus"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={formData.sourcingStatus}
              onChange={handleChange}
            >
              <option value="in progress">In Progress</option>
              <option value="negotiation">Negotiation</option>
              <option value="complete">Complete</option>
              <option value="MOQ required">MOQ Required</option>
              <option value="price">Price Issue</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          
          {product && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Unit sales and revenue are now tracked in the sales history. 
                After adding a product, use the "Add Sales" tab to record sales data.
              </p>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              {product ? 'Update' : 'Add'} Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;