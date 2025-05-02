import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../services/authService'

const Header = ({ title }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = authService.getCurrentUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }
  
  // Check if current path matches the link
  const isActive = (path) => {
    return location.pathname === path
  }
  
  return (
    <header className="bg-white sticky top-0 left-0 right-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-lg text-white group-hover:bg-indigo-700 transition-colors">
                <span className="text-xl">🛋️</span>
              </div>
              <div className="ml-3">
                <div className="flex items-baseline">
                  <h1 className="text-xl font-bold text-indigo-600">Furniture</h1>
                  <h2 className="ml-1 text-lg text-gray-600 hidden sm:block">Visualizer</h2>
                </div>
                
                {title && (
                  <p className="text-xs text-gray-500 -mt-1 hidden sm:block">{title}</p>
                )}
              </div>
            </Link>
          </div>
          
          {/* Main Navigation - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {/* User Email Badge */}
            <div className="flex items-center px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-600 mr-3">
              <svg className="w-4 h-4 text-gray-500 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <span className="truncate max-w-[150px]">{user?.email}</span>
            </div>
            
            {/* Navigation Links */}
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <Link 
                to="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-700 hover:text-indigo-600'
                }`}
              >
                My Designs
              </Link>
              
              <Link 
                to="/editor" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/editor') || location.pathname.startsWith('/editor/')
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-700 hover:text-indigo-600'
                }`}
              >
                New Design
              </Link>
            </div>
            
            <button
              onClick={handleLogout}
              className="ml-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors shadow-sm hover:shadow"
            >
              Logout
            </button>
          </div>
          
          {/* Mobile Title (if needed) */}
          {title && (
            <div className="md:hidden">
              <span className="text-gray-700 font-medium">{title}</span>
            </div>
          )}
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-60' : 'max-h-0'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
          <div className="px-3 py-2 rounded-md text-sm text-gray-600 bg-gray-50 flex items-center mb-2">
            <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span className="truncate">{user?.email}</span>
          </div>
          
          <Link 
            to="/" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/') 
                ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600 pl-2' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            My Designs
          </Link>
          
          <Link 
            to="/editor" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/editor') || location.pathname.startsWith('/editor/')
                ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600 pl-2' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            New Design
          </Link>
          
          <div className="pt-2">
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full px-3 py-2 text-base font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 