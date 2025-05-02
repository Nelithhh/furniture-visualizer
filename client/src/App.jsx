import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './App.css'
import ErrorBoundary from './components/ErrorBoundary'
import { NotificationProvider } from './contexts/NotificationContext'
import { ModalProvider } from './contexts/ModalContext'

import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Editor2D from './pages/Editor2D'
import Viewer3D from './pages/Viewer3D'
import ProtectedRoute from './components/ProtectedRoute'
import { authService } from './services/authService'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated())
  }, [])
  
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <ModalProvider>
          <Router>
            <div className="min-h-screen bg-gray-100">
              <Routes>
                <Route 
                  path="/login" 
                  element={<Login setIsAuthenticated={setIsAuthenticated} />} 
                />
                
                <Route 
                  path="/register" 
                  element={<Register setIsAuthenticated={setIsAuthenticated} />} 
                />
                
                <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/editor/:designId?" element={<Editor2D />} />
                  <Route path="/viewer/:designId" element={<Viewer3D />} />
                </Route>
              </Routes>
            </div>
          </Router>
        </ModalProvider>
      </NotificationProvider>
    </ErrorBoundary>
  )
}

export default App
