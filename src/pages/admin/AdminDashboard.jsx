import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import api from '../../api/axios'
import { formatCurrency } from '../../utils/helpers'
import { Spinner } from '../../components/common/UIComponents'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers, faGamepad, faMoneyBillWave, faInbox,
  faChartLine, faChartColumn, faRotate, faHourglassHalf,
  faTrophy, faCrown, faMedal, faBox, faDice,
  faCreditCard, faStar, faArrowUp, faArrowDown,
  faChartPie, faShoppingCart, faCoins,
} from '@fortawesome/free-solid-svg-icons'

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  shop:      '#ff2d73',
  mystery:   '#8b5cf6',
  wheel:     '#f59e0b',
  topup:     '#00d4ff',
  card:      '#10b981',
  deposit:   '#6366f1',
}

const PIE_COLORS = [COLORS.shop, COLORS.mystery, COLORS.wheel, COLORS.topup]

const TX_TYPE_LABEL = {
  PURCHASE:       { label: 'Mua acc',      color: COLORS.shop,    icon: faGamepad },
  MYSTERY_BOX:    { label: 'Túi mù',       color: COLORS.mystery, icon: faBox },
  SPIN:           { label: 'Vòng quay',    color: COLORS.wheel,   icon: faDice },
  TOPUP_PURCHASE: { label: 'Nạp quân huy', color: COLORS.topup,   icon: faCoins },
  DEPOSIT:        { label: 'Nạp tiền',     color: COLORS.deposit, icon: faInbox },
  REWARD:         { label: 'Thưởng',       color: '#10b981',      icon: faStar },
  REFUND:         { label: 'Hoàn tiền',    color: '#64748b',      icon: faArrowDown },
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="gaming-card border border-white/10 p-3 shadow-2xl min-w-[160px]">
      <p className="text-white/60 text-xs mb-2 font-display">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-white/60">{p.name}</span>
          </div>
          <span className="font-bold text-white">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Mini Stat Row ─────────────────────────────────────────────────────────────
function RevenueRow({ icon, label, today, range, color }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
        style={{ background: color + '22', color }}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-xs font-medium">{label}</div>
        <div className="text-white/30 text-[10px]">Hôm nay: <span className="text-white/60">{formatCurrency(today)}</span></div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold" style={{ color }}>{formatCurrency(range)}</div>
        <div className="text-white/20 text-[10px]">trong kỳ</div>
      </div>
    </div>
  )
}

// ─── Big Stat Card ────────────────────────────────────────────────────────────
function BigStatCard({ icon, label, value, sub, color, delay = 0 }) {
  const colorMap = {
    pink:   'from-neon-pink/20 to-transparent border-neon-pink/20 text-neon-pink',
    blue:   'from-neon-blue/20 to-transparent border-neon-blue/20 text-neon-blue',
    purple: 'from-neon-purple/20 to-transparent border-neon-purple/20 text-neon-purple',
    green:  'from-neon-green/20 to-transparent border-neon-green/20 text-neon-green',
    yellow: 'from-yellow-500/20 to-transparent border-yellow-500/20 text-yellow-400',
    cyan:   'from-cyan-500/20 to-transparent border-cyan-500/20 text-cyan-400',
  }
  const cls = colorMap[color] || colorMap.pink
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className={`gaming-card p-5 bg-gradient-to-br ${cls}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`text-2xl ${cls.split(' ').pop()}`}>
          <FontAwesomeIcon icon={icon} />
        </div>
        {sub && (
          <span className="text-[10px] text-neon-green bg-neon-green/10 px-2 py-0.5 rounded-full whitespace-nowrap">
            {sub}
          </span>
        )}
      </div>
      <div className="font-gaming text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-white/40 text-xs">{label}</div>
    </motion.div>
  )
}

// ─── Module Quick Stat ────────────────────────────────────────────────────────
function ModuleCard({ icon, label, stats, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="gaming-card p-4 border border-white/5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
          style={{ background: color + '22', color }}>
          <FontAwesomeIcon icon={icon} />
        </div>
        <span className="text-white/70 text-xs font-display font-bold">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <div className="font-gaming text-lg font-bold" style={{ color }}>{s.value}</div>
            <div className="text-white/30 text-[10px]">{s.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Range Button ─────────────────────────────────────────────────────────────
function RangeBtn({ value, label, active, onClick }) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-3 py-1.5 rounded-lg text-xs font-display transition-all ${
        active
          ? 'bg-neon-pink/20 border border-neon-pink/40 text-neon-pink'
          : 'bg-dark-600 border border-white/10 text-white/50 hover:text-white hover:border-white/20'
      }`}
    >
      {label}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { settings: siteSettings } = useSiteSettings()
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [range, setRange]       = useState('7d')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [chartMode, setChartMode] = useState('area') // 'area' | 'bar' | 'pie'

  useEffect(() => {
    if (range === 'custom' && (!dateFrom || !dateTo)) return
    setLoading(true)
    const query = range === 'custom'
      ? `/admin/dashboard?range=custom&from=${dateFrom}&to=${dateTo}`
      : `/admin/dashboard?range=${range}`
    api.get(query)
      .then(r => setStats(r.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [range, dateFrom, dateTo])

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  )

  if (!stats) return (
    <div className="text-white/40 text-center py-20">Lỗi tải dữ liệu</div>
  )

  const bd = stats.revenueBreakdown
  const qs = stats.quickStats

  // Pie data
  const pieData = [
    { name: 'Shop Acc',    value: bd.range.shop      },
    { name: 'Túi Mù',      value: bd.range.mysteryBox},
    { name: 'Vòng Quay',   value: bd.range.wheel     },
    { name: 'Quân Huy',    value: bd.range.topup     },
  ].filter(d => d.value > 0)

  const rankIcons = [faCrown, faMedal, faMedal, faTrophy, faTrophy]
  const rankColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600', 'text-white/40', 'text-white/40']

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
<div className="space-y-3">
  <div className="flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h1 className="font-gaming text-2xl font-bold text-gradient mb-1">Dashboard</h1>
      <p className="text-white/40 text-sm">
        Tổng quan hệ thống {siteSettings?.site_name || 'AOV Shop'}
      </p>
    </div>

    <div className="flex gap-2 flex-wrap">
      {[
        ['7d', '7 ngày'],
        ['30d', '30 ngày'],
        ['month', 'Tháng này'],
        ['custom', 'Tùy chọn'],
        ['all', 'Tất cả'],
      ].map(([v, l]) => (
        <RangeBtn
          key={v}
          value={v}
          label={l}
          active={range === v}
          onClick={setRange}
        />
      ))}
    </div>
  </div>

  <AnimatePresence>
  {range === 'custom' && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div className="flex justify-end pt-1">
        <div className="flex items-center gap-2 flex-nowrap">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="input-gaming text-xs py-1.5 px-3 w-[150px]"
          />

          <span className="text-white/40 text-xs">→</span>

          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="input-gaming text-xs py-1.5 px-3 w-[150px]"
          />
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
</div>

      {/* ── Top 4 Big Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <BigStatCard
          icon={faUsers} color="blue" delay={0}
          label="Tổng người dùng"
          value={stats.users.total.toLocaleString()}
          sub={`+${stats.users.newToday} hôm nay`}
        />
        <BigStatCard
          icon={faGamepad} color="purple" delay={0.05}
          label="Acc có sẵn"
          value={stats.accounts.available.toLocaleString()}
          sub={`${stats.accounts.sold} đã bán`}
        />
        <BigStatCard
          icon={faMoneyBillWave} color="pink" delay={0.1}
          label={`Doanh thu ${stats.rangeLabel}`}
          value={formatCurrency(stats.revenue.range)}
          sub={`Hôm nay: ${formatCurrency(stats.revenue.today)}`}
        />
        <BigStatCard
          icon={faInbox} color="green" delay={0.15}
          label={`Nạp tiền ${stats.rangeLabel}`}
          value={formatCurrency(stats.deposits.rangeAmount)}
          sub={`${stats.deposits.today} lệnh hôm nay`}
        />
      </div>

      {/* ── Doanh thu chi tiết từng loại ── */}
      <div className="gaming-card p-5">
        <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faChartPie} className="text-neon-pink" />
          Doanh thu chi tiết theo loại hình
          <span className="text-white/30 text-xs ml-auto font-normal">{stats.rangeLabel}</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: rows */}
          <div>
            <div className="text-white/40 text-xs mb-3 uppercase tracking-wider font-display">Phân tích từng nguồn</div>
            <RevenueRow
              icon={faGamepad}     label="Shop Acc (mua tài khoản)"
              color={COLORS.shop}  today={bd.today.shop}   range={bd.range.shop}
            />
            <RevenueRow
              icon={faBox}         label="Túi Mù (mystery box)"
              color={COLORS.mystery} today={bd.today.mysteryBox} range={bd.range.mysteryBox}
            />
            <RevenueRow
              icon={faDice}        label="Vòng Quay (spin)"
              color={COLORS.wheel} today={bd.today.wheel}  range={bd.range.wheel}
            />
            <RevenueRow
              icon={faCoins}       label="Nạp Quân Huy (topup)"
              color={COLORS.topup} today={bd.today.topup}  range={bd.range.topup}
            />
            <RevenueRow
              icon={faCreditCard}  label="Nạp Thẻ (card deposit)"
              color={COLORS.card}  today={bd.today.card}   range={bd.range.card}
            />

            {/* Divider + Total */}
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/10">
              <div className="flex items-center gap-2 text-sm font-display font-bold text-white">
                <FontAwesomeIcon icon={faChartLine} className="text-neon-pink" />
                Tổng doanh thu (kỳ)
              </div>
              <div className="font-gaming text-lg font-bold text-neon-pink">
                {formatCurrency(bd.range.total)}
              </div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-white/40 text-xs">Hôm nay</div>
              <div className="text-sm font-bold text-neon-green">{formatCurrency(bd.today.total)}</div>
            </div>
          </div>

          {/* Right: Pie chart */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-white/40 text-xs mb-3 uppercase tracking-wider font-display text-center">Tỷ lệ doanh thu</div>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85} paddingAngle={3}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-white/50">{d.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-white/20 text-sm py-10">Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Module Quick Stats ── */}
      <div>
        <h3 className="font-display font-bold text-white/60 text-xs uppercase tracking-wider mb-3">
          Thống kê nhanh theo module
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ModuleCard delay={0}    color={COLORS.shop}    icon={faGamepad}    label="Shop Acc"
            stats={[
              { value: qs.accounts.available, label: 'Còn sẵn' },
              { value: qs.accounts.sold,      label: 'Đã bán' },
            ]}
          />
          <ModuleCard delay={0.05} color={COLORS.mystery} icon={faBox}        label="Túi Mù"
            stats={[
              { value: qs.mysteryBox.available, label: 'Còn sẵn' },
              { value: qs.mysteryBox.sold,      label: 'Đã bán' },
            ]}
          />
          <ModuleCard delay={0.1}  color={COLORS.wheel}   icon={faDice}       label="Vòng Quay"
            stats={[
              { value: qs.wheel.spinsToday?.toLocaleString(), label: 'Hôm nay' },
              { value: qs.wheel.totalSpins?.toLocaleString(), label: 'Tổng lượt' },
            ]}
          />
          <ModuleCard delay={0.15} color={COLORS.topup}   icon={faCoins}      label="Nạp Quân Huy"
            stats={[
              { value: qs.topup.ordersToday, label: 'Hôm nay' },
              { value: qs.topup.totalOrders, label: 'Tổng đơn' },
            ]}
          />
        </div>
      </div>

      {/* ── Revenue Chart ── */}
      <div className="gaming-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-display font-bold text-white flex items-center gap-2">
            <FontAwesomeIcon icon={faChartLine} className="text-neon-pink" />
            Biểu đồ doanh thu & nạp tiền
          </h3>
          <div className="flex gap-2">
            {[
              ['area', faChartLine, 'Area'],
              ['bar',  faChartColumn, 'Bar'],
            ].map(([mode, ic, lbl]) => (
              <button key={mode} onClick={() => setChartMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display transition-all ${
                  chartMode === mode
                    ? 'bg-neon-pink/20 border border-neon-pink/30 text-neon-pink'
                    : 'bg-dark-600 border border-white/10 text-white/40 hover:text-white'
                }`}
              >
                <FontAwesomeIcon icon={ic} />
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          {chartMode === 'area' ? (
            <AreaChart data={stats.revenueChart}>
              <defs>
                {[
                  ['shopGrad',    COLORS.shop],
                  ['mysteryGrad', COLORS.mystery],
                  ['wheelGrad',   COLORS.wheel],
                  ['topupGrad',   COLORS.topup],
                  ['depGrad',     COLORS.deposit],
                ].map(([id, c]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={c} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={c} stopOpacity={0}   />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
              <Area type="monotone" dataKey="shopRevenue"    name="Shop Acc"    stroke={COLORS.shop}    strokeWidth={2} fill="url(#shopGrad)"    />
              <Area type="monotone" dataKey="mysteryRevenue" name="Túi Mù"      stroke={COLORS.mystery} strokeWidth={2} fill="url(#mysteryGrad)" />
              <Area type="monotone" dataKey="wheelRevenue"   name="Vòng Quay"   stroke={COLORS.wheel}   strokeWidth={2} fill="url(#wheelGrad)"   />
              <Area type="monotone" dataKey="topupRevenue"   name="Quân Huy"    stroke={COLORS.topup}   strokeWidth={2} fill="url(#topupGrad)"   />
              <Area type="monotone" dataKey="deposit"        name="Nạp tiền"    stroke={COLORS.deposit} strokeWidth={2} fill="url(#depGrad)"     />
            </AreaChart>
          ) : (
            <BarChart data={stats.revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
              <Bar dataKey="shopRevenue"    name="Shop Acc"  fill={COLORS.shop}    radius={[3,3,0,0]} fillOpacity={0.85} stackId="rev" />
              <Bar dataKey="mysteryRevenue" name="Túi Mù"    fill={COLORS.mystery} radius={[0,0,0,0]} fillOpacity={0.85} stackId="rev" />
              <Bar dataKey="wheelRevenue"   name="Vòng Quay" fill={COLORS.wheel}   radius={[0,0,0,0]} fillOpacity={0.85} stackId="rev" />
              <Bar dataKey="topupRevenue"   name="Quân Huy"  fill={COLORS.topup}   radius={[3,3,0,0]} fillOpacity={0.85} stackId="rev" />
              <Bar dataKey="deposit"        name="Nạp tiền"  fill={COLORS.deposit} radius={[3,3,0,0]} fillOpacity={0.85} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* ── Recent Transactions + Pending Deposits ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="gaming-card p-5">
          <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faRotate} className="text-neon-blue" />
            Giao dịch gần đây
          </h3>
          <div className="space-y-0 max-h-72 overflow-y-auto">
            {stats.recentTransactions?.slice(0, 10).map(tx => {
              const meta = TX_TYPE_LABEL[tx.type] || { label: tx.type, color: '#64748b', icon: faCoins }
              const isPos = parseFloat(tx.amount) > 0
              return (
                <div key={tx.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                  <img
                    src={tx.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tx.user?.username}`}
                    alt="" className="w-7 h-7 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">{tx.user?.username}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-display"
                        style={{ background: meta.color + '22', color: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="text-white/20 text-[10px] truncate">{tx.description}</span>
                    </div>
                  </div>
                  <div className={`text-xs font-bold flex-shrink-0 ${isPos ? 'text-neon-green' : 'text-neon-pink'}`}>
                    {isPos ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pending Deposits */}
        <div className="gaming-card p-5">
          <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faHourglassHalf} className="text-yellow-400" />
            Chờ xác nhận nạp tiền
            {stats.pendingDeposits?.length > 0 && (
              <span className="ml-auto text-[10px] bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded-full">
                {stats.pendingDeposits.length} lệnh
              </span>
            )}
          </h3>

          {stats.pendingDeposits?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-white/20">
              <FontAwesomeIcon icon={faInbox} className="text-3xl mb-2" />
              <div className="text-sm">Không có lệnh chờ</div>
            </div>
          ) : (
            <div className="space-y-0 max-h-72 overflow-y-auto">
              {stats.pendingDeposits?.slice(0, 10).map(d => (
                <div key={d.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                  <div className="w-7 h-7 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400 text-xs flex-shrink-0">
                    <FontAwesomeIcon icon={faHourglassHalf} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium">{d.user?.username}</div>
                    <div className="font-mono text-white/30 text-[10px] truncate">{d.transferContent}</div>
                  </div>
                  <div className="text-neon-green text-xs font-bold flex-shrink-0">{formatCurrency(d.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Top Users ── */}
      <div className="gaming-card p-5">
        <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faTrophy} className="text-yellow-400" />
          Top Người Dùng Chi Tiêu Nhiều Nhất
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {stats.topUsers?.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="gaming-card p-4 text-center relative overflow-hidden"
            >
              {i === 0 && (
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/10 to-transparent pointer-events-none" />
              )}
              <div className={`text-xl mb-2 ${rankColors[i]}`}>
                <FontAwesomeIcon icon={rankIcons[i] || faTrophy} />
              </div>
              <img
                src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                alt=""
                className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-neon-pink/20"
              />
              <div className="text-white text-xs font-bold truncate">{u.displayName || u.username}</div>
              <div className="text-neon-green text-xs mt-1 font-gaming">{formatCurrency(u.totalDeposit)}</div>
              {u.totalSpent > 0 && (
                <div className="text-white/30 text-[10px] mt-0.5">
                  Đã chi: {formatCurrency(u.totalSpent)}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  )
}