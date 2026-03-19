'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import {
  X, Star, Trash2, Globe, Edit, FileText, Download, Github,
  Eye, Bookmark, ChevronLeft, ChevronRight, User as UserIcon,
  Tag, Calendar, BarChart2
} from 'lucide-react'
import { Project, Review } from '@/types'
import ProjectModal from './ProjectModal'

export default function AppDetailModal({
  isOpen,
  onClose,
  project,
  userId,
}: {
  isOpen: boolean
  onClose: () => void
  project: Project
  userId?: string
}) {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [screenshotIndex, setScreenshotIndex] = useState(0)

  // Review form state
  const [userRating, setUserRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [userComment, setUserComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)

  const isOwner = userId === project.user_id
  const screenshots = project.screenshots ?? []
  const hasPrev = screenshotIndex > 0
  const hasNext = screenshotIndex < screenshots.length - 1

  // Increment views on open
  useEffect(() => {
    if (isOpen && project.id) {
      supabase
        .from('projects')
        .update({ views: (project.views ?? 0) + 1 })
        .eq('id', project.id)
        .then(() => {})
    }
  }, [isOpen, project.id])

  // Fetch reviews on open
  useEffect(() => {
    if (isOpen && project.id) {
      setScreenshotIndex(0)
      setReviewSuccess(false)
      const fetchReviews = async () => {
        setReviewsLoading(true)
        try {
          const { data } = await supabase
            .from('reviews')
            .select('*, profiles(full_name, avatar_url)')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false })
          if (data) setReviews(data)
        } catch (err) {
          console.error('리뷰 불러오기 오류:', err)
        } finally {
          setReviewsLoading(false)
        }
      }
      fetchReviews()
    }
  }, [isOpen, project.id])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const handleDelete = async () => {
    if (!confirm('이 산출물을 삭제하시겠습니까?')) return
    setLoading(true)
    try {
      const { error } = await supabase.from('projects').delete().eq('id', project.id)
      if (error) throw error
      router.refresh()
      onClose()
    } catch (err) {
      console.error('삭제 오류:', err)
      alert('삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return alert('리뷰를 작성하려면 로그인이 필요합니다.')
    setSubmittingReview(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        project_id: project.id,
        user_id: userId,
        rating: userRating,
        comment: userComment,
      })
      if (error) throw error

      const { data } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, avatar_url)')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })
      if (data) setReviews(data)

      router.refresh()
      setUserComment('')
      setUserRating(5)
      setReviewSuccess(true)
    } catch (err) {
      console.error('리뷰 제출 오류:', err)
      alert('리뷰 제출에 실패했습니다. 이미 리뷰를 작성했을 수 있습니다.')
    } finally {
      setSubmittingReview(false)
    }
  }

  const difficultyLabel = { low: '하', medium: '중', high: '상' }
  const difficultyColor = {
    low: 'text-blue-600 bg-blue-50 border-blue-100',
    medium: 'text-yellow-700 bg-yellow-50 border-yellow-100',
    high: 'text-red-600 bg-red-50 border-red-100',
  }

  const formattedDate = project.created_at
    ? new Date(project.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] my-auto">

          {/* ── Hero / Screenshot area ── */}
          <div className="relative bg-gray-100 rounded-t-2xl overflow-hidden flex-shrink-0" style={{ aspectRatio: '16/7' }}>
            {screenshots.length > 0 ? (
              <>
                <img
                  src={screenshots[screenshotIndex]}
                  alt={`스크린샷 ${screenshotIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Carousel controls */}
                {screenshots.length > 1 && (
                  <>
                    <button
                      onClick={() => setScreenshotIndex(i => i - 1)}
                      disabled={!hasPrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setScreenshotIndex(i => i + 1)}
                      disabled={!hasNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {/* Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {screenshots.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setScreenshotIndex(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${i === screenshotIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
                {project.type === 'document' ? (
                  <FileText className="w-16 h-16 text-green-300" />
                ) : (
                  <span className="text-7xl font-bold text-green-200">{project.title.charAt(0).toUpperCase()}</span>
                )}
              </div>
            )}

            {/* Top badges */}
            <div className="absolute top-3 left-3 flex gap-1.5">
              {project.is_featured && (
                <span className="px-2.5 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full shadow">
                  ⭐ Featured
                </span>
              )}
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow ${project.type === 'webapp' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                {project.type === 'webapp' ? '웹앱' : '문서'}
              </span>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 bg-black/25 hover:bg-black/50 text-white rounded-full transition-colors backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto px-6 pb-8 pt-5">

            {/* Title row */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">{project.title}</h2>
              {project.difficulty && (
                <span className={`flex-shrink-0 mt-0.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${difficultyColor[project.difficulty]}`}>
                  난이도 {difficultyLabel[project.difficulty]}
                </span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
              {(project.review_count ?? 0) > 0 ? (
                <span className="flex items-center gap-1 text-yellow-500 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {Number(project.average_rating).toFixed(1)}
                  <span className="text-gray-400 font-normal">({project.review_count})</span>
                </span>
              ) : (
                <span className="text-gray-400 text-xs italic">리뷰 없음</span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {project.views} 조회
              </span>
              {project.bookmark_count !== undefined && project.bookmark_count > 0 && (
                <span className="flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5" />
                  {project.bookmark_count}
                </span>
              )}
              {formattedDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formattedDate}
                </span>
              )}
              {project.category && (
                <span className="flex items-center gap-1">
                  <BarChart2 className="w-3.5 h-3.5" />
                  {project.category}
                </span>
              )}
            </div>

            {/* Author */}
            {project.profiles && (
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                {project.profiles.avatar_url ? (
                  <img src={project.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full border border-gray-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{project.profiles.full_name || '익명'}</p>
                  <p className="text-xs text-gray-400">작성자</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              {project.type === 'webapp' && project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-full text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
                >
                  <Globe className="w-4 h-4" />
                  방문하기
                </a>
              )}
              {project.type === 'document' && project.file_url && (
                <a
                  href={project.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  다운로드
                </a>
              )}
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-700 transition-colors shadow-sm"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              )}
              {isOwner && (
                <>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    수정
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-full text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </>
              )}
            </div>

            {/* Tags */}
            {project.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {project.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {project.description && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">소개</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                  {project.description}
                </p>
              </div>
            )}

            {/* AI Feedback */}
            {project.ai_feedback && (
              <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl">
                <h3 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  ✨ AI 피드백
                </h3>
                <p className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">{project.ai_feedback}</p>
                {project.ai_feedback_at && (
                  <p className="text-xs text-green-500 mt-2">
                    {new Date(project.ai_feedback_at).toLocaleDateString('ko-KR')}
                  </p>
                )}
              </div>
            )}

            {/* ── Reviews section ── */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                리뷰 및 평점
                <span className="ml-1.5 text-sm font-normal text-gray-400">({reviews.length})</span>
              </h3>

              {/* Review form — only for logged-in non-owners who haven't reviewed yet */}
              {!isOwner && userId && !reviewSuccess && (
                <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm font-semibold text-gray-800 mb-3">리뷰 작성</p>

                  {/* Star picker */}
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setUserRating(star)}
                        className="transition-transform active:scale-90 focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= (hoverRating || userRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs text-gray-400">{userRating}점</span>
                  </div>

                  <textarea
                    required
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    placeholder="이 산출물에 대한 의견을 남겨주세요..."
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-300 transition-all bg-white"
                    rows={3}
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-full hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {submittingReview ? '제출 중...' : '리뷰 등록'}
                  </button>
                </form>
              )}

              {reviewSuccess && (
                <div className="mb-6 p-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-100 font-medium">
                  리뷰가 등록되었습니다! 감사합니다 🎉
                </div>
              )}

              {!userId && (
                <p className="mb-4 text-sm text-gray-400">
                  리뷰를 작성하려면{' '}
                  <a href="/login" className="text-green-600 font-medium hover:underline">로그인</a>이 필요합니다.
                </p>
              )}

              {/* Review list */}
              {reviewsLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                  <div className="w-4 h-4 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin" />
                  리뷰를 불러오는 중...
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="flex gap-3">
                      {review.profiles?.avatar_url ? (
                        <img
                          src={review.profiles.avatar_url}
                          alt=""
                          className="w-9 h-9 rounded-full flex-shrink-0 border border-gray-100"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full flex-shrink-0 bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">
                          {review.profiles?.full_name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {review.profiles?.full_name || '익명'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(review.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm py-4 text-center">
                  아직 리뷰가 없습니다. 첫 번째 리뷰어가 되어주세요!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {isEditModalOpen && userId && (
        <ProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          userId={userId}
          project={project}
        />
      )}
    </>
  )
}
