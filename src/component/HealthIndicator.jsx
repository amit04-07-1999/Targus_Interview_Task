import { useState, useEffect } from 'react';
import { checkHealth } from '../services/api';
import './HealthIndicator.css';

const HealthIndicator = () => {
  const [healthStatus, setHealthStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState('');

  const checkHealthStatus = async () => {
    try {
      setHealthStatus('checking');
      setError('');
      
      const response = await checkHealth();
      
      // Handle different response formats
      if (response.status === 'healthy' || response.healthy === true || response.health === 'ok') {
        setHealthStatus('healthy');
      } else if (response.status === 'unhealthy' || response.healthy === false) {
        setHealthStatus('unhealthy');
      } else {
        setHealthStatus('healthy'); // Default to healthy if response is successful
      }
      
      setLastChecked(new Date());
    } catch (error) {
      setHealthStatus('unhealthy');
      setError(error.message);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkHealthStatus();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealthStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusText = () => {
    switch (healthStatus) {
      case 'healthy':
        return 'Healthy';
      case 'unhealthy':
        return 'Unhealthy';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (healthStatus) {
      case 'healthy':
        return '#28a745';
      case 'unhealthy':
        return '#dc3545';
      case 'checking':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const formatLastChecked = () => {
    if (!lastChecked) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - lastChecked) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else {
      return lastChecked.toLocaleTimeString();
    }
  };

  return (
    <div className="health-indicator">
      <div 
        className="status-badge"
        style={{ backgroundColor: getStatusColor() }}
        onClick={checkHealthStatus}
        title={`Last checked: ${formatLastChecked()}`}
      >
        <div className="status-dot"></div>
        <span className="status-text">{getStatusText()}</span>
      </div>
      
      {error && healthStatus === 'unhealthy' && (
        <div className="health-error">
          <small>{error}</small>
        </div>
      )}
      
      <div className="health-info">
        <small>Last checked: {formatLastChecked()}</small>
      </div>
    </div>
  );
};

export default HealthIndicator;
