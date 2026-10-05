import React, { useState, useEffect } from 'react';

/**
 * Isolated Clock Component to prevent re-rendering parent components every second
 */
export const LiveClock: React.FC<{ className?: string }> = ({ className }) => {
  const [time, setTime] = useState<string>(() =>
    new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <span className={className}>{time}</span>;
};
