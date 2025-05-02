import React from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { useModal } from '../contexts/ModalContext';

const DesignCard = ({ design, onDelete }) => {
  const { showInfo } = useNotification();
  const { confirm } = useModal();

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    confirm(
      `Are you sure you want to delete "${design.name}"?`,
      () => onDelete(design.id),
      'Delete Design'
    );
  };

  const handleView3D = (e) => {
    e.stopPropagation();
    showInfo('Opening 3D view...');
  };

  return (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Thumbnail Preview */}
      <Link to={`/editor/${design.id}`} className="block">
        <div 
          className="relative aspect-[4/3] overflow-hidden"
          style={{ 
            backgroundColor: design.roomConfig?.color || '#F5F5DC',
          }}
        >
          {/* Furniture items preview */}
          {design.furniture && design.furniture.length > 0 && (
            <div className="absolute inset-0 p-2">
              {design.furniture.map(item => (
                <div
                  key={item.id}
                  className="absolute shadow-sm"
                  style={{
                    left: `${(item.x / design.roomConfig.width) * 100}%`,
                    top: `${(item.y / design.roomConfig.height) * 100}%`,
                    width: `${(item.width / design.roomConfig.width) * 100}%`,
                    height: `${(item.height / design.roomConfig.height) * 100}%`,
                    backgroundColor: item.fill || '#8B4513',
                    borderRadius: '2px',
                    transition: 'transform 0.2s ease-in-out'
                  }}
                ></div>
              ))}
            </div>
          )}
          
          {/* Items count badge */}
          <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {design.furniture?.length || 0} items
          </div>
          
          {/* Hover overlay with quick actions */}
          <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="inline-flex items-center px-3 py-1.5 bg-white/90 text-indigo-700 rounded-md text-sm font-medium">
              Click to Edit
            </span>
          </div>
        </div>
      </Link>
      
      {/* Design Info & Actions */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-medium text-gray-800 mb-1 truncate">{design.name}</h3>
        <p className="text-sm text-gray-500 mb-4 flex items-center">
          <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          Last modified: {design.lastModified}
        </p>
        
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
          <div className="flex space-x-1">
            <Link 
              to={`/editor/${design.id}`}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
              Edit
            </Link>
            
            <Link 
              to={`/viewer/${design.id}`}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100 transition-colors"
              onClick={handleView3D}
            >
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
              </svg>
              View 3D
            </Link>
          </div>
          
          <button
            onClick={handleDeleteClick}
            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignCard; 