'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Plus, Trash2, Image as ImageIcon, Upload, Loader2 } from 'lucide-react'
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
    const [uploading, setUploading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        description: '',
        screenshots: [] as string[],
    })

    const fileInputRef = useRef<HTMLInputElement>(null)
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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        if (formData.screenshots.length >= 3) {
            alert("You can only add up to 3 screenshots.")
            return
        }

        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        setUploading(true)

        try {
            const { error: uploadError } = await supabase.storage
                .from('screenshots')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data } = supabase.storage.from('screenshots').getPublicUrl(filePath)

            setFormData(prev => ({
                ...prev,
                screenshots: [...prev.screenshots, data.publicUrl]
            }))
        } catch (error) {
            console.error('Error uploading image:', error)
            alert('Failed to upload image')
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
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

                        {/* Screenshots Input (File Upload) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Screenshots <span className="text-xs text-gray-400">Max 3</span>
                            </label>

                            <div className="flex flex-col gap-3">
                                {/* Upload Button */}
                                {formData.screenshots.length < 3 && (
                                    <div className="relative">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            disabled={uploading}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                                        />
                                        <div className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                                            {uploading ? (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span className="text-sm">Uploading...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Upload className="w-5 h-5" />
                                                    <span className="text-sm font-medium">Click to upload screenshot</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Screenshots List */}
                                {formData.screenshots.length > 0 && (
                                    <div className="space-y-2">
                                        {formData.screenshots.map((url, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100 group">
                                                <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                                                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-xs text-gray-500 truncate flex-1 font-mono">{url.split('/').pop()}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveScreenshot(idx)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                    <button
                        type="submit"
                        form="project-form"
                        disabled={loading || uploading}
                        className="w-full py-2.5 bg-black text-white rounded-md font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-all"
                    >
                        {loading ? 'Saving...' : (project ? 'Update App' : 'Register App')}
                    </button>
                </div>
            </div>
        </div>
    )
}
