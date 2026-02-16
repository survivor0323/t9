import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import AppGrid from '@/components/AppGrid'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching user projects:', error)
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            <Header user={user} />

            <main className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8 border-b border-gray-100 pb-8">
                    <div className="flex items-center gap-4 mb-4">
                        {user.user_metadata?.avatar_url ? (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt="Profile"
                                className="w-16 h-16 rounded-full border border-gray-200"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-full" />
                        )}
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                                My Apps
                            </h1>
                            <p className="text-gray-500">
                                Manage the applications you have shared with the community.
                            </p>
                        </div>
                    </div>
                </div>

                <AppGrid projects={projects || []} userId={user.id} />
            </main>
        </div>
    )
}
