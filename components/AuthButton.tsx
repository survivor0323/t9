import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AuthButton() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const signOut = async () => {
        'use server'

        const supabase = await createClient()
        await supabase.auth.signOut()
        return redirect('/login')
    }

    return user ? (
        <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-300">
                Hey, {user.email}!
            </span>
            <form action={signOut}>
                <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
                    Logout
                </button>
            </form>
        </div>
    ) : (
        <Link
            href="/login"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
            Login
        </Link>
    )
}
