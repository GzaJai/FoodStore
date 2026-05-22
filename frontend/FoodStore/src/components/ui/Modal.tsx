import { X } from 'lucide-react'
import { useEffect } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlay?: boolean
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
    }
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* Modal content */}
      <div
        className={`
          relative bg-white rounded-2xl shadow-2xl w-full ${sizeStyles[size]}
          animate-in fade-in zoom-in duration-200
        `}
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-6 pt-6 pb-4">
            {title && <h2 className="text-xl font-semibold text-gray-800">{title}</h2>}
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>

        {/* Body */}
        <div className="px-6 pb-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function ModalFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex justify-end gap-2 ${className}`}>{children}</div>
}
