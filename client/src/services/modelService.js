import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'

const MODEL_MAP = {
  'Sofa': '/models/canba.glb',
  'Table': '/models/table.glb',
  'Bed': '/models/bed-2.glb',
  'Bookshelf': '/models/bookshelf.glb', 
  'Dresser': '/models/dresser.glb',
  'Plant': '/models/plant.glb',
  'default': '/models/cube.glb'
};

const MODEL_SCALES = {
  'Sofa': 1,
  'Table': 0.18,
  'Bed': 1.9,
  'Bookshelf': 0.45,
  'Dresser': 0.4,
  'Plant': 0.3,
  'default': 0.5
};

const MODEL_Y_POSITIONS = {
  'Sofa': 0,
  'Table': 0.7,
  'Bed': 0.5,
  'Bookshelf': 0.5,
  'Dresser': 0.3,
  'Plant': 0.1,
  'default': 0
};

const MODEL_ROTATIONS = {
  'Sofa': 0,
  'Table': 0,
  'Bed': 0,
  'Bookshelf': 0,
  'Dresser': 0,
  'Plant': 0,
  'default': 0
};

const TOP_DOWN_ADJUSTMENTS = {
  'Sofa': { cameraHeight: 8, rotationOffset: 0, scale: 1.3 },
  'Table': { cameraHeight: 7, rotationOffset: 0, scale: 1.2 },
  'Bed': { cameraHeight: 12, rotationOffset: 0, scale: 1.5 },
  'Bookshelf': { cameraHeight: 10, rotationOffset: 0, scale: 1.4 },
  'Dresser': { cameraHeight: 6, rotationOffset: 0, scale: 1.2 },
  'Plant': { cameraHeight: 5, rotationOffset: 0, scale: 1.0 },
  'default': { cameraHeight: 8, rotationOffset: 0, scale: 1.2 }
};

const modelCache = {};
const loader = new GLTFLoader();

export const modelService = {
  getModelPath(furnitureType) {
    return MODEL_MAP[furnitureType] || MODEL_MAP.default;
  },
  
  getModelConfig(furnitureType) {
    return {
      scale: MODEL_SCALES[furnitureType] || MODEL_SCALES.default,
      yPosition: MODEL_Y_POSITIONS[furnitureType] || MODEL_Y_POSITIONS.default,
      rotation: MODEL_ROTATIONS[furnitureType] || MODEL_ROTATIONS.default
    };
  },
  
  async loadModel(furnitureType) {
    const modelPath = this.getModelPath(furnitureType);
    
    if (modelCache[modelPath]) {
      return modelCache[modelPath].clone();
    }
    
    try {
      const gltf = await this._loadGLTF(modelPath);
      const model = gltf.scene;
      
      modelCache[modelPath] = model.clone();
      
      return model;
    } catch (error) {
      console.error(`Error loading model from ${modelPath}:`, error);
      throw error;
    }
  },
  
  _loadGLTF(path) {
    return new Promise((resolve, reject) => {
      loader.load(
        path,
        (gltf) => resolve(gltf),
        undefined,
        (error) => reject(error)
      );
    });
  },
  
  applyMaterial(model, color) {
    model.traverse((child) => {
      if (child.isMesh) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map(m => {
            const newMaterial = new THREE.MeshStandardMaterial({
              color: new THREE.Color(color),
              roughness: 0.7,
              metalness: 0.2
            });
            if (m.map) newMaterial.map = m.map;
            return newMaterial;
          });
        } else {
          const oldMap = child.material.map;
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            roughness: 0.7,
            metalness: 0.2
          });
          if (oldMap) child.material.map = oldMap;
        }
      }
    });
  },
  
  async preloadModels(progressCallback) {
    const modelPaths = Object.values(MODEL_MAP);
    const total = modelPaths.length;
    let loaded = 0;
    
    for (const path of modelPaths) {
      if (!modelCache[path]) {
        try {
          const gltf = await this._loadGLTF(path);
          modelCache[path] = gltf.scene;
          loaded++;
          if (progressCallback) progressCallback(loaded, total);
        } catch (error) {
          console.error(`Error preloading model from ${path}:`, error);
        }
      }
    }
  },
  
  clearCache() {
    for (const path in modelCache) {
      delete modelCache[path];
    }
  },
  
  getTopDownViewSettings(modelType) {
    return TOP_DOWN_ADJUSTMENTS[modelType] || TOP_DOWN_ADJUSTMENTS.default;
  }
};

export default modelService;