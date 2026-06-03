import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../api/axios'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { Spinner, Pagination } from '../common/UIComponents'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCreditCard,
  faCircleCheck,
  faCircleXmark,
  faHourglassHalf,
  faRotateRight,
  faClockRotateLeft,
  faTriangleExclamation,
  faMobileScreen,
  faGamepad,
  faXmark,
  faMoneyBillWave,
  faCircleInfo,
  faShieldHalved,
  faCopy,
  faCheck,
  faFilter,
} from '@fortawesome/free-solid-svg-icons'

const HISTORY_LIMIT = 5

const PHONE_TELCOS = [
  'VIETTEL',
  'VINAPHONE',
  'MOBIFONE',
  'VIETNAMOBILE',
  'GMOBILE',
  'REDDI',
]

function StatusBadge({ status }) {
  const cfg = {
    PENDING: {
      icon: faHourglassHalf,
      cls: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
      label: 'Đang xử lý',
    },
    SUCCESS: {
      icon: faCircleCheck,
      cls: 'text-neon-green bg-neon-green/15 border-neon-green/30',
      label: 'Thành công',
    },
    WRONG_VALUE: {
      icon: faTriangleExclamation,
      cls: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
      label: 'Sai mệnh giá',
    },
    FAILED: {
      icon: faCircleXmark,
      cls: 'text-red-400 bg-red-500/15 border-red-500/30',
      label: 'Thất bại',
    },
  }

  const c = cfg[status] || cfg.PENDING

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${c.cls}`}>
      <FontAwesomeIcon icon={c.icon} />
      {c.label}
    </span>
  )
}

export default function CardDepositTab() {
  const [configs, setConfigs] = useState([])
  const [configsLoading, setConfigsLoading] = useState(true)
  const [selectedTelco, setSelectedTelco] = useState(null)
  const [selectedConfig, setSelectedConfig] = useState(null)
  const [code, setCode] = useState('')
  const [serial, setSerial] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [polling, setPolling] = useState(null)
  const [history, setHistory] = useState([])
  const [histPage, setHistPage] = useState(1)
  const [histTotal, setHistTotal] = useState(0)
  const [histLoading, setHistLoading] = useState(false)
  const [histFilterStatus, setHistFilterStatus] = useState('')
  const [histFilterTelco, setHistFilterTelco] = useState('')
  const [histFromDate, setHistFromDate] = useState('')
  const [histToDate, setHistToDate] = useState('')

  const pollRef = useRef(null)

  useEffect(() => {
    fetchConfigs()
    fetchHistory()
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [histPage, histFilterStatus, histFilterTelco, histFromDate, histToDate])

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const fetchConfigs = async () => {
    setConfigsLoading(true)

    try {
      const { data } = await api.get('/card/configs?type=deposit')
      const list = data.data || []

      setConfigs(list)

      const enabledList = list.filter(c => c.depositEnabled)
      const telcoList = [...new Set(enabledList.map(c => c.telco))]
      const phoneFirst = telcoList.find(t => PHONE_TELCOS.includes(t))
      const firstTelco = phoneFirst || telcoList[0]

      if (firstTelco) {
        setSelectedTelco(firstTelco)

        const firstConfig = enabledList.find(c => c.telco === firstTelco)
        setSelectedConfig(firstConfig || null)
      }
    } catch {
      toast.error('Lỗi tải cấu hình thẻ')
    } finally {
      setConfigsLoading(false)
    }
  }

  const fetchHistory = async () => {
    setHistLoading(true)
    try {
      const q = new URLSearchParams({ page: histPage, limit: HISTORY_LIMIT })
      if (histFilterStatus) q.append('status', histFilterStatus)
      if (histFilterTelco) q.append('telco', histFilterTelco)
      if (histFromDate) q.append('fromDate', histFromDate)
      if (histToDate) q.append('toDate', histToDate)
      const { data } = await api.get(`/card/deposit/history?${q}`)
      setHistory(data.data || [])
      setHistTotal(data.pagination?.total || 0)
    } catch {
      setHistory([])
    } finally {
      setHistLoading(false)
    }
  }

  const enabledConfigs = configs.filter(c => c.depositEnabled)
  const telcos = [...new Set(enabledConfigs.map(c => c.telco))]

  const phoneTelcos = telcos.filter(telco => PHONE_TELCOS.includes(telco))
  const gameTelcos = telcos.filter(telco => !PHONE_TELCOS.includes(telco))

  const denomsForTelco = configs.filter(c => c.telco === selectedTelco && c.depositEnabled)

  const receivable = selectedConfig
    ? Math.round(
      parseFloat(selectedConfig.denomination) *
      (1 - parseFloat(selectedConfig.depositDiscount) / 100)
    )
    : 0

  const renderTelcoButton = (telco, icon) => {
    const items = configs.filter(c => c.telco === telco && c.depositEnabled)
    if (items.length === 0) return null

    const first = items[0]

    return (
      <button
        key={telco}
        type="button"
        onClick={() => {
          setSelectedTelco(telco)

          const firstConfig = configs.find(c => c.telco === telco && c.depositEnabled)
          setSelectedConfig(firstConfig || null)
        }}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${selectedTelco === telco
          ? 'bg-neon-purple/20 border-neon-purple/40 text-white'
          : 'bg-white/[0.03] border-white/10 text-white/50 hover:border-white/20 hover:text-white/80'
          }`}
      >
        {first.thumbnailUrl ? (
          <img
            src={first.thumbnailUrl}
            className="w-8 h-5 object-cover rounded border border-white/10"
            alt={first.telcoLabel || telco}
          />
        ) : (
          <FontAwesomeIcon icon={icon} className="text-xs" />
        )}

        {first.telcoLabel || telco}
      </button>
    )
  }

  const startPolling = id => {
    if (pollRef.current) clearInterval(pollRef.current)

    let tries = 0

    pollRef.current = setInterval(async () => {
      tries++

      try {
        const { data } = await api.get(`/card/deposit/${id}/status`)
        const dep = data.data

        if (dep.status !== 'PENDING') {
          clearInterval(pollRef.current)
          setPolling(null)
          setResult(dep)
          fetchHistory()

          if (dep.status === 'SUCCESS') {
            toast.success(dep.message || `Nạp thành công! +${formatCurrency(dep.receivedAmount)}`)
          } else if (dep.status === 'WRONG_VALUE') {
            toast(dep.message || `Sai mệnh giá — nhận ${formatCurrency(dep.receivedAmount)}`)
          } else {
            toast.error(dep.message || 'Thẻ lỗi hoặc đã sử dụng')
          }
        }
      } catch { }

      if (tries >= 30) {
        clearInterval(pollRef.current)
        setPolling(null)
      }
    }, 3000)
  }

  const handleSubmit = async () => {
    if (!selectedConfig) {
      toast.error('Vui lòng chọn mệnh giá')
      return
    }

    if (!code.trim()) {
      toast.error('Nhập mã thẻ')
      return
    }

    if (!serial.trim()) {
      toast.error('Nhập số seri')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const { data } = await api.post('/card/deposit', {
        cardConfigId: selectedConfig.id,
        code: code.trim().replace(/[\s-]/g, ''),
        serial: serial.trim().replace(/[\s-]/g, ''),
      })

      const dep = data.data

      if (!data.success) {
        toast.error(data.message || 'Thẻ lỗi hoặc không hợp lệ')

        if (dep) {
          setResult(dep)
        }

        fetchHistory()
        return
      }

      if (dep?.status === 'PENDING') {
        toast.success(data.message || 'Thẻ đã gửi, đang chờ xử lý...')
        setPolling(dep)
        startPolling(dep.id)
      } else {
        setResult(dep)

        if (dep?.status === 'SUCCESS') {
          toast.success(data.message || 'Nạp thẻ thành công')
        } else if (dep?.status === 'WRONG_VALUE') {
          toast(data.message || 'Thẻ sai mệnh giá')
        } else {
          toast.error(data.message || 'Thẻ lỗi hoặc đã sử dụng')
        }
      }

      setCode('')
      setSerial('')
      fetchHistory()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi gửi thẻ')

      if (e.response?.data?.data) {
        setResult(e.response.data.data)
        fetchHistory()
      }
    } finally {
      setLoading(false)
    }
  }

  if (configsLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="lg" />
      </div>
    )
  }

  if (enabledConfigs.length === 0) {
    return (
      <div className="gaming-card p-10 text-center">
        <FontAwesomeIcon icon={faCreditCard} className="text-4xl text-white/20 mb-3" />
        <p className="text-white/40 text-sm">Chức năng nạp thẻ hiện đang tạm khóa</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          className="text-yellow-400 text-lg mt-0.5 flex-shrink-0"
        />

        <div>
          <div className="text-yellow-400 font-bold text-sm uppercase tracking-wide mb-1">
            Lưu ý khi nạp thẻ
          </div>

          <div className="text-white/70 text-sm leading-relaxed">
            Tỷ lệ quy đổi tùy từng loại thẻ và mệnh giá.
            <span className="text-yellow-300 font-semibold">
              {' '}Nếu nạp sai mệnh giá đã chọn, hệ thống chỉ nhận 40% giá trị thực của thẻ.
            </span>
            {' '}Vui lòng kiểm tra kỹ nhà mạng và mệnh giá trước khi gửi thẻ để tránh thất thoát giá trị.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="gaming-card p-6 space-y-5">
          <h3 className="font-gaming text-sm font-bold text-white/80 uppercase tracking-wide flex items-center gap-2">
            <FontAwesomeIcon icon={faCreditCard} className="text-neon-purple" />
            Thông tin thẻ
          </h3>

          <div>
            <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-3">
              Nhà mạng / Loại thẻ
            </label>

            {phoneTelcos.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-[11px] text-white/40 font-bold uppercase tracking-wider mb-2">
                  <FontAwesomeIcon icon={faMobileScreen} className="text-neon-green" />
                  Thẻ điện thoại
                </div>

                <div className="flex flex-wrap gap-2">
                  {phoneTelcos.map(telco => renderTelcoButton(telco, faMobileScreen))}
                </div>
              </div>
            )}

            {gameTelcos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-[11px] text-white/40 font-bold uppercase tracking-wider mb-2">
                  <FontAwesomeIcon icon={faGamepad} className="text-neon-purple" />
                  Thẻ game
                </div>

                <div className="flex flex-wrap gap-2">
                  {gameTelcos.map(telco => renderTelcoButton(telco, faGamepad))}
                </div>
              </div>
            )}
          </div>

          {selectedTelco && (
            <div>
              <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-2">
                Mệnh giá
              </label>

              <select
                value={selectedConfig?.id || ''}
                onChange={e => {
                  const cfg = denomsForTelco.find(x => x.id === e.target.value)
                  setSelectedConfig(cfg || null)
                }}
                className="input-gaming text-sm py-2"
              >
                <option value="">-- Chọn mệnh giá --</option>

                {denomsForTelco.map(cfg => {
                  const receive = Math.round(
                    parseFloat(cfg.denomination) *
                    (1 - parseFloat(cfg.depositDiscount) / 100)
                  )

                  return (
                    <option key={cfg.id} value={cfg.id}>
                      {formatCurrency(cfg.denomination)} - nhận {formatCurrency(receive)} - CK {cfg.depositDiscount}%
                    </option>
                  )
                })}
              </select>
            </div>
          )}

          {selectedConfig && (
            <div className="rounded-xl border border-neon-green/20 bg-neon-green/5 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50 flex items-center gap-2">
                  <FontAwesomeIcon icon={faMoneyBillWave} />
                  Dự kiến nhận
                </span>

                <span className="font-gaming text-neon-green font-black">
                  {formatCurrency(receivable)}
                </span>
              </div>
            </div>
          )}
          <div>
            <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-2">
              Số seri thẻ
            </label>

            <input
              value={serial}
              onChange={e => setSerial(e.target.value)}
              placeholder="Nhập số seri thẻ"
              className="input-gaming text-sm py-2 font-mono tracking-wider"
              maxLength={30}
            />
          </div>

          <div>
            <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-2">
              Mã thẻ
            </label>

            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Nhập mã thẻ"
              className="input-gaming text-sm py-2 font-mono tracking-wider"
              maxLength={30}
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !!polling}
            className="btn-primary w-full py-3.5 font-gaming font-black tracking-wider text-base flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Spinner size="sm" color="white" />
                Đang gửi...
              </>
            ) : polling ? (
              <>
                <Spinner size="sm" color="white" />
                Đang xử lý...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCreditCard} />
                Nạp Thẻ Ngay
              </>
            )}
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {polling && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="gaming-card p-5 border-yellow-500/30 bg-yellow-500/5"
              >
                <div className="flex items-center gap-3">
                  <Spinner size="md" color="yellow" />

                  <div>
                    <div className="text-yellow-400 font-bold text-sm">
                      Đang xử lý thẻ...
                    </div>

                    <div className="text-white/40 text-xs mt-0.5">
                      Hệ thống đang kiểm tra, vui lòng chờ.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`gaming-card p-5 ${result.status === 'SUCCESS'
                  ? 'border-neon-green/30 bg-neon-green/5'
                  : result.status === 'WRONG_VALUE'
                    ? 'border-orange-500/30 bg-orange-500/5'
                    : 'border-red-500/30 bg-red-500/5'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon
                    icon={
                      result.status === 'SUCCESS'
                        ? faCircleCheck
                        : result.status === 'WRONG_VALUE'
                          ? faTriangleExclamation
                          : faCircleXmark
                    }
                    className={`text-2xl ${result.status === 'SUCCESS'
                      ? 'text-neon-green'
                      : result.status === 'WRONG_VALUE'
                        ? 'text-orange-400'
                        : 'text-red-400'
                      }`}
                  />

                  <div className="flex-1">
                    <div
                      className={`font-bold text-sm ${result.status === 'SUCCESS'
                        ? 'text-neon-green'
                        : result.status === 'WRONG_VALUE'
                          ? 'text-orange-400'
                          : 'text-red-400'
                        }`}
                    >
                      {result.status === 'SUCCESS'
                        ? 'Nạp thẻ thành công!'
                        : result.status === 'WRONG_VALUE'
                          ? 'Thẻ sai mệnh giá — đã xử lý'
                          : 'Thẻ lỗi'}
                    </div>

                    {result.receivedAmount > 0 && (
                      <div className="text-white/70 text-xs mt-1">
                        Nhận:{' '}
                        <span className="text-neon-green font-bold text-sm">
                          {formatCurrency(result.receivedAmount)}
                        </span>
                      </div>
                    )}

                    {result.message && (
                      <div className="text-white/40 text-xs mt-1">
                        {result.message}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="text-white/30 hover:text-white/60"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="gaming-card p-5 space-y-2.5">
            <h4 className="text-white/60 text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faShieldHalved} className="text-blue-400" />
              Lưu ý
            </h4>

            {[
              'Nhập đúng nhà mạng và chọn đúng mệnh giá thẻ',
              'Sai mệnh giá: thẻ vẫn xử lý, tiền tính theo thực tế',
              'Mã thẻ và seri không có dấu gạch, không khoảng cách',
              'Mỗi thẻ chỉ dùng được 1 lần',
              'Xử lý tự động trong 1–3 phút',
            ].map((note, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-white/50">
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="text-neon-green text-[10px] mt-0.5 flex-shrink-0"
                />
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="gaming-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-gaming text-sm font-bold text-white/80 uppercase tracking-wide flex items-center gap-2">
            <FontAwesomeIcon icon={faClockRotateLeft} className="text-neon-purple" />
            Lịch Sử Nạp Thẻ
          </h3>
          <button type="button" onClick={() => { setHistPage(1); fetchHistory() }} className="text-white/30 hover:text-white/60 text-sm">
            <FontAwesomeIcon icon={faRotateRight} />
          </button>
        </div>

        {/* Bộ lọc */}
        <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] text-white/40 uppercase font-bold tracking-wide block mb-1">
                Trạng thái
              </label>
              <select
                value={histFilterStatus}
                onChange={e => {
                  setHistFilterStatus(e.target.value)
                  setHistPage(1)
                }}
                className="input-gaming text-xs py-1.5 w-full"
              >
                <option value="">Tất cả</option>
                <option value="SUCCESS">Thành công</option>
                <option value="WRONG_VALUE">Sai mệnh giá</option>
                <option value="PENDING">Đang xử lý</option>
                <option value="FAILED">Thất bại</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-white/40 uppercase font-bold tracking-wide block mb-1">
                Nhà mạng
              </label>
              <select
                value={histFilterTelco}
                onChange={e => {
                  setHistFilterTelco(e.target.value)
                  setHistPage(1)
                }}
                className="input-gaming text-xs py-1.5 w-full"
              >
                <option value="">Tất cả</option>
                {[...new Map(configs.filter(c => c.depositEnabled).map(c => [c.telco, c])).values()].map(c => (
                  <option key={c.telco} value={c.telco}>
                    {c.telcoLabel || c.telco}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-white/40 uppercase font-bold tracking-wide block mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={histFromDate}
                onChange={e => {
                  setHistFromDate(e.target.value)
                  setHistPage(1)
                }}
                className="input-gaming text-xs py-1.5 w-full"
              />
            </div>

            <div>
              <label className="text-[10px] text-white/40 uppercase font-bold tracking-wide block mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={histToDate}
                onChange={e => {
                  setHistToDate(e.target.value)
                  setHistPage(1)
                }}
                className="input-gaming text-xs py-1.5 w-full"
              />
            </div>
          </div>

          {(histFilterStatus || histFilterTelco || histFromDate || histToDate) && (
            <button
              type="button"
              onClick={() => {
                setHistFilterStatus('')
                setHistFilterTelco('')
                setHistFromDate('')
                setHistToDate('')
                setHistPage(1)
              }}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 border border-red-500/20 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
            >
              <FontAwesomeIcon icon={faXmark} />
              Xóa bộ lọc
            </button>
          )}
        </div>

        {histLoading ? (
          <div className="flex justify-center py-4"><Spinner /></div>
        ) : history.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">Chưa có lịch sử</p>
        ) : (
          <>
            <div className="space-y-2">
              {history.map(h => (
                <HistoryItem key={h.id} h={h} />
              ))}
            </div>
            {histTotal > HISTORY_LIMIT && (
              <div className="pt-4">
                <Pagination page={histPage} pages={Math.ceil(histTotal / HISTORY_LIMIT)} onPageChange={setHistPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text || ''); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className={`p-1 rounded text-[10px] transition-all ${copied ? 'text-neon-green' : 'text-white/30 hover:text-white/60'}`}
    >
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
    </button>
  )
}

function HistoryItem({ h }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div className="w-10 h-7 flex-shrink-0">
          {h.cardConfig?.thumbnailUrl ? (
            <img src={h.cardConfig.thumbnailUrl} className="w-10 h-7 rounded object-cover border border-white/10" alt={h.cardConfig?.telcoLabel || h.telco} />
          ) : (
            <div className="w-10 h-7 rounded bg-neon-purple/15 flex items-center justify-center">
              <FontAwesomeIcon icon={faCreditCard} className="text-neon-purple text-xs" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-medium">
            {h.cardConfig?.telcoLabel || h.telco} — {formatCurrency(h.declaredAmount)}
          </div>
          <div className="text-white/40 text-[10px]">{formatDate(h.createdAt)}</div>
        </div>
        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
          {h.receivedAmount > 0 && (
            <div className="text-neon-green text-xs font-bold">+{formatCurrency(h.receivedAmount)}</div>
          )}
          <StatusBadge status={h.status} />
        </div>
      </button>

      {/* Detail expandable */}
      {open && (
        <div className="px-3 pb-3 border-t border-white/[0.06] pt-2 space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/40 w-16 shrink-0">Mã thẻ</span>
            <code className="text-blue-300 font-mono font-bold break-all flex-1">{h.code}</code>
            <CopyBtn text={h.code} />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/40 w-16 shrink-0">Seri</span>
            <code className="text-white/70 font-mono break-all flex-1">{h.serial}</code>
            <CopyBtn text={h.serial} />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/40 w-16 shrink-0">Mệnh giá</span>
            <span className="text-white/70">{formatCurrency(h.declaredAmount)}</span>
            {h.realAmount && h.realAmount !== h.declaredAmount && (
              <span className="text-orange-400 text-[10px]">(thực tế: {formatCurrency(h.realAmount)})</span>
            )}
          </div>
          {h.depositDiscount > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/40 w-16 shrink-0">Chiết khấu</span>
              <span className="text-white/60">{h.depositDiscount}%</span>
            </div>
          )}
          {h.message && (
            <div className="text-[10px] text-white/30 italic pt-0.5">{h.message}</div>
          )}
        </div>
      )}
    </div>
  )
}