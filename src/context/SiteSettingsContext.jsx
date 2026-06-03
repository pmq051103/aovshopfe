import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api from '../api/axios'

const SiteSettingsContext = createContext({})

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(() => {
    return api.get('/settings/public')
      .then(r => setSettings(r.data.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    // Fetch lần đầu
    fetchSettings()

    // Poll mỗi 10 giây để cập nhật maintenance_mode kịp thời
    const interval = setInterval(fetchSettings, 10_000)
    return () => clearInterval(interval)
  }, [fetchSettings])

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refetch: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}
