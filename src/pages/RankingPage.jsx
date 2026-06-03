import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../api/axios'
import { formatCurrency } from '../utils/helpers'
import { SectionHeader, Spinner } from '../components/common/UIComponents'
import {
  faSun,
  faCalendarWeek,
  faCalendarDays,
  faCrown,
  faMedal,
  faTrophy,
  faClipboardList,
  faGift,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Hôm Nay', icon: faSun },
  { value: 'weekly', label: 'Tuần Này', icon: faCalendarWeek },
  { value: 'monthly', label: 'Tháng Này', icon: faCalendarDays },
]

const RANK_ICONS = [
  { rank: 1, icon: faCrown, color: '#FFD700' },
  { rank: 2, icon: faMedal, color: '#C0C0C0' },
  { rank: 3, icon: faMedal, color: '#CD7F32' },
]

export default function RankingPage() {
  const [period, setPeriod] = useState('daily')
  const [rankings, setRankings] = useState([])
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRanking()
  }, [period])

  const fetchRanking = async () => {
    setLoading(true)

    try {
      const { data } = await api.get(`/ranking?period=${period}`)
      setRankings(data.data || [])
      setRewards(data.rewards || [])
    } catch {
      setRankings([])
      setRewards([])
    } finally {
      setLoading(false)
    }
  }

  const top3 = rankings.slice(0, 3)
  const topRest = rankings.slice(3, 10)

  const podiumItems = [
    top3[1] ? { data: top3[1], rank: 2, height: 'h-32' } : null,
    top3[0] ? { data: top3[0], rank: 1, height: 'h-44' } : null,
    top3[2] ? { data: top3[2], rank: 3, height: 'h-28' } : null,
  ].filter(Boolean)

  const getRankIcon = rank => {
    return RANK_ICONS.find(r => r.rank === Number(rank))
  }

  const getRewardByRank = rank => {
    return rewards.find(r => Number(r.rank) === Number(rank))
  }

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="page-container max-w-6xl">
        <SectionHeader
          title={
            <>
              <FontAwesomeIcon icon={faTrophy} className="mr-3" />
              Bảng Xếp Hạng
            </>
          }
          subtitle="Top những người nạp tiền nhiều nhất"
        />

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {PERIOD_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => setPeriod(o.value)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-sm transition-all ${
                period === o.value
                  ? 'bg-neon-pink/20 border border-neon-pink/50 text-neon-pink shadow-neon-pink'
                  : 'gaming-card text-white/60 hover:text-white'
              }`}
            >
              <FontAwesomeIcon icon={o.icon} />
              {o.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <FontAwesomeIcon icon={faTrophy} className="text-6xl mb-4" />
            <div>Chưa có dữ liệu xếp hạng</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              {top3.length > 0 && (
                <div className="flex items-end justify-center gap-4 mb-10">
                  {podiumItems.map((item, i) => {
                    const r = item.data
                    const podiumRank = item.rank
                    const iconInfo = getRankIcon(podiumRank)
                    const rewardInfo = getRewardByRank(podiumRank)

                    return (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="flex flex-col items-center"
                      >
                        {podiumRank === 1 && (
                          <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-3xl mb-2"
                            style={{ color: iconInfo?.color }}
                          >
                            <FontAwesomeIcon icon={faCrown} />
                          </motion.div>
                        )}

                        <img
                          src={
                            r.user?.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.user?.username}`
                          }
                          alt=""
                          className="rounded-full border-4 mb-2 object-cover"
                          style={{
                            width: podiumRank === 1 ? 72 : 56,
                            height: podiumRank === 1 ? 72 : 56,
                            borderColor: iconInfo?.color,
                          }}
                        />

                        <div className="font-bold text-white text-sm mb-0.5 max-w-[90px] truncate text-center">
                          {r.user?.displayName || r.user?.username}
                        </div>

                        <div className="text-xs text-neon-green font-mono mb-2">
                          {formatCurrency(r.totalDeposit)}
                        </div>

                        <div
                          className={`w-24 ${item.height} rounded-t-xl flex flex-col items-center justify-start pt-3`}
                          style={{
                            background: `linear-gradient(180deg, ${iconInfo?.color || '#ffffff'}20, ${iconInfo?.color || '#ffffff'}08)`,
                            border: `1px solid ${iconInfo?.color || '#ffffff'}40`,
                          }}
                        >
                          <span
                            className="text-2xl font-gaming font-black"
                            style={{ color: iconInfo?.color }}
                          >
                            #{podiumRank}
                          </span>

                          {rewardInfo && (
                            <>
                              <span className="text-xs text-white/40 mt-1">
                                Thưởng
                              </span>
                              <span
                                className="text-xs font-bold text-center px-1 line-clamp-2"
                                style={{ color: iconInfo?.color }}
                              >
                                {rewardInfo.reward}
                              </span>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              <div className="gaming-card p-5">
                <h3 className="font-gaming text-sm font-bold text-gradient mb-4 uppercase">
                  <FontAwesomeIcon icon={faClipboardList} className="mr-2" />
                  Top 4 - Top 10
                </h3>

                {topRest.length === 0 ? (
                  <div className="text-center py-10 text-white/30">
                    Chưa có người dùng từ hạng 4 trở xuống
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topRest.map((r, i) => {
                      const rewardInfo = getRewardByRank(r.rank)

                      return (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-dark-700/70 border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-dark-600 flex items-center justify-center font-gaming font-bold text-white/60 text-sm">
                            #{r.rank}
                          </div>

                          <img
                            src={
                              r.user?.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.user?.username}`
                            }
                            alt=""
                            className="w-10 h-10 rounded-full border border-white/10 object-cover"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white text-sm truncate">
                              {r.user?.displayName || r.user?.username}
                            </div>
                            <div className="text-white/30 text-xs">
                              @{r.user?.username}
                            </div>
                            {rewardInfo && (
                              <div className="text-neon-green text-xs mt-0.5 truncate">
                                Thưởng: {rewardInfo.reward}
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="font-gaming font-bold text-neon-green text-sm">
                              {formatCurrency(r.totalDeposit)}
                            </div>
                            <div className="text-white/30 text-xs">đã nạp</div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="gaming-card p-6 lg:sticky lg:top-24">
              <h3 className="font-gaming text-sm font-bold text-gradient mb-4 uppercase">
                <FontAwesomeIcon icon={faGift} className="mr-2" />
                Phần Thưởng Xếp Hạng
              </h3>

              {rewards.length === 0 ? (
                <div className="text-center py-6 text-white/30 text-sm">
                  Chưa có thông tin phần thưởng
                </div>
              ) : (
                <div className="space-y-2">
                  {rewards.map(rw => {
                    const iconInfo = getRankIcon(rw.rank)

                    return (
                      <div
                        key={rw.rank}
                        className="flex items-center justify-between gap-3 py-3 border-b border-white/5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {iconInfo ? (
                            <FontAwesomeIcon
                              icon={iconInfo.icon}
                              className="text-xl"
                              style={{ color: iconInfo.color }}
                            />
                          ) : (
                            <span className="font-gaming font-bold text-white/40 w-6 text-center">
                              #{rw.rank}
                            </span>
                          )}

                          <span
                            className="font-bold whitespace-nowrap"
                            style={{ color: iconInfo?.color || 'white' }}
                          >
                            {rw.label || `Hạng #${rw.rank}`}
                          </span>
                        </div>

                        <span className="font-gaming font-bold text-neon-green text-right text-sm">
                          {rw.reward}
                        </span>
                      </div>
                    )
                  })}

                  <div className="text-white/30 text-xs mt-3">
                    * Phần thưởng được trao vào cuối mỗi kỳ
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}