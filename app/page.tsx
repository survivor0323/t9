import { createClient } from '@/utils/supabase/server'
import Header from '@/components/Header'
import AppGrid from '@/components/AppGrid'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()

  // Fetch User
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch Projects (Web Apps)
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-indigo-100">
      <Header user={user} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Discover Great Web Apps
          </h1>
          <p className="text-gray-500 text-lg">
            Explore a curated list of tools and services registered by the community.
          </p>
        </div>

        <AppGrid projects={projects || []} userId={user?.id} />
      </main>

      <footer className="border-t border-gray-100 mt-20 py-8 bg-gray-50">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; 2026 M.Vibe Marketplace. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
