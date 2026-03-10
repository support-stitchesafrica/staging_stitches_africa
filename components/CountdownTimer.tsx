"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [isLaunched, setIsLaunched] = useState(false);

  useEffect(() => {
    // 🎯 Launch date — November 7, 2025, at 00:00 (midnight)
    const targetDate = new Date("2025-11-07T00:00:00+01:00").getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        // 🚀 When countdown ends
        setIsLaunched(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🔹 Timer box component
  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div
        className="
          bg-[#0b0b0b]/80 border border-[#D4AF37]/40 
          rounded-2xl shadow-[0_0_35px_rgba(212,175,55,0.25)]
          hover:shadow-[0_0_45px_rgba(226,114,91,0.3)]
          flex items-center justify-center
          w-[70px] h-[70px]
          sm:w-[90px] sm:h-[90px]
          md:w-[110px] md:h-[110px]
          lg:w-[130px] lg:h-[130px]
          xl:w-[150px] xl:h-[150px]
          transition-all duration-300
        "
      >
        <span
          className="
            text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 
            font-bold text-[#E2725B] 
            drop-shadow-[0_0_12px_rgba(226,114,91,0.7)]
          "
        >
          {value.toString().padStart(2, "0")}
        </span>
      </div>

      <div
        className="
          text-[#D4AF37]/90 mt-2 sm:mt-3 
          text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg 
          uppercase tracking-widest
        "
      >
        {label}
      </div>
    </div>
  );

  // 🔹 When launched, show a success message
  if (isLaunched) {
    return (
      <div className="text-center text-[#E2725B] text-3xl sm:text-5xl font-extrabold mt-10 animate-pulse">
        🚀 We’re Live! Welcome to Stitches Africa 🎉
      </div>
    );
  }

  return (
    <div
      className="
        flex flex-wrap justify-center items-center 
        gap-3 sm:gap-5 md:gap-7 lg:gap-10 xl:gap-12
        px-2 sm:px-4
      "
    >
      <TimeUnit value={timeLeft.days} label="Days" />
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <TimeUnit value={timeLeft.minutes} label="Minutes" />
      <TimeUnit value={timeLeft.seconds} label="Seconds" />
    </div>
  );
};

export default CountdownTimer;
