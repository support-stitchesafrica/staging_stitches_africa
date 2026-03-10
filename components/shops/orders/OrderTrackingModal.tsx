'use client';

import React from 'react';
import { UserOrder } from '@/types';
import { X, Package, Truck, MapPin, Clock, Check, TriangleAlert, Calendar } from 'lucide-react';
import { formatDate, formatTime, getTrackingStatusIconType, getTrackingStatusColor } from '@/lib/utils/order-utils';

interface OrderTrackingModalProps
{
  order: UserOrder;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ order, onClose }) =>
{
  const dhlEvents = order.dhl_events_snapshot || [];
  const timeline = order.timeline || [];
  const packages = order.packages || [];
  const latestEvent = order.last_dhl_event;

  // Helper function to render tracking status icons
  const renderTrackingIcon = (typeCode: string, size: number = 20) =>
  {
    const iconProps = { size, className: 'text-current' };
    const iconType = getTrackingStatusIconType(typeCode);

    switch (iconType)
    {
      case 'package':
        return <Package {...iconProps} />;
      case 'truck':
        return <Truck {...iconProps} />;
      case 'check-circle':
        return <Check {...iconProps} />;
      case 'alert-circle':
        return <TriangleAlert {...iconProps} />;
      default:
        return <Clock {...iconProps} />;
    }
  };

  // Sort events by date (newest first)
  const sortedEvents = [...dhlEvents].sort((a, b) =>
  {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Track Order #{order.order_id}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {order.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Current Status */}
          {latestEvent && (
            <div className="p-6 bg-blue-50 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                {renderTrackingIcon(latestEvent.typeCode)}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {latestEvent.description}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(latestEvent.date)} at {formatTime(latestEvent.time)}
                  </p>
                  {latestEvent.serviceArea && latestEvent.serviceArea[0] && (
                    <p className="text-sm text-gray-600">
                      <MapPin size={14} className="inline mr-1" />
                      {latestEvent.serviceArea[0].description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Package Information */}
          {packages.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={18} />
                Package Information
              </h3>
              {packages.map((pkg, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 mb-3 last:mb-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Tracking Number:</span>
                      <p className="text-gray-900 font-mono">{pkg.trackingNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Reference:</span>
                      <p className="text-gray-900">#{pkg.referenceNumber}</p>
                    </div>
                  </div>
                  {pkg.trackingUrl && (
                    <div className="mt-3">
                      <a
                        href={pkg.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View on DHL Website →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tracking Timeline */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={18} />
              Tracking History
            </h3>

            {sortedEvents.length > 0 ? (
              <div className="space-y-4">
                {sortedEvents.map((event, index) =>
                {
                  const isLatest = index === 0;
                  const statusColor = getTrackingStatusColor(event.typeCode);

                  return (
                    <div key={index} className="flex gap-4">
                      {/* Timeline Icon */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLatest ? 'bg-blue-600 text-white' : statusColor
                          }`}>
                          {renderTrackingIcon(event.typeCode, 16)}
                        </div>
                        {index < sortedEvents.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                        )}
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className={`font-medium ${isLatest ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                              {event.description}
                            </h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>{formatDate(event.date)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>{formatTime(event.time)}</span>
                              </div>
                            </div>
                            {event.serviceArea && event.serviceArea[0] && (
                              <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                                <MapPin size={14} />
                                <span>{event.serviceArea[0].description}</span>
                              </div>
                            )}
                          </div>

                          {isLatest && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                              Latest
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No tracking information available yet</p>
              </div>
            )}
          </div>

          {/* Delivery Address */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin size={18} />
              Delivery Address
            </h3>
            <div className="text-sm text-gray-700">
              <p className="font-medium">
                {order.user_address.first_name} {order.user_address.last_name}
              </p>
              <p>{order.user_address.street_address}</p>
              <p>
                {order.user_address.city}, {order.user_address.state} {order.user_address.post_code}
              </p>
              <p>{order.user_address.country}</p>
              <p className="mt-2">
                <span className="font-medium">Phone:</span> {order.user_address.dial_code}{order.user_address.phone_number}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Carrier: <span className="font-medium">{order.shipping.carrier}</span>
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};