import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Stage, Layer, Rect, Transformer, Image as KonvaImage } from 'react-konva'
import Layout from '../components/Layout'
import { designService } from '../services/designService'
import { modelService } from '../services/modelService'
import { useNotification } from '../contexts/NotificationContext'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// Add a top-down image cache
const topDownImageCache = {};

// Debug logging helper
const debug = (message, data = null) => {
  if (process.env.NODE_ENV !== 'production') {
    if (data) {
      console.log(`[Editor2D Debug] ${message}:`, data);
    } else {
      console.log(`[Editor2D Debug] ${message}`);
    }
  }
};

// Update the createTopDownImage function
const createTopDownImage = async (modelName, color, rotation) => {
  const cacheKey = `${modelName}-${color}-${rotation}`;
  
  // Check if already in cache
  if (topDownImageCache[cacheKey]) {
    return topDownImageCache[cacheKey];
  }
  
  try {
    // Create DOM element for rendering
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 300;
    tempCanvas.height = 300;
    document.body.appendChild(tempCanvas); // Temporarily add to DOM for rendering
    
    // Setup scene with transparent background
    const scene = new THREE.Scene();
    
    // Get model-specific settings
    const topDownSettings = modelService.getTopDownViewSettings(modelName);
    
    // Setup camera for top-down view
    const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 1000);
    camera.position.set(0, topDownSettings.cameraHeight, 0);
    camera.lookAt(0, 0, 0);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);
    
    // Create renderer with transparency enabled
    const renderer = new THREE.WebGLRenderer({
      canvas: tempCanvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setClearColor(0x000000, 0); // Transparent background
    
    // Load and prepare the model
    const model = await modelService.loadModel(modelName);
    
    // Apply color
    modelService.applyMaterial(model, color);
    
    // Apply rotation
    const rotationRadians = THREE.MathUtils.degToRad((rotation || 0) + topDownSettings.rotationOffset);
    model.rotation.y = rotationRadians;
    
    // Scale model appropriately
    const config = modelService.getModelConfig(modelName);
    const scale = config.scale * topDownSettings.scale;
    model.scale.set(scale, scale, scale);
    
    // Center the model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.x = -center.x;
    model.position.z = -center.z;
    model.position.y = -box.min.y; // Place on "ground"
    
    scene.add(model);
    
    // Render the scene
    renderer.render(scene, camera);
    
    // Get the image data
    const dataURL = tempCanvas.toDataURL('image/png');
    
    // Clean up
    document.body.removeChild(tempCanvas);
    scene.remove(model);
    model.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    renderer.dispose();
    
    // Cache the result
    if (dataURL) {
      topDownImageCache[cacheKey] = dataURL;
    }
    
    return dataURL;
  } catch (error) {
    console.error('Error creating top-down image:', error);
    return null;
  }
};

// Add a preloader for images to ensure they're fully loaded before displaying
const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Add this component above the Editor2D component
const FurnitureItem = ({ item, isSelected, onSelect, onDragEnd, onTransformEnd, imageUrl }) => {
  const [image, setImage] = useState(null);

  // Load the image when the URL is available
  useEffect(() => {
    if (!imageUrl) return;
    
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => setImage(img);
  }, [imageUrl]);
  
  // If we have the image loaded, display it
  if (image) {
    return (
      <KonvaImage
        key={item.id}
        id={item.id}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        image={image}
        rotation={item.rotation || 0}
        draggable
        onClick={() => onSelect(item.id)}
        onTap={() => onSelect(item.id)}
        perfectDrawEnabled={true}
        imageSmoothingEnabled={true}
        onDragEnd={onDragEnd}
        onTransformEnd={onTransformEnd}
      />
    );
  }
  
  // Fallback to rectangle if image is not available
  return (
    <Rect
      key={item.id}
      id={item.id}
      x={item.x}
      y={item.y}
      width={item.width}
      height={item.height}
      fill={item.fill}
      rotation={item.rotation || 0}
      draggable
      onClick={() => onSelect(item.id)}
      onTap={() => onSelect(item.id)}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  );
};

const Editor2D = () => {
  const { designId } = useParams()
  const navigate = useNavigate()
  const isNewDesign = !designId
  const { showSuccess, showError, showInfo } = useNotification()
  
  // Editor state
  const [designName, setDesignName] = useState('New Design')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('room') // 'room', 'furniture', 'actions'
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const editorContainerRef = useRef(null)
  
  // Room settings
  const [roomConfig, setRoomConfig] = useState({
    width: 500,
    height: 400,
    color: '#F5F5DC', // Floor color
    wallColor: '#F5F5F5' // Add wall color with default value
  })
  
  // Furniture items
  const [furniture, setFurniture] = useState([])
  
  // Selected furniture
  const [selectedId, setSelectedId] = useState(null)
  const transformerRef = useRef(null)
  const selectedItem = selectedId ? furniture.find(item => item.id === selectedId) : null
  
  // Add state for model previews
  const [modelPreviews, setModelPreviews] = useState({});
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  
  // Add state for initial model loading
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Fetch design data if editing an existing design
  useEffect(() => {
    if (!isNewDesign) {
      const fetchDesign = async () => {
        try {
          setLoading(true)
          const design = await designService.getDesign(designId)
          
          // Set design data
          setDesignName(design.name)
          setRoomConfig(design.roomConfig)
          setFurniture(design.furniture)
        } catch (error) {
          console.error('Error fetching design:', error)
          showError('Could not load the design')
          navigate('/')
        } finally {
          setLoading(false)
        }
      }
      
      fetchDesign()
    }
  }, [designId, isNewDesign, navigate, showError])
  
  // Add this effect for initial model preloading
  useEffect(() => {
    const preloadModels = async () => {
      try {
        await modelService.preloadModels();
        setInitialLoading(false);
      } catch (error) {
        console.error('Error preloading models:', error);
        setInitialLoading(false);
      }
    };
    
    preloadModels();
    
    return () => {
      modelService.clearCache();
    };
  }, []);
  
  // Handle selection
  const checkDeselect = (e) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null)
    }
  }
  
  // Furniture types with properties
  const furnitureTypes = [
    { type: 'sofa', name: 'Sofa', width: 120, height: 70, fill: '#8B4513', icon: '🛋️' },
    { type: 'table', name: 'Table', width: 80, height: 80, fill: '#A0522D', icon: '🪑' },
    { type: 'bed', name: 'Bed', width: 160, height: 200, fill: '#CD853F', icon: '🛏️' },
    { type: 'bookshelf', name: 'Bookshelf', width: 60, height: 120, fill: '#D2B48C', icon: '📚' },
    { type: 'dresser', name: 'Dresser', width: 100, height: 50, fill: '#8B4513', icon: '🗄️' },
    { type: 'plant', name: 'Plant', width: 40, height: 40, fill: '#228B22', icon: '🪴' }
  ]
  
  // Add furniture
  const addFurniture = (type) => {
    const furnitureType = furnitureTypes.find(f => f.type === type) || furnitureTypes[0]
    
    const newItem = {
      id: Date.now(),
      x: roomConfig.width / 2 - furnitureType.width / 2,
      y: roomConfig.height / 2 - furnitureType.height / 2,
      width: furnitureType.width,
      height: furnitureType.height,
      fill: furnitureType.fill,
      name: furnitureType.name,
      rotation: 0 // Add rotation property with default 0 degrees
    }
    
    setFurniture(prev => [...prev, newItem])
    setSelectedId(newItem.id)
    showInfo(`Added new ${furnitureType.name}`)
  }
  
  // Update furniture color
  const updateFurnitureColor = (color) => {
    if (!selectedId) return
    
    setFurniture(furniture.map(item => {
      if (item.id === selectedId) {
        return { ...item, fill: color }
      }
      return item
    }))
  }
  
  // Add this new function to handle rotation changes
  const updateFurnitureRotation = (degrees) => {
    if (!selectedId) return
    
    setFurniture(furniture.map(item => {
      if (item.id === selectedId) {
        return { ...item, rotation: degrees }
      }
      return item
    }))
  }
  
  // Delete selected furniture
  const deleteSelected = () => {
    if (selectedId) {
      const itemToDelete = furniture.find(item => item.id === selectedId)
      setFurniture(furniture.filter(item => item.id !== selectedId))
      setSelectedId(null)
      showInfo(`Deleted ${itemToDelete.name}`)
    }
  }
  
  // Save the design
  const saveDesign = async () => {
    try {
      setSaving(true)
      
      const designData = {
        name: designName,
        roomConfig,
        furniture
      }
      
      if (isNewDesign) {
        // Create new design
        const newDesign = await designService.createDesign(designData)
        showSuccess('Design saved successfully!')
        // Navigate to edit page for the new design
        navigate(`/editor/${newDesign.id}`)
      } else {
        // Update existing design
        await designService.updateDesign(designId, designData)
        showSuccess('Design updated successfully!')
      }
    } catch (error) {
      console.error('Error saving design:', error)
      showError('Failed to save design. Please try again.')
    } finally {
      setSaving(false)
    }
  }
  
  // View in 3D
  const view3D = () => {
    if (isNewDesign) {
      showInfo('Please save your design first before viewing in 3D')
      return
    }
    
    navigate(`/viewer/${designId}`)
  }
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }
  
  // Add this new effect for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedId) return;
      
      // Rotate with R key
      if (e.key === 'r') {
        updateFurnitureRotation(((selectedItem?.rotation || 0) + 15) % 360);
      }
      
      // Delete with Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedItem, updateFurnitureRotation, deleteSelected]);
  
  // Update the model preview generation effect
  useEffect(() => {
    const generatePreviews = async () => {
      if (furniture.length === 0) return;
      
      debug(`Generating previews for ${furniture.length} furniture items`);
      setLoadingPreviews(true);
      const newPreviews = { ...modelPreviews };
      let updatedPreviews = false;
      
      for (const item of furniture) {
        const cacheKey = `${item.name}-${item.fill}-${item.rotation || 0}`;
        debug(`Processing ${item.name} with color ${item.fill} and rotation ${item.rotation}`);
        
        if (!newPreviews[cacheKey]) {
          try {
            debug(`Creating top-down image for ${item.name}`);
            const imageUrl = await createTopDownImage(item.name, item.fill, item.rotation || 0);
            
            if (imageUrl) {
              debug(`Successfully created image for ${item.name}`);
              newPreviews[cacheKey] = imageUrl;
              updatedPreviews = true;
            } else {
              debug(`Failed to create image for ${item.name}`);
            }
          } catch (error) {
            console.error(`Error generating preview for ${item.name}:`, error);
          }
        } else {
          debug(`Using cached image for ${item.name}`);
        }
      }
      
      if (updatedPreviews) {
        debug("Updating model previews state");
        setModelPreviews(newPreviews);
      }
      
      setLoadingPreviews(false);
    };
    
    generatePreviews();
  }, [furniture]);
  
  // Add this effect to clean up resources
  useEffect(() => {
    // This runs when the component unmounts
    return () => {
      // Clear the top-down image cache
      for (const key in topDownImageCache) {
        delete topDownImageCache[key];
      }
      
      // Clear the model cache
      modelService.clearCache();
    };
  }, []);
  
  // Add this effect at the top of the Editor2D component
  useEffect(() => {
    // Test direct model loading
    const testModel = async () => {
      debug("Testing direct model loading...");
      try {
        const testModelName = "Sofa";
        const model = await modelService.loadModel(testModelName);
        debug(`Successfully loaded test model: ${testModelName}`, model);
        
        // Test image generation
        debug("Testing image generation...");
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 300;
        testCanvas.height = 300;
        
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 1000);
        camera.position.set(0, 8, 0);
        camera.lookAt(0, 0, 0);
        
        const renderer = new THREE.WebGLRenderer({
          canvas: testCanvas,
          antialias: true,
          alpha: true
        });
        
        scene.add(model);
        renderer.render(scene, camera);
        
        debug("Test rendering completed");
        // Clean up test resources
        renderer.dispose();
        
      } catch (error) {
        console.error("Test model loading failed:", error);
      }
    };
    
    testModel();
  }, []);
  
  // Add a loading indicator while models are being loaded
  if (loading || initialLoading) {
    return (
      <Layout title="Editor">
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-lg text-gray-600">
              {loading ? 'Loading your design...' : 'Loading 3D models...'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="2D Room Editor">
      <div className="flex h-[calc(100vh-6rem)] bg-gray-50 -mt-6 overflow-hidden">
        {/* Sidebar */}
        <div 
          className={`bg-white border-r border-gray-200 flex flex-col ${
            sidebarOpen ? 'w-72' : 'w-0'
          } transition-all duration-300 overflow-hidden`}
        >
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">Design Name</label>
              <input
                type="text"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Tabs for mobile */}
          <div className="flex bg-gray-100 border-b border-gray-200 md:hidden">
            <button
              className={`flex-1 py-2 text-sm font-medium ${activeTab === 'room' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('room')}
            >
              Room
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${activeTab === 'furniture' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('furniture')}
            >
              Furniture
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${activeTab === 'actions' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('actions')}
            >
              Actions
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto">
            {/* Room Settings */}
            <div className={`p-4 ${activeTab !== 'room' && 'hidden md:block'}`}>
              <h2 className="text-lg font-medium text-gray-800 mb-4">Room Settings</h2>
              
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Room Width (inch)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="300" 
                      max="1000" 
                      value={roomConfig.width} 
                      onChange={(e) => setRoomConfig({...roomConfig, width: parseInt(e.target.value)})}
                      className="flex-1 accent-indigo-600"
                    />
                    <span className="w-14 text-sm text-gray-600 bg-gray-100 py-1 px-2 rounded text-center font-mono">
                      {roomConfig.width}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Room Height (inch)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="200" 
                      max="1000" 
                      value={roomConfig.height} 
                      onChange={(e) => setRoomConfig({...roomConfig, height: parseInt(e.target.value)})}
                      className="flex-1 accent-indigo-600"
                    />
                    <span className="w-14 text-sm text-gray-600 bg-gray-100 py-1 px-2 rounded text-center font-mono">
                      {roomConfig.height}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Room Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={roomConfig.color} 
                      onChange={(e) => setRoomConfig({...roomConfig, color: e.target.value})}
                      className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm font-mono bg-gray-100 py-1 px-2 rounded flex-1 text-gray-600 whitespace-nowrap overflow-hidden">
                      {roomConfig.color}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Wall Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={roomConfig.wallColor} 
                      onChange={(e) => setRoomConfig({...roomConfig, wallColor: e.target.value})}
                      className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm font-mono bg-gray-100 py-1 px-2 rounded flex-1 text-gray-600 whitespace-nowrap overflow-hidden">
                      {roomConfig.wallColor}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Furniture Options */}
            <div className={`p-4 ${activeTab !== 'furniture' && 'hidden md:block'}`}>
              <h2 className="text-lg font-medium text-gray-800 mb-4">Add Furniture</h2>
              
              <div className="grid grid-cols-2 gap-2 mb-6">
                {furnitureTypes.map(item => (
                  <button 
                    key={item.type}
                    onClick={() => addFurniture(item.type)}
                    className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                  >
                    <span className="text-2xl mb-1">{item.icon}</span>
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </button>
                ))}
              </div>
              
              {selectedItem && (
                <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">{selectedItem.name}</span>
                    <span className="text-xs py-0.5 px-2 bg-indigo-100 text-indigo-700 rounded-full">Selected</span>
                  </h3>
                  
                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700">Color</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={selectedItem.fill} 
                        onChange={(e) => updateFurnitureColor(e.target.value)}
                        className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <span className="text-sm font-mono bg-gray-100 py-1 px-2 rounded flex-1 text-gray-600">
                        {selectedItem.fill}
                      </span>
                    </div>
                  </div>
                  
                  {/* Add rotation control */}
                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700 flex justify-between">
                      <span>Rotation</span>
                      <span className="text-gray-500 font-mono">{selectedItem.rotation || 0}°</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0" 
                        max="360" 
                        step="15"
                        value={selectedItem.rotation || 0} 
                        onChange={(e) => updateFurnitureRotation(parseInt(e.target.value))}
                        className="flex-1 accent-indigo-600"
                      />
                      <button 
                        onClick={() => updateFurnitureRotation(((selectedItem.rotation || 0) + 90) % 360)}
                        className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        title="Rotate 90°"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    onClick={deleteSelected}
                    className="w-full px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Delete Item
                  </button>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className={`p-4 ${activeTab !== 'actions' && 'hidden md:block'}`}>
              <h2 className="text-lg font-medium text-gray-800 mb-4">Actions</h2>
              
              <div className="space-y-3">
                <button 
                  onClick={saveDesign}
                  disabled={saving}
                  className="w-full px-4 py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                      </svg>
                      <span>Save Design</span>
                    </>
                  )}
                </button>
                
                <button 
                  onClick={view3D}
                  disabled={isNewDesign}
                  className="w-full px-4 py-3 text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
                  </svg>
                  <span>View in 3D</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Editor Area */}
        <div className="flex-grow flex flex-col relative" ref={editorContainerRef}>
          {/* Toggle sidebar button */}
          <button
            onClick={toggleSidebar}
            className="absolute top-4 left-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {sidebarOpen ? (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
              </svg>
            )}
          </button>
          
          {/* Canvas container */}
          <div className="flex-grow flex items-center justify-center p-4 bg-gray-100 overflow-auto">
            <div className="relative">
              {/* Help tooltip */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1.5 rounded-full shadow-md text-xs text-gray-600 whitespace-nowrap">
                {selectedId 
                  ? "Drag to move" 
                  : "Click an item to select it"}
              </div>
              
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <Stage 
                  width={roomConfig.width} 
                  height={roomConfig.height} 
                  onMouseDown={checkDeselect}
                  onTouchStart={checkDeselect}
                  className="border border-gray-200"
                >
                  <Layer>
                    {/* Room Background */}
                    <Rect 
                      width={roomConfig.width} 
                      height={roomConfig.height} 
                      fill={roomConfig.color} 
                    />
                    
                    {/* Furniture - Use the FurnitureItem component */}
                    {furniture.map(item => {
                      const cacheKey = `${item.name}-${item.fill}-${item.rotation || 0}`;
                      const imageUrl = modelPreviews[cacheKey];
                      
                      return (
                        <FurnitureItem
                          key={item.id}
                          item={item}
                          isSelected={selectedId === item.id}
                          imageUrl={imageUrl}
                          onSelect={setSelectedId}
                          onDragEnd={(e) => {
                            const newFurniture = furniture.map(f => {
                              if (f.id === item.id) {
                                return {
                                  ...f,
                                  x: e.target.x(),
                                  y: e.target.y()
                                }
                              }
                              return f
                            })
                            setFurniture(newFurniture)
                          }}
                          onTransformEnd={(e) => {
                            const node = e.target
                            const newFurniture = furniture.map(f => {
                              if (f.id === item.id) {
                                return {
                                  ...f,
                                  x: node.x(),
                                  y: node.y(),
                                  width: node.width() * node.scaleX(),
                                  height: node.height() * node.scaleY(),
                                  rotation: node.rotation()
                                }
                              }
                              return f
                            })
                            setFurniture(newFurniture)
                          }}
                        />
                      );
                    })}
                    
                    {/* Transformer for selected item */}
                    {selectedId && (
                      <Transformer
                        ref={transformerRef}
                        rotateEnabled={true}
                        boundBoxFunc={(oldBox, newBox) => {
                          // Limit size
                          if (newBox.width < 20 || newBox.height < 20) {
                            return oldBox
                          }
                          return newBox
                        }}
                        anchorStroke="#4F46E5"
                        anchorFill="#4F46E5"
                        anchorSize={8}
                        borderStroke="#4F46E5"
                        borderDash={[2, 2]}
                        anchorCornerRadius={2}
                        attachTo={furniture.find(item => item.id === selectedId)}
                      />
                    )}
                  </Layer>
                </Stage>
              </div>
            </div>
          </div>
          
          {/* Status bar */}
          <div className="h-10 bg-white border-t border-gray-200 px-4 flex items-center justify-between text-xs text-gray-600">
            <div>
              Size: {roomConfig.width} × {roomConfig.height}
            </div>
            <div>
              Items: {furniture.length}
            </div>
            <div>
              {selectedItem ? `Selected: ${selectedItem.name}` : 'No item selected'}
            </div>
          </div>
          
          {/* Add a loading indicator while generating previews */}
          {loadingPreviews && (
            <div className="absolute top-2 right-2 z-50 bg-white bg-opacity-80 px-3 py-1 rounded-full text-sm text-gray-700 flex items-center">
              <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2"></div>
              Loading models...
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Editor2D 