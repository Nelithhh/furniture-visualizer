import { createContext, useContext, useState, useCallback } from 'react'
import Notification from '../components/Notification'

const NotificationContext = createContext()

export const useNotification = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  
  const addNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type, duration }])
    return id
  }, [])
  
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])
  
  // Helper methods for different notification types
  const showSuccess = useCallback((message, duration) => {
    return addNotification(message, 'success', duration)
  }, [addNotification])
  
  const showError = useCallback((message, duration) => {
    return addNotification(message, 'error', duration)
  }, [addNotification])
  
  const showWarning = useCallback((message, duration) => {
    return addNotification(message, 'warning', duration)
  }, [addNotification])
  
  const showInfo = useCallback((message, duration) => {
    return addNotification(message, 'info', duration)
  }, [addNotification])
  
  return (
    <NotificationContext.Provider value={{ 
      addNotification, 
      removeNotification,
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
      <div className="notification-container">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
} 