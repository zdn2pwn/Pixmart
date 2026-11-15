-- Add stock column to marketplace_listings table
ALTER TABLE marketplace_listings 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 1;

-- Add comment
COMMENT ON COLUMN marketplace_listings.stock IS 'Available stock quantity. 0 = sold out';

-- Update existing listings to have stock = 1
UPDATE marketplace_listings 
SET stock = 1 
WHERE stock IS NULL;
