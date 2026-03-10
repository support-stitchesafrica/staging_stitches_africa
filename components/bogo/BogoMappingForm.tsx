"use client";

import { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { bogoMappingService } from '@/lib/bogo/mapping-service';
import type { BogoMapping, CreateBogoMappingData } from '@/types/bogo';

interface BogoMappingFormProps {
  mapping?: BogoMapping;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BogoMappingForm({ mapping, onSuccess, onCancel }: BogoMappingFormProps) {
  const [formData, setFormData] = useState<CreateBogoMappingData>({
    mainProductId: '',
    freeProductIds: [''],
    promotionStartDate: new Date(),
    promotionEndDate: new Date(),
    active: true,
    autoFreeShipping: true,
    promotionName: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mapping) {
      setFormData({
        mainProductId: mapping.mainProductId,
        freeProductIds: [...mapping.freeProductIds],
        promotionStartDate: mapping.promotionStartDate.toDate(),
        promotionEndDate: mapping.promotionEndDate.toDate(),
        active: mapping.active,
        autoFreeShipping: mapping.autoFreeShipping,
        promotionName: mapping.promotionName || '',
        description: mapping.description || '',
        maxRedemptions: mapping.maxRedemptions
      });
    } else {
      // Set default dates for new mappings
      const now = new Date();
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 30); // Default to 30 days from now
      endDate.setHours(23, 59, 59, 999);

      setFormData(prev => ({
        ...prev,
        promotionStartDate: startDate,
        promotionEndDate: endDate
      }));
    }
  }, [mapping]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.mainProductId.trim()) {
      errors.mainProductId = 'Main product ID is required';
    }

    if (formData.freeProductIds.length === 0 || formData.freeProductIds.every(id => !id.trim())) {
      errors.freeProductIds = 'At least one free product ID is required';
    }

    const validFreeProductIds = formData.freeProductIds.filter(id => id.trim());
    if (validFreeProductIds.includes(formData.mainProductId.trim())) {
      errors.freeProductIds = 'Main product cannot be included in free products list';
    }

    if (formData.promotionEndDate <= formData.promotionStartDate) {
      errors.promotionEndDate = 'End date must be after start date';
    }

    if (formData.maxRedemptions !== undefined && formData.maxRedemptions <= 0) {
      errors.maxRedemptions = 'Max redemptions must be greater than 0';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userId = localStorage.getItem('adminUID') || 'admin';
      
      // Clean up free product IDs
      const cleanedData = {
        ...formData,
        mainProductId: formData.mainProductId.trim(),
        freeProductIds: formData.freeProductIds.filter(id => id.trim()).map(id => id.trim()),
        promotionName: formData.promotionName?.trim() || undefined,
        description: formData.description?.trim() || undefined
      };

      if (mapping) {
        await bogoMappingService.updateMapping(mapping.id, cleanedData, userId);
      } else {
        await bogoMappingService.createMapping(cleanedData, userId);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Failed to save mapping:', err);
      setError(err.userMessage || 'Failed to save mapping. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFreeProduct = () => {
    setFormData(prev => ({
      ...prev,
      freeProductIds: [...prev.freeProductIds, '']
    }));
  };

  const handleRemoveFreeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      freeProductIds: prev.freeProductIds.filter((_, i) => i !== index)
    }));
  };

  const handleFreeProductChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      freeProductIds: prev.freeProductIds.map((id, i) => i === index ? value : id)
    }));
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {mapping ? 'Edit BOGO Mapping' : 'Create BOGO Mapping'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="promotionName" className="block text-sm font-medium text-gray-700 mb-2">
              Promotion Name
            </label>
            <input
              type="text"
              id="promotionName"
              value={formData.promotionName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, promotionName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., December BOGO Promotion"
            />
          </div>

          <div>
            <label htmlFor="maxRedemptions" className="block text-sm font-medium text-gray-700 mb-2">
              Max Redemptions (Optional)
            </label>
            <input
              type="number"
              id="maxRedemptions"
              value={formData.maxRedemptions || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                maxRedemptions: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              className={`w-full px-3 py-2 border rounded-md focus:ring-purple-500 focus:border-purple-500 ${
                validationErrors.maxRedemptions ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Leave empty for unlimited"
              min="1"
            />
            {validationErrors.maxRedemptions && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.maxRedemptions}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            placeholder="Describe this BOGO promotion..."
          />
        </div>

        {/* Product Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Product Configuration</h3>
          
          <div>
            <label htmlFor="mainProductId" className="block text-sm font-medium text-gray-700 mb-2">
              Main Product ID *
            </label>
            <input
              type="text"
              id="mainProductId"
              value={formData.mainProductId}
              onChange={(e) => setFormData(prev => ({ ...prev, mainProductId: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:ring-purple-500 focus:border-purple-500 ${
                validationErrors.mainProductId ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter the main product ID"
              required
            />
            {validationErrors.mainProductId && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.mainProductId}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Free Product IDs *
              </label>
              <button
                type="button"
                onClick={handleAddFreeProduct}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </button>
            </div>
            
            <div className="space-y-2">
              {formData.freeProductIds.map((productId, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={productId}
                    onChange={(e) => handleFreeProductChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder={`Free product ID ${index + 1}`}
                  />
                  {formData.freeProductIds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFreeProduct(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {validationErrors.freeProductIds && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.freeProductIds}</p>
            )}
          </div>
        </div>

        {/* Promotion Dates */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Promotion Period</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="promotionStartDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                id="promotionStartDate"
                value={formatDateForInput(formData.promotionStartDate)}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  promotionStartDate: new Date(e.target.value) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label htmlFor="promotionEndDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                id="promotionEndDate"
                value={formatDateForInput(formData.promotionEndDate)}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  promotionEndDate: new Date(e.target.value) 
                }))}
                className={`w-full px-3 py-2 border rounded-md focus:ring-purple-500 focus:border-purple-500 ${
                  validationErrors.promotionEndDate ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {validationErrors.promotionEndDate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.promotionEndDate}</p>
              )}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Settings</h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Active (promotion is currently running)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoFreeShipping"
                checked={formData.autoFreeShipping}
                onChange={(e) => setFormData(prev => ({ ...prev, autoFreeShipping: e.target.checked }))}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="autoFreeShipping" className="ml-2 block text-sm text-gray-900">
                Enable free shipping for BOGO orders
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {mapping ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {mapping ? 'Update Mapping' : 'Create Mapping'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}