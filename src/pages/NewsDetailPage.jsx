import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faCalendar,
  faEye,
  faTag,
  faNewspaper,
} from '@fortawesome/free-solid-svg-icons'
import 'react-quill/dist/quill.snow.css'

export default function NewsDetailPage() {
  const { slug } = useParams()
  const [news, setNews] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!slug) return

    // Chặn React StrictMode gọi API 2 lần ở môi trường dev
    if (fetchedRef.current) return
    fetchedRef.current = true

    setLoading(true)
    setNotFound(false)

    api.get(`/news/${slug}`)
      .then((r) => {
        setNews(r.data.data)
      })
      .catch(() => {
        setNotFound(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-pink border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !news) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-white/30">
        <FontAwesomeIcon icon={faNewspaper} className="text-5xl" />
        <p>Không tìm thấy bài viết</p>
        <Link to="/news" className="text-neon-pink text-sm hover:underline">
          ← Quay lại tin tức
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen pt-24 pb-10 px-4 max-w-3xl mx-auto"
    >
      {/* Back */}
      <Link
        to="/news"
        className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        Tin tức
      </Link>

      {/* Thumbnail */}
      {news.thumbnailUrl && (
        <div className="rounded-xl overflow-hidden mb-6 border border-white/5">
          <img
            src={news.thumbnailUrl}
            alt={news.title}
            className="w-full max-h-80 object-cover"
          />
        </div>
      )}

      {/* Tags */}
      {news.tags && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {news.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
            .map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-full text-xs bg-neon-purple/20 text-neon-purple border border-neon-purple/20"
              >
                <FontAwesomeIcon icon={faTag} className="mr-1 text-[10px]" />
                {t}
              </span>
            ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-2xl font-gaming font-bold text-white mb-3 leading-snug">
        {news.title}
      </h1>

      {/* Meta */}
      <div className="flex items-center gap-4 text-white/30 text-xs mb-6 pb-6 border-b border-white/5">
        <span className="flex items-center gap-1.5">
          <FontAwesomeIcon icon={faCalendar} />
          {new Date(news.publishedAt || news.createdAt).toLocaleDateString(
            'vi-VN',
            {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }
          )}
        </span>

        <span className="flex items-center gap-1.5">
          <FontAwesomeIcon icon={faEye} />
          {news.viewCount || 0} lượt xem
        </span>
      </div>

      {/* Summary */}
      {news.summary && (
        <p className="text-white/60 text-base leading-relaxed mb-6 italic border-l-2 border-neon-pink/40 pl-4">
          {news.summary}
        </p>
      )}

      {/* Content */}
      <div className="ql-snow">
        <div
          className="
            ql-editor !p-0 !text-white/80 !leading-relaxed
            [&_h1]:!text-white [&_h2]:!text-white [&_h3]:!text-white
            [&_p]:!text-white/80
            [&_strong]:!text-white
            [&_a]:!text-neon-pink
            [&_blockquote]:!border-l-neon-pink/40 [&_blockquote]:!text-white/50
            [&_img]:!rounded-xl [&_img]:!border [&_img]:!border-white/10
            [&_code]:!bg-dark-900 [&_code]:!text-neon-pink
          "
          dangerouslySetInnerHTML={{ __html: news.content }}
        />
      </div>
    </motion.div>
  )
}