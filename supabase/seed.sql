-- Pricing tiers
INSERT INTO pricing_tiers (name, display_name, discount_percentage, sort_order) VALUES
  ('mesa', 'MESA Dealers', 40.00, 1),
  ('new_dealer', 'New Dealers', 25.00, 2),
  ('dealer', 'Dealers', 35.00, 3),
  ('international', 'International Dealers', 30.00, 4);

-- Sectors
INSERT INTO sectors (name, slug, sort_order) VALUES
  ('Vehicle Electronics', 'vehicle-electronics', 1);

-- Categories
INSERT INTO categories (sector_id, name, slug, badge_color, sort_order)
SELECT s.id, c.name, c.slug, c.badge_color, c.sort_order
FROM sectors s,
(VALUES
  ('Digital Mirrors', 'digital-mirrors', '#3B82F6', 1),
  ('Blind Spot Detection', 'blind-spot-detection', '#EF4444', 2),
  ('Cameras', 'cameras', '#10B981', 3),
  ('Monitors', 'monitors', '#8B5CF6', 4)
) AS c(name, slug, badge_color, sort_order)
WHERE s.slug = 'vehicle-electronics';

-- Products (sample from Rydeen catalog)
INSERT INTO products (category_id, sku, name, short_description, description, features, msrp, image_url, status_flags, inventory_count)
SELECT c.id, p.sku, p.name, p.short_desc, p.description, p.features::jsonb, p.msrp, p.image_url, p.status_flags::text[], p.inv
FROM categories c,
(VALUES
  ('digital-mirrors', '360-VIEW-K', '360 VIEW-K', '4K Dash Camera Frameless Rearview Mirror',
   '360 VIEW-K is a universal touchscreen 10-inch frameless rearview mirror with built-in dash cam/HD monitor.',
   '["4K dash camera", "10-inch frameless mirror", "Touchscreen display", "DVR with TFT screen"]',
   549.00, '/images/products/360-view-k.jpg', '{NEW}', 25),
  ('digital-mirrors', '360-VIEW-SPL', '360 VIEW-SPL', '360 Surround View Frameless Rearview Mirror with 4K Dash and Backup Cameras',
   'The 360 VIEW-SPL is a universal touchscreen 10-inch frameless rearview mirror with built-in dash cam/HD monitor with 360 surround video recording features.',
   '["360-degree video rearview replacement mirror with touchscreen", "10-inch mirror DVR with TFT screen", "Auto sensing photo sensor for TFT screen brightness control", "AHD Rear Camera"]',
   599.00, '/images/products/360-view-spl.jpg', '{}', 18),
  ('blind-spot-detection', 'BSS-ONE', 'BSS-ONE', 'Single Sensor 77-GHz Blind Spot Detection System',
   'BSS-ONE is a single sensor 77GHz blind spot detection system designed for easy installation.',
   '["77GHz radar technology", "Single sensor design", "Easy installation", "LED warning indicators"]',
   549.00, '/images/products/bss-one.jpg', '{}', 30),
  ('blind-spot-detection', 'BSS2LPB', 'BSS2LPB', 'License Plate Bar Radar Blind Spot Detection System',
   'BSS2LPB integrates blind spot detection into a license plate bar for a clean, OEM-like installation.',
   '["License plate bar design", "Radar blind spot detection", "OEM-like installation", "Dual sensors"]',
   499.00, '/images/products/bss2lpb.jpg', '{SALE}', 15),
  ('blind-spot-detection', 'BSS3', 'BSS3', 'Advanced Dual Radar Blind Spot Detection System',
   'BSS3 is an advanced dual radar blind spot detection system with enhanced coverage.',
   '["Dual radar sensors", "Advanced detection algorithm", "Wide coverage area", "Visual and audio alerts"]',
   699.00, '/images/products/bss3.jpg', '{NEW}', 12),
  ('cameras', 'CM-AHD1', 'CM-AHD1', 'Full HD AHD Vehicle Backup Camera',
   'CM-AHD1 is a full HD AHD vehicle backup camera designed for clear rearview imaging.',
   '["Full HD AHD resolution", "Wide viewing angle", "Waterproof design", "Night vision"]',
   59.00, '/images/products/cm-ahd1.jpg', '{}', 100),
  ('cameras', 'CM-AHD1000P', 'CM-AHD1000P', 'Commercial Pro Grade Digital Backup Camera',
   'CM-AHD1000P is a commercial pro grade digital backup camera for heavy-duty vehicles.',
   '["Pro grade sensor", "Commercial duty build", "Digital signal processing", "IP69K waterproof"]',
   99.00, '/images/products/cm-ahd1000p.jpg', '{}', 45),
  ('cameras', 'CM-AHD2', 'CM-AHD2', 'Full HD AHD Passenger Vehicle Camera',
   'CM-AHD2 is a full HD AHD camera designed specifically for passenger vehicles.',
   '["Full HD AHD", "Compact design", "Passenger vehicle optimized", "Easy mount"]',
   69.00, '/images/products/cm-ahd2.jpg', '{}', 80),
  ('cameras', 'CM-D700-AHD', 'CM-D700 AHD', 'Dual 1080P AHD Side Camera Kit',
   'CM-D700-AHD is a dual 1080P AHD side camera kit with wide-angle coverage.',
   '["Dual 1080P cameras", "AHD technology", "Side mount design", "Wide angle coverage"]',
   319.00, '/images/products/cm-d700-ahd.jpg', '{}', 20),
  ('cameras', 'CM-D700', 'CM-D700', 'Dual Side View Blindspot Camera Kit',
   'CM-D700 is a dual side view blindspot camera kit for enhanced visibility.',
   '["Dual side view cameras", "Blindspot coverage", "Compact design", "Universal mount"]',
   279.00, '/images/products/cm-d700.jpg', '{}', 22),
  ('cameras', 'CM-SIDE-AHD', 'CM-SIDE AHD', 'Ultra-Wide High-Resolution Safety Side Camera',
   'CM-SIDE-AHD is an ultra-wide high-resolution safety side camera.',
   '["Ultra-wide angle", "High resolution", "Safety rated", "AHD output"]',
   79.00, '/images/products/cm-side-ahd.jpg', '{UPDATED}', 60),
  ('monitors', 'PV8-A', 'PV8-A', '8.2" Ultra-Bright HD Digital Rearview Mirror Monitor',
   'PV8-A is an 8.2 inch ultra-bright HD digital rearview mirror monitor.',
   '["8.2 inch display", "Ultra-bright HD", "Digital rearview mirror", "Auto brightness"]',
   359.00, '/images/products/pv8-a.jpg', '{}', 35)
) AS p(cat_slug, sku, name, short_desc, description, features, msrp, image_url, status_flags, inv)
WHERE c.slug = p.cat_slug;
