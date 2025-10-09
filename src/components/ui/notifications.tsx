// Simplified notifications component without type issues
'use client';

import { useState } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

const notifications: Notification[] = [];

export function useNotifications() {
  const [notificationList, setNotificationList] = useState<Notification[]>(notifications);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false
    };
    
    notifications.push(newNotification);
    setNotificationList([...notifications]);
  };

  return {
    notifications: notificationList,
    addNotification,
    success: (title: string, message: string) => addNotification({ type: 'success', title, message }),
    error: (title: string, message: string) => addNotification({ type: 'error', title, message }),
    warning: (title: string, message: string) => addNotification({ type: 'warning', title, message }),
    info: (title: string, message: string) => addNotification({ type: 'info', title, message })
  };
}

export default useNotifications;









