'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Upload, X, Trash2, Loader2, Sparkles, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = ['기획', '영업', '마케팅', '디자인', '운영', '경영', '개발', '기타']

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${ok ? 'text-green-600' : 'text-gray-400'}`}>
      <span className="text-base">{ok ? '✅' : '❌'}</span>
      {label}
    </div>
  )
}

export default function RegisterWebappPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [classifying, setClassifying] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const [form, setForm] = useState({
    title: '',
    url: '',
    github_url: '',
    description: '',
    tags: [] as string[],
    category: '',
    screenshots: [] as string[],
  })

  const isPublicReady =
    form.screenshots.length >= 1 &&
    form.description.length >= 20 &&
    form.tags.length >= 1 &&
    form.category !== ''

  const addTag = (value: string) => {
    const tag = value.trim().replace(/^#/, '')
    if (tag && !form.tags.includes(tag) && form.tags.length < 5) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }))
    }
    setTagInput('')
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || form.screenshots.length >= 3) return
    const file = e.target.files[0]
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const fileName = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`
    setUploading(true)
    try {
      const { error } = await supabase.storage.from('screenshots').upload(fileName, file)
      if (error) throw error
      const { data } = supabase.storage.from('screenshots').getPublicUrl(fileName)
      setForm(prev => ({ ...prev, screenshots: [...prev.screenshots, data.publicUrl] }))
    } catch {
      alert('업로드 실패')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleClassify = async () => {
    if (!form.description) return
    setClassifying(true)
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, description: form.description, tags: form.tags }),
      })
      const data = await res.json()
      if (data.category) setForm(prev => ({ ...prev, category: data.category }))
    } catch {
      alert('자동분류 실패')
    } finally {
      setClassifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const status = isPublicReady ? 'public' : 'draft'
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          type: 'webapp',
          status,
          title: form.title,
          url: form.url,
          github_url: form.github_url || null,
          description: form.description,
          tags: form.tags,
          category: form.category || null,
          screenshots: form.screenshots,
          views: 0,
          clicks: 0,
        })
        .select()
        .single()

      if (error) throw error

      // Trigger AI analysis if github_url exists (fire and forget)
      if (project && form.github_url) {
        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: project.id }),
        }).catch(() => {})
      }

      router.push('/')
    } catch {
      alert('등록 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> 홈으로
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">웹앱 등록</h1>

        <div className="flex gap-8">
          {/* Form */}
          <div className="flex-1 min-w-0">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                  placeholder="앱 이름을 입력하세요"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="url"
                  value={form.url}
                  onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                  placeholder="https://..."
                />
              </div>

              {/* GitHub URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub URL{' '}
                  <span className="text-gray-400 text-xs">(선택 - AI 분석용)</span>
                </label>
                <input
                  type="url"
                  value={form.github_url}
                  onChange={e => setForm(p => ({ ...p, github_url: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                  placeholder="https://github.com/..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명{' '}
                  <span className="text-gray-400 text-xs">(공개 조건: 20자 이상)</span>
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 resize-none"
                  placeholder="어떤 앱인지 설명해주세요..."
                />
                <p
                  className={`text-xs mt-1 ${
                    form.description.length >= 20 ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {form.description.length}자
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  태그{' '}
                  <span className="text-gray-400 text-xs">(공개 조건: 1개 이상, 최대 5개)</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-sm rounded-full"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() =>
                          setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))
                        }
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {form.tags.length < 5 && (
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

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리 <span className="text-gray-400 text-xs">(공개 조건)</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 bg-white"
                  >
                    <option value="">선택하세요</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleClassify}
                    disabled={classifying || !form.description}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-sm font-medium hover:bg-purple-100 disabled:opacity-50 transition-colors"
                  >
                    {classifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    AI 자동분류
                  </button>
                </div>
              </div>

              {/* Screenshots */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  스크린샷{' '}
                  <span className="text-gray-400 text-xs">(공개 조건: 1장 이상, 최대 3장)</span>
                </label>
                <div className="space-y-2">
                  {form.screenshots.map((url, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-12 h-12 object-cover rounded-lg border"
                      />
                      <span className="text-xs text-gray-400 truncate flex-1 font-mono">
                        {url.split('/').pop()}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setForm(p => ({
                            ...p,
                            screenshots: p.screenshots.filter((_, j) => j !== i),
                          }))
                        }
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {form.screenshots.length < 3 && (
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 text-sm transition-colors">
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> 업로드 중...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" /> 이미지 업로드
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !form.title}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '등록 중...' : isPublicReady ? '공개 등록' : '임시저장으로 등록'}
              </button>
            </form>
          </div>

          {/* Checklist sidebar */}
          <div className="w-60 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">공개 조건</h3>
              <div className="space-y-3">
                <CheckItem ok={form.screenshots.length >= 1} label="스크린샷 1장 이상" />
                <CheckItem ok={form.description.length >= 20} label="설명 20자 이상" />
                <CheckItem ok={form.tags.length >= 1} label="태그 1개 이상" />
                <CheckItem ok={form.category !== ''} label="카테고리 선택" />
              </div>
              <div
                className={`mt-4 p-3 rounded-xl text-xs ${
                  isPublicReady ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                }`}
              >
                {isPublicReady
                  ? '✅ 조건 충족! 공개 등록됩니다'
                  : '조건 미충족 시 비공개(임시저장)로 등록됩니다'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
