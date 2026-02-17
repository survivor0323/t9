'use client'

import { useState } from 'react'
import { Star, Eye } from 'lucide-react'
import { Project } from '@/types'
import AppDetailModal from './AppDetailModal'

export default function AppCard({
    project,
    userId,
}: {
    project: Project
    userId?: string
}) {
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    return (
        <>
            <div
                onClick={() => setIsDetailOpen(true)}
                className="group relative bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
            >
                <div className="flex items-start gap-4">
                    <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-gray-700 shadow-inner group-hover:scale-105 transition-transform"
                        style={{
                            background: project.profiles?.card_color
                                ? project.profiles.card_color
                                : 'linear-gradient(to bottom right, #f3f4f6, #e5e7eb)' // Fallback gray gradient
                        }}
                    >
                        {project.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                            {project.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2 h-10">
                            {project.description || "No description provided."}
                        </p>
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                            {project.review_count && project.review_count > 0 ? (
                                <span className="flex items-center gap-1 font-medium text-gray-900">
                                    {project.average_rating} <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-gray-400 font-normal">({project.review_count})</span>
                                </span>
                            ) : (
                                <span className="text-gray-400 italic">
                                    아직 별점이 없습니다. 첫 리뷰어가 되어주세요!
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                {project.views} <Eye className="w-3 h-3" />
                            </span>
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
