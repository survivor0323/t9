'use client'
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Star, Eye, ExternalLink } from 'lucide-react'
import { Project } from '@/types'

export default function FeaturedBanner({ projects }: { projects: Project[] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [animating, setAnimating] = useState(false)

  const goTo = useCallback((index: number) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setCurrent(index)
      setAnimating(false)
    }, 400)
  }, [animating])

  const next = useCallback(() => goTo((current + 1) % projects.length), [current, projects.length, goTo])
  const prev = () => goTo((current - 1 + projects.length) % projects.length)

  useEffect(() => {
    if (paused || projects.length <= 1) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [paused, next, projects.length])

  if (!projects.length) return null

  const project = projects[current]

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white flex"
      style={{ minHeight: 280 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Left — Text */}
      <div className="flex flex-col justify-center px-10 py-8 w-1/2 flex-shrink-0 z-10">
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full mb-4 w-fit">
          ⭐ FEATURED
        </span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 line-clamp-2">{project.title}</h2>
        {project.description && (
          <p className="text-gray-500 text-sm mb-5 line-clamp-3">{project.description}</p>
        )}
        <div className="flex items-center gap-4 mb-6">
          {project.review_count != null && project.review_count > 0 && (
            <span className="flex items-center gap-1 text-gray-700 text-sm">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {Number(project.average_rating).toFixed(1)}
              <span className="text-gray-400">({project.review_count})</span>
            </span>
          )}
          <span className="flex items-center gap-1 text-gray-400 text-sm">
            <Eye className="w-4 h-4" />
            {project.views}
          </span>
          {project.category && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
              {project.category}
            </span>
          )}
        </div>
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-full font-medium text-sm hover:bg-green-700 transition-colors w-fit"
          >
            <ExternalLink className="w-4 h-4" />
            방문하기
          </a>
        )}

        {/* Dots */}
        {projects.length > 1 && (
          <div className="flex gap-2 mt-8">
            {projects.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? 'bg-green-600 w-6' : 'bg-gray-200 w-2'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right — Image */}
      <div className="relative flex-1 overflow-hidden">
        {projects.map((p, i) => (
          <div
            key={p.id}
            className="absolute inset-0 transition-all duration-500 ease-in-out"
            style={{
              opacity: i === current ? 1 : 0,
              transform: i === current ? 'scale(1)' : 'scale(1.04)',
            }}
          >
            {p.screenshots?.[0] ? (
              <img
                src={p.screenshots[0]}
                alt={p.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                <span className="text-green-300 text-6xl font-bold">M</span>
              </div>
            )}
          </div>
        ))}

        {/* Arrows */}
        {projects.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all z-20"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all z-20"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
