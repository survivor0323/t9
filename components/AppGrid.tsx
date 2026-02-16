'use client'

import { useState } from 'react'
import { Project } from '@/types'
import AppCard from './AppCard'
import { LayoutGrid, List } from 'lucide-react'

export default function AppGrid({
    projects,
    userId,
}: {
    projects: Project[]
    userId?: string
}) {
    const [filter, setFilter] = useState<'newest' | 'popular'>('newest')

    const sortedProjects = [...projects].sort((a, b) => {
        if (filter === 'newest') {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        return b.views - a.views
    })

    return (
        <div className="space-y-6">
            {/* Filter / Sort Bar */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex gap-6">
                    <button
                        onClick={() => setFilter('newest')}
                        className={`text-sm font-medium pb-4 -mb-4 transition-colors ${filter === 'newest'
                                ? 'text-black border-b-2 border-black'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        Newest Apps
                    </button>
                    <button
                        onClick={() => setFilter('popular')}
                        className={`text-sm font-medium pb-4 -mb-4 transition-colors ${filter === 'popular'
                                ? 'text-black border-b-2 border-black'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        Popular
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProjects.map((project) => (
                    <AppCard key={project.id} project={project} userId={userId} />
                ))}
            </div>

            {projects.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500">No apps found. Be the first to register one!</p>
                </div>
            )}
        </div>
    )
}
