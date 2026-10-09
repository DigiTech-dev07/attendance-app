import { useState, useEffect } from 'react';

const FOUR_HOURS_IN_SECONDS = 4 * 60 * 60; // 14,400 seconds

export function use4HourTimer({ isActive, startedAt, onExpire }) {
  const [remainingSeconds, setRemainingSeconds] = useState(FOUR_HOURS_IN_SECONDS);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!isActive || !startedAt) {
      setRemainingSeconds(FOUR_HOURS_IN_SECONDS);
      setIsExpired(false);
      return;
    }

    const calculateRemaining = () => {
      const startTime = new Date(startedAt).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const left = FOUR_HOURS_IN_SECONDS - elapsedSeconds;

      if (left <= 0) {
        setRemainingSeconds(0);
        setIsExpired(true);
        if (onExpire) {
          onExpire();
        }
      } else {
        setRemainingSeconds(left);
        setIsExpired(false);
      }
    };

    // Calculate immediately
    calculateRemaining();

    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [isActive, startedAt, onExpire]);

  const formatRemaining = () => {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  return {
    remainingSeconds,
    formattedRemaining: formatRemaining(),
    isExpired,
  };
}

export default use4HourTimer;
