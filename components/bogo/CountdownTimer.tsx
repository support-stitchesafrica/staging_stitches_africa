// BOGO Countdown Timer Component
'use client';

import React, { useState, useEffect } from 'react';
import { bogoDurationService } from '@/lib/bogo/duration-service';

interface CountdownTimerProps {
  productId: string;
  className?: string;
  onExpired?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  productId,
  className = '',
  onExpired
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [hasCountdown, setHasCountdown] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const updateCountdown = async () => {
      try {
        const countdown = await bogoDurationService.getPromotionCountdown(productId);
        
        if (countdown.hasCountdown && countdown.timeRemaining) {
          setTimeRemaining(countdown.timeRemaining);
          setIsExpiringSoon(countdown.isExpiringSoon || false);
          setHasCountdown(true);
        } else {
          setHasCountdown(false);
          if (onExpired) {
            onExpired();
          }
        }
      } catch (error) {
        console.error('Error updating countdown:', error);
        setHasCountdown(false);
      }
    };

    // Initial update
    updateCountdown();

    // Update every second
    interval = setInterval(updateCountdown, 1000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [productId, onExpired]);

  if (!hasCountdown || !timeRemaining) {
    return null;
  }

  const formatTime = (time: number): string => {
    return time.toString().padStart(2, '0');
  };

  const timerClass = `
    inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium
    ${isExpiringSoon 
      ? 'bg-red-100 text-red-800 border border-red-200' 
      : 'bg-orange-100 text-orange-800 border border-orange-200'
    }
    ${className}
  `.trim();

  return (
    <div className={timerClass}>
      <span className="text-xs">
        {isExpiringSoon ? '⚠️' : '⏰'}
      </span>
      <span>
        {timeRemaining.days > 0 && (
          <span>{timeRemaining.days}d </span>
        )}
        {formatTime(timeRemaining.hours)}:
        {formatTime(timeRemaining.minutes)}:
        {formatTime(timeRemaining.seconds)}
      </span>
      <span className="text-xs opacity-75">
        {isExpiringSoon ? 'Ending Soon!' : 'Left'}
      </span>
    </div>
  );
};

export default CountdownTimer;