/**
 * Simple notification utility for storefront
 */

export interface NotificationOptions {
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export function showNotification({ type, title, message, duration = 3000 }: NotificationOptions) {
  if (typeof window === 'undefined') return;

  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-0 opacity-100 ${
    type === 'success' ? 'bg-green-500 text-white' :
    type === 'error' ? 'bg-red-500 text-white' :
    'bg-blue-500 text-white'
  }`;

  const icon = type === 'success' 
    ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'
    : type === 'error'
    ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>'
    : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';

  notification.innerHTML = `
    <div class="flex items-center gap-3">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        ${icon}
      </svg>
      <div>
        <div class="font-medium">${title}</div>
        ${message ? `<div class="text-sm opacity-90">${message}</div>` : ''}
      </div>
      <button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto remove after duration
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentElement) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, duration);
}

// Convenience functions
export const showSuccess = (title: string, message?: string) => 
  showNotification({ type: 'success', title, message });

export const showError = (title: string, message?: string) => 
  showNotification({ type: 'error', title, message });

export const showInfo = (title: string, message?: string) => 
  showNotification({ type: 'info', title, message });