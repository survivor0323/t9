import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { userId, amount, reason, referenceId } = await req.json()

    if (!userId || !amount || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // Insert point log
    const { error: logError } = await admin
      .from('point_logs')
      .insert({
        user_id: userId,
        amount,
        reason,
        reference_id: referenceId || null,
      })

    if (logError) throw logError

    // Update total point
    const { data: profile } = await admin
      .from('profiles')
      .select('point')
      .eq('id', userId)
      .single()

    const { error: updateError } = await admin
      .from('profiles')
      .update({ point: (profile?.point ?? 0) + amount })
      .eq('id', userId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, newTotal: (profile?.point ?? 0) + amount })
  } catch (error) {
    console.error('Points error:', error)
    return NextResponse.json({ error: 'Failed to add points' }, { status: 500 })
  }
}
