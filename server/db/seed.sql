-- ============================================================
-- Briner Shop - נתוני התחלה (Seed Data)
-- ============================================================
-- מוצרי דוגמה. הרץ אחרי schema.sql.
-- אפשר להריץ שוב ושוב - on conflict do nothing מונע כפילויות.
-- ============================================================

insert into public.products
  (handle, sku, name, description, type, color, color_hex, weight_grams, diameter, price, stock, image_url, badge, is_featured, sort_order)
values
  ('glow-rainbow-5-dark', 'GR5-DARK', 'Glow Rainbow #5 Dark', 'פילמנט סילק עם אפקט קשת זוהר בחושך', 'silk', 'Rainbow Dark', null, 1000, '1.75mm', 98, 0,
    'https://shop.briner.co.il/cdn/shop/files/glowrainbowdark.png?v=1779016083&width=533', 'חדש', true, 1),

  ('silk-bicolor-blue-green', 'SBI-BG', 'Silk Bicolor - Blue Green', 'פילמנט סילק דו-צבעי כחול-ירוק', 'silk', 'Blue/Green', null, 1000, '1.75mm', 98, 25,
    'https://shop.briner.co.il/cdn/shop/files/blue_green.png?v=1778656563&width=533', null, false, 2),

  ('silk-bicolor-purple-blue', 'SBI-PB', 'Silk Bicolor - Purple Blue', 'פילמנט סילק דו-צבעי סגול-כחול', 'silk', 'Purple/Blue', null, 1000, '1.75mm', 79, 30,
    'https://shop.briner.co.il/cdn/shop/files/purpleblue.png?v=1779018797&width=533', 'מבצע', false, 3),

  ('silk-bicolor-red-gold', 'SBI-RG', 'Silk Bicolor - Red Gold', 'פילמנט סילק דו-צבעי אדום-זהב', 'silk', 'Red/Gold', null, 1000, '1.75mm', 79, 18,
    'https://shop.briner.co.il/cdn/shop/files/Redgold.png?v=1779018405&width=533', 'מבצע', false, 4),

  ('pla-rainbow', 'PLA-RNB', 'PLA - Rainbow', 'פילמנט PLA צבעוני - קשת', 'silk', 'Rainbow', null, 1000, '1.75mm', 79, 40,
    'https://shop.briner.co.il/cdn/shop/files/rainbow.png?v=1779013356&width=533', 'פופולרי', true, 5),

  ('pla-red', 'PLA-RED', 'PLA - אדום', 'פילמנט PLA סטנדרטי בצבע אדום', 'pla', 'אדום', '#D32F2F', 1000, '1.75mm', 69, 50,
    'https://shop.briner.co.il/cdn/shop/files/red.png?v=1778659909&width=533', null, false, 10),

  ('pla-blue', 'PLA-BLU', 'PLA - כחול', 'פילמנט PLA סטנדרטי בצבע כחול', 'pla', 'כחול', '#1976D2', 1000, '1.75mm', 69, 50,
    'https://shop.briner.co.il/cdn/shop/files/blue.png?v=1778664859&width=533', null, false, 11),

  ('pla-white', 'PLA-WHT', 'PLA - לבן', 'פילמנט PLA סטנדרטי בצבע לבן', 'pla', 'לבן', '#FFFFFF', 1000, '1.75mm', 69, 60,
    'https://shop.briner.co.il/cdn/shop/files/white.png?v=1778656559&width=533', null, true, 12),

  ('pla-yellow', 'PLA-YEL', 'PLA - צהוב', 'פילמנט PLA סטנדרטי בצבע צהוב', 'pla', 'צהוב', '#FBC02D', 1000, '1.75mm', 69, 35,
    'https://shop.briner.co.il/cdn/shop/files/yellow.png?v=1778661626&width=533', null, false, 13),

  ('pla-green-dark', 'PLA-GRN-D', 'PLA - ירוק כהה', 'פילמנט PLA סטנדרטי בצבע ירוק כהה', 'pla', 'ירוק כהה', '#2E7D32', 1000, '1.75mm', 69, 25,
    'https://shop.briner.co.il/cdn/shop/files/dark_green.png?v=1778656564&width=533', null, false, 14),

  ('pla-orange', 'PLA-ORG', 'PLA - כתום', 'פילמנט PLA סטנדרטי בצבע כתום', 'pla', 'כתום', '#F57C00', 1000, '1.75mm', 69, 22,
    'https://shop.briner.co.il/cdn/shop/files/orange.png?v=1778660877&width=533', null, false, 15),

  ('pla-purple', 'PLA-PUR', 'PLA - סגול', 'פילמנט PLA סטנדרטי בצבע סגול', 'pla', 'סגול', '#7B1FA2', 1000, '1.75mm', 69, 28,
    'https://shop.briner.co.il/cdn/shop/files/purple.png?v=1778661329&width=533', null, false, 16)
on conflict (handle) do nothing;
