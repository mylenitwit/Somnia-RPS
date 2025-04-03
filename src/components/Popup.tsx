import React, { useEffect } from 'react';
import './Popup.css';

interface PopupProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`popup ${type}`}>
      <div className="popup-content">
        <div className="popup-message">{message}</div>
        <button className="popup-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default Popup; 