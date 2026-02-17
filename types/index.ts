export type Project = {
    id: string
    user_id: string
    title: string
    status: string
    created_at: string
    url?: string
    description?: string
    views: number
    screenshots?: string[]
    profiles?: Profile // Owner information
    average_rating?: number
    review_count?: number
}

export type Profile = {
    id: string
    full_name?: string
    username?: string
    avatar_url?: string
    card_color?: string
}

export type Review = {
    id: string
    project_id: string
    user_id: string
    rating: number
    comment?: string
    created_at: string
    profiles?: Profile
}


