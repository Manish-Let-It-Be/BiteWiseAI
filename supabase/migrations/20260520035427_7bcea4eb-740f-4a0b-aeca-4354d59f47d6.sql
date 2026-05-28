-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  monthly_budget NUMERIC NOT NULL DEFAULT 3000,
  daily_calorie_target INT NOT NULL DEFAULT 2000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TYPE public.dish_type AS ENUM ('healthy', 'moderate', 'indulgent');

CREATE TABLE public.dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  place_name TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  calories INT NOT NULL CHECK (calories >= 0),
  type public.dish_type NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or default dishes" ON public.dishes FOR SELECT
  USING (is_default = true OR user_id = auth.uid());
CREATE POLICY "Insert own dishes" ON public.dishes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_default = false);
CREATE POLICY "Update own dishes" ON public.dishes FOR UPDATE
  USING (auth.uid() = user_id AND is_default = false);
CREATE POLICY "Delete own dishes" ON public.dishes FOR DELETE
  USING (auth.uid() = user_id AND is_default = false);

CREATE TABLE public.meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dish_id UUID,
  dish_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  calories INT NOT NULL,
  type public.dish_type NOT NULL,
  mood_at_time TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own logs" ON public.meal_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own logs" ON public.meal_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own logs" ON public.meal_logs FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX meal_logs_user_logged_idx ON public.meal_logs (user_id, logged_at DESC);

INSERT INTO public.dishes (name, place_name, price, calories, type, tags, is_default) VALUES
('Dal Rice', 'Mess Standard', 40, 450, 'moderate', ARRAY['comfort','filling'], true),
('Chole Bhature', 'Street Corner', 70, 750, 'indulgent', ARRAY['spicy','filling','street food'], true),
('Aloo Paratha', 'Tiffin Center', 50, 550, 'moderate', ARRAY['breakfast','filling'], true),
('Vada Pav', 'Mumbai Stall', 25, 290, 'indulgent', ARRAY['spicy','quick','street food'], true),
('Paneer Tikka', 'Dhaba', 150, 480, 'moderate', ARRAY['protein','spicy'], true),
('Banana', 'Fruit Vendor', 10, 105, 'healthy', ARRAY['fruit','quick'], true),
('Poha', 'Breakfast Stall', 30, 270, 'healthy', ARRAY['breakfast','light'], true),
('Maggi', 'Hostel Canteen', 35, 380, 'indulgent', ARRAY['quick','comfort'], true),
('Samosa', 'Street Corner', 15, 260, 'indulgent', ARRAY['fried','snack'], true),
('Fruit Bowl', 'Juice Center', 80, 200, 'healthy', ARRAY['fruit','fresh'], true),
('Idli Sambar', 'South Indian', 50, 320, 'healthy', ARRAY['breakfast','light','south indian'], true),
('Masala Dosa', 'South Indian', 80, 480, 'moderate', ARRAY['breakfast','south indian'], true),
('Rajma Chawal', 'Mess Standard', 60, 540, 'moderate', ARRAY['comfort','protein'], true),
('Egg Bhurji', 'Street Corner', 60, 350, 'moderate', ARRAY['protein','spicy'], true),
('Curd Rice', 'South Indian', 40, 310, 'healthy', ARRAY['light','cooling'], true),
('Chicken Biryani', 'Dhaba', 180, 850, 'indulgent', ARRAY['rice','protein','spicy','filling'], true),
('Pav Bhaji', 'Mumbai Stall', 80, 620, 'indulgent', ARRAY['spicy','street food'], true),
('Sprouts Chaat', 'Health Stall', 50, 180, 'healthy', ARRAY['protein','light','fresh'], true),
('Veg Frankie', 'Street Corner', 60, 420, 'moderate', ARRAY['wrap','quick'], true),
('Roti Sabzi', 'Mess Standard', 50, 380, 'healthy', ARRAY['comfort','light'], true);