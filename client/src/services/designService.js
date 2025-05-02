import { authService } from './authService';

const DESIGNS_KEY = 'furniture_designs';

const getDesigns = () => {
  const designs = localStorage.getItem(DESIGNS_KEY);
  if (!designs) {

    const initialDesigns = [
      {
        id: '1',
        name: 'Living Room',
        lastModified: '2023-05-10',
        thumbnail: '',
        userId: 'test123',
        roomConfig: {
          width: 500,
          height: 400,
          color: '#F5F5DC',
          wallColor: '#F5F5F5'
        },
        furniture: [
          { id: 1, x: 50, y: 50, width: 100, height: 60, fill: '#8B4513', name: 'Sofa' },
          { id: 2, x: 200, y: 150, width: 80, height: 80, fill: '#A0522D', name: 'Coffee Table' }
        ]
      },
      {
        id: '2',
        name: 'Bedroom',
        lastModified: '2023-05-15',
        thumbnail: '',
        userId: 'test123',
        roomConfig: {
          width: 450,
          height: 350,
          color: '#E6E6FA'
        },
        furniture: [
          { id: 1, x: 150, y: 100, width: 120, height: 200, fill: '#8B4513', name: 'Bed' },
          { id: 2, x: 300, y: 120, width: 50, height: 50, fill: '#A0522D', name: 'Nightstand' }
        ]
      }
    ];
    localStorage.setItem(DESIGNS_KEY, JSON.stringify(initialDesigns));
    return initialDesigns;
  }
  return JSON.parse(designs);
};

const saveDesigns = (designs) => {
  localStorage.setItem(DESIGNS_KEY, JSON.stringify(designs));
};

const getAuthHeader = () => {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const designService = {

  async getDesigns() {

    const designs = localStorage.getItem('furniture_designs');
    return designs ? JSON.parse(designs) : [];
  },
  

  async getDesign(id) {
    const designs = await this.getDesigns();
    const design = designs.find(d => d.id === id);
    
    if (!design) {
      throw new Error('Design not found');
    }
    
    return design;
  },
  

  async createDesign(designData) {
    const designs = await this.getDesigns();
    
    const newDesign = {
      id: Date.now().toString(),
      ...designData,
      lastModified: new Date().toISOString(),
      userId: JSON.parse(localStorage.getItem('user'))._id,
    };
    
    const updatedDesigns = [...designs, newDesign];
    localStorage.setItem('furniture_designs', JSON.stringify(updatedDesigns));
    
    return newDesign;
  },
  

  async updateDesign(id, designData) {
    const designs = await this.getDesigns();
    const index = designs.findIndex(d => d.id === id);
    
    if (index === -1) {
      throw new Error('Design not found');
    }
    
    const updatedDesign = {
      ...designs[index],
      ...designData,
      lastModified: new Date().toISOString(),
    };
    
    designs[index] = updatedDesign;
    localStorage.setItem('furniture_designs', JSON.stringify(designs));
    
    return updatedDesign;
  },
  
  async deleteDesign(id) {
    const designs = await this.getDesigns();
    const updatedDesigns = designs.filter(d => d.id !== id);
    
    localStorage.setItem('furniture_designs', JSON.stringify(updatedDesigns));
    
    return true;
  },
};

export default designService; 