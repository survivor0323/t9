'use client'
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Star, Eye, ExternalLink } from 'lucide-react'
import { Project } from '@/types'

export default function FeaturedBanner({ projects }: { projects: Project[] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => setCurrent(c => (c + 1) % projects.length), [projects.length])
  const prev = () => setCurrent(c => (c - 1 + projects.length) % projects.length)

  useEffect(() => {
    if (paused || projects.length <= 1) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [paused, next, projects.length])

  if (!projects.length) return null

  const project = projects[current]
  const difficultyLabel = { low: '하', medium: '중', high: '상' }

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ minHeight: 300 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background */}
      {project.screenshots?.[0] ? (
        <div className="absolute inset-0">
          <img src={project.screenshots[0]} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-800" />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full p-8 min-h-[300px]">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full mb-3">
            ⭐ FEATURED
          </span>
          <h2 className="text-3xl font-bold text-white mb-2">{project.title}</h2>
          {project.description && (
            <p className="text-white/80 text-base mb-4 line-clamp-2">{project.description}</p>
          )}
          <div className="flex items-center gap-4 mb-5">
            {project.difficulty && (
              <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
                난이도 {difficultyLabel[project.difficulty as keyof typeof difficultyLabel]}
              </span>
            )}
            {project.review_count && project.review_count > 0 && (
              <span className="flex items-center gap-1 text-white text-sm">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {Number(project.average_rating).toFixed(1)} ({project.review_count})
              </span>
            )}
            <span className="flex items-center gap-1 text-white/70 text-sm">
              <Eye className="w-4 h-4" />
              {project.views}
            </span>
          </div>
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-full font-medium text-sm hover:bg-gray-100 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              방문하기
            </a>
          )}
        </div>
      </div>

      {/* Arrows */}
      {projects.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-all z-20"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-all z-20"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </>
      )}

      {/* Dots */}
      {projects.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {projects.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current ? 'bg-white w-6' : 'bg-white/50 w-2'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
