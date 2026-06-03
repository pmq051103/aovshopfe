import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../api/axios'
import { formatCurrency, formatDate, getRarityColor, getRarityLabel } from '../../utils/helpers'
import { Spinner, RarityBadge } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faPen,
  faTrash,
  faFloppyDisk,
  faUpload,
  faSearch,
  faGamepad,
  faFilter,
  faCheck,
} from '@fortawesome/free-solid-svg-icons'

const RARITIES = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC']

const defaultForm = {
  categoryId: '',
  gameUsername: '',
  gamePassword: '',
  gameBindInfo: '',
  rarity: 'COMMON',
}

const parseBulkText = (text, categoryId, defaultRarity) => {
  const lines = text.trim().split('\n').filter(l => l.trim())

  return lines.map((line, idx) => {
    const parts = line.split('|').map(p => p.trim())

    // Hỗ trợ 2 format:
    // Format cũ: username|password|bindinfo|rarity
    // Format mới: code|username|password|bindinfo|rarity
    const hasCode = parts.length >= 5
    return {
      categoryId,
      code: hasCode ? parts[0] : '',
      gameUsername: hasCode ? parts[1] : (parts[0] || ''),
      gamePassword: hasCode ? parts[2] : (parts[1] || ''),
      gameBindInfo: hasCode ? parts[3] : (parts[2] || ''),
      rarity: (hasCode ? parts[4] : parts[3]) || defaultRarity,
    }
  })
}

export default function AdminMysteryBoxAccounts() {
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [filters, setFilters] = useState({
    categoryId: 'ALL',
    isSold: 'ALL',
    rarity: 'ALL',
    search: '',
  })

  const [showModal, setShowModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [editAcc, setEditAcc] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const [bulkText, setBulkText] = useState('')
  const [bulkCategoryId, setBulkCategoryId] = useState('')
  const [bulkRarity, setBulkRarity] = useState('COMMON')
  const [bulkParsed, setBulkParsed] = useState([])
  const [bulkImporting, setBulkImporting] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [page, filters])

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/mystery-box/admin/categories')
      setCategories(data.data || [])
    } catch {
      toast.error('Lỗi tải category')
    }
  }

  const fetchAccounts = async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({ page, limit: 10 })

      if (filters.categoryId !== 'ALL') params.append('categoryId', filters.categoryId)
      if (filters.isSold !== 'ALL') params.append('isSold', filters.isSold)
      if (filters.rarity !== 'ALL') params.append('rarity', filters.rarity)
      if (filters.search) params.append('search', filters.search)

      const { data } = await api.get(`/mystery-box/admin/accounts?${params}`)

      setAccounts(data.data || [])
      setTotalPages(data.pagination?.pages || 1)
      setTotal(data.pagination?.total || 0)
    } catch {
      toast.error('Lỗi tải acc')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditAcc(null)
    setForm({
      ...defaultForm,
      categoryId: categories[0]?.id || '',
    })
    setShowModal(true)
  }

  const openEdit = acc => {
    setEditAcc(acc)
    setForm({
      categoryId: acc.categoryId || '',
      code: acc.code || '',
      gameUsername: acc.gameUsername || '',
      gamePassword: acc.gamePassword || '',
      gameBindInfo: acc.gameBindInfo || '',
      rarity: acc.rarity || 'COMMON',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.categoryId || !form.gameUsername || !form.gamePassword) {
      toast.error('Vui lòng chọn category, nhập tài khoản và mật khẩu')
      return
    }

    setSaving(true)

    try {
      const payload = {
        categoryId: form.categoryId,
        code: form.code.trim() || undefined,
        gameUsername: form.gameUsername,
        gamePassword: form.gamePassword,
        gameBindInfo: form.gameBindInfo,
        rarity: form.rarity || 'COMMON',
      }

      if (editAcc) {
        await api.put(`/mystery-box/admin/accounts/${editAcc.id}`, payload)
        toast.success('Cập nhật thành công')
      } else {
        await api.post('/mystery-box/admin/accounts', payload)
        toast.success('Thêm acc thành công')
      }

      setShowModal(false)
      fetchAccounts()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi lưu')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    try {
      await api.delete(`/mystery-box/admin/accounts/${id}`)
      toast.success('Đã xóa acc')
      fetchAccounts()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi xóa')
    }

    setDeleteConfirm(null)
  }

  const handleBulkPreview = () => {
    if (!bulkCategoryId) {
      toast.error('Chọn category trước')
      return
    }

    if (!bulkText.trim()) {
      toast.error('Nhập danh sách acc trước')
      return
    }

    const parsed = parseBulkText(bulkText, bulkCategoryId, bulkRarity)
    setBulkParsed(parsed)
  }

  const handleBulkImport = async () => {
    if (!bulkParsed.length) {
      toast.error('Chưa có data để import')
      return
    }

    setBulkImporting(true)

    try {
      const { data } = await api.post('/mystery-box/admin/accounts/bulk-import', {
        categoryId: bulkCategoryId,
        accounts: bulkParsed,
      })

      toast.success(data.message || `Import thành công ${bulkParsed.length} acc`)
      setShowBulkModal(false)
      setBulkText('')
      setBulkParsed([])
      fetchAccounts()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi bulk import')
    } finally {
      setBulkImporting(false)
    }
  }

  const handleFilterChange = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }))
    setPage(1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-gaming text-xl font-bold text-white flex items-center gap-2">
            <FontAwesomeIcon icon={faGamepad} className="text-neon-pink" />
            Quản Lý Acc Túi Mù
          </h2>

          <p className="text-white/40 text-sm mt-1">
            Tổng {total} acc
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setBulkCategoryId(categories[0]?.id || '')
              setBulkParsed([])
              setBulkText('')
              setShowBulkModal(true)
            }}
            className="btn-neon text-sm px-4 py-2.5 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faUpload} />
            Bulk Import
          </button>

          <button
            onClick={openCreate}
            className="btn-primary text-sm px-4 py-2.5 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            Thêm Acc
          </button>
        </div>
      </div>

      <div className="gaming-card p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm"
              />

              <input
                className="input-gaming w-full pl-9 text-sm py-2"
                placeholder="Tìm tài khoản..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          <select
            className="input-gaming text-sm py-2"
            value={filters.categoryId}
            onChange={e => handleFilterChange('categoryId', e.target.value)}
          >
            <option value="ALL">Tất cả category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="input-gaming text-sm py-2"
            value={filters.rarity}
            onChange={e => handleFilterChange('rarity', e.target.value)}
          >
            <option value="ALL">Tất cả rarity</option>
            {RARITIES.map(r => (
              <option key={r} value={r}>
                {getRarityLabel(r)}
              </option>
            ))}
          </select>

          <select
            className="input-gaming text-sm py-2"
            value={filters.isSold}
            onChange={e => handleFilterChange('isSold', e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="false">Còn hàng</option>
            <option value="true">Đã bán</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="gaming-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Mã</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-left px-4 py-3">Tài khoản</th>
                  <th className="text-left px-4 py-3">Mật khẩu</th>
                  <th className="text-left px-4 py-3">Bind Info</th>
                  <th className="text-left px-4 py-3">Rarity</th>
                  <th className="text-left px-4 py-3">Trạng thái</th>
                  <th className="text-left px-4 py-3">Ngày tạo</th>
                  <th className="text-left px-4 py-3">Hành động</th>
                </tr>
              </thead>

              <tbody>
                {accounts.map(acc => (
                  <tr
                    key={acc.id}
                    className="border-b border-white/5 hover:bg-white/2 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-bold text-neon-pink/80 bg-neon-pink/10 border border-neon-pink/20 px-2 py-0.5 rounded">
                        {acc.code || '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {acc.category?.thumbnail && (
                          <img
                            src={acc.category.thumbnail}
                            alt=""
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}

                        <div>
                          <div className="text-white/70 text-xs">
                            {acc.category?.name || '—'}
                          </div>

                          <div className="text-neon-pink text-xs font-gaming font-bold">
                            {formatCurrency(acc.category?.price)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-white/70 text-xs font-mono">
                        {acc.gameUsername || '—'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-white/50 text-xs font-mono">
                        {acc.gamePassword || '—'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-white/50 text-xs font-mono">
                        {acc.gameBindInfo || '—'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <RarityBadge rarity={acc.rarity} size="xs" />
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          acc.isSold
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : 'bg-green-500/15 text-green-400 border border-green-500/30'
                        }`}
                      >
                        {acc.isSold ? 'Đã bán' : 'Còn hàng'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-white/40 text-xs">
                      {formatDate(acc.createdAt)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!acc.isSold ? (
                          <>
                            <button
                              onClick={() => openEdit(acc)}
                              className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                              title="Sửa"
                            >
                              <FontAwesomeIcon icon={faPen} />
                            </button>

                            <button
                              onClick={() => setDeleteConfirm(acc)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Xóa"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </>
                        ) : (
                          <span className="text-white/20 text-xs">Đã bán</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-white/30">
                      Không có acc nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 border-t border-white/5">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1

                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === p
                        ? 'bg-neon-pink text-black'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !saving && setShowModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative gaming-card w-full max-w-xl my-8 p-6 z-10"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-gaming text-lg font-bold text-white mb-5 flex items-center gap-2">
                <FontAwesomeIcon icon={faGamepad} className="text-neon-pink" />
                {editAcc ? 'Sửa Acc Túi Mù' : 'Thêm Acc Túi Mù'}
              </h3>

              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-white/50 text-xs mb-1.5 uppercase tracking-wider">
                    Category *
                  </label>

                  <select
                    className="input-gaming w-full"
                    value={form.categoryId}
                    onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  >
                    <option value="">Chọn category...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {formatCurrency(c.price)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/50 text-xs mb-1.5 uppercase tracking-wider">
                    Tài khoản *
                  </label>

                  <input
                    className="input-gaming w-full font-mono text-sm"
                    value={form.gameUsername}
                    onChange={e => setForm(f => ({ ...f, gameUsername: e.target.value }))}
                    placeholder="Nhập tài khoản"
                  />
                </div>

                <div>
                  <label className="block text-white/50 text-xs mb-1.5 uppercase tracking-wider">
                    Mật khẩu *
                  </label>

                  <input
                    className="input-gaming w-full font-mono text-sm"
                    value={form.gamePassword}
                    onChange={e => setForm(f => ({ ...f, gamePassword: e.target.value }))}
                    placeholder="Nhập mật khẩu"
                  />
                </div>

                <div>
                  <label className="block text-white/50 text-xs mb-1.5 uppercase tracking-wider">
                    Bind Info email/SĐT
                  </label>

                  <input
                    className="input-gaming w-full font-mono text-sm"
                    value={form.gameBindInfo}
                    onChange={e => setForm(f => ({ ...f, gameBindInfo: e.target.value }))}
                    placeholder="email@gmail.com / 0901234567"
                  />
                </div>

                <div>
                  <label className="block text-white/50 text-xs mb-1.5 uppercase tracking-wider">
                    Rarity
                  </label>

                  <select
                    className="input-gaming w-full"
                    value={form.rarity}
                    onChange={e => setForm(f => ({ ...f, rarity: e.target.value }))}
                  >
                    {RARITIES.map(r => (
                      <option key={r} value={r}>
                        {getRarityLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="btn-neon text-sm px-5 py-2.5"
                >
                  Hủy
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
                >
                  {saving ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <FontAwesomeIcon icon={faFloppyDisk} />
                  )}
                  {editAcc ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !bulkImporting && setShowBulkModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative gaming-card w-full max-w-2xl my-8 p-6 z-10"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-gaming text-lg font-bold text-white mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faUpload} className="text-neon-pink" />
                Bulk Import Acc Túi Mù
              </h3>

              <div className="bg-dark-800/60 rounded-xl p-3 mb-4 text-xs text-white/40 font-mono">
                Format mỗi dòng: username|password|bindInfo|rarity
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-white/50 text-xs mb-1.5 uppercase tracking-wider">
                    Category *
                  </label>

                  <select
                    className="input-gaming w-full text-sm"
                    value={bulkCategoryId}
                    onChange={e => setBulkCategoryId(e.target.value)}
                  >
                    <option value="">Chọn category...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/50 text-xs mb-1.5 uppercase tracking-wider">
                    Rarity mặc định
                  </label>

                  <select
                    className="input-gaming w-full text-sm"
                    value={bulkRarity}
                    onChange={e => setBulkRarity(e.target.value)}
                  >
                    {RARITIES.map(r => (
                      <option key={r} value={r}>
                        {getRarityLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                className="input-gaming w-full h-48 resize-none font-mono text-xs mb-3"
                placeholder={
                  'acc1|pass1|email1@gmail.com|COMMON\nacc2|pass2|0901234567|EPIC\nacc3|pass3||LEGENDARY'
                }
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
              />

              <div className="flex gap-3 mb-4">
                <button
                  onClick={handleBulkPreview}
                  className="btn-neon text-sm px-4 py-2"
                >
                  <FontAwesomeIcon icon={faFilter} className="mr-2" />
                  Preview ({bulkText.split('\n').filter(l => l.trim()).length} dòng)
                </button>
              </div>

              {bulkParsed.length > 0 && (
                <div className="bg-dark-800/60 rounded-xl p-3 mb-4 max-h-40 overflow-y-auto">
                  <div className="text-xs text-white/40 mb-2">
                    Preview {bulkParsed.length} acc:
                  </div>

                  {bulkParsed.slice(0, 10).map((acc, i) => (
                    <div key={i} className="text-xs text-white/60 py-0.5 flex gap-2">
                      <span className="text-white/30">{i + 1}.</span>
                      <span className="font-mono">{acc.gameUsername || '—'}</span>
                      <span className="text-white/30">|</span>
                      <span className="font-mono">{acc.gameBindInfo || '—'}</span>
                      <span className="text-white/30">|</span>
                      <span style={{ color: getRarityColor(acc.rarity) }}>
                        {getRarityLabel(acc.rarity)}
                      </span>
                    </div>
                  ))}

                  {bulkParsed.length > 10 && (
                    <div className="text-xs text-white/30 mt-1">
                      ...và {bulkParsed.length - 10} acc nữa
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowBulkModal(false)}
                  disabled={bulkImporting}
                  className="btn-neon text-sm px-5 py-2.5"
                >
                  Hủy
                </button>

                <button
                  onClick={handleBulkImport}
                  disabled={bulkImporting || !bulkParsed.length}
                  className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
                >
                  {bulkImporting ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <FontAwesomeIcon icon={faCheck} />
                  )}
                  Import {bulkParsed.length} acc
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/70"
              onClick={() => setDeleteConfirm(null)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative gaming-card p-6 max-w-sm w-full z-10 text-center"
            >
              <div className="text-4xl mb-3">⚠️</div>

              <h3 className="font-gaming font-bold text-white mb-2">
                Xóa Acc?
              </h3>

              <p className="text-white/50 text-sm mb-5">
                Xóa acc{' '}
                <strong className="text-white font-mono">
                  {deleteConfirm.gameUsername}
                </strong>
                ?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 btn-neon text-sm py-2.5"
                >
                  Hủy
                </button>

                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors"
                >
                  Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}