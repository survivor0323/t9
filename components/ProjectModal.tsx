'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Plus, Trash2, Image as ImageIcon } from 'lucide-react'
import { Project } from '@/types'

type ProjectModalProps = {
    isOpen: boolean
    onClose: () => void
    userId: string
    project?: Project // If provided, we are in Edit mode
}

export default function ProjectModal({
    isOpen,
    onClose,
    userId,
    project,
}: ProjectModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        description: '',
        screenshots: [] as string[],
    })

    // New screenshot input state
    const [newScreenshot, setNewScreenshot] = useState('')

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        if (isOpen && project) {
            setFormData({
                title: project.title,
                url: project.url || '',
                description: project.description || '',
                screenshots: project.screenshots || [],
            })
        } else if (isOpen && !project) {
            // Reset for create mode
            setFormData({
                title: '',
                url: '',
                description: '',
                screenshots: [],
            })
        }
    }, [isOpen, project])

    const handleAddScreenshot = () => {
        if (!newScreenshot.trim()) return
        if (formData.screenshots.length >= 3) {
            alert("You can only add up to 3 screenshots.")
            return
        }
        setFormData(prev => ({
            ...prev,
            screenshots: [...prev.screenshots, newScreenshot.trim()]
        }))
        setNewScreenshot('')
    }

    const handleRemoveScreenshot = (index: number) => {
        setFormData(prev => ({
            ...prev,
            screenshots: prev.screenshots.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (project) {
                // Update existing project
                const { error } = await supabase
                    .from('projects')
                    .update({
                        title: formData.title,
                        url: formData.url,
                        description: formData.description,
                        screenshots: formData.screenshots,
                    })
                    .eq('id', project.id)

                if (error) throw error
            } else {
                // Create new project
                const { error } = await supabase.from('projects').insert({
                    user_id: userId,
                    title: formData.title,
                    url: formData.url,
                    description: formData.description,
                    screenshots: formData.screenshots,
                    status: 'published',
                })

                if (error) throw error
            }

            router.refresh()
            onClose()
        } catch (error) {
            console.error('Error saving app:', error)
            alert('Failed to save app')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {project ? 'Edit App' : 'Register New App'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 flex-1">
                    <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                App Name
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors"
                                placeholder="e.g., My Awesome Calculator"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL
                            </label>
                            <input
                                required
                                type="url"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors"
                                placeholder="https://..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                required
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors resize-none"
                                placeholder="What does your app do?"
                            />
                        </div>

                        {/* Screenshots Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Screenshots (URL) <span className="text-xs text-gray-400">Max 3</span>
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="url"
                                    value={newScreenshot}
                                    onChange={(e) => setNewScreenshot(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors text-sm"
                                    placeholder="https://image-url.com/..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddScreenshot();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddScreenshot}
                                    disabled={formData.screenshots.length >= 3 || !newScreenshot}
                                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Screenshots List */}
                            {formData.screenshots.length > 0 && (
                                <div className="space-y-2 mt-3">
                                    {formData.screenshots.map((url, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100 group">
                                            <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                                <img src={url} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150?text=Error'} />
                                            </div>
                                            <span className="text-xs text-gray-500 truncate flex-1">{url}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveScreenshot(idx)}
                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                    <button
                        type="submit"
                        form="project-form"
                        disabled={loading}
                        className="w-full py-2.5 bg-black text-white rounded-md font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-all"
                    >
                        {loading ? 'Saving...' : (project ? 'Update App' : 'Register App')}
                    </button>
                </div>
            </div>
        </div>
    )
}
