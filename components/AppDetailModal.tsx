'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Star, Trash2, ExternalLink, Globe, Edit, Image as ImageIcon } from 'lucide-react'
import { Project, Profile, Review } from '@/types'
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
    const [loading, setLoading] = useState(false)
    const [reviews, setReviews] = useState<Review[]>([])
    const [reviewsLoading, setReviewsLoading] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    // Review Form State
    const [userRating, setUserRating] = useState(5)
    const [userComment, setUserComment] = useState('')
    const [submittingReview, setSubmittingReview] = useState(false)

    useEffect(() => {
        if (isOpen && project.id) {
            const fetchReviews = async () => {
                setReviewsLoading(true)
                try {
                    const { data } = await supabase
                        .from('reviews')
                        .select('*, profiles(full_name, username)')
                        .eq('project_id', project.id)
                        .order('created_at', { ascending: false })

                    if (data) setReviews(data)
                } catch (error) {
                    console.error('Error fetching reviews:', error)
                } finally {
                    setReviewsLoading(false)
                }
            }
            fetchReviews()
        }
    }, [isOpen, project.id, supabase])
    const router = useRouter()
    const isOwner = userId === project.user_id

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this app?')) return
        setLoading(true)
        try {
            const { error } = await supabase.from('projects').delete().eq('id', project.id)
            if (error) throw error
            router.refresh()
            onClose()
        } catch (error) {
            console.error('Error deleting app:', error)
            alert('Failed to delete app')
        } finally {
            setLoading(false)
        }
    }


    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userId) return alert('Please sign in to leave a review.')
        setSubmittingReview(true)
        try {
            const { error } = await supabase.from('reviews').insert({
                project_id: project.id,
                user_id: userId,
                rating: userRating,
                comment: userComment
            })
            if (error) throw error

            // Refresh reviews
            const { data } = await supabase
                .from('reviews')
                .select('*, profiles(full_name, username)')
                .eq('project_id', project.id)
                .order('created_at', { ascending: false })
            if (data) setReviews(data)

            router.refresh() // Update main grid ratings

            setUserComment('')
            setUserRating(5)
            alert('Review submitted!')
        } catch (error) {
            console.error('Error submitting review:', error)
            alert('Failed to submit review. You might have already reviewed this app.')
        } finally {
            setSubmittingReview(false)
        }
    }

    if (!isOpen) return null

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">
                    {/* Header Image / Icon Area */}
                    <div className="h-48 bg-gray-100 rounded-t-xl flex items-center justify-center relative overflow-hidden group">
                        {project.screenshots && project.screenshots.length > 0 ? (
                            <img
                                src={project.screenshots[0]}
                                alt="Cover"
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                        )}

                        <div className="absolute -bottom-10 left-8 w-24 h-24 bg-white shadow-lg rounded-2xl flex items-center justify-center text-4xl font-bold text-gray-800 z-10 border-4 border-white">
                            {project.title.charAt(0).toUpperCase()}
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-sm"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="pt-14 px-8 pb-8 flex-1 overflow-y-auto">
                        {/* Title & Meta */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{project.title}</h2>
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1 text-yellow-500 font-medium">
                                    4.5 <Star className="w-3 h-3 fill-current" />
                                </span>
                                <span>•</span>
                                <span>{project.views} views</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-center mb-8">
                            {project.url && (
                                <a
                                    href={project.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    <Globe className="w-4 h-4" />
                                    Visit App
                                </a>
                            )}
                            {isOwner && (
                                <>
                                    <button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="space-y-6">
                            {/* Screenshots */}
                            {project.screenshots && project.screenshots.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Preview</h3>
                                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                                        {project.screenshots.map((url, i) => (
                                            <div key={i} className="flex-shrink-0 w-64 aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-100 snap-center">
                                                <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">About this app</h3>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {project.description || "No description provided."}
                                </p>
                            </div>

                            {/* Reviews Section */}
                            <div className="border-t border-gray-100 pt-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-gray-900">Ratings & Reviews <span className="text-gray-400 font-normal text-sm">({reviews.length})</span></h3>
                                </div>

                                {/* Review Form */}
                                {!isOwner && userId && (
                                    <form onSubmit={handleSubmitReview} className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Write a Review</h4>
                                        <div className="flex gap-1 mb-3">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setUserRating(star)}
                                                    className="focus:outline-none transition-transform active:scale-95"
                                                >
                                                    <Star
                                                        className={`w-5 h-5 ${star <= userRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            required
                                            value={userComment}
                                            onChange={(e) => setUserComment(e.target.value)}
                                            placeholder="Share your thoughts..."
                                            className="w-full p-3 border border-gray-200 rounded-md text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                            rows={2}
                                        />
                                        <button
                                            type="submit"
                                            disabled={submittingReview}
                                            className="text-sm bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50"
                                        >
                                            {submittingReview ? 'Posting...' : 'Post Review'}
                                        </button>
                                    </form>
                                )}

                                {reviewsLoading ? (
                                    <p className="text-gray-500 text-sm">Loading reviews...</p>
                                ) : reviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {reviews.map((review) => (
                                            <div key={review.id} className="flex gap-3">
                                                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">
                                                    U
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {review.profiles?.full_name || review.profiles?.username || 'User'}
                                                    </div>
                                                    <div className="flex text-yellow-400 text-xs mb-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                                                        ))}
                                                    </div>
                                                    <p className="text-sm text-gray-600">{review.comment}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No reviews yet. Be the first to rate!</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
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
