'use client'

import { create } from 'zustand'

export type NotificationVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark'

export type ShowNotificationInput = {
  title?: string
  message: string
  variant?: NotificationVariant
  delay?: number
}

type NotificationState = {
  show: boolean
  title?: string
  message: string
  variant: NotificationVariant
  delay: number
}

type NotificationActions = {
  showNotification: (notification: ShowNotificationInput) => void
  hideNotification: () => void
}

export type NotificationStore = NotificationState & NotificationActions

const DEFAULT_NOTIFICATION: NotificationState = {
  show: false,
  title: '',
  message: '',
  variant: 'light',
  delay: 2000,
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  ...DEFAULT_NOTIFICATION,
  showNotification: ({ title = '', message, variant = 'light', delay = 2000 }) => {
    set({
      show: true,
      title,
      message,
      variant,
      delay,
    })
  },
  hideNotification: () => {
    set(DEFAULT_NOTIFICATION)
  },
}))
