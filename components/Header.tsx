'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Plus, LogOut, User as UserIcon } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import ProjectModal from './ProjectModal'

type HeaderProps = {
    user: any // Supabase user object
}

export default function Header({ user }: HeaderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    return (
        <>
            <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    {/* Left: Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                            M
                        </div>
                        <span className="font-bold text-xl tracking-tight text-gray-900">
                            My Apps
                        </span>
                    </Link>

                    {/* Center: AI Search Bar */}
                    <div className="flex-1 max-w-2xl hidden md:flex">
                        <div className="relative w-full group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-full leading-5 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 sm:text-sm transition-all shadow-sm group-hover:bg-white"
                                placeholder="Ask AI to find an app (e.g., 'I need a good calculator')..."
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                                    AI
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Register App</span>
                                </button>

                                {/* Mobile Icon Button */}
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="sm:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>

                                <div className="h-6 w-px bg-gray-200 mx-1" />

                                <div className="relative group">
                                    <button className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-full transition-colors">
                                        {user.user_metadata?.avatar_url ? (
                                            <img
                                                src={user.user_metadata.avatar_url}
                                                alt="User"
                                                className="w-8 h-8 rounded-full border border-gray-200"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                                <UserIcon className="w-4 h-4" />
                                            </div>
                                        )}
                                    </button>

                                    {/* Dropdown Menu */}
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                                        <div className="px-4 py-2 border-b border-gray-50">
                                            <p className="text-xs text-gray-500 truncate">Signed in as</p>
                                            <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                                        </div>
                                        <Link
                                            href="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            My Apps
                                        </Link>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Project Modal (Create) */}
            {user && (
                <ProjectModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    userId={user.id}
                />
            )}
        </>
    )
}
