-- 0026: 20 nya MEK-frågor publiceras (Oscar 2026-10-27: "Fyll gärna på MEK-frågorna").
--
-- In (status 'published'): ovn-mek-061–080. Alla har lösts blint av två
-- oberoende kontrollanter med samma svar som facit, förklaringarna har
-- granskats, och de fyra frågor som skrevs om efter granskningen har lösts
-- blint en gång till (andra kontrollen 'agreed').
--
-- Skydd som i 0022/0023/0026: bara utkast med andra kontrollen 'agreed' och
-- exakt det granskade innehållet (md5) publiceras; avvikande hoppas över med
-- en notis. Finns inga av frågorna (tom lokal databas) görs ingenting. Inget
-- avvisas eller tas bort.

do $$
declare
  fix record;
  ok text[] := '{}';
  skipped text[] := '{}';
  present integer := 0;
begin
  for fix in
    select * from (values
    ('ovn-mek-061', 'b1b7550ad1c243676ba9a77bd971236d', '08ea453e2de13bcc41bc8d9c0252692f', 'aeb9949c802282058299858747bd0025', 0, 'ce3414239347f999f611a8d11538f533'),
    ('ovn-mek-062', 'b1b7550ad1c243676ba9a77bd971236d', 'c9e98ece612db2b8023d79eaf5f7b8fe', 'e1e2013372eccfe606d79f4630b17693', 2, '3d3b572322cf8ae9d6e591a3db00c71c'),
    ('ovn-mek-063', '609b6fb9fb95f1fc39312ad3b1ae2cd6', 'ab25f165e38773df0803cda08ecdc86e', 'a5d84462745442dab6035581c45d5e1e', 1, '778f34c137d08ddd182266ae74ec6381'),
    ('ovn-mek-064', 'b1b7550ad1c243676ba9a77bd971236d', 'd566c6e229c1eac78851322196d78c9c', 'a8fb5cb8686c53871c3baddf72507a60', 3, '759cb5b3400a61e337346326a53d80c0'),
    ('ovn-mek-065', '609b6fb9fb95f1fc39312ad3b1ae2cd6', '1e35833e53f8ac2cc9a21cb52f8f6607', '6a7656672747b312e885b3c8661086d0', 2, '2f231adf88687a82195e78187b62171d'),
    ('ovn-mek-066', 'b1b7550ad1c243676ba9a77bd971236d', 'afd244850f39fc40fcc520f8e0941ead', 'a147ff53338c389e3f7fd92eee200082', 1, 'a3efdd3a742221f8fb26f14969cfcbd2'),
    ('ovn-mek-067', '609b6fb9fb95f1fc39312ad3b1ae2cd6', 'bf3215ca512eec5f5f4d76d444bb9bc0', 'ca3f964b1e94faf548e7337cb868d862', 0, '8068be60bd5a4c7e203a5762498d9a20'),
    ('ovn-mek-068', 'b1b7550ad1c243676ba9a77bd971236d', '0d0af50a44ce55abb84eed0787be83bd', '7447eea5319d3305fa76e01aeb4abf08', 3, '16cce12b6b8958f0d7eadadad69de9ae'),
    ('ovn-mek-069', '609b6fb9fb95f1fc39312ad3b1ae2cd6', 'a030fc129be0f7869280dff1ec0728de', 'd9e7d0eabd75d5f11459210456d84dee', 1, 'a47fdb47270b8bd269d8824ef0b44254'),
    ('ovn-mek-070', 'b1b7550ad1c243676ba9a77bd971236d', 'f41dba84aab475de03f16a7487183ee9', '987d4e8f4b7bef74e6fdd0081605b6fe', 2, '7928b50da1267714d924586f55f00a2f'),
    ('ovn-mek-071', '609b6fb9fb95f1fc39312ad3b1ae2cd6', '09ca76311a78dc0147d2ad415a0655e2', 'a0fd5d52587ee3840a0f4ad6eea0d2a0', 0, 'c9bd7cd529b8dc1c8f46e0b1e4b9ee78'),
    ('ovn-mek-072', 'b1b7550ad1c243676ba9a77bd971236d', 'defd35e666eb77c0c784837b94c84717', '202200a217675ad48c59b8b4f956a128', 3, 'dd89bd273f842f7a46b709551c93b82f'),
    ('ovn-mek-073', '609b6fb9fb95f1fc39312ad3b1ae2cd6', '46dc39bf65be9f8937f5d00a9870016e', '4d2e6faa7960ea5708be8677ac893afd', 2, '91cd370b41a0c59f50c20b9419c372e9'),
    ('ovn-mek-074', 'b1b7550ad1c243676ba9a77bd971236d', '69b0a5a5750b4d69dfdabe378e5cc666', '64e2edb03fc932996dbc7e40c22eaa1b', 1, '4763aa176b6cac02d1012d8d6e7fbf39'),
    ('ovn-mek-075', '609b6fb9fb95f1fc39312ad3b1ae2cd6', '6ff2998070cc13c676c2d54a0838f117', '77c4c4e95a5cce00af70f71a8ea6d83a', 3, '6ff9460cdd2ea89237f5d36b9b8ef184'),
    ('ovn-mek-076', 'b1b7550ad1c243676ba9a77bd971236d', '91fd1fb18a60ffffc28814c3f823d3e3', 'd406d68ea88cf8db85674017ec648879', 0, '64757b3fc5724bfbbb1ed91c08722f38'),
    ('ovn-mek-077', '609b6fb9fb95f1fc39312ad3b1ae2cd6', 'a84895147042a01e0db5293948000ce5', 'bf2d001b7bd703fc7a90717614de883f', 3, '7318cb46a2132f098e88ccf2a2582038'),
    ('ovn-mek-078', 'b1b7550ad1c243676ba9a77bd971236d', '35636fbdc93ef16bb6ec7d2595aed4cc', 'b73d43ef764e4aa0eb4e2dd1e9ae581a', 1, 'aca23276dc8a226429ef37f98dca7fbc'),
    ('ovn-mek-079', '609b6fb9fb95f1fc39312ad3b1ae2cd6', 'eb0192efa5f5dc374161b9648f371477', '794c3659ff4093a3242f147f48aadc07', 2, '4b0b7ee04a878867f1c960ac5a8a1b9d'),
    ('ovn-mek-080', '609b6fb9fb95f1fc39312ad3b1ae2cd6', '815798eae3d184797a1b910f2d7a75e8', 'ceb4debac8e89a34a234751ca571a6a2', 0, '6d5c6616a283e17d2c8f9c93c5d1ddcb')
    ) as v(id, prompt_md5, passage_md5, options_md5, correct_index, explain_md5)
  loop
    if exists (select 1 from public.questions q where q.id = fix.id) then
      present := present + 1;
    end if;
    if exists (
      select 1 from public.questions q
       where q.id = fix.id
         and q.status = 'draft'
         and q.verification = 'agreed'
         and md5(q.prompt) = fix.prompt_md5
         and md5(q.passage) is not distinct from fix.passage_md5
         and md5(q.options::text) = fix.options_md5
         and q.correct_index = fix.correct_index
         and md5(q.explain) = fix.explain_md5
    ) then
      ok := ok || fix.id;
    elsif exists (select 1 from public.questions q where q.id = fix.id and q.status <> 'published') then
      skipped := skipped || fix.id;
    end if;
  end loop;

  if present = 0 then
    raise notice '0026: de nya frågorna finns inte i databasen; inget görs.';
    return;
  end if;

  update public.questions set status = 'published' where id = any(ok);

  raise notice '0026: % publicerade, % hoppades över: %', coalesce(array_length(ok, 1), 0),
    coalesce(array_length(skipped, 1), 0), array_to_string(skipped, ', ');
end
$$;
