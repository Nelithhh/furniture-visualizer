import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Header from '../components/Header'
import { designService } from '../services/designService'
import { modelService } from '../services/modelService'
import { useNotification } from '../contexts/NotificationContext'

// 3D model mapping configuration
const MODEL_MAP = {
  'Sofa': '/models/canba.glb',
  'Table': '/models/table.glb',
  'Bed': '/models/bed-2.glb',
  'Bookshelf': '/models/bookshelf.glb', 
  'Dresser': '/models/dresser.glb',
  'Plant': '/models/plant.glb',
  'default': '/models/cube.glb'
};

// Model scale factors (adjust based on actual models)
const MODEL_SCALES = {
  'Sofa': 0.5,
  'Table': 0.4,
  'Bed': 0.6,
  'Bookshelf': 0.45,
  'Dresser': 0.4,
  'Plant': 0.3,
  'default': 0.5
};

// Model Y-Position adjustments (for floor alignment)
const MODEL_Y_POSITIONS = {
  'Sofa': 0,
  'Table': 0,
  'Bed': 0,
  'Bookshelf': 0,
  'Dresser': 0,
  'Plant': 0,
  'default': 0
};

// Model rotation adjustments (in radians)
const MODEL_ROTATIONS = {
  'Sofa': 0,
  'Table': 0,
  'Bed': 0,
  'Bookshelf': 0,
  'Dresser': 0,
  'Plant': 0,
  'default': 0
};

const Viewer3D = () => {
  const { designId } = useParams()
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [totalModels, setTotalModels] = useState(0)
  const [modelsLoaded, setModelsLoaded] = useState(0)
  const [design, setDesign] = useState(null)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('3d') // '3d' or 'topDown'
  const [showGrid, setShowGrid] = useState(true)
  const [showWalls, setShowWalls] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [ambientLightIntensity, setAmbientLightIntensity] = useState(0.5)
  const [directionalLightIntensity, setDirectionalLightIntensity] = useState(1)
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 5, z: 10 })
  const [selectedModelId, setSelectedModelId] = useState(null)
  
  const { showInfo, showError } = useNotification()
  const navigate = useNavigate()
  
  // Fetch design data
  useEffect(() => {
    const fetchDesign = async () => {
      try {
        const data = await designService.getDesign(designId)
        setDesign(data)
        setTotalModels(data.furniture.length)
      } catch (err) {
        console.error('Error fetching design:', err)
        setError('Failed to load design')
        showError('Failed to load design data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchDesign()
  }, [designId, showError])
  
  // Setup and render 3D scene once design data is loaded
  useEffect(() => {
    if (loading || error || !design || !containerRef.current) return
    
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0xf0f0f0)
    
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 5, 10)
    
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer
    
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 3
    controls.maxDistance = 20
    controls.maxPolarAngle = Math.PI / 2 - 0.05
    controlsRef.current = controls
    
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientLightIntensity)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, directionalLightIntensity)
    directionalLight.position.set(5, 10, 7.5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 1024
    directionalLight.shadow.mapSize.height = 1024
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50
    scene.add(directionalLight)
    
    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5)
    scene.add(hemisphereLight)
    
    const scale = 0.02
    
    const roomWidth = design.roomConfig.width * scale
    const roomDepth = design.roomConfig.height * scale
    
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth)
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: design.roomConfig.color,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.2
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)
    
    const wallHeight = 3
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(design.roomConfig.wallColor || '#F5F5F5'),
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide
    })
    
    const backWallGeometry = new THREE.PlaneGeometry(roomWidth, wallHeight)
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial)
    backWall.position.set(0, wallHeight / 2, -roomDepth / 2)
    backWall.castShadow = true
    backWall.receiveShadow = true
    backWall.visible = showWalls
    scene.add(backWall)
    
    const leftWallGeometry = new THREE.PlaneGeometry(roomDepth, wallHeight)
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial)
    leftWall.position.set(-roomWidth / 2, wallHeight / 2, 0)
    leftWall.rotation.y = Math.PI / 2
    leftWall.castShadow = true
    leftWall.receiveShadow = true
    leftWall.visible = showWalls
    scene.add(leftWall)
    
    const rightWallGeometry = new THREE.PlaneGeometry(roomDepth, wallHeight)
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial)
    rightWall.position.set(roomWidth / 2, wallHeight / 2, 0)
    rightWall.rotation.y = -Math.PI / 2
    rightWall.castShadow = true
    rightWall.receiveShadow = true
    rightWall.visible = showWalls
    scene.add(rightWall)
    
    const gridHelper = new THREE.GridHelper(10, 10)
    gridHelper.visible = showGrid
    scene.add(gridHelper)
    
    const gltfLoader = new GLTFLoader()
    const loadingManager = new THREE.LoadingManager()
    
    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      setLoadingProgress(Math.floor((itemsLoaded / itemsTotal) * 100))
    }
    
    const loadModel = async (item) => {
      const x = (item.x * scale) - (roomWidth / 2) + (item.width * scale / 2)
      const z = (item.y * scale) - (roomDepth / 2) + (item.height * scale / 2)
      
      try {
        const model = await modelService.loadModel(item.name);
        model.userData = { itemId: item.id };
        modelService.applyMaterial(model, item.fill);
        
        if (selectedModelId === item.id) {
          model.traverse(child => {
            if (child.isMesh) {
              child.material.emissive = new THREE.Color(0x333333);
            }
          });
        }
        
        const config = modelService.getModelConfig(item.name);
        model.scale.set(config.scale, config.scale, config.scale);
        model.position.set(x, config.yPosition, z);
        model.rotation.y = THREE.MathUtils.degToRad(item.rotation || 0);
        
        scene.add(model);
        setModelsLoaded(prev => prev + 1);
        return model;
      } catch (error) {
        console.error(`Failed to load model for ${item.name}:`, error);
        
        const width = item.width * scale;
        const depth = item.height * scale;
        const height = 1;
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ color: item.fill });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.set(x, height / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        scene.add(mesh);
        setModelsLoaded(prev => prev + 1);
        return mesh;
      }
    }
    
    const loadAllModels = async () => {
      try {
        const promises = design.furniture.map(item => loadModel(item))
        const models = await Promise.all(promises)
        return models;
      } catch (error) {
        console.error('Error loading models:', error)
        return [];
      }
    }
    
    let models = [];
    loadAllModels().then(loadedModels => {
      models = loadedModels;
    });
    
    const setTopDownView = () => {
      camera.position.set(0, 15, 0)
      camera.lookAt(0, 0, 0)
      controls.maxPolarAngle = Math.PI / 4
    }
    
    const setRegularView = () => {
      camera.position.set(0, 5, 10)
      camera.lookAt(0, 0, 0)
      controls.maxPolarAngle = Math.PI / 2 - 0.05
    }
    
    if (viewMode === 'topDown') {
      setTopDownView()
    }
    
    const toggleWalls = () => {
      const newValue = !showWalls
      setShowWalls(newValue)
      if (window.viewer3d) {
        window.viewer3d.toggleWalls(newValue)
      }
      showInfo(newValue ? 'Walls shown' : 'Walls hidden')
    }
    
    const toggleGrid = () => {
      const newValue = !showGrid
      setShowGrid(newValue)
      if (window.viewer3d) {
        window.viewer3d.toggleGrid(newValue)
      }
      showInfo(newValue ? 'Grid shown' : 'Grid hidden')
    }
    
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    
    animate()
    
    const handleResize = () => {
      if (!containerRef.current) return
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    
    window.addEventListener('resize', handleResize)
    
    window.viewer3d = {
      setViewMode: (mode) => {
        if (mode === 'topDown') {
          setTopDownView()
        } else {
          setRegularView()
        }
      },
      toggleWalls,
      toggleGrid
    }
    
    return () => {
      window.removeEventListener('resize', handleResize)
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      
      delete window.viewer3d
      
      models.forEach(model => {
        scene.remove(model);
      });
      
      modelService.clearCache();
    }
  }, [loading, error, design, showWalls, showGrid, viewMode, showInfo])
  
  const changeViewMode = (mode) => {
    setViewMode(mode)
    if (window.viewer3d) {
      window.viewer3d.setViewMode(mode)
    }
    showInfo(mode === 'topDown' ? 'Top down view' : '3D perspective view')
  }
  
  const toggleWalls = () => {
    const newValue = !showWalls
    setShowWalls(newValue)
    if (window.viewer3d) {
      window.viewer3d.toggleWalls(newValue)
    }
    showInfo(newValue ? 'Walls shown' : 'Walls hidden')
  }
  
  const toggleGrid = () => {
    const newValue = !showGrid
    setShowGrid(newValue)
    if (window.viewer3d) {
      window.viewer3d.toggleGrid(newValue)
    }
    showInfo(newValue ? 'Grid shown' : 'Grid hidden')
  }
  
  useEffect(() => {
    const preloadAllModels = async () => {
      try {
        await modelService.preloadModels((loaded, total) => {
          setLoadingProgress(Math.floor((loaded / total) * 50));
        });
      } catch (error) {
        console.error('Error preloading models:', error);
      }
    };
    
    preloadAllModels();
    
    return () => {
      modelService.clearCache();
    };
  }, []);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  useEffect(() => {
    if (!controlsRef.current || !loading) return;
    
    const camera = controlsRef.current.object;
    camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    camera.lookAt(0, 0, 0);
    controlsRef.current.update();
    
  }, [cameraPosition, loading]);
  
  const handleModelClick = () => {
    if (!containerRef.current || !sceneRef.current) return;
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const onClick = (event) => {
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, controlsRef.current.object);
      
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
      
      if (intersects.length > 0) {
        let foundModel = null;
        
        for (let i = 0; i < intersects.length; i++) {
          let obj = intersects[i].object;
          while (obj && (!obj.userData || !obj.userData.itemId)) {
            obj = obj.parent;
          }
          
          if (obj && obj.userData && obj.userData.itemId) {
            foundModel = obj;
            break;
          }
        }
        
        if (foundModel) {
          const newSelectedId = foundModel.userData.itemId;
          
          if (selectedModelId) {
            sceneRef.current.traverse(child => {
              if (child.userData && child.userData.itemId === selectedModelId) {
                child.traverse(subChild => {
                  if (subChild.isMesh && subChild.material) {
                    subChild.material.emissive = new THREE.Color(0x000000);
                    subChild.material.emissiveIntensity = 0;
                  }
                });
              }
            });
          }
          
          foundModel.traverse(child => {
            if (child.isMesh && child.material) {
              child.material.emissive = new THREE.Color(0x333333);
              child.material.emissiveIntensity = 0.5;
            }
          });
          
          setSelectedModelId(newSelectedId);
          showInfo(`Selected: ${design.furniture.find(item => item.id === newSelectedId)?.name}`);
          return;
        }
      }
      
      if (selectedModelId) {
        sceneRef.current.traverse(child => {
          if (child.userData && child.userData.itemId === selectedModelId) {
            child.traverse(subChild => {
              if (subChild.isMesh && subChild.material) {
                subChild.material.emissive = new THREE.Color(0x000000);
                subChild.material.emissiveIntensity = 0;
              }
            });
          }
        });
      }
      
      setSelectedModelId(null);
    };
    
    containerRef.current.addEventListener('click', onClick);
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', onClick);
      }
    };
  };
  
  useEffect(handleModelClick, [sceneRef.current, containerRef.current]);
  
  const moveSelectedFurniture = (direction) => {
    if (!selectedModelId || !design || !sceneRef.current) return;
    
    const selectedItemIndex = design.furniture.findIndex(item => item.id === selectedModelId);
    if (selectedItemIndex === -1) return;
    
    const updatedFurniture = [...design.furniture];
    const item = updatedFurniture[selectedItemIndex];
    
    const moveDistance = 10;
    let newX = item.x;
    let newY = item.y;
    
    switch(direction) {
      case 'left':
        newX = Math.max(0, item.x - moveDistance);
        break;
      case 'right':
        newX = Math.min(design.roomConfig.width - item.width, item.x + moveDistance);
        break;
      case 'up':
        newY = Math.max(0, item.y - moveDistance);
        break;
      case 'down':
        newY = Math.min(design.roomConfig.height - item.height, item.y + moveDistance);
        break;
      default:
        break;
    }
    
    const scale = 0.02;
    const roomWidth = design.roomConfig.width * scale;
    const roomDepth = design.roomConfig.height * scale;
    
    const x = (newX * scale) - (roomWidth / 2) + (item.width * scale / 2);
    const z = (newY * scale) - (roomDepth / 2) + (item.height * scale / 2);
    
    let modelFound = false;
    sceneRef.current.traverse(child => {
      if (child.userData && child.userData.itemId === selectedModelId) {
        child.position.x = x;
        child.position.z = z;
        modelFound = true;
      }
    });
    
    if (!modelFound) {
      console.warn('Could not find 3D model for item:', selectedModelId);
      return;
    }
    
    updatedFurniture[selectedItemIndex] = { ...item, x: newX, y: newY };
    
    setDesign({...design, furniture: updatedFurniture});
    
    showInfo(`Moved ${item.name} ${direction}`);
  };
  
  const rotateSelectedFurniture = (degrees) => {
    if (!selectedModelId || !design || !sceneRef.current) return;
    
    const selectedItemIndex = design.furniture.findIndex(item => item.id === selectedModelId);
    if (selectedItemIndex === -1) return;
    
    const updatedFurniture = [...design.furniture];
    const item = updatedFurniture[selectedItemIndex];
    
    const currentRotation = item.rotation || 0;
    let newRotation = (currentRotation + degrees) % 360;
    if (newRotation < 0) newRotation += 360;
    
    let modelFound = false;
    sceneRef.current.traverse(child => {
      if (child.userData && child.userData.itemId === selectedModelId) {
        child.rotation.y = THREE.MathUtils.degToRad(newRotation);
        modelFound = true;
      }
    });
    
    if (!modelFound) {
      console.warn('Could not find 3D model for item:', selectedModelId);
      return;
    }
    
    updatedFurniture[selectedItemIndex] = { ...item, rotation: newRotation };
    
    setDesign({...design, furniture: updatedFurniture});
    
    showInfo(`Rotated ${item.name} to ${newRotation}°`);
  };
  
  const updateFurnitureRotation = (degrees) => {
    if (!selectedModelId || !design || !sceneRef.current) return;
    
    const selectedItemIndex = design.furniture.findIndex(item => item.id === selectedModelId);
    if (selectedItemIndex === -1) return;
    
    const updatedFurniture = [...design.furniture];
    const item = updatedFurniture[selectedItemIndex];
    
    const newRotation = parseInt(degrees);
    
    let modelFound = false;
    sceneRef.current.traverse(child => {
      if (child.userData && child.userData.itemId === selectedModelId) {
        child.rotation.y = THREE.MathUtils.degToRad(newRotation);
        modelFound = true;
      }
    });
    
    if (!modelFound) {
      console.warn('Could not find 3D model for item:', selectedModelId);
      return;
    }
    
    updatedFurniture[selectedItemIndex] = { ...item, rotation: newRotation };
    
    setDesign({...design, furniture: updatedFurniture});
  };
  
  const saveChanges = async () => {
    if (!design) return;
    
    try {
      const saveButton = document.getElementById('save-changes-button');
      if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
      }
      
      await designService.updateDesign(designId, design);
      
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
      }
      
      showInfo('Design updated successfully');
    } catch (error) {
      console.error('Error saving design:', error);
      
      const saveButton = document.getElementById('save-changes-button');
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
      }
      
      showError('Failed to save changes: ' + (error.message || 'Unknown error'));
    }
  };
  
  const updateAmbientLight = (intensity) => {
    setAmbientLightIntensity(intensity);
    sceneRef.current.children.forEach(child => {
      if (child.isAmbientLight) {
        child.intensity = intensity;
      }
    });
  };
  
  const updateDirectionalLight = (intensity) => {
    setDirectionalLightIntensity(intensity);
    sceneRef.current.children.forEach(child => {
      if (child.isDirectionalLight) {
        child.intensity = intensity;
      }
    });
  };

  useEffect(() => {
    if (!selectedModelId || !design) return;
    
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key.toLowerCase()) {
        case 'w':
          moveSelectedFurniture('up');
          break;
        case 'a':
          moveSelectedFurniture('left');
          break;
        case 's':
          moveSelectedFurniture('down');
          break;
        case 'd':
          moveSelectedFurniture('right');
          break;
        case 'q':
          rotateSelectedFurniture(-15);
          break;
        case 'e':
          rotateSelectedFurniture(15);
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedModelId, design, moveSelectedFurniture, rotateSelectedFurniture]);
  
  const updateWallColor = (color) => {
    if (!sceneRef.current) return;
    
    sceneRef.current.traverse((child) => {
      if (child.isMesh && child.material && child.material.name === 'wallMaterial') {
        child.material.color.set(color);
      }
    });
    
    setDesign({
      ...design,
      roomConfig: {
        ...design.roomConfig,
        wallColor: color
      }
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header title="3D Room Viewer" />
        <div className="container p-4 mx-auto">
          <div className="flex items-center justify-center p-8 bg-white rounded-lg shadow">
            <div className="text-center">
              <div className="inline-block w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-lg text-gray-700">Loading 3D model...</p>
              {loadingProgress > 0 && (
                <div className="w-64 h-3 mt-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full" 
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
              )}
              {modelsLoaded > 0 && totalModels > 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  Loading models: {modelsLoaded}/{totalModels}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header title="3D Room Viewer" />
        <div className="container p-4 mx-auto">
          <div className="p-8 bg-red-50 text-red-700 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">Error Loading Design</h3>
            <p>{error}</p>
            <Link to="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="3D Room Viewer" />
      <div className="container p-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-4 md:space-y-0">
          <Link 
            to={`/editor/${designId}`}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Editor
          </Link>
          <div className="flex flex-wrap gap-2">
            <div className="bg-white rounded-md shadow-sm">
              <button
                onClick={() => changeViewMode('3d')}
                className={`px-3 py-2 text-sm rounded-l-md ${viewMode === '3d' 
                  ? 'bg-purple-100 text-purple-700 font-medium' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              >
                3D View
              </button>
              <button
                onClick={() => changeViewMode('topDown')}
                className={`px-3 py-2 text-sm rounded-r-md ${viewMode === 'topDown' 
                  ? 'bg-purple-100 text-purple-700 font-medium' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              >
                Top Down
              </button>
            </div>
            
            <button
              onClick={toggleSidebar}
              className="px-3 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            >
              {sidebarOpen ? 'Hide Controls' : 'Show Controls'}
            </button>
          </div>
        </div>
        
        <div className="flex h-[calc(100vh-14rem)] bg-white rounded-lg shadow-md overflow-hidden">
          <div 
            className={`bg-white border-r border-gray-200 flex flex-col ${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden`}
          >
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-medium text-gray-800">3D Controls</h2>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">View Options</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={toggleGrid}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show Grid</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showWalls}
                      onChange={toggleWalls}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show Walls</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Furniture Controls</h3>
                {selectedModelId ? (
                  <div className="space-y-3">
                    {design.furniture.filter(item => item.id === selectedModelId).map(item => (
                      <div key={item.id} className="mb-3">
                        <div className="flex items-center mb-2">
                          <span 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: item.fill }}
                          ></span>
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                      </div>
                    ))}
                    <div>
                      <label className="block mb-1 text-sm text-gray-700 flex justify-between">
                        <span>Position</span>
                        <span className="text-xs text-gray-500">Use WASD keys</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => moveSelectedFurniture('left')}
                          className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                          title="Move left"
                        >
                          <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => moveSelectedFurniture('up')}
                          className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                          title="Move up"
                        >
                          <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => moveSelectedFurniture('right')}
                          className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                          title="Move right"
                        >
                          <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => moveSelectedFurniture('down')}
                          className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors col-start-2"
                          title="Move down"
                        >
                          <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm text-gray-700 flex justify-between">
                        <span>Rotation</span>
                        <span className="flex items-center">
                          <span className="text-xs text-gray-500 mr-2">Use Q/E keys</span>
                          {design.furniture.find(item => item.id === selectedModelId)?.rotation || 0}°
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => rotateSelectedFurniture(-15)}
                          className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                          title="Rotate counter-clockwise"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                          </svg>
                        </button>
                        <input 
                          type="range" 
                          min="0" 
                          max="360" 
                          step="15" 
                          value={design.furniture.find(item => item.id === selectedModelId)?.rotation || 0} 
                          onChange={(e) => updateFurnitureRotation(parseInt(e.target.value))}
                          className="flex-1 accent-indigo-600"
                        />
                        <button
                          onClick={() => rotateSelectedFurniture(15)}
                          className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                          title="Rotate clockwise"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" transform="scale(-1, 1) translate(-24, 0)"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <button 
                      id="save-changes-button"
                      onClick={saveChanges}
                      className="w-full px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors shadow-sm mt-2"
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-600">
                    <p>Select an item to modify</p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Camera Position</h3>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    onClick={() => {
                      if (controlsRef.current) {
                        setCameraPosition({ x: 0, y: 5, z: 10 });
                        controlsRef.current.reset();
                      }
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Front
                  </button>
                  <button
                    onClick={() => {
                      if (controlsRef.current && sceneRef.current) {
                        setCameraPosition({ x: 0, y: 15, z: 0 });
                        changeViewMode('topDown');
                      }
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Top
                  </button>
                  <button
                    onClick={() => {
                      if (controlsRef.current) {
                        setCameraPosition({ x: 10, y: 5, z: 0 });
                        controlsRef.current.reset();
                      }
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Side
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (controlsRef.current) {
                      setCameraPosition({ x: 0, y: 5, z: 10 });
                      controlsRef.current.reset();
                      changeViewMode('3d');
                    }
                  }}
                  className="w-full px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                >
                  Reset View
                </button>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Room Information</h3>
                
                <div className="space-y-1 text-sm text-gray-700">
                  <p><span className="font-medium">Size:</span> {design.roomConfig.width} × {design.roomConfig.height}</p>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Color:</span>
                    <span 
                      className="inline-block w-4 h-4 rounded-full border border-gray-300 mr-1" 
                      style={{ backgroundColor: design.roomConfig.color }}
                    ></span>
                    <span className="text-xs font-mono">{design.roomConfig.color}</span>
                  </div>
                  <p><span className="font-medium">Items:</span> {design.furniture.length}</p>
                  <p><span className="font-medium">Last Modified:</span> {design.lastModified}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Room Colors</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-sm text-gray-700">Floor Color</label>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: design.roomConfig.color }}
                      ></div>
                      <span className="text-sm font-mono">{design.roomConfig.color}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-sm text-gray-700">Wall Color</label>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: design.roomConfig.wallColor || '#F5F5F5' }}
                      ></div>
                      <span className="text-sm font-mono">{design.roomConfig.wallColor || '#F5F5F5'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {design.furniture.length > 0 && (
                <div>
                  <h3 className="text-md font-medium text-gray-800 mb-3">Furniture Items</h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {design.furniture.map(item => (
                      <div 
                        key={item.id} 
                        className={`text-sm p-2 rounded cursor-pointer flex items-center ${
                          selectedModelId === item.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedModelId(item.id)}
                      >
                        <span 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: item.fill }}
                        ></span>
                        <span>{item.name}</span>
                      </div>
                    ))}  
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Lighting</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-sm text-gray-700 flex justify-between">
                      <span>Ambient Light</span>
                      <span>{(ambientLightIntensity * 100).toFixed(0)}%</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05"
                      value={ambientLightIntensity} 
                      onChange={(e) => updateAmbientLight(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-gray-700 flex justify-between">
                      <span>Directional Light</span>
                      <span>{(directionalLightIntensity * 100).toFixed(0)}%</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="2" 
                      step="0.1"
                      value={directionalLightIntensity} 
                      onChange={(e) => updateDirectionalLight(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-grow relative">
            {!sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="absolute top-4 left-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                aria-label="Show sidebar"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
                </svg>
              </button>
            )}
                 
            <div 
              ref={containerRef} 
              className="w-full h-full bg-white overflow-hidden relative"
            >
              {(modelsLoaded < totalModels && totalModels > 0) && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                  <div className="text-center">
                    <div className="inline-block w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-2 text-sm text-gray-700">Loading models: {modelsLoaded}/{totalModels}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-medium mb-2 text-gray-800">3D Viewer Controls</h2>
          <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
            <li>Left click + drag: Rotate camera</li>
            <li>Right click + drag: Pan camera</li>
            <li>Scroll: Zoom in/out</li>
            <li>Use side panel controls to adjust lighting and view options</li>
            <li>Keyboard shortcuts: <span className="font-mono bg-gray-100 px-1 rounded">W</span> (up), <span className="font-mono bg-gray-100 px-1 rounded">A</span> (left), <span className="font-mono bg-gray-100 px-1 rounded">S</span> (down), <span className="font-mono bg-gray-100 px-1 rounded">D</span> (right), <span className="font-mono bg-gray-100 px-1 rounded">Q</span> (rotate counter-clockwise), <span className="font-mono bg-gray-100 px-1 rounded">E</span> (rotate clockwise)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Viewer3D