import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faNewspaper, faCalendar, faEye, faTag, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

export default function NewsPage() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTag, setActiveTag] = useState('')

  useEffect(() => { fetchNews() }, [page, activeTag])

  const fetchNews = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 6 })
      if (activeTag) params.append('tag', activeTag)
      const { data } = await api.get(`/news?${params}`)
      setNews(data.data || [])
      setTotalPages(data.totalPages || 1)
    } finally { setLoading(false) }
  }

  const allTags = [...new Set(news.flatMap(n => (n.tags || '').split(',').map(t => t.trim()).filter(Boolean)))]

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-10 px-3 md:px-4 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}
        className="text-center mb-10">
        <h1 className="font-gaming text-3xl font-black text-gradient mb-2">TIN TỨC</h1>
        <p className="text-white/40 text-sm">Cập nhật thông tin mới nhất từ LQ Shop</p>
      </motion.div>

      {/* Tags filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <button onClick={() => { setActiveTag(''); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!activeTag ? 'bg-neon-pink/20 border-neon-pink/30 text-neon-pink' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
              }`}>Tất cả</button>
          {allTags.map(tag => (
            <button key={tag} onClick={() => { setActiveTag(tag); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${activeTag === tag ? 'bg-neon-pink/20 border-neon-pink/30 text-neon-pink' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                }`}>
              <FontAwesomeIcon icon={faTag} className="mr-1 text-[10px]" />{tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-dark-800 rounded-xl h-64 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <FontAwesomeIcon icon={faNewspaper} className="text-4xl mb-3" />
          <p>Chưa có tin tức nào</p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {news.map(n => (
            <motion.div key={n.id} variants={fadeUp}>
              <Link to={`/news/${n.slug}`}
                className="block bg-dark-800 rounded-xl border border-white/5 hover:border-neon-pink/20 overflow-hidden transition-all hover:shadow-lg hover:shadow-neon-pink/5 group">
                {/* Thumbnail */}
                <div className="h-28 md:h-44 overflow-hidden bg-dark-900">
                  {n.thumbnailUrl
                    ? <img src={n.thumbnailUrl} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-white/10">
                      <FontAwesomeIcon icon={faNewspaper} className="text-4xl" />
                    </div>
                  }
                </div>
                {/* Content */}
                <div className="p-2.5 md:p-4">
                  {/* Tags */}
                  {n.tags && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {n.tags.split(',').filter(Boolean).slice(0, 2).map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-neon-purple/20 text-neon-purple border border-neon-purple/20">{t.trim()}</span>
                      ))}
                    </div>
                  )}
                  <h3
  className="
    text-white font-semibold text-xs md:text-sm
    h-8 md:h-10
    leading-4 md:leading-5
    overflow-hidden
    line-clamp-2
    group-hover:text-neon-pink
    transition-colors
  "
>
                    {n.title}
                  </h3>
                  {n.summary && (
                    <p
                      className="
                          text-white/40 text-xs
                          h-10 leading-5
                          overflow-hidden
                          line-clamp-2
                          mb-3
                        "
                    >
                      {n.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-white/30 text-xs">
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faCalendar} />
                      {new Date(n.publishedAt || n.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faEye} /> {n.viewCount}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-2 rounded-lg bg-dark-800 border border-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-colors">
            <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`px-3 py-2 rounded-lg border text-sm transition-colors ${page === i + 1 ? 'bg-neon-pink/20 border-neon-pink/30 text-neon-pink' : 'bg-dark-800 border-white/10 text-white/50 hover:text-white'
                }`}>{i + 1}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-2 rounded-lg bg-dark-800 border border-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-colors">
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
          </button>
        </div>
      )}
    </div>
  )
}
