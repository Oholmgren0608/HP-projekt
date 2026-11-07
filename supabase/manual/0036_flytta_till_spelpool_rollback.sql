-- Backar 0036: alla frågor i spelpoolen blir övningsfrågor igen (syns i
-- övningen och kommer med i nästa fragebank:export). Kör bara om spelpoolen
-- ska avvecklas; tävlingslägena får då inga frågor.
update public.questions set pool = 'ovning' where pool = 'spel';
