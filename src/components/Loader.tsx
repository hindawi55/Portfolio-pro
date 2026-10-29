import React, { useEffect, useState } from 'react';

export const Loader: React.FC = () => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHidden(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`loader ${hidden ? 'hidden' : ''}`} id="loader">
      <div className="loader-text">ENAAM ALI OSMAN</div>
      <div className="loader-bar">
        <div className="loader-bar-inner"></div>
      </div>
    </div>
  );
};
