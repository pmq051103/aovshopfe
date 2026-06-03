import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'

export default function Footer() {
  const { settings } = useSiteSettings()

  const siteName = settings.site_name || 'LQ SHOP'
  const siteDescription = settings.site_description || 'Nền tảng mua bán tài khoản Liên Quân Mobile uy tín #1 Việt Nam. Giao dịch an toàn, bảo hành tài khoản 7 ngày.'

  const socials = [
    { label: 'Facebook', url: settings.facebook_url },
    { label: 'Discord', url: settings.discord_url },
    { label: 'Youtube', url: settings.youtube_url },
    { label: 'Telegram', url: settings.telegram_url },
    { label: 'Zalo', url: settings.zalo_url },
    { label: 'TikTok', url: settings.tiktok_url },
  ].filter(s => s.url)

  // Fallback nếu chưa set bất kỳ social nào
  const socialList = socials.length > 0 ? socials : [
    { label: 'Facebook', url: '#' },
    { label: 'Discord', url: '#' },
    { label: 'Youtube', url: '#' },
  ]

  return (
    <footer className="relative z-10 border-t border-white/5 bg-dark-800/50 backdrop-blur-sm mt-20">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              {settings.site_logo ? (
                <img src={settings.site_logo} alt={siteName} className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center">
                  <span className="font-gaming font-bold text-white text-xs">
                    {siteName.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <div className="font-gaming text-lg font-bold text-gradient">{siteName.toUpperCase()}</div>
                <div className="text-xs text-white/40">Liên Quân Mobile Store</div>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
              {siteDescription}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {socialList.map(s => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-neon-pink/20 border border-white/10 hover:border-neon-pink/30 text-white/60 hover:text-neon-pink text-xs transition-all"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display font-bold text-white mb-4 text-sm uppercase tracking-wider">Điều Hướng</h3>
            <ul className="space-y-2">
              {[['/', 'Trang Chủ'], ['/shop', 'Shop Acc'], ['/lucky-wheel', 'Vòng Quay'], ['/mystery-box', 'Túi Mù'], ['/ranking', 'Xếp Hạng']].map(([to, label]) => (
                <li key={to}><Link to={to} className="text-white/50 hover:text-neon-pink text-sm transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-white mb-4 text-sm uppercase tracking-wider">Hỗ Trợ</h3>
            <ul className="space-y-2">
              {['Điều khoản dịch vụ', 'Chính sách bảo mật', 'Hướng dẫn mua hàng', 'Liên hệ hỗ trợ', 'Câu hỏi thường gặp'].map(item => (
                <li key={item}><a href="#" className="text-white/50 hover:text-neon-pink text-sm transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/20">Powered by</span>
            <div className="flex gap-2">
              {['React', 'Node.js', 'MySQL'].map(tech => (
                <span key={tech} className="px-2 py-0.5 rounded bg-white/5 text-white/30 text-xs">{tech}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}