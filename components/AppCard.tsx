'use client'
import { useState } from 'react'
import { Star, Eye, Bookmark, FileText, Globe } from 'lucide-react'
import { Project } from '@/types'
import AppDetailModal from './AppDetailModal'

export default function AppCard({
  project, userId, isBookmarked = false, onBookmarkToggle
}: {
  project: Project
  userId?: string
  isBookmarked?: boolean
  onBookmarkToggle?: (projectId: string, bookmarked: boolean) => void
}) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [bookmarked, setBookmarked] = useState(isBookmarked)

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = !bookmarked
    setBookmarked(next)
    onBookmarkToggle?.(project.id, next)
  }

  const difficultyLabel = { low: '하', medium: '중', high: '상' }
  const difficultyColor = { low: 'text-blue-500 bg-blue-50', medium: 'text-yellow-600 bg-yellow-50', high: 'text-red-500 bg-red-50' }

  return (
    <>
      <div
        onClick={() => setIsDetailOpen(true)}
        className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col"
      >
        {/* Screenshot / Thumbnail */}
        <div className="relative aspect-video bg-gray-100 overflow-hidden flex-shrink-0">
          {project.screenshots?.[0] ? (
            <img
              src={project.screenshots[0]}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
              {project.type === 'document' ? (
                <FileText className="w-12 h-12 text-green-300" />
              ) : (
                <div className="text-5xl font-bold text-green-200">{project.title.charAt(0).toUpperCase()}</div>
              )}
            </div>
          )}

          {/* Badges top-left */}
          <div className="absolute top-2 left-2 flex gap-1">
            {project.is_featured && (
              <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full shadow">
                ⭐ Featured
              </span>
            )}
          </div>

          {/* Badges top-right */}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {project.difficulty && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${difficultyColor[project.difficulty]}`}>
                난이도 {difficultyLabel[project.difficulty]}
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${project.type === 'webapp' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {project.type === 'webapp' ? '웹앱' : '문서'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-900 truncate text-base group-hover:text-green-600 transition-colors">
            {project.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-1">
            {project.description || '설명이 없습니다.'}
          </p>

          {/* Tags */}
          {project.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {project.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {project.review_count && project.review_count > 0 ? (
                <span className="flex items-center gap-0.5 font-medium text-gray-900">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {Number(project.average_rating).toFixed(1)}
                  <span className="text-gray-400 font-normal ml-0.5">({project.review_count})</span>
                </span>
              ) : (
                <span className="text-gray-400">리뷰 없음</span>
              )}
              <span className="flex items-center gap-0.5">
                <Eye className="w-3 h-3" />
                {project.views}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Author */}
              {project.profiles && (
                <div className="flex items-center gap-1">
                  {project.profiles.avatar_url ? (
                    <img src={project.profiles.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                      {project.profiles.full_name?.charAt(0) || '?'}
                    </div>
                  )}
                  <span className="text-xs text-gray-400 max-w-[60px] truncate">{project.profiles.full_name}</span>
                </div>
              )}

              {/* Bookmark */}
              {userId && (
                <button
                  onClick={handleBookmark}
                  className={`p-1 rounded-full transition-colors ${bookmarked ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                >
                  <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AppDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        project={project}
        userId={userId}
      />
    </>
  )
}
