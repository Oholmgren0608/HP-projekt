-- HP Lift: Härdning av säkerhetslintet för avboknings-RPC:erna.
--
-- Lintfyndet gäller SECURITY DEFINER-funktionerna duel_cancel_queue och
-- duel_cancel_private (exponerade för authenticated, med parfynd för anon).
--
-- Bedömning: funktionerna är medvetet användarvända (endast inloggade) och
-- kontrollerar redan att auth.uid() äger resursen:
--   * duel_cancel_queue()  tar bara bort raden där user_id = auth.uid()
--   * duel_cancel_private() ändrar bara status om player_a = auth.uid()
--     och status = 'waiting' (player_a är NOT NULL, så anon kan aldrig
--     matcha en rad).
-- Därför behåller vi SECURITY DEFINER och behörighetsmodellen, men härdar:
--   1) set search_path = '' — förhindrar kapning av sökvägen. Alla
--      identifierare är redan schemakvalificerade (public.*, auth.*) och
--      pg_catalog söks alltid, så beteendet ändras inte.
--   2) Rättigheterna återbekräftas så att ev. drift i databasen åtgärdas:
--      execute borttaget för public OCH anon, kvar endast för authenticated.
--
-- Kör den här filen i Supabase Dashboard -> SQL Editor (efter 0007).

-- Avbryt kösökning (endast egen körad).
create or replace function public.duel_cancel_queue()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.duel_queue where user_id = auth.uid();
end;
$$;

-- Avbryt en väntande privat lobby (endast skaparen).
create or replace function public.duel_cancel_private(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.duel_matches
  set status = 'cancelled'
  where id = p_match_id
    and player_a = auth.uid()
    and status = 'waiting';
end;
$$;

-- Återbekräfta rättigheter (lintet har ett fynd per roll).
revoke execute on function public.duel_cancel_queue() from public, anon;
revoke execute on function public.duel_cancel_private(uuid) from public, anon;
grant execute on function public.duel_cancel_queue() to authenticated;
grant execute on function public.duel_cancel_private(uuid) to authenticated;
