import React, { createContext, useContext, useState, useCallback } from 'react'
import ConfirmationModal from '../components/ConfirmationModal'

const ModalContext = createContext()

export const useModal = () => useContext(ModalContext)

export const ModalProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: () => {},
    confirmButtonClass: 'bg-red-600 hover:bg-red-700'
  })
  
  const openModal = useCallback((config) => {
    setModalConfig({
      ...modalConfig,
      isOpen: true,
      ...config
    })
  }, [modalConfig])
  
  const closeModal = useCallback(() => {
    setModalConfig({
      ...modalConfig,
      isOpen: false
    })
  }, [modalConfig])
  
  // Shorthand method for confirmation dialogs
  const confirm = useCallback((
    message, 
    onConfirm, 
    title = 'Confirm Action',
    options = {}
  ) => {
    openModal({
      title,
      message,
      onConfirm,
      ...options
    })
  }, [openModal])
  
  return (
    <ModalContext.Provider value={{ openModal, closeModal, confirm }}>
      {children}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
        confirmButtonClass={modalConfig.confirmButtonClass}
      />
    </ModalContext.Provider>
  )
} 