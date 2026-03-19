'use client'
import { useState, useMemo } from 'react'
import { Project } from '@/types'
import AppCard from './AppCard'
import { createClient } from '@/utils/supabase/client'

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
  const [typeFilter, setTypeFilter] = useState<'all' | 'webapp' | 'document'>('all')
  const [category, setCategory] = useState('전체')
  const [sort, setSort] = useState('newest')
  const [tagFilter, setTagFilter] = useState('')
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set(bookmarkedIds))
  const supabase = createClient()

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    projects.forEach(p => p.tags?.forEach(t => tags.add(t)))
    return Array.from(tags).slice(0, 15)
  }, [projects])

  const filtered = useMemo(() => {
    let list = [...projects]

    // Type filter
    if (typeFilter !== 'all') list = list.filter(p => p.type === typeFilter)

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
          {(['all', 'webapp', 'document'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t === 'all' ? '전체' : t === 'webapp' ? '웹앱' : '문서'}
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

      {/* Grid */}
      {filtered.length > 0 ? (
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
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400 text-lg mb-2">산출물이 없습니다</p>
          <p className="text-gray-300 text-sm">첫 번째로 등록해보세요!</p>
        </div>
      )}
    </div>
  )
}
