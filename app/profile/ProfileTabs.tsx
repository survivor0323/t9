'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Eye,
  Bookmark,
  Star,
  Pencil,
  Trash2,
  FileText,
  Globe,
  TrendingUp,
  X,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import AppCard from '@/components/AppCard'
import { Project } from '@/types'

type Stats = {
  totalViews: number
  totalBookmarksReceived: number
  totalReviews: number
  averageRating: number
}

type Props = {
  projects: Project[]
  bookmarkedProjects: Project[]
  userId: string
  stats: Stats
  registeredParam: string | null
}

type TabId = 'my' | 'bookmarks' | 'stats'

function DraftBanner({ project }: { project: Project }) {
  const missing: string[] = []
  if (!project.screenshots || project.screenshots.length === 0) {
    if (project.type === 'webapp') missing.push('스크린샷 1장 이상')
    else missing.push('파일 업로드')
  }
  if (!project.description || project.description.length < 20) missing.push('설명 20자 이상')
  if (!project.tags || project.tags.length === 0) missing.push('태그 1개 이상')
  if (!project.category) missing.push('카테고리 선택')

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 mt-2">
      <p className="text-xs font-semibold text-yellow-700 mb-1">공개 미충족 항목</p>
      <ul className="space-y-0.5">
        {missing.map(m => (
          <li key={m} className="text-xs text-yellow-600 flex items-center gap-1">
            <span>❌</span> {m}
          </li>
        ))}
      </ul>
    </div>
  )
}

function MyProjectCard({
  project,
  onDelete,
}: {
  project: Project
  onDelete: (id: string) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const isDraft = project.status === 'draft'
  const editHref =
    project.type === 'webapp'
      ? `/register/webapp/${project.id}/edit`
      : `/register/document/${project.id}/edit`

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠어요?')) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('projects').delete().eq('id', project.id)
      if (error) throw error
      onDelete(project.id)
    } catch {
      alert('삭제 실패')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col group hover:shadow-lg transition-shadow">
      {/* Status badge */}
      <div className="absolute top-2 left-2 z-10">
        {isDraft ? (
          <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full shadow">
            비공개
          </span>
        ) : project.status === 'hidden' ? (
          <span className="px-2 py-0.5 bg-gray-400 text-white text-xs font-bold rounded-full shadow">
            숨김
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full shadow">
            공개
          </span>
        )}
      </div>

      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden flex-shrink-0">
        {project.screenshots?.[0] ? (
          <img
            src={project.screenshots[0]}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
            {project.type === 'document' ? (
              <FileText className="w-12 h-12 text-green-300" />
            ) : (
              <div className="text-5xl font-bold text-green-200">
                {project.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
              project.type === 'webapp'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {project.type === 'webapp' ? '웹앱' : '문서'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 truncate text-base">{project.title}</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-1">
          {project.description || '설명이 없습니다.'}
        </p>

        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {project.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
          <span className="flex items-center gap-0.5">
            <Eye className="w-3 h-3" /> {project.views}
          </span>
          {project.review_count && project.review_count > 0 ? (
            <span className="flex items-center gap-0.5 text-gray-600">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {Number(project.average_rating).toFixed(1)}
              <span className="text-gray-400">({project.review_count})</span>
            </span>
          ) : null}
        </div>

        {/* Draft checklist */}
        {isDraft && <DraftBanner project={project} />}

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <Link
            href={editHref}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-colors"
          >
            <Pencil className="w-4 h-4" /> 수정
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Toast({
  message,
  type,
  onClose,
}: {
  message: string
  type: 'success' | 'warning'
  onClose: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium transition-all ${
        type === 'success'
          ? 'bg-green-600 text-white'
          : 'bg-yellow-400 text-yellow-900'
      }`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function ProfileTabs({
  projects: initialProjects,
  bookmarkedProjects,
  userId,
  stats,
  registeredParam,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('my')
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(
    null
  )
  const router = useRouter()

  // Show toast from URL param on mount
  useEffect(() => {
    if (registeredParam === 'public') {
      setToast({ message: '등록 완료! 공개 상태입니다', type: 'success' })
    } else if (registeredParam === 'draft') {
      setToast({
        message: '임시저장됨. 아래 항목을 완성하면 공개됩니다.',
        type: 'warning',
      })
    }
    // Clean the URL param without navigation
    if (registeredParam) {
      const url = new URL(window.location.href)
      url.searchParams.delete('registered')
      window.history.replaceState({}, '', url.toString())
    }
  }, [registeredParam])

  const handleDelete = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: 'my', label: '내 산출물' },
    { id: 'bookmarks', label: '북마크' },
    { id: 'stats', label: '통계' },
  ]

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Tab buttons */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-xl transition-colors -mb-px ${
              activeTab === tab.id
                ? 'text-green-700 border-b-2 border-green-600 bg-green-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-b-2 border-transparent'
            }`}
          >
            {tab.label}
            {tab.id === 'my' && projects.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {projects.length}
              </span>
            )}
            {tab.id === 'bookmarks' && bookmarkedProjects.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {bookmarkedProjects.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: 내 산출물 */}
      {activeTab === 'my' && (
        <div>
          {projects.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Globe className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium">아직 등록한 산출물이 없어요</p>
              <p className="text-sm mt-1">웹앱 또는 문서를 등록해보세요!</p>
              <div className="flex justify-center gap-3 mt-6">
                <Link
                  href="/register/webapp"
                  className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  웹앱 등록
                </Link>
                <Link
                  href="/register/document"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  문서 등록
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {projects.map(project => (
                <MyProjectCard key={project.id} project={project} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: 북마크 */}
      {activeTab === 'bookmarks' && (
        <div>
          {bookmarkedProjects.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Bookmark className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium">북마크한 산출물이 없어요</p>
              <p className="text-sm mt-1">마음에 드는 산출물을 북마크해보세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {bookmarkedProjects.map(project => (
                <AppCard
                  key={project.id}
                  project={project}
                  userId={userId}
                  isBookmarked={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: 통계 */}
      {activeTab === 'stats' && (
        <div className="max-w-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Eye className="w-5 h-5 text-blue-500" />}
              label="총 조회수"
              value={stats.totalViews.toLocaleString()}
              bg="bg-blue-50"
            />
            <StatCard
              icon={<Bookmark className="w-5 h-5 text-green-500" />}
              label="받은 북마크"
              value={stats.totalBookmarksReceived.toLocaleString()}
              bg="bg-green-50"
            />
            <StatCard
              icon={<Star className="w-5 h-5 text-yellow-500" />}
              label="총 리뷰 수"
              value={stats.totalReviews.toLocaleString()}
              bg="bg-yellow-50"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
              label="평균 별점"
              value={
                stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'
              }
              bg="bg-purple-50"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">산출물 현황</h3>
            <div className="space-y-3">
              {[
                {
                  label: '전체',
                  count: initialProjects.length,
                  color: 'bg-gray-200',
                },
                {
                  label: '공개',
                  count: initialProjects.filter(p => p.status === 'public').length,
                  color: 'bg-green-400',
                },
                {
                  label: '임시저장',
                  count: initialProjects.filter(p => p.status === 'draft').length,
                  color: 'bg-yellow-400',
                },
                {
                  label: '숨김',
                  count: initialProjects.filter(p => p.status === 'hidden').length,
                  color: 'bg-gray-400',
                },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-500 flex-shrink-0">{row.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.color} transition-all`}
                      style={{
                        width:
                          initialProjects.length > 0
                            ? `${(row.count / initialProjects.length) * 100}%`
                            : '0%',
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-6 text-right">
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode
  label: string
  value: string
  bg: string
}) {
  return (
    <div className={`rounded-2xl p-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
