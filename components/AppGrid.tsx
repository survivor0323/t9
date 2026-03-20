'use client'
import { useState, useMemo } from 'react'
import { Project } from '@/types'
import AppCard from './AppCard'
import AppDetailModal from './AppDetailModal'
import { createClient } from '@/utils/supabase/client'
import { LayoutGrid, List, Star, Eye, FileText, Globe } from 'lucide-react'


const CATEGORIES = ['전체', '기획', '영업', '마케팅', '디자인', '운영', '경영', '개발', '기타']
const SORT_OPTIONS = [
  { value: 'newest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'rating', label: '별점순' },
]

export default function AppGrid({
  projects,
  userId,
  bookmarkedIds = [],
  searchQuery = '',
}: {
  projects: Project[]
  userId?: string
  bookmarkedIds?: string[]
  searchQuery?: string
}) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'webapp' | 'document' | 'bookmark'>('all')
  const [category, setCategory] = useState('전체')
  const [sort, setSort] = useState('newest')
  const [tagFilter, setTagFilter] = useState('')
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set(bookmarkedIds))
  const [viewType, setViewType] = useState<'card' | 'list'>('card')
  const [listModalProject, setListModalProject] = useState<Project | null>(null)
  const supabase = createClient()

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    projects.forEach(p => p.tags?.forEach(t => tags.add(t)))
    return Array.from(tags).slice(0, 15)
  }, [projects])

  const filtered = useMemo(() => {
    let list = [...projects]

    // Type filter
    if (typeFilter === 'bookmark') list = list.filter(p => bookmarks.has(p.id))
    else if (typeFilter !== 'all') list = list.filter(p => p.type === typeFilter)

    // Category filter
    if (category !== '전체') list = list.filter(p => p.category === category)

    // Tag filter
    if (tagFilter) list = list.filter(p => p.tags?.includes(tagFilter))

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some(t => t.toLowerCase().includes(q))
      )
    }

    // Sort
    if (sort === 'newest')
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sort === 'popular') list.sort((a, b) => b.views - a.views)
    else if (sort === 'rating')
      list.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))

    return list
  }, [projects, typeFilter, category, sort, tagFilter, searchQuery])

  const handleBookmarkToggle = async (projectId: string, bookmarked: boolean) => {
    if (!userId) return
    const next = new Set(bookmarks)
    if (bookmarked) {
      next.add(projectId)
      await supabase.from('bookmarks').insert({ user_id: userId, project_id: projectId })
    } else {
      next.delete(projectId)
      await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('project_id', projectId)
    }
    setBookmarks(next)
  }

  return (
    <div className="space-y-5">
      {/* Type + Sort bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex gap-1">
          {(['all', 'webapp', 'document', ...(userId ? ['bookmark'] : [])] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t as any)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t === 'all' ? '전체' : t === 'webapp' ? '웹앱' : t === 'document' ? '문서' : '북마크'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{filtered.length}개</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-200"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewType('card')}
              className={`p-1.5 transition-colors ${viewType === 'card' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-100'}`}
              title="카드 보기"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`p-1.5 transition-colors ${viewType === 'list' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-100'}`}
              title="리스트 보기"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              category === cat
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tagFilter && (
            <button
              onClick={() => setTagFilter('')}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded-full"
            >
              #{tagFilter} ✕
            </button>
          )}
          {allTags
            .filter(t => t !== tagFilter)
            .map(tag => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full hover:bg-green-100 transition-colors"
              >
                #{tag}
              </button>
            ))}
        </div>
      )}

      {/* Grid / List */}
      {filtered.length > 0 ? (
        viewType === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(project => (
              <AppCard
                key={project.id}
                project={project}
                userId={userId}
                isBookmarked={bookmarks.has(project.id)}
                onBookmarkToggle={handleBookmarkToggle}
              />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
            {filtered.map(project => (
              <div
                key={project.id}
                onClick={() => setListModalProject(project)}
                className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-28 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {project.screenshots?.[0] ? (
                    <img src={project.screenshots[0]} alt={project.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      {project.type === 'document' ? <FileText className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${project.type === 'document' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                      {project.type === 'document' ? '문서' : '웹앱'}
                    </span>
                    {project.category && <span className="text-xs text-gray-400">{project.category}</span>}
                    <p className="font-medium text-gray-900 truncate">{project.title}</p>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{project.description}</p>
                </div>
                {/* Right: stats + author + date */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0 text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" />{project.average_rating ? project.average_rating.toFixed(1) : '-'}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{project.views}</span>
                  </div>
                  <span className="text-gray-500 font-medium">{(project as any).profiles?.full_name || '알 수 없음'}</span>
                  <span>{new Date(project.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                </div>
              </div>
            ))}
            {listModalProject && (
              <AppDetailModal
                isOpen={true}
                project={listModalProject}
                userId={userId}
                onClose={() => setListModalProject(null)}
              />
            )}
          </div>
        )
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400 text-lg mb-2">산출물이 없습니다</p>
          <p className="text-gray-300 text-sm">첫 번째로 등록해보세요!</p>
        </div>
      )}
    </div>
  )
}
