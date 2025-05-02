import { useState, useEffect, useRef } from 'react'

const AnimatedElement = ({ 
  children, 
  animation = 'fadeIn', // fadeIn, slideUp, slideIn, scale, etc.
  duration = 300,
  delay = 0,
  className = '',
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )
    
    const currentElement = elementRef.current
    if (currentElement) {
      observer.observe(currentElement)
    }
    
    return () => {
      if (currentElement) {
        observer.unobserve(currentElement)
      }
    }
  }, [])
  
  // Define animation styles
  const animationStyles = {
    fadeIn: {
      initial: 'opacity-0',
      animate: 'opacity-100 transition-opacity',
    },
    slideUp: {
      initial: 'opacity-0 translate-y-8',
      animate: 'opacity-100 translate-y-0 transition-all',
    },
    slideIn: {
      initial: 'opacity-0 -translate-x-8',
      animate: 'opacity-100 translate-x-0 transition-all',
    },
    scale: {
      initial: 'opacity-0 scale-95',
      animate: 'opacity-100 scale-100 transition-all',
    },
  }
  
  const { initial, animate } = animationStyles[animation] || animationStyles.fadeIn
  
  return (
    <div
      ref={elementRef}
      className={`${initial} ${isVisible ? animate : ''} ${className}`}
      style={{ 
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms` 
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export default AnimatedElement 