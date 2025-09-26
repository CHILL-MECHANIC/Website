-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services table to store service definitions
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT[],
  price INTEGER NOT NULL,
  service_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table for scheduled services
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  total_amount INTEGER NOT NULL,
  service_tax INTEGER NOT NULL DEFAULT 0,
  travel_charges INTEGER NOT NULL DEFAULT 50,
  final_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booking_items table for services in each booking
CREATE TABLE public.booking_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_description TEXT[],
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for services (public read)
CREATE POLICY "Services are viewable by everyone" 
ON public.services 
FOR SELECT 
USING (true);

-- Create policies for bookings
CREATE POLICY "Users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
ON public.bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for booking_items
CREATE POLICY "Users can view booking items for their bookings" 
ON public.booking_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.bookings 
  WHERE id = booking_items.booking_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can insert booking items for their bookings" 
ON public.booking_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.bookings 
  WHERE id = booking_items.booking_id 
  AND user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert initial service data
INSERT INTO public.services (name, description, price, service_type) VALUES
('AC General Service', ARRAY['Complete AC inspection', 'Filter cleaning', 'Gas pressure check', '1 month warranty'], 500, 'ac'),
('AC Deep Cleaning', ARRAY['Deep coil cleaning', 'Drain cleaning', 'Anti-bacterial treatment', '2 months warranty'], 800, 'ac'),
('AC Gas Refill', ARRAY['Gas leak detection', 'Gas refill service', 'Performance check', '6 months warranty'], 1200, 'ac'),
('Refrigerator General Service', ARRAY['Complete inspection', 'Coil cleaning', 'Temperature calibration', '1 month warranty'], 400, 'refrigerator'),
('Refrigerator Deep Service', ARRAY['Defrosting service', 'Deep coil cleaning', 'Gasket replacement', '3 months warranty'], 700, 'refrigerator'),
('RO General Service', ARRAY['Filter replacement', 'Water quality check', 'System cleaning', '1 month warranty'], 300, 'ro'),
('RO Advanced Service', ARRAY['All filters replacement', 'UV/UF service', 'TDS adjustment', '6 months warranty'], 600, 'ro'),
('Geyser General Service', ARRAY['Element check', 'Tank cleaning', 'Safety valve inspection', '1 month warranty'], 350, 'geyser'),
('Geyser Element Replacement', ARRAY['Element replacement', 'Thermostat check', 'Safety inspection', '6 months warranty'], 800, 'geyser'),
('Washing Machine General', ARRAY['Drum cleaning', 'Filter cleaning', 'Performance check', '1 month warranty'], 400, 'washing-machine'),
('Washing Machine Deep Clean', ARRAY['Deep drum cleaning', 'Pipe cleaning', 'Motor inspection', '2 months warranty'], 700, 'washing-machine');