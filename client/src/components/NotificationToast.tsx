import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NotificationMessage } from '@/types';

interface NotificationToastProps {
  notification: NotificationMessage;
  onClose: () => void;
}

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle text-green-500';
      case 'error':
        return 'fas fa-exclamation-circle text-red-500';
      case 'warning':
        return 'fas fa-exclamation-triangle text-yellow-500';
      case 'info':
      default:
        return 'fas fa-info-circle text-blue-500';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Wait for animation to complete before removing
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-out ${
        isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      }`}
      data-testid={`notification-toast-${notification.type}`}
    >
      <Card className={`shadow-lg max-w-sm ${getNotificationColor(notification.type)}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <i className={getNotificationIcon(notification.type)}></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground" data-testid="notification-title">
                {notification.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1" data-testid="notification-message">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="flex-shrink-0 h-6 w-6 p-0 hover:bg-black/5"
              data-testid="button-close-notification"
            >
              <i className="fas fa-times text-xs"></i>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
