'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Check, Palette } from 'lucide-react'
import { Profile } from '@/types'

const PRESET_COLORS = [
    '#eec9d2', '#f4b6c2', '#f6eac2',
    '#eee6ab', '#a8e6cf', '#dcedc1',
    '#ffd3b6', '#ffaaa5', '#ff8b94'
]

type ProfileHeaderProps = {
    user: any
    profile?: Profile
}

export default function ProfileHeader({ user, profile }: ProfileHeaderProps) {
    const router = useRouter()
    const supabase = createClient()
    const [updating, setUpdating] = useState(false)
    const [selectedColor, setSelectedColor] = useState(profile?.card_color || PRESET_COLORS[0])
    const [isPickerOpen, setIsPickerOpen] = useState(false)

    const handleColorChange = async (color: string) => {
        if (updating || color === profile?.card_color) return

        setUpdating(true)
        setSelectedColor(color)

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ card_color: color })
                .eq('id', user.id)

            if (error) throw error

            router.refresh()
            setIsPickerOpen(false)
        } catch (error) {
            console.error('Error updating color:', error)
            alert('Failed to update color')
            // Revert on error if needed, but router refresh will fix it essentially
        } finally {
            setUpdating(false)
        }
    }

    return (
        <div className="mb-8 border-b border-gray-100 pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    {user.user_metadata?.avatar_url ? (
                        <div className="relative">
                            <img
                                src={user.user_metadata.avatar_url}
                                alt="Profile"
                                className="w-16 h-16 rounded-full border border-gray-200"
                            />
                            <div
                                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white"
                                style={{ background: selectedColor }}
                            />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-full" />
                    )}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            My Apps
                        </h1>
                        <p className="text-gray-500">
                            Manage your applications and card theme.
                        </p>
                    </div>
                </div>

                {/* Color Picker Section */}
                <div className="relative">
                    <button
                        onClick={() => setIsPickerOpen(!isPickerOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700"
                    >
                        <Palette className="w-4 h-4" />
                        <span>Card Theme</span>
                        <div
                            className="w-4 h-4 rounded-full border border-gray-200 ml-1"
                            style={{ background: selectedColor }}
                        />
                    </button>

                    {isPickerOpen && (
                        <div className="absolute right-0 top-full mt-2 p-3 bg-white rounded-xl shadow-xl border border-gray-100 grid grid-cols-3 gap-2 z-10 w-48">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => handleColorChange(color)}
                                    disabled={updating}
                                    className="w-10 h-10 rounded-full border border-gray-100 hover:scale-110 transition-transform relative"
                                    style={{ background: color }}
                                >
                                    {selectedColor === color && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Check className="w-4 h-4 text-black/50" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
