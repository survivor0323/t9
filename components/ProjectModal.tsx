'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Trash2, Upload, Loader2, FileText, Image } from 'lucide-react'
import { Project } from '@/types'

const CATEGORIES = ['기획', '영업', '마케팅', '디자인', '운영', '경영', '개발', '기타']

const ACCEPTED_DOC_TYPES = '.pdf,.pptx,.ppt,.docx,.doc'
const ACCEPTED_DOC_MIME = 'application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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
    const [uploadingDoc, setUploadingDoc] = useState(false)
    const [tagInput, setTagInput] = useState('')
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        description: '',
        category: '',
        screenshots: [] as string[],
        tags: [] as string[],
        file_url: '',
        file_name: '',
        file_size: 0,
        thumbnail_url: '',
    })

    const isDocument = project?.type === 'document'

    const fileInputRef = useRef<HTMLInputElement>(null)
    const docInputRef = useRef<HTMLInputElement>(null)
    const thumbInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        if (isOpen && project) {
            setFormData({
                title: project.title,
                url: project.url || '',
                description: project.description || '',
                category: project.category || '',
                screenshots: project.screenshots || [],
                tags: project.tags || [],
                file_url: project.file_url || '',
                file_name: project.file_url ? project.file_url.split('/').pop() || '' : '',
                file_size: 0,
                thumbnail_url: project.screenshots?.[0] || '',
            })
        } else if (isOpen && !project) {
            setFormData({
                title: '',
                url: '',
                description: '',
                category: '',
                screenshots: [],
                tags: [],
                file_url: '',
                file_name: '',
                file_size: 0,
                thumbnail_url: '',
            })
            setTagInput('')
        }
    }, [isOpen, project])

    // --- Webapp: screenshot upload ---
    const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        if (formData.screenshots.length >= 3) {
            alert('스크린샷은 최대 3장까지 가능합니다.')
            return
        }
        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/${Date.now()}.${fileExt}`
        setUploading(true)
        try {
            const { error } = await supabase.storage.from('screenshots').upload(fileName, file)
            if (error) throw error
            const { data } = supabase.storage.from('screenshots').getPublicUrl(fileName)
            setFormData(prev => ({ ...prev, screenshots: [...prev.screenshots, data.publicUrl] }))
        } catch (error) {
            console.error('Error uploading image:', error)
            alert('이미지 업로드 실패')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleRemoveScreenshot = (index: number) => {
        setFormData(prev => ({ ...prev, screenshots: prev.screenshots.filter((_, i) => i !== index) }))
    }

    // --- Document: file upload ---
    const handleDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return
        const file = e.target.files[0]
        const ext = file.name.split('.').pop()
        const fileName = `${userId}/${Date.now()}.${ext}`
        setUploadingDoc(true)
        try {
            const { error } = await supabase.storage.from('documents').upload(fileName, file)
            if (error) throw error
            const { data } = supabase.storage.from('documents').getPublicUrl(fileName)
            setFormData(prev => ({ ...prev, file_url: data.publicUrl, file_name: file.name, file_size: file.size }))
        } catch {
            alert('파일 업로드 실패')
        } finally {
            setUploadingDoc(false)
            if (docInputRef.current) docInputRef.current.value = ''
        }
    }

    // --- Document: thumbnail upload ---
    const handleThumbChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return
        const file = e.target.files[0]
        const ext = file.name.split('.').pop()
        const fileName = `${userId}/thumb_${Date.now()}.${ext}`
        setUploading(true)
        try {
            const { error } = await supabase.storage.from('screenshots').upload(fileName, file)
            if (error) throw error
            const { data } = supabase.storage.from('screenshots').getPublicUrl(fileName)
            setFormData(prev => ({ ...prev, thumbnail_url: data.publicUrl }))
        } catch {
            alert('썸네일 업로드 실패')
        } finally {
            setUploading(false)
            if (thumbInputRef.current) thumbInputRef.current.value = ''
        }
    }

    // --- Tags ---
    const addTag = (value: string) => {
        const tag = value.trim().replace(/^#/, '')
        if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
        }
        setTagInput('')
    }

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag(tagInput)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (project) {
                // Update existing project
                if (isDocument) {
                    const screenshots = formData.thumbnail_url ? [formData.thumbnail_url] : []
                    const { error } = await supabase
                        .from('projects')
                        .update({
                            title: formData.title,
                            file_url: formData.file_url,
                            description: formData.description,
                            category: formData.category || null,
                            tags: formData.tags,
                            screenshots,
                        })
                        .eq('id', project.id)
                    if (error) throw error
                } else {
                    const { error } = await supabase
                        .from('projects')
                        .update({
                            title: formData.title,
                            url: formData.url,
                            description: formData.description,
                            category: formData.category || null,
                            screenshots: formData.screenshots,
                        })
                        .eq('id', project.id)
                    if (error) throw error
                }
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
            console.error('Error saving project:', error)
            alert('저장 실패')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const modalTitle = project
        ? (isDocument ? '문서 수정' : '앱 수정')
        : '앱 등록'

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-900">{modalTitle}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 flex-1">
                    <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {isDocument ? '제목' : '앱 이름'}
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-colors"
                                placeholder={isDocument ? '문서 제목을 입력하세요' : '앱 이름을 입력하세요'}
                            />
                        </div>

                        {isDocument ? (
                            <>
                                {/* Document File Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        파일 <span className="text-gray-400 text-xs">(PDF, PPTX, DOCX)</span>
                                    </label>
                                    {formData.file_url ? (
                                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <FileText className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{formData.file_name}</p>
                                                {formData.file_size > 0 && (
                                                    <p className="text-xs text-gray-400">{formatFileSize(formData.file_size)}</p>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, file_url: '', file_name: '', file_size: 0 }))}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                ref={docInputRef}
                                                type="file"
                                                accept={`${ACCEPTED_DOC_TYPES},${ACCEPTED_DOC_MIME}`}
                                                onChange={handleDocChange}
                                                disabled={uploadingDoc}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="flex items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 text-sm transition-colors">
                                                {uploadingDoc ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" /> 업로드 중...
                                                    </>
                                                ) : (
                                                    <div className="text-center">
                                                        <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                                                        <p>파일을 클릭하여 업로드</p>
                                                        <p className="text-xs text-gray-400 mt-1">PDF, PPTX, DOCX 지원</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Thumbnail (optional) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        썸네일 이미지 <span className="text-gray-400 text-xs">(선택)</span>
                                    </label>
                                    {formData.thumbnail_url ? (
                                        <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
                                            <img
                                                src={formData.thumbnail_url}
                                                alt="thumbnail"
                                                className="w-16 h-12 object-cover rounded-lg border"
                                            />
                                            <span className="text-xs text-gray-400 truncate flex-1 font-mono">
                                                {formData.thumbnail_url.split('/').pop()}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, thumbnail_url: '' }))}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                ref={thumbInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleThumbChange}
                                                disabled={uploading}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 text-sm transition-colors">
                                                {uploading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" /> 업로드 중...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Image className="w-4 h-4" /> 썸네일 이미지 업로드
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Webapp: URL */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                                    <input
                                        required
                                        type="url"
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-colors"
                                        placeholder="https://..."
                                    />
                                </div>
                            </>
                        )}

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                            <textarea
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-colors resize-none"
                                placeholder={isDocument ? '문서에 대해 설명해주세요' : '어떤 앱인지 설명해주세요'}
                            />
                        </div>

                        {/* Tags (document only) */}
                        {isDocument && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    태그 <span className="text-gray-400 text-xs">(최대 5개)</span>
                                </label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {formData.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-sm rounded-full"
                                        >
                                            #{tag}
                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))}
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                {formData.tags.length < 5 && (
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        onBlur={() => tagInput && addTag(tagInput)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 text-sm"
                                        placeholder="태그 입력 후 Enter..."
                                    />
                                )}
                            </div>
                        )}

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 bg-white transition-colors"
                            >
                                <option value="">선택하세요</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Screenshots (webapp only) */}
                        {!isDocument && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    스크린샷 <span className="text-xs text-gray-400">최대 3장</span>
                                </label>
                                <div className="flex flex-col gap-3">
                                    {formData.screenshots.length < 3 && (
                                        <div className="relative">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleScreenshotChange}
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
                        )}
                    </form>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                    <button
                        type="submit"
                        form="project-form"
                        disabled={loading || uploading || uploadingDoc}
                        className="w-full py-2.5 bg-black text-white rounded-md font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-all"
                    >
                        {loading ? '저장 중...' : (project ? '수정 완료' : '등록')}
                    </button>
                </div>
            </div>
        </div>
    )
}
