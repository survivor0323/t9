import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import ProfileTabs from './ProfileTabs'
import { Project } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch user's own projects (all statuses)
  const { data: projects } = await supabase
    .from('projects')
    .select('*, profiles(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch bookmarked projects
  const { data: bookmarkRows } = await supabase
    .from('bookmarks')
    .select('project_id, projects(*, profiles(*))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const bookmarkedProjects: Project[] = (bookmarkRows ?? [])
    .map((row: any) => row.projects)
    .filter(Boolean)

  // Fetch stats
  const { data: statsRows } = await supabase
    .from('projects')
    .select('views, clicks')
    .eq('user_id', user.id)

  const totalViews = (statsRows ?? []).reduce((sum: number, r: any) => sum + (r.views ?? 0), 0)

  const { count: totalBookmarksReceived } = await supabase
    .from('bookmarks')
    .select('id', { count: 'exact', head: true })
    .in(
      'project_id',
      (projects ?? []).map((p: any) => p.id)
    )

  const { data: reviewStats } = await supabase
    .from('reviews')
    .select('rating')
    .in(
      'project_id',
      (projects ?? []).map((p: any) => p.id)
    )

  const totalReviews = (reviewStats ?? []).length
  const averageRating =
    totalReviews > 0
      ? (reviewStats ?? []).reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
      : 0

  const params = await searchParams
  const registeredParam = params?.registered ?? null

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Header user={user} profile={profile} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <ProfileTabs
          projects={projects ?? []}
          bookmarkedProjects={bookmarkedProjects}
          userId={user.id}
          stats={{
            totalViews,
            totalBookmarksReceived: totalBookmarksReceived ?? 0,
            totalReviews,
            averageRating,
          }}
          registeredParam={registeredParam}
        />
      </main>
    </div>
  )
}
