import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../api/axios'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { SectionHeader, Pagination, EmptyState, Spinner } from '../../components/common/UIComponents'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClipboardList,
  faMoneyBillWave,
  faCartShopping,
  faCoins,
  faDice,
  faBoxOpen,
  faGift,
  faRotateLeft,
  faRightLeft,
  faXmark,
  faCreditCard,
  faDownload,
  faCopy,
  faCheck,
  faEye,
  faEyeSlash,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'

const TYPE_LABELS = {
  DEPOSIT: { label: 'Nạp tiền', icon: faMoneyBillWave, color: 'text-neon-green' },
  PURCHASE: { label: 'Mua acc', icon: faCartShopping, color: 'text-neon-pink' },
  TOPUP_PURCHASE: { label: 'Nạp Quân Huy', icon: faCoins, color: 'text-yellow-400' },
  SPIN: { label: 'Vòng quay', icon: faDice, color: 'text-yellow-400' },
  MYSTERY_BOX: { label: 'Túi mù', icon: faBoxOpen, color: 'text-purple-400' },
  REWARD: { label: 'Thưởng', icon: faGift, color: 'text-neon-green' },
  REFUND: { label: 'Hoàn tiền', icon: faRotateLeft, color: 'text-blue-400' },
}

const CARD_PURCHASE_STATUS = {
  PENDING: { label: 'Chờ xử lý', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  SUCCESS: { label: 'Thành công', color: 'text-neon-green', bg: 'bg-neon-green/10 border-neon-green/30' },
  FAILED: { label: 'Thất bại', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
}

const CARD_DEPOSIT_STATUS = {
  PENDING: { label: 'Chờ xử lý', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  SUCCESS: { label: 'Thành công', color: 'text-neon-green', bg: 'bg-neon-green/10 border-neon-green/30' },
  WRONG_VALUE: { label: 'Sai mệnh giá', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30' },
  WRONG_AMOUNT: { label: 'Sai mệnh giá', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30' },
  FAILED: { label: 'Thất bại', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
  TIMEOUT: { label: 'Hết thời gian', color: 'text-white/40', bg: 'bg-white/5 border-white/10' },
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`p-1 rounded text-xs transition-all ${copied ? 'text-neon-green' : 'text-white/30 hover:text-white/60'
        }`}
    >
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
    </button>
  )
}

function CardViewModal({ purchase, onClose }) {
  const [show, setShow] = useState(false)
  const cards = purchase?.cards || []

  return (
    <AnimatePresence>
      {purchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative gaming-card p-5 max-w-md w-full z-10 border-neon-green/30"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-white/30 hover:text-white"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>

            <div className="text-center mb-5">
              <FontAwesomeIcon icon={faCreditCard} className="text-4xl text-neon-green mb-3" />

              <div className="font-gaming text-lg font-black text-white">
                THÔNG TIN THẺ ĐÃ MUA
              </div>

              <div className="text-white/40 text-xs mt-1">
                {purchase.quantity}x {purchase.cardConfig?.telcoLabel || purchase.telco}{' '}
                {formatCurrency(purchase.denomination)}
              </div>

              <div className="text-white/30 text-xs mt-1">
                Thời gian mua: {formatDate(purchase.createdAt)}
              </div>
            </div>

            {cards.length === 0 ? (
              <div className="text-center text-white/40 text-sm py-6">
                Chưa có mã thẻ để hiển thị.
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 mb-4">
                {cards.map((card, i) => (
                  <div key={i} className="rounded-xl border border-neon-green/20 bg-neon-green/5 p-3">
                    <div className="text-white/40 text-xs mb-2">
                      Thẻ #{i + 1}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white/40 text-xs">Mã thẻ:</span>
                        <div className="flex items-center gap-1 min-w-0">
                          <code className={`text-neon-green font-mono font-bold text-sm break-all ${show ? '' : 'blur-sm select-none'}`}>
                            {card.pin || card.code || '••••••••••••'}
                          </code>
                          {show && <CopyBtn text={card.pin || card.code || ''} />}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white/40 text-xs">Seri:</span>
                        <div className="flex items-center gap-1 min-w-0">
                          <code className={`text-white/70 font-mono text-xs break-all ${show ? '' : 'blur-sm select-none'}`}>
                            {card.serial || '••••••••••'}
                          </code>
                          {show && <CopyBtn text={card.serial || ''} />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white text-sm flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={show ? faEyeSlash : faEye} />
              {show ? 'Ẩn mã thẻ' : 'Hiện mã thẻ'}
            </button>

            <div className="text-center text-white/30 text-xs flex items-center justify-center gap-2 mt-3">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              Lưu mã ngay sau khi xem.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function TransactionTab() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    fetchData()
  }, [page, filter, fromDate, toDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ page, limit: 15 })
      if (filter) q.append('type', filter)
      if (fromDate) q.append('fromDate', fromDate)
      if (toDate) q.append('toDate', toDate)

      const { data } = await api.get(`/users/transactions?${q}`)
      setTransactions(data.data || [])
      setTotal(data.pagination?.total || 0)
    } catch {
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="gaming-card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1">Loại giao dịch</label>
            <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} className="input-gaming text-sm py-2">
              <option value="">Tất cả</option>
              {Object.entries(TYPE_LABELS).map(([type, info]) => (
                <option key={type} value={type}>{info.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1">Từ ngày</label>
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1) }} className="input-gaming text-sm py-2" />
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1">Đến ngày</label>
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1) }} className="input-gaming text-sm py-2" />
          </div>
        </div>

        {(filter || fromDate || toDate) && (
          <button
            type="button"
            onClick={() => { setFilter(''); setFromDate(''); setToDate(''); setPage(1) }}
            className="mt-3 px-3 py-1.5 rounded-lg text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center gap-1"
          >
            <FontAwesomeIcon icon={faXmark} /> Xóa bộ lọc
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : transactions.length === 0 ? (
        <EmptyState icon={<FontAwesomeIcon icon={faClipboardList} />} title="Không có giao dịch" description="Chưa có giao dịch nào" />
      ) : (
        <div className="space-y-3">
          {transactions.map((tx, i) => {
            const typeInfo = TYPE_LABELS[tx.type] || { label: tx.type, icon: faRightLeft, color: 'text-white' }
            const isPositive = parseFloat(tx.amount) > 0

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="gaming-card p-4 flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isPositive ? 'bg-neon-green/10' : 'bg-neon-pink/10'} ${typeInfo.color}`}>
                  <FontAwesomeIcon icon={typeInfo.icon} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm truncate">
                    {tx.description || typeInfo.label}
                  </div>
                  {tx.gameAccount && (
                    <div className="text-white/30 text-xs mt-0.5">
                      Acc: {tx.gameAccount.code} — {tx.gameAccount.title}
                    </div>
                  )}
                  <div className="text-white/30 text-xs">{formatDate(tx.createdAt)}</div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className={`font-gaming font-bold text-base ${isPositive ? 'text-neon-green' : 'text-neon-pink'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                  </div>
                  <div className="text-white/30 text-xs">Còn: {formatCurrency(tx.balanceAfter)}</div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Pagination page={page} pages={Math.ceil(total / 15)} onPageChange={setPage} />
    </>
  )
}

function CardPurchaseTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTelco, setFilterTelco] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [telcoOptions, setTelcoOptions] = useState([])
  const [viewPurchase, setViewPurchase] = useState(null)

  useEffect(() => {
    api.get('/card/configs?type=buy')
      .then(({ data }) => {
        const unique = [...new Map((data.data || []).map(c => [c.telco, c])).values()]
        setTelcoOptions(unique.map(c => ({ value: c.telco, label: c.telcoLabel || c.telco })))
      })
      .catch(() => setTelcoOptions([]))
  }, [])

  useEffect(() => {
    fetchData()
  }, [page, filterStatus, filterTelco, fromDate, toDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ page, limit: 10 })
      if (filterStatus) q.append('status', filterStatus)
      if (filterTelco) q.append('telco', filterTelco)
      if (fromDate) q.append('fromDate', fromDate)
      if (toDate) q.append('toDate', toDate)

      const { data } = await api.get(`/card/buy/history?${q}`)
      setItems(data.data || [])
      setTotal(data.pagination?.total || 0)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const loadDetail = async id => {
    try {
      const { data } = await api.get(`/card/buy/${id}`)
      setViewPurchase(data.data)
    } catch {
      const item = items.find(x => x.id === id)
      if (item) setViewPurchase(item)
    }
  }

  const hasFilter = filterStatus || filterTelco || fromDate || toDate
  const statusOptions = Object.entries(CARD_PURCHASE_STATUS).map(([value, info]) => ({ value, label: info.label }))

  return (
    <>
      <CardViewModal purchase={viewPurchase} onClose={() => setViewPurchase(null)} />

      <div className="gaming-card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1">Trạng thái</label>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="input-gaming text-sm py-2">
              <option value="">Tất cả</option>
              {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1">Nhà mạng</label>
            <select value={filterTelco} onChange={e => { setFilterTelco(e.target.value); setPage(1) }} className="input-gaming text-sm py-2">
              <option value="">Tất cả</option>
              {telcoOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1">Từ ngày</label>
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1) }} className="input-gaming text-sm py-2" />
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1">Đến ngày</label>
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1) }} className="input-gaming text-sm py-2" />
          </div>
        </div>

        {hasFilter && (
          <button
            type="button"
            onClick={() => { setFilterStatus(''); setFilterTelco(''); setFromDate(''); setToDate(''); setPage(1) }}
            className="mt-3 px-3 py-1.5 rounded-lg text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center gap-1"
          >
            <FontAwesomeIcon icon={faXmark} /> Xóa bộ lọc
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={<FontAwesomeIcon icon={faCreditCard} />} title="Chưa có lịch sử mua thẻ" description="Bạn chưa mua thẻ nào" />
      ) : (
        <div className="space-y-3">
          {items.map((h, i) => {
            const s = CARD_PURCHASE_STATUS[h.status] || CARD_PURCHASE_STATUS.PENDING
            const hasCards = (h.cards || []).length > 0

            return (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="gaming-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-7 flex-shrink-0">
                    {h.cardConfig?.thumbnailUrl ? (
                      <img src={h.cardConfig.thumbnailUrl} className="w-10 h-7 rounded object-cover border border-white/10" alt="" />
                    ) : (
                      <div className="w-10 h-7 rounded bg-neon-green/15 flex items-center justify-center">
                        <FontAwesomeIcon icon={faCreditCard} className="text-neon-green text-xs" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white text-sm">
                        {h.quantity}x {h.cardConfig?.telcoLabel || h.telco} {formatCurrency(h.denomination)}
                      </span>
                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                        {s.label}
                      </span>
                    </div>
                    <div className="text-white/30 text-xs">{formatDate(h.createdAt)}</div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="font-gaming font-bold text-neon-pink">
                      {formatCurrency(h.totalPrice)}
                    </div>
                    <div className="text-white/30 text-xs">Chiết khấu {h.buyDiscount}%</div>
                  </div>

                  {h.status === 'SUCCESS' && (
                    <button
                      type="button"
                      onClick={() => loadDetail(h.id)}
                      disabled={!hasCards}
                      className="px-3 py-1.5 rounded-lg border border-neon-green/30 text-neon-green hover:bg-neon-green/10 text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FontAwesomeIcon icon={faEye} />
                      Xem
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Pagination page={page} pages={Math.ceil(total / 10)} onPageChange={setPage} />
    </>
  )
}

function CardDepositTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTelco, setFilterTelco] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [telcoOptions, setTelcoOptions] = useState([])

  useEffect(() => {
    api.get('/card/configs?type=deposit')
      .then(({ data }) => {
        const unique = [...new Map((data.data || []).map(c => [c.telco, c])).values()]
        setTelcoOptions(unique.map(c => ({ value: c.telco, label: c.telcoLabel || c.telco })))
      })
      .catch(() => setTelcoOptions([]))
  }, [])

  useEffect(() => {
    fetchData()
  }, [page, filterStatus, filterTelco, fromDate, toDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ page, limit: 10 })
      if (filterStatus) q.append('status', filterStatus)
      if (filterTelco) q.append('telco', filterTelco)
      if (fromDate) q.append('fromDate', fromDate)
      if (toDate) q.append('toDate', toDate)

      const { data } = await api.get(`/card/deposit/history?${q}`)
      setItems(data.data || [])
      setTotal(data.pagination?.total || 0)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = Object.entries(CARD_DEPOSIT_STATUS).map(([value, info]) => ({ value, label: info.label }))
  const hasFilter = filterStatus || filterTelco || fromDate || toDate

  return (
    <>
      <div className="gaming-card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1">Trạng thái</label>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="input-gaming text-sm py-2">
              <option value="">Tất cả</option>
              {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1">Nhà mạng</label>
            <select value={filterTelco} onChange={e => { setFilterTelco(e.target.value); setPage(1) }} className="input-gaming text-sm py-2">
              <option value="">Tất cả</option>
              {telcoOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1">Từ ngày</label>
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1) }} className="input-gaming text-sm py-2" />
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1">Đến ngày</label>
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1) }} className="input-gaming text-sm py-2" />
          </div>
        </div>

        {hasFilter && (
          <button
            type="button"
            onClick={() => { setFilterStatus(''); setFilterTelco(''); setFromDate(''); setToDate(''); setPage(1) }}
            className="mt-3 px-3 py-1.5 rounded-lg text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center gap-1"
          >
            <FontAwesomeIcon icon={faXmark} /> Xóa bộ lọc
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={<FontAwesomeIcon icon={faDownload} />} title="Chưa có lịch sử nạp thẻ" description="Bạn chưa nạp thẻ nào" />
      ) : (
        <div className="space-y-3">
          {items.map((h, i) => {
            const s = CARD_DEPOSIT_STATUS[h.status] || CARD_DEPOSIT_STATUS.PENDING

            return (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="gaming-card p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-7 flex-shrink-0">
                    {h.cardConfig?.thumbnailUrl ? (
                      <img src={h.cardConfig.thumbnailUrl} className="w-10 h-7 rounded object-cover border border-white/10" alt="" />
                    ) : (
                      <div className="w-10 h-7 rounded bg-blue-400/15 flex items-center justify-center">
                        <FontAwesomeIcon icon={faDownload} className="text-blue-400 text-xs" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white text-sm">
                        {h.cardConfig?.telcoLabel || h.telco} — {formatCurrency(h.declaredAmount)}
                      </span>
                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                        {s.label}
                      </span>
                    </div>
                    <div className="text-white/30 text-xs">{formatDate(h.createdAt)}</div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {h.receivedAmount ? (
                      <div className="font-gaming font-bold text-neon-green">
                        +{formatCurrency(h.receivedAmount)}
                      </div>
                    ) : (
                      <div className="text-white/30 text-sm font-gaming">
                        {formatCurrency(h.declaredAmount)}
                      </div>
                    )}
                    {h.depositDiscount > 0 && (
                      <div className="text-white/30 text-xs">Chiết khấu {h.depositDiscount}%</div>
                    )}
                  </div>
                </div>

                <div className="pl-2 border-l-2 border-blue-400/20">
                  <div className="text-xs text-white/50 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      Mã thẻ:
                      <code className="text-blue-300 font-mono font-bold break-all">
                        {h.code}
                      </code>
                      <CopyBtn text={h.code} />
                    </span>

                    <span className="inline-flex items-center gap-1">
                      Seri:
                      <code className="text-white/70 font-mono break-all">
                        {h.serial}
                      </code>
                      <CopyBtn text={h.serial} />
                    </span>

                    {h.realAmount && Number(h.realAmount) !== Number(h.declaredAmount) && (
                      <span className="text-orange-400">
                        Thực tế: {formatCurrency(h.realAmount)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Pagination page={page} pages={Math.ceil(total / 10)} onPageChange={setPage} />
    </>
  )
}

export default function TransactionHistoryPage() {
  const [tab, setTab] = useState('transactions')

  const tabs = [
    { v: 'transactions', icon: faClipboardList, label: 'Giao dịch' },
    { v: 'card_purchase', icon: faCreditCard, label: 'Mua thẻ' },
    { v: 'card_deposit', icon: faDownload, label: 'Nạp thẻ' },
  ]

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="page-container max-w-3xl">
        <SectionHeader
          title={
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faClipboardList} />
              Lịch Sử Giao Dịch
            </span>
          }
        />

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.v}
              type="button"
              onClick={() => setTab(t.v)}
              className={`px-4 py-2.5 rounded-xl font-display text-sm transition-all border flex items-center gap-2 ${tab === t.v
                  ? 'bg-neon-pink/20 border-neon-pink/50 text-neon-pink'
                  : 'border-white/10 text-white/50 hover:text-white hover:border-white/20'
                }`}
            >
              <FontAwesomeIcon icon={t.icon} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'transactions' && <TransactionTab />}
        {tab === 'card_purchase' && <CardPurchaseTab />}
        {tab === 'card_deposit' && <CardDepositTab />}
      </div>
    </div>
  )
}