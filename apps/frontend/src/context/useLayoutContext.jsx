'use client'

import { getSystemTheme, toggleAttribute } from '@/utils/layout'
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'
import { useSessionStorage } from 'usehooks-ts'
const debounce = (fn, delay) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}
export const showBackdrop = () => {
  const htmlEl = document.documentElement
  const backdropEl = document.createElement('div')
  backdropEl.id = 'custom-backdrop'
  backdropEl.className = 'offcanvas-backdrop fade show'
  document.body.appendChild(backdropEl)
  document.body.style.overflow = 'hidden'
  htmlEl.classList.add('sidebar-enable')
  if (window.outerWidth > 767) {
    document.body.style.paddingRight = '15px'
  }
  backdropEl.addEventListener('click', () => {
    hideBackdrop()
  })
}
export const hideBackdrop = () => {
  const htmlEl = document.documentElement
  htmlEl.classList.remove('sidebar-enable')
  const backdropEl = document.getElementById('custom-backdrop')
  if (backdropEl) {
    document.body.removeChild(backdropEl)
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  }
}
const INIT_STATE = {
  skin: 'default',
  theme: 'light',
  orientation: 'vertical',
  sidenavSize: 'default',
  sidenavColor: 'light',
  sidenavUser: false,
  topbarColor: 'dark',
  width: 'fluid',
  position: 'fixed',
  dir: 'ltr',
}
const getQueryParams = (state) => {
  if (typeof window === 'undefined') return {}
  const urlParams = new URLSearchParams(window.location.search)
  const queryParams = {}
  Object.keys(state).forEach((key) => {
    const k = key
    const value = urlParams.get(k)
    if (value !== null) {
      if (typeof state[k] === 'boolean') {
        Object.assign(queryParams, {
          [k]: value === 'true' || value === '1',
        })
      } else {
        Object.assign(queryParams, {
          [k]: value,
        })
      }
    }
  })
  return queryParams
}
const LayoutContext = createContext(undefined)
export const useLayoutContext = () => {
  const context = use(LayoutContext)
  if (!context) {
    throw new Error('useLayoutContext can only be used within LayoutProvider')
  }
  return context
}
export const LayoutProvider = ({ children }) => {
  const [settings, setSettings] = useSessionStorage('__THEME_CONFIG__', INIT_STATE, {
    initializeWithValue: false,
  })
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false)
  const updateSettings = useCallback(
    (_newSettings) => {
      setSettings((prevSettings) => ({
        ...prevSettings,
        ..._newSettings,
      }))
    },
    [setSettings]
  )
  const toggleCustomizer = useCallback(() => {
    setIsCustomizerOpen((prevValue) => !prevValue)
  }, [])
  const reset = useCallback(() => {
    setSettings(INIT_STATE)
  }, [setSettings])
  useEffect(() => {
    const queryConfig = getQueryParams(INIT_STATE)
    if (Object.keys(queryConfig).length > 0) {
      updateSettings(queryConfig)
    }
  }, [updateSettings])
  useEffect(() => {
    if (!settings.sidenavSize?.includes('on-hover')) hideBackdrop()
    toggleAttribute('data-layout', settings.orientation === 'horizontal' ? 'topnav' : '')
    toggleAttribute('data-sidenav-user', settings.sidenavUser.toString())
    toggleAttribute('data-layout-position', settings.position)
    toggleAttribute('data-topbar-color', settings.topbarColor)
    toggleAttribute('data-menu-color', settings.sidenavColor)
    toggleAttribute('data-bs-theme', settings.theme === 'system' ? getSystemTheme() : settings.theme)
    toggleAttribute('data-skin', settings.skin)
    toggleAttribute('data-sidenav-size', settings.sidenavSize)
    toggleAttribute('data-layout-width', settings.width)
    toggleAttribute('dir', settings.dir)
  }, [settings])
  useEffect(() => {
    const handleResize = () => {
      const width = window.outerWidth
      if (settings.orientation === 'vertical') {
        if (width <= 768) {
          updateSettings({
            sidenavSize: 'offcanvas',
          })
        } else if (width <= 1140 && settings.sidenavSize !== 'offcanvas') {
          updateSettings({
            sidenavSize: 'condensed',
          })
        } else {
          updateSettings({
            sidenavSize: INIT_STATE.sidenavSize,
          })
        }
      } else if (settings.orientation === 'horizontal') {
        if (width < 992) {
          updateSettings({
            sidenavSize: 'offcanvas',
          })
        } else {
          updateSettings({
            sidenavSize: INIT_STATE.sidenavSize,
          })
        }
      }
    }
    const debouncedResize = debounce(handleResize, 200)
    window.addEventListener('resize', debouncedResize)
    return () => {
      window.removeEventListener('resize', debouncedResize)
    }
  }, [settings.orientation, settings.sidenavSize, updateSettings])
  return (
    <LayoutContext
      value={useMemo(
        () => ({
          ...settings,
          updateSettings,
          isCustomizerOpen,
          toggleCustomizer,
          reset,
        }),
        [settings, updateSettings, isCustomizerOpen, toggleCustomizer, reset]
      )}
    >
      {children}
    </LayoutContext>
  )
}
