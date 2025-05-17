import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/reminder.css';

interface ReminderData {
  type: 'blink' | 'posture';
  message: string;
}

const blinkMessages = [
  "Blink blink, friend!",
  "Those peepers need moisture",
  "Time for a blink break",
  "Blink it out!",
  "Give those eyes a flutter",
];

const postureMessages = [
  "Sit up straight, champion!",
  "Check that posture!",
  "Shoulders back, chin up",
  "Time to straighten up",
  "Your spine will thank you",
];

const ReminderApp: React.FC = () => {
  const [data, setData] = useState<ReminderData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  
  useEffect(() => {
    (window as any).electronAPI.onReminderData((reminderData: ReminderData) => {
      setData(reminderData);
      setIsHiding(false);
      
      // Small delay to allow DOM to update before showing
      requestAnimationFrame(() => {
        setTimeout(() => setIsVisible(true), 100);
      });
      
      // Start exit animation after 5 seconds
      setTimeout(() => {
        setIsHiding(true);
        setIsVisible(false);
      }, 5000);
    });
  }, []);
  
  if (!data) return null;
  
  return (
    <div className={`reminder ${isVisible ? 'visible' : ''} ${isHiding ? 'hiding' : ''} ${data.type}`}>
      <div className="reminder-content">
        <div className="reminder-icon">
          {data.type === 'blink' ? '👁️' : '🧘'}
        </div>
        <div className="reminder-message">
          {data.message}
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<ReminderApp />);
}