import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGear,
  faGlobe,
  faCreditCard,
  faMobileScreen,
  faMagnifyingGlass,
  faHouse,
  faFloppyDisk,
  faImage,
  faUpload,
  faCheck,
} from '@fortawesome/free-solid-svg-icons'

import api from '../../api/axios'
import { Spinner } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'

const SETTING_GROUPS = [
  {
    key: 'general',
    label: 'Thông Tin Website',
    icon: faGlobe,
    fields: [
      { key: 'site_name', label: 'Tên website', type: 'text', placeholder: 'LQ Shop' },
      { key: 'site_description', label: 'Mô tả website', type: 'text', placeholder: 'Mua bán acc Liên Quân uy tín' },
      { key: 'site_logo', label: 'Logo website', type: 'image' },
      { key: 'site_favicon', label: 'Favicon', type: 'image' },
      { key: 'maintenance_mode', label: 'Chế độ bảo trì', type: 'toggle' },
      { key: 'maintenance_message', label: 'Thông báo bảo trì', type: 'text', placeholder: 'Website đang bảo trì, vui lòng quay lại sau' },
    ],
  },
  {
    key: 'payment',
    label: 'Cấu Hình Thanh Toán',
    icon: faCreditCard,
    fields: [
      { key: 'bank_code', label: 'Mã ngân hàng', type: 'text', placeholder: 'MB' },
      { key: 'bank_account_number', label: 'Số tài khoản', type: 'text', placeholder: '0123456789' },
      { key: 'bank_account_name', label: 'Tên chủ tài khoản', type: 'text', placeholder: 'NGUYEN VAN A' },
      { key: 'deposit_min', label: 'Nạp tối thiểu (VNĐ)', type: 'number', placeholder: '10000' },
      { key: 'deposit_max', label: 'Nạp tối đa (VNĐ)', type: 'number', placeholder: '50000000' },
      { key: 'deposit_expire_minutes', label: 'Hết hạn QR (phút)', type: 'number', placeholder: '30' },
    ],
  },
  {
    key: 'social',
    label: 'Mạng Xã Hội',
    icon: faMobileScreen,
    fields: [
      { key: 'facebook_url', label: 'Facebook URL', type: 'url', placeholder: 'https://facebook.com/...' },
      { key: 'show_facebook_bubble', label: 'Hiện nút Facebook trên web', type: 'toggle' },
      { key: 'discord_url', label: 'Discord URL', type: 'url', placeholder: 'https://discord.gg/...' },
      { key: 'youtube_url', label: 'YouTube URL', type: 'url', placeholder: 'https://youtube.com/...' },
      { key: 'telegram_url', label: 'Telegram URL', type: 'url', placeholder: 'https://t.me/...' },
      { key: 'tiktok_url', label: 'TikTok URL', type: 'url', placeholder: 'https://tiktok.com/...' },
      { key: 'zalo_url', label: 'Zalo URL', type: 'url', placeholder: 'https://zalo.me/...' },
      { key: 'show_zalo_bubble', label: 'Hiện nút Zalo trên web', type: 'toggle' },
    ],
  },
  {
    key: 'seo',
    label: 'SEO',
    icon: faMagnifyingGlass,
    fields: [
      { key: 'seo_title', label: 'SEO Title', type: 'text', placeholder: 'LQ Shop - Mua Bán Acc Liên Quân Uy Tín #1' },
      { key: 'seo_description', label: 'SEO Description', type: 'textarea', placeholder: 'Mô tả SEO...' },
      { key: 'seo_keywords', label: 'Keywords', type: 'text', placeholder: 'acc liên quân, mua acc, shop acc' },
      { key: 'google_analytics', label: 'Google Analytics ID', type: 'text', placeholder: 'G-XXXXXXXXXX' },
    ],
  },
  {
    key: 'homepage',
    label: 'Trang Chủ',
    icon: faHouse,
    fields: [
      { key: 'hero_title', label: 'Hero Title', type: 'text', placeholder: 'MUA BÁN ACC UY TÍN #1' },
      { key: 'hero_subtitle', label: 'Hero Subtitle', type: 'text', placeholder: 'Giao dịch an toàn...' },
      { key: 'featured_count', label: 'Số acc nổi bật', type: 'number', placeholder: '8' },
      { key: 'new_account_count', label: 'Số acc mới', type: 'number', placeholder: '8' },
      { key: 'show_ranking', label: 'Hiện bảng xếp hạng', type: 'toggle' },
      { key: 'show_wheel_section', label: 'Hiện vòng quay', type: 'toggle' },
      { key: 'show_mystery_box', label: 'Hiện túi mù', type: 'toggle' },
      { key: 'show_chatbox', label: 'Hiện chatbox AI', type: 'toggle' },
      { key: 'video_section_title', label: 'Tiêu đề video', type: 'text', placeholder: 'Hướng dẫn sử dụng' },
      { key: 'video_section_url', label: 'URL video YouTube/embed', type: 'url', placeholder: 'https://www.youtube.com/embed/...' },
      { key: 'show_video_section', label: 'Hiện section video', type: 'toggle' },
    ],
  },
]

function ImageSettingInput({ field, value, file, preview, onFileChange }) {
  const inputId = `setting-image-${field.key}`
  const displayImage = preview || value

  const handleFileChange = e => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh')
      return
    }

    onFileChange(field.key, selectedFile)
  }

  return (
    <div>
      <div
        onClick={() => document.getElementById(inputId)?.click()}
        className="border-2 border-dashed border-white/20 rounded-2xl p-4 cursor-pointer hover:border-neon-pink/50 transition-colors bg-dark-700/40"
      >
        {displayImage ? (
          <div className="relative group">
            <img
              src={displayImage}
              alt={field.label}
              className="w-full h-40 object-contain rounded-xl bg-dark-900 border border-white/10 p-3"
            />

            <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faUpload} />
                Đổi ảnh
              </span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="text-5xl mb-3 text-white/30">
              <FontAwesomeIcon icon={faImage} />
            </div>

            <p className="text-white/60 text-sm font-bold">
              Click để chọn ảnh
            </p>

            <p className="text-white/25 text-xs mt-1">
              Logo / favicon: JPG, PNG, WebP, ICO
            </p>
          </div>
        )}
      </div>

      <input
        id={inputId}
        type="file"
        accept="image/*,.ico"
        onChange={handleFileChange}
        className="hidden"
      />

      {file && (
        <p className="text-neon-green text-xs mt-2 flex items-center gap-1">
          <FontAwesomeIcon icon={faCheck} />
          Đã chọn: {file.name}
        </p>
      )}
    </div>
  )
}

export default function AdminSettings() {
  const [settings, setSettings] = useState({})
  const [imageFiles, setImageFiles] = useState({})
  const [imagePreviews, setImagePreviews] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeGroup, setActiveGroup] = useState('general')
  const [changed, setChanged] = useState({})

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)

    try {
      const { data } = await api.get('/settings')
      const map = {}

      data.data?.forEach(s => {
        map[s.key] = s.value
      })

      setSettings(map)
    } catch (e) {
      toast.error('Lỗi tải cài đặt')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key, value) => {
    setSettings(p => ({
      ...p,
      [key]: value,
    }))

    setChanged(p => ({
      ...p,
      [key]: true,
    }))
  }

  const handleImageFileChange = (key, file) => {
    setImageFiles(p => ({
      ...p,
      [key]: file,
    }))

    setImagePreviews(p => ({
      ...p,
      [key]: URL.createObjectURL(file),
    }))

    setChanged(p => ({
      ...p,
      [key]: true,
    }))
  }

  const handleSaveGroup = async groupKey => {
    const group = SETTING_GROUPS.find(g => g.key === groupKey)
    if (!group) return

    setSaving(true)

    try {
      const settingsToSave = group.fields.map(f => ({
        key: f.key,
        value: settings[f.key] ?? '',
        group: groupKey,
        type:
          f.type === 'toggle'
            ? 'boolean'
            : f.type === 'number'
              ? 'number'
              : 'string',
      }))

      const formData = new FormData()

      formData.append('settings', JSON.stringify(settingsToSave))

      group.fields.forEach(f => {
        if (f.type === 'image' && imageFiles[f.key]) {
          formData.append(f.key, imageFiles[f.key])
        }
      })

      await api.post('/settings/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setChanged(p => {
        const next = { ...p }
        group.fields.forEach(f => delete next[f.key])
        return next
      })

      setImageFiles(p => {
        const next = { ...p }
        group.fields.forEach(f => delete next[f.key])
        return next
      })

      setImagePreviews(p => {
        const next = { ...p }
        group.fields.forEach(f => delete next[f.key])
        return next
      })

      await fetchSettings()

      toast.success('Lưu cài đặt thành công!')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi lưu cài đặt')
    } finally {
      setSaving(false)
    }
  }

  const currentGroup = SETTING_GROUPS.find(g => g.key === activeGroup)
  const hasChanges = currentGroup?.fields.some(f => changed[f.key])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-gaming text-xl font-bold text-gradient flex items-center gap-2">
          <FontAwesomeIcon icon={faGear} />
          Cài Đặt Hệ Thống
        </h1>

        <p className="text-white/40 text-sm">
          Cấu hình website và các tính năng
        </p>
      </div>

      <div className="flex gap-5">
        <div className="w-52 flex-shrink-0 space-y-1">
          {SETTING_GROUPS.map(g => (
            <button
              key={g.key}
              onClick={() => setActiveGroup(g.key)}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-display text-sm transition-all flex items-center gap-2 ${
                activeGroup === g.key
                  ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <FontAwesomeIcon icon={g.icon} className="w-4" />

              <span>{g.label}</span>

              {g.fields.some(f => changed[f.key]) && (
                <span className="ml-auto w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <motion.div
            key={activeGroup}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="gaming-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-white text-lg flex items-center gap-2">
                <FontAwesomeIcon icon={currentGroup?.icon} />
                {currentGroup?.label}
              </h2>

              {hasChanges && (
                <span className="text-yellow-400 text-xs bg-yellow-400/10 border border-yellow-400/20 px-2 py-1 rounded">
                  Có thay đổi chưa lưu
                </span>
              )}
            </div>

            <div className="space-y-5">
              {currentGroup?.fields.map(field => (
                <div key={field.key}>
                  <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">
                    {field.label}
                    {changed[field.key] && (
                      <span className="ml-2 text-yellow-400">●</span>
                    )}
                  </label>

                  {field.type === 'toggle' ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleChange(
                            field.key,
                            settings[field.key] === 'true' ? 'false' : 'true'
                          )
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings[field.key] === 'true'
                            ? 'bg-neon-pink'
                            : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            settings[field.key] === 'true'
                              ? 'translate-x-7'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>

                      <span className="text-white/60 text-sm">
                        {settings[field.key] === 'true' ? 'Đang bật' : 'Đang tắt'}
                      </span>
                    </div>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={settings[field.key] ?? ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="input-gaming resize-none"
                    />
                  ) : field.type === 'image' ? (
                    <ImageSettingInput
                      field={field}
                      value={settings[field.key] ?? ''}
                      file={imageFiles[field.key]}
                      preview={imagePreviews[field.key]}
                      onFileChange={handleImageFileChange}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={settings[field.key] ?? ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="input-gaming"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-8 pt-6 border-t border-white/5">
              <button
                onClick={() => handleSaveGroup(activeGroup)}
                disabled={saving}
                className="btn-primary px-8 py-3 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" color="white" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faFloppyDisk} />
                    Lưu Cài Đặt
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}