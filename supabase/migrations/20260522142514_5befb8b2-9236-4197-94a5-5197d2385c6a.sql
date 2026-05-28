
-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS weight_kg numeric,
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS activity_level text,
  ADD COLUMN IF NOT EXISTS fitness_goal text,
  ADD COLUMN IF NOT EXISTS dietary_preference text,
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS lifestyle text;

-- Extend meal_logs
ALTER TABLE public.meal_logs
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS quantity numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS protein_g numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS log_date date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS meal_type text NOT NULL DEFAULT 'lunch';

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON public.meal_logs(user_id, log_date DESC);

-- Chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for food photos
INSERT INTO storage.buckets (id, name, public) VALUES ('food-photos','food-photos', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Food photos public read" ON storage.objects FOR SELECT USING (bucket_id = 'food-photos');
CREATE POLICY "Users upload own food photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own food photos" ON storage.objects FOR DELETE
  USING (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
