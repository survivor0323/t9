-- Unified point system: merge quiz_score into point
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS point integer DEFAULT 0;
UPDATE profiles SET point = COALESCE(quiz_score, 0);
ALTER TABLE profiles DROP COLUMN IF EXISTS quiz_score;

-- Point history log
CREATE TABLE IF NOT EXISTS point_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  reference_id uuid
);

ALTER TABLE point_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own point logs" ON point_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all point logs" ON point_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
