INSERT INTO inventory (item_id, quantity_on_hand, quantity_allocated, reorder_point)
SELECT id, 0, 0, 5
FROM hardware_catalog
WHERE is_active = true
ON CONFLICT (item_id) DO NOTHING;
