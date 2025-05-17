import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/notification.css';

interface NotificationData {
  title: string;
  body: string;
  type: 'twentytwenty' | 'blink' | 'posture';
}

const NotificationApp: React.FC = () => {
  const [data, setData] = useState<NotificationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    (window as any).electronAPI.onNotificationData((notificationData: NotificationData) => {
      setData(notificationData);
      setTimeout(() => setIsVisible(true), 100);
    });
  }, []);
  
  if (!data) return null;
  
  const getIcon = () => {
    switch (data.type) {
      case 'twentytwenty':
        return '👁️';
      case 'blink':
        return '😌';
      case 'posture':
        return '🧘';
      default:
        return '🔔';
    }
  };
  
  const getColor = () => {
    switch (data.type) {
      case 'twentytwenty':
        return '#007AFF';
      case 'blink':
        return '#34C759';
      case 'posture':
        return '#FF9500';
      default:
        return '#5856D6';
    }
  };
  
  return (
    <div className={`notification ${isVisible ? 'visible' : ''}`} style={{ borderLeftColor: getColor() }}>
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-content">
        <h3 className="notification-title">{data.title}</h3>
        <p className="notification-body">{data.body}</p>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<NotificationApp />);
}