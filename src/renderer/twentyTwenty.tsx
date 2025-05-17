import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/twentyTwenty.css';

const messages = [
  "Give them eyes a rest, champ 👀",
  "Time to gaze into the distance 🌅",
  "Look far, see far 🔭",
  "Your eyes will thank you ✨",
  "Take a visual vacation 🏖️",
  "Time for some eye yoga 🧘",
  "Let those peepers breathe 💨",
  "Focus on the horizon 🌄",
];

const TwentyTwentyApp: React.FC = () => {
  const [countdown, setCountdown] = useState(20);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    // Listen for initial state
    (window as any).electronAPI.onInitialState((state: { countdown: number; message: string }) => {
      setCountdown(state.countdown);
      setMessage(state.message);
    });
    
    // Listen for countdown updates
    (window as any).electronAPI.onCountdownUpdate((newCountdown: number) => {
      setCountdown(newCountdown);
    });
  }, []);
  
  const handleSkip = () => {
    (window as any).electronAPI.skip();
  };
  
  const formatTime = (seconds: number): string => {
    return `00:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="twenty-twenty-overlay">
      <div className="content">
        <h1 className="message">{message}</h1>
        <div className="countdown">{formatTime(countdown)}</div>
        <div className="instructions">
          Look at something 20 feet away
        </div>
        <button className="skip-button" onClick={handleSkip}>
          Skip (ESC)
        </button>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<TwentyTwentyApp />);
}