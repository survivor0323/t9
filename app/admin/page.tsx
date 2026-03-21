import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import AdminTabs from './AdminTabs'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Check admin status
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  const admin = createAdminClient()

  // Fetch all projects (bypass RLS)
  const { data: projects } = await admin
    .from('projects')
    .select('id, title, type, status, views, is_featured, created_at, category')
    .order('created_at', { ascending: false })

  // Fetch all profiles (bypass RLS)
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, quiz_score, is_admin, created_at')
    .order('created_at', { ascending: false })

  // Compute stats
  const totalProjects = (projects || []).length
  const totalUsers = (profiles || []).length
  const featuredCount = (projects || []).filter(p => p.is_featured).length
  const totalViews = (projects || []).reduce((sum, p) => sum + (p.views || 0), 0)

  const stats = { totalProjects, totalUsers, featuredCount, totalViews }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="text-gray-500 mt-1">M.hub 플랫폼 관리</p>
        </div>
        <AdminTabs
          stats={stats}
          projects={projects || []}
          profiles={profiles || []}
        />
      </div>
    </div>
  )
}
