import React, { useMemo } from 'react';

export const Particles: React.FC = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      left: `${(i * 6.3 + 4) % 96}%`,
      top: `${(i * 8.7 + 10) % 90}%`,
      delay: `${(i * 1.1) % 15}s`,
      duration: `${11 + (i % 9)}s`,
    }));
  }, []);

  return (
    <div className="particles" id="particles" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
};
