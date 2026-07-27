'use client'
import { useNotificationStore, type ShowNotificationInput } from '@/store'
import { type ChildrenType } from '@/types'
import { createContext, use, useEffect, useMemo } from 'react'
import { ToastBody, ToastHeader } from 'react-bootstrap'
import Toast from 'react-bootstrap/Toast'
import ToastContainer from 'react-bootstrap/ToastContainer'

type ToastrProps = {
  show: boolean
  onClose?: () => void
} & ShowNotificationInput

type NotificationContextType = {
  showNotification: (notification: ShowNotificationInput) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

function Toastr({ show, title, message, onClose, variant = 'light', delay }: Readonly<ToastrProps>) {
  return (
    <ToastContainer className="m-3 position-fixed" position="top-end">
      <Toast bg={variant} delay={delay} show={show} onClose={onClose} autohide>
        {title && (
          <ToastHeader className={`text-${variant}`}>
            <strong className="me-auto">{title}</strong>
          </ToastHeader>
        )}
        <ToastBody className={['dark', 'danger', 'success', 'primary'].includes(variant) ? 'text-white' : ''}>{message}</ToastBody>
      </Toast>
    </ToastContainer>
  )
}

export function useNotificationContext() {
  const context = use(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within an NotificationProvider')
  }
  return context
}

export function NotificationProvider({ children }: ChildrenType) {
  const show = useNotificationStore((state) => state.show)
  const title = useNotificationStore((state) => state.title)
  const message = useNotificationStore((state) => state.message)
  const variant = useNotificationStore((state) => state.variant)
  const delay = useNotificationStore((state) => state.delay)
  const showNotification = useNotificationStore((state) => state.showNotification)
  const hideNotification = useNotificationStore((state) => state.hideNotification)

  useEffect(() => {
    if (!show) return

    const timeoutId = window.setTimeout(() => {
      hideNotification()
    }, delay)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [delay, hideNotification, show])

  return (
    <NotificationContext value={useMemo(() => ({ showNotification }), [showNotification])}>
      <Toastr show={show} title={title} message={message} variant={variant} delay={delay} onClose={hideNotification} />
      {children}
    </NotificationContext>
  )
}
