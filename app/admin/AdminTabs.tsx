'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { BarChart2, AppWindow, Users, Star, Eye, Trash2, ShieldCheck, ShieldOff } from 'lucide-react'

type Project = {
  id: string
  title: string
  type: string
  status: string
  views: number
  is_featured: boolean
  created_at: string
  category: string | null
}

type Profile = {
  id: string
  full_name: string | null
  quiz_score: number | null
  is_admin: boolean
  created_at: string
}

type Stats = {
  totalProjects: number
  totalUsers: number
  featuredCount: number
  totalViews: number
}

type Tab = '통계' | '앱 관리' | '사용자 관리'

export default function AdminTabs({
  stats,
  projects: initialProjects,
  profiles: initialProfiles,
}: {
  stats: Stats
  projects: Project[]
  profiles: Profile[]
}) {
  const [activeTab, setActiveTab] = useState<Tab>('통계')
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)

  const supabase = createClient()

  // --- Project actions ---
  const toggleFeatured = async (project: Project) => {
    const newVal = !project.is_featured
    const { error } = await supabase
      .from('projects')
      .update({ is_featured: newVal })
      .eq('id', project.id)
    if (!error) {
      setProjects(prev =>
        prev.map(p => p.id === project.id ? { ...p, is_featured: newVal } : p)
      )
    }
  }

  const toggleStatus = async (project: Project) => {
    const newStatus = project.status === 'public' ? 'hidden' : 'public'
    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', project.id)
    if (!error) {
      setProjects(prev =>
        prev.map(p => p.id === project.id ? { ...p, status: newStatus } : p)
      )
    }
  }

  const deleteProject = async (project: Project) => {
    if (!confirm(`"${project.title}" 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return
    const { error } = await supabase.from('projects').delete().eq('id', project.id)
    if (!error) {
      setProjects(prev => prev.filter(p => p.id !== project.id))
    }
  }

  // --- Profile actions ---
  const toggleAdmin = async (profile: Profile) => {
    const newVal = !profile.is_admin
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: newVal })
      .eq('id', profile.id)
    if (!error) {
      setProfiles(prev =>
        prev.map(p => p.id === profile.id ? { ...p, is_admin: newVal } : p)
      )
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      public: 'bg-green-100 text-green-700',
      private: 'bg-gray-100 text-gray-600',
      hidden: 'bg-red-100 text-red-600',
    }
    const label: Record<string, string> = {
      public: '공개',
      private: '비공개',
      hidden: '숨김',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-500'}`}>
        {label[status] || status}
      </span>
    )
  }

  const tabs: Tab[] = ['통계', '앱 관리', '사용자 관리']
  const tabIcons: Record<Tab, React.ReactNode> = {
    '통계': <BarChart2 className="w-4 h-4" />,
    '앱 관리': <AppWindow className="w-4 h-4" />,
    '사용자 관리': <Users className="w-4 h-4" />,
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-gray-200 w-fit">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-green-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tabIcons[tab]}
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: 통계 */}
      {activeTab === '통계' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="전체 앱" value={stats.totalProjects} icon={<AppWindow className="w-6 h-6 text-green-600" />} />
          <StatCard label="전체 사용자" value={stats.totalUsers} icon={<Users className="w-6 h-6 text-green-600" />} />
          <StatCard label="추천 앱" value={stats.featuredCount} icon={<Star className="w-6 h-6 text-green-600" />} />
          <StatCard label="총 조회수" value={stats.totalViews.toLocaleString()} icon={<Eye className="w-6 h-6 text-green-600" />} />
        </div>
      )}

      {/* Tab 2: 앱 관리 */}
      {activeTab === '앱 관리' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">제목</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">유형</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">상태</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">조회수</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">추천</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map(project => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 max-w-[200px] truncate">{project.title}</div>
                      {project.category && (
                        <div className="text-xs text-gray-400 mt-0.5">{project.category}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {project.type === 'webapp' ? '웹앱' : '문서'}
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(project.status)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {(project.views || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleFeatured(project)}
                        title={project.is_featured ? '추천 해제' : '추천 설정'}
                        className={`transition-transform hover:scale-110 ${
                          project.is_featured ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      >
                        <Star className="w-5 h-5" fill={project.is_featured ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggleStatus(project)}
                          className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                            project.status === 'public'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {project.status === 'public' ? '숨김' : '공개'}
                        </button>
                        <button
                          onClick={() => deleteProject(project)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      등록된 앱이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: 사용자 관리 */}
      {activeTab === '사용자 관리' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">이름</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">퀴즈 점수</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">관리자</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">가입일</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">권한 변경</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map(profile => (
                  <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {profile.full_name || '(이름 없음)'}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">{profile.id.slice(0, 8)}…</div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {profile.quiz_score ?? 0}점
                    </td>
                    <td className="px-4 py-3 text-center">
                      {profile.is_admin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <ShieldCheck className="w-3 h-3" /> 관리자
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                          <ShieldOff className="w-3 h-3" /> 일반
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {new Date(profile.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleAdmin(profile)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          profile.is_admin
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {profile.is_admin ? '관리자 해제' : '관리자 지정'}
                      </button>
                    </td>
                  </tr>
                ))}
                {profiles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      등록된 사용자가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <div className="p-2 bg-green-50 rounded-lg">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  )
}
