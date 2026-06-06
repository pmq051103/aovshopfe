import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ParticleBackground from '../common/ParticleBackground'
import MobileNav from '../mobile/MobileNav'
import SupportBubble from '../common/SupportBubble'
import AIChatBot from '../common/AIChatBot'
import AnnouncementPopup from '../common/AnnouncementPopup'
import { useSiteSettings } from '../../context/SiteSettingsContext'

export default function MainLayout() {
  const { settings } = useSiteSettings()

  return (
    <div className="min-h-screen bg-animated grid-bg flex flex-col relative">
      <ParticleBackground />
      <Navbar />
      <main className="flex-1 relative z-10 pb-16 lg:pb-0">
        <Outlet />
      </main>
      <div className="hidden lg:block">
        <Footer />
      </div>
      <MobileNav />
      <SupportBubble />
      {settings.show_chatbox !== 'false' && <AIChatBot />}
      <AnnouncementPopup />
    </div>
  )
}