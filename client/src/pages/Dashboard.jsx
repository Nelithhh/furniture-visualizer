import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { designService } from '../services/designService'
import { useNotification } from '../contexts/NotificationContext'

const Dashboard = () => {
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const { showError } = useNotification()

  // Fetch user's designs
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const data = await designService.getDesigns()
        setDesigns(data)
      } catch (error) {
        console.error('Error fetching designs:', error)
        showError('Could not load designs')
      } finally {
        setLoading(false)
      }
    }

    fetchDesigns()
  }, [showError])

  // Delete a design
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this design?')) return

    try {
      await designService.deleteDesign(id)
      setDesigns(designs.filter(design => design.id !== id))
    } catch (error) {
      console.error('Error deleting design:', error)
      showError('Could not delete design')
    }
  }

  // Generate a random gradient for design cards
  const getRandomGradient = () => {
    const gradients = [
      'from-purple-500 to-indigo-600',
      'from-blue-500 to-teal-400',
      'from-green-400 to-emerald-600',
      'from-yellow-400 to-orange-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-purple-600',
      'from-cyan-400 to-blue-600',
      'from-amber-400 to-red-500'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  }

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-[80vh] bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
            <div className="inline-block w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 text-xl font-medium text-gray-700">Loading your designs...</p>
            <p className="mt-2 text-gray-500">Preparing your creative space</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Dashboard">
      <div className="min-h-screen pt-6 pb-12">
        <div className="">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 mb-10 shadow-lg">
            <div className="max-w-4xl">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Welcome to your Design Studio</h1>
              <p className="text-indigo-100 text-lg mb-6">Create, manage, and visualize your furniture layouts in 2D and 3D</p>
              <Link
                to="/editor"
                className="inline-flex items-center px-6 py-3 rounded-full bg-white text-indigo-700 font-medium text-base shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create New Design
              </Link>
            </div>
          </div>

          {/* Designs Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Your Designs</h2>
              <div className="flex space-x-2">
                <Link
                  to="/editor"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  New Design
                </Link>
              </div>
            </div>

            {/* Designs Grid */}
            {designs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl shadow-md">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No designs yet</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">Start creating beautiful room layouts with our intuitive design tools.</p>
                <Link
                  to="/editor"
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-full shadow-md text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Design
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {designs.map((design, index) => {
                  // Use a consistent gradient for each design based on index
                  const gradientClass = `from-${['purple', 'blue', 'cyan', 'teal', 'green', 'amber', 'orange', 'pink'][index % 8]}-500 to-${['indigo', 'cyan', 'blue', 'emerald', 'teal', 'orange', 'red', 'rose'][index % 8]}-600`;
                  
                  return (
                    <div
                      key={design.id}
                      className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      {/* Design Preview */}
                      <div 
                        className={`h-48 bg-gradient-to-r ${gradientClass} relative overflow-hidden`}
                        style={{ 
                          backgroundColor: design.roomConfig?.color || '#F5F5DC',
                        }}
                      >
                        {/* Furniture items preview */}
                        {design.furniture && design.furniture.length > 0 && (
                          <div className="absolute inset-0 p-4">
                            {design.furniture.map(item => (
                              <div
                                key={item.id}
                                className="absolute shadow-md rounded transition-transform duration-200 group-hover:scale-105"
                                style={{
                                  left: `${(item.x / design.roomConfig.width) * 100}%`,
                                  top: `${(item.y / design.roomConfig.height) * 100}%`,
                                  width: `${(item.width / design.roomConfig.width) * 100}%`,
                                  height: `${(item.height / design.roomConfig.height) * 100}%`,
                                  backgroundColor: item.fill || '#8B4513',
                                  transform: `rotate(${item.rotation || 0}deg)`,
                                }}
                              ></div>
                            ))}
                          </div>
                        )}
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-lg font-medium">View Design</span>
                        </div>
                        
                        {/* Items count badge */}
                        <div className="absolute top-3 right-3 bg-white/90 text-gray-800 text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                          {design.furniture?.length || 0} items
                        </div>
                      </div>
                      
                      {/* Design Info */}
                      <div className="p-5">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{design.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Room size: {design.roomConfig?.width}×{design.roomConfig?.height}
                        </p>
                        
                        <div className="flex gap-2">
                          <Link
                            to={`/editor/${design.id}`}
                            className="flex-1 inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </Link>
                          
                          <Link
                            to={`/viewer/${design.id}`}
                            className="flex-1 inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                            </svg>
                            View 3D
                          </Link>
                          
                          <button
                            onClick={() => handleDelete(design.id)}
                            className="inline-flex justify-center items-center p-2.5 rounded-lg text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-300 transition-colors"
                            title="Delete design"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Info Cards */}
          {designs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-t-4 border-blue-500">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Editing</h3>
                <p className="text-gray-600">Easily modify room dimensions, furniture positions, and colors in real-time.</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-t-4 border-purple-500">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-full mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3D Visualization</h3>
                <p className="text-gray-600">See your designs come to life with realistic 3D rendering and lighting effects.</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-t-4 border-green-500">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Sharing</h3>
                <p className="text-gray-600">Share your designs with clients and colleagues for instant feedback.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard 