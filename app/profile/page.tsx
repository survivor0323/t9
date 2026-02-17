import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import AppGrid from '@/components/AppGrid'
import ProfileHeader from '@/components/ProfileHeader'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch User Profile (for color)
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: projects, error } = await supabase
        .from('projects')
        .select('*, profiles(card_color)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching user projects:', error)
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            <Header user={user} />

            <main className="container mx-auto px-4 py-8 max-w-7xl">
                <ProfileHeader user={user} profile={profile} />

                <AppGrid projects={projects || []} userId={user.id} />
            </main>
        </div>
    )
}
