import React, { useState, useEffect } from 'react';
import '../styles/App.css';

interface ReminderSettings {
  twentyTwentyInterval: number;
  blinkInterval: number;
  postureInterval: number;
  isEnabled: boolean;
  workingHoursEnabled: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  launchAtLogin: boolean;
}

interface SettingSliderProps {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  icon: string;
  color: string;
  onChange: (value: number) => void;
}

const SettingSlider: React.FC<SettingSliderProps> = ({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  unit = 'min',
  icon,
  color,
  onChange,
}) => {
  return (
    <div className="setting-card">
      <div className="setting-header">
        <div className="setting-icon" style={{ background: color }}>
          {icon}
        </div>
        <div className="setting-info">
          <h3>{label}</h3>
          <p>{description}</p>
        </div>
        <div className="setting-value">
          <span className="value">{value}</span>
          <span className="unit">{unit}</span>
        </div>
      </div>
      <div className="slider-container">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="slider"
          style={{ '--slider-color': color } as React.CSSProperties}
        />
        <div className="slider-labels">
          <span>{min} {unit}</span>
          <span>{max} {unit}</span>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<ReminderSettings>({
    twentyTwentyInterval: 20,
    blinkInterval: 5,
    postureInterval: 30,
    isEnabled: true,
    workingHoursEnabled: false,
    workingHoursStart: "09:00",
    workingHoursEnd: "17:00",
    launchAtLogin: false,
  });
  
  useEffect(() => {
    (window as any).electronAPI.getReminderSettings().then((savedSettings: ReminderSettings) => {
      setSettings(savedSettings);
    });
  }, []);

  const updateSetting = (key: keyof ReminderSettings, value: number | boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    (window as any).electronAPI.updateReminderSettings({ [key]: value });
  };
  
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="app-icon">👁️</div>
          <div>
            <h1>BlinkAway</h1>
            <p className="tagline">Keep your eyes healthy, one blink at a time</p>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        <div className="settings-grid">
          <SettingSlider
            label="20-20-20 Rule"
            description="Look away every 20 minutes"
            value={settings.twentyTwentyInterval}
            min={5}
            max={60}
            step={5}
            icon="👁️"
            color="#007AFF"
            onChange={(value) => updateSetting('twentyTwentyInterval', value)}
          />
          
          <SettingSlider
            label="Blink Reminder"
            description="Remember to blink regularly"
            value={settings.blinkInterval}
            min={1}
            max={30}
            icon="😌"
            color="#34C759"
            onChange={(value) => updateSetting('blinkInterval', value)}
          />
          
          <SettingSlider
            label="Posture Check"
            description="Maintain good posture"
            value={settings.postureInterval}
            min={1}
            max={30}
            icon="🧘"
            color="#FF9500"
            onChange={(value) => updateSetting('postureInterval', value)}
          />
        </div>
        
        <div className="working-hours-section">
          <h2 className="section-title">Working Hours</h2>
          <div className="working-hours-card">
            <div className="working-hours-header">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.workingHoursEnabled}
                  onChange={(e) => updateSetting('workingHoursEnabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">Auto-pause outside working hours</span>
              </label>
            </div>
            {settings.workingHoursEnabled && (
              <div className="working-hours-times">
                <div className="time-picker">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={settings.workingHoursStart}
                    onChange={(e) => updateSetting('workingHoursStart', e.target.value)}
                    className="time-input"
                  />
                </div>
                <div className="time-picker">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={settings.workingHoursEnd}
                    onChange={(e) => updateSetting('workingHoursEnd', e.target.value)}
                    className="time-input"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="startup-section">
          <h2 className="section-title">System Settings</h2>
          <div className="startup-card">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.launchAtLogin}
                onChange={(e) => updateSetting('launchAtLogin', e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">Start BlinkAway with system</span>
            </label>
          </div>
        </div>
        
        <div className="footer">
          <p className="footer-text">
            💡 Click the menu bar icon to pause reminders
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;