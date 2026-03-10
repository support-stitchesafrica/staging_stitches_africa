/**
 * Enhanced Countdown Timer Component
 * Displays real-time countdown to waitlist launch with modern themes
 */

"use client";

import React from 'react';
import { CountdownTime } from '@/types/waitlist';

interface CountdownTimerProps {
  countdownTime: CountdownTime;
  theme?: 'light' | 'dark' | 'glass';
  size?: 'small' | 'medium' | 'large';
}

export default function CountdownTimer({ 
  countdownTime, 
  theme = 'light',
  size = 'medium'
}: CountdownTimerProps) {
  if (countdownTime.isExpired) {
    return (
      <div className="text-center">
        <div className={`text-2xl font-bold ${theme === 'dark' || theme === 'glass' ? 'text-white' : 'text-gray-900'}`}>
          🎉 Launch Time!
        </div>
      </div>
    );
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'gap-2',
          timeBox: 'w-12 h-12 text-sm',
          number: 'text-lg font-bold',
          label: 'text-xs'
        };
      case 'large':
        return {
          container: 'gap-4 md:gap-6',
          timeBox: 'w-16 h-16 md:w-24 md:h-24 text-lg',
          number: 'text-xl md:text-3xl font-bold',
          label: 'text-sm'
        };
      default: // medium
        return {
          container: 'gap-3 md:gap-4',
          timeBox: 'w-14 h-14 md:w-20 md:h-20',
          number: 'text-lg md:text-2xl font-bold',
          label: 'text-xs md:text-sm'
        };
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return {
          timeBox: 'bg-white/20 backdrop-blur-sm text-white border border-white/30 shadow-lg',
          number: 'text-white',
          label: 'text-white/80',
          separator: 'text-white/60'
        };
      case 'glass':
        return {
          timeBox: 'bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-xl',
          number: 'text-white drop-shadow-sm',
          label: 'text-white/90 drop-shadow-sm',
          separator: 'text-white/70'
        };
      default: // light
        return {
          timeBox: 'bg-white text-gray-900 border border-gray-200 shadow-lg hover:shadow-xl transition-shadow',
          number: 'text-gray-900',
          label: 'text-gray-600',
          separator: 'text-gray-400'
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const themeClasses = getThemeClasses();

  const timeUnits = [
    { value: countdownTime.days, label: 'Days', shortLabel: 'D' },
    { value: countdownTime.hours, label: 'Hours', shortLabel: 'H' },
    { value: countdownTime.minutes, label: 'Minutes', shortLabel: 'M' },
    { value: countdownTime.seconds, label: 'Seconds', shortLabel: 'S' }
  ];

  return (
    <div className="text-center">
      <div className={`flex justify-center items-center ${sizeClasses.container}`}>
        {timeUnits.map((unit, index) => (
          <React.Fragment key={unit.label}>
            <div className="flex flex-col items-center group">
              <div className={`
                ${sizeClasses.timeBox} 
                ${themeClasses.timeBox}
                flex items-center justify-center rounded-xl transform transition-all duration-300 group-hover:scale-105
                ${theme === 'glass' ? 'hover:bg-white/15' : ''}
              `}>
                <span className={`${sizeClasses.number} ${themeClasses.number} tabular-nums`}>
                  {unit.value.toString().padStart(2, '0')}
                </span>
              </div>
              <span className={`${sizeClasses.label} ${themeClasses.label} mt-2 font-medium uppercase tracking-wider`}>
                {size === 'small' ? unit.shortLabel : unit.label}
              </span>
            </div>
            
            {/* Separator */}
            {index < timeUnits.length - 1 && (
              <div className={`${themeClasses.separator} text-2xl font-bold mx-1 animate-pulse`}>
                :
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Pulse animation for urgency */}
      {(countdownTime.days === 0 && countdownTime.hours < 24) && (
        <div className="mt-4">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium animate-pulse ${
            theme === 'dark' || theme === 'glass' 
              ? 'bg-red-500/20 text-red-200 border border-red-400/30' 
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            🔥 Launching Soon!
          </div>
        </div>
      )}
    </div>
  );
}