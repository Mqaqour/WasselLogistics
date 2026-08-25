-- ============================================================
-- Migration 011: Move fixed resource card images to /assets/projects
-- ============================================================

UPDATE dbo.resource_categories
SET image_url = N'/assets/projects/services.png'
WHERE code = N'services'
  AND image_url = N'/assets/services.png';

UPDATE dbo.resource_categories
SET image_url = N'/assets/projects/shipping-guides.png'
WHERE code = N'shipping-guides'
  AND image_url = N'/assets/shipping-guides.png';

UPDATE dbo.resource_categories
SET image_url = N'/assets/projects/packaging.png'
WHERE code = N'packaging'
  AND image_url = N'/assets/packaging.png';

UPDATE dbo.resource_categories
SET image_url = N'/assets/projects/prohibited-items.png'
WHERE code = N'prohibited-items'
  AND image_url = N'/assets/prohibited-items.png';

UPDATE dbo.resource_categories
SET image_url = N'/assets/projects/customs-clearance.png'
WHERE code = N'customs-clearance'
  AND image_url = N'/assets/customs-clearance.png';

UPDATE dbo.resource_categories
SET image_url = N'/assets/projects/accounts-payments.png'
WHERE code = N'accounts-payments'
  AND image_url = N'/assets/accounts-payments.png';

UPDATE dbo.resource_categories
SET image_url = N'/assets/projects/policies-terms.png'
WHERE code = N'policies-terms'
  AND image_url = N'/assets/policies-terms.png';

PRINT 'Migration 011 complete.';
