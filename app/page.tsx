import { createClient } from '@/utils/supabase/server'
import Header from '@/components/Header'
import AppGrid from '@/components/AppGrid'
import FeaturedBanner from '@/components/FeaturedBanner'
import QuizBanner from '@/components/QuizBanner'
import ChatBot from '@/components/ChatBot'

export const dynamic = 'force-dynamic'

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get profile
  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  // Get all public projects with reviews for rating computation
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      profiles(id, full_name, avatar_url),
      reviews(rating)
    `)
    .eq('status', 'public')
    .order('created_at', { ascending: false })

  // Compute average_rating and review_count from joined reviews
  const enrichedProjects = (projects || []).map(p => {
    const ratings = (p.reviews || []).map((r: { rating: number }) => r.rating)
    return {
      ...p,
      reviews: undefined,
      average_rating: ratings.length
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
        : 0,
      review_count: ratings.length,
    }
  })

  // Featured projects (is_featured=true, already filtered to public above)
  const featuredProjects = enrichedProjects.filter(p => p.is_featured)

  // User bookmarks
  let bookmarkedIds: string[] = []
  if (user) {
    const { data: bm } = await supabase
      .from('bookmarks')
      .select('project_id')
      .eq('user_id', user.id)
    bookmarkedIds = (bm || []).map((b: { project_id: string }) => b.project_id)
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header user={user} profile={profile} />

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Quiz Banner - shown if logged in */}
        {user && <QuizBanner userId={user.id} />}

        {/* Featured banner */}
        {featuredProjects.length > 0 && (
          <FeaturedBanner projects={featuredProjects} />
        )}

        {/* Section header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Motive AI Hub</h1>
          <p className="text-gray-500 mt-1">바이브코딩 웹애플리케이션, AI로 만든 문서와 크리에이티브를 공유합니다</p>
        </div>

        <AppGrid
          projects={enrichedProjects}
          userId={user?.id}
          bookmarkedIds={bookmarkedIds}
          searchQuery={params.q}
        />
      </main>

      <footer className="border-t border-gray-100 mt-20 py-8 bg-gray-50">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          &copy; 2026 Motiv Intelligence. All rights reserved.
        </div>
      </footer>

      <ChatBot />
    </div>
  )
}
