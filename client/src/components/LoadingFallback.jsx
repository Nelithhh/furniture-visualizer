const LoadingFallback = ({ message = 'Loading...', size = 'medium', showProgress = false, progress = 0 }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  }
  
  const textClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }
  
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`inline-block ${sizeClasses[size]} border-4 border-blue-600 border-t-transparent rounded-full animate-spin`}></div>
      
      <p className={`mt-4 ${textClasses[size]} text-gray-700`}>{message}</p>
      
      {showProgress && (
        <div className="w-64 h-3 mt-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  )
}

export default LoadingFallback 