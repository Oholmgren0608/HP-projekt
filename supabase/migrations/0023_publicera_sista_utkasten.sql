-- 0023: ovn-nog-026 avvisas och de sista granskade utkasten publiceras (Oscar 2026-10-26).
--
-- ovn-nog-026 liknade provuppgiften hp-2015-03-28, provpass 2, NOG 27 för
-- mycket och avvisas (raden finns kvar).
--
-- In (status 'published'): 60 övningsfrågor i ORD och KVA (ovn-ord-001–020,
-- ovn-kva-001–040), alla granskade och ense (KVA i 0018, ORD i 0021).
--
-- Skydd som i 0022: bara utkast med andra kontrollen 'agreed' och exakt det
-- granskade innehållet (md5) publiceras; avvikande hoppas över med en notis.
-- Finns inga av frågorna (tom lokal databas) görs ingenting.

do $$
declare
  fix record;
  ok text[] := '{}';
  skipped text[] := '{}';
  present integer := 0;
begin
  for fix in
    select * from (values
    ('ovn-ord-001', '2563a69df911b82a1f6b3e0349f27ac2', null, '8511b31a8af990408743c42aa61eba6c', 2, '8782aafc3b8b0352f7a2816891f8718b'),
    ('ovn-ord-002', '0031b35bc9fc506d7e7e0f84cf2a11ab', null, '8197be4dd717cb5d7d2437c69d06ef4f', 4, '63ec0044d70f7f8e98a7798c7a52c803'),
    ('ovn-ord-003', '4a78e8b0487f93858dc2f346867d9bb2', null, '407c502ec886f83be2a5b61e44418650', 1, 'e5224adb599f786bd7acaecb1bcfbcbb'),
    ('ovn-ord-004', 'c119c2db89e7372c84baa46b284bc25f', null, '8f620658cd091fcd12976d4c2c8b27ca', 0, 'd22d3159d77225b28417898ec968fec1'),
    ('ovn-ord-005', '18015b40fb7f637b72c74da3c8eb8cbd', null, '0517e54cec931581cf2b46699c8ee77e', 3, 'c7bf6e209fd21b8025092d72b549d339'),
    ('ovn-ord-006', '389a241da578f7f45749a10838f57f30', null, 'c721c21aff885843d20b536ba81bc297', 3, 'b387491229ab368ea4bc6ba4f8056359'),
    ('ovn-ord-007', '6f5647238a4002d9a79a994beb296bea', null, '5173e6aa4ac09710770efcbeb3418083', 1, '31573e0a213035e560c1322241b3986a'),
    ('ovn-ord-008', '0e9b9cabd1a9af923ceae035b5ec3753', null, '357678c609d24f4e973179188004f465', 4, '9bbcf07cf217ef831be5d004d0751418'),
    ('ovn-ord-009', 'eac7b483942e37d9038391222b2a78ef', null, '880d38db58eaf915b5f8d4018a56f97d', 2, 'fe83c72260b91ee38472e673b62fa702'),
    ('ovn-ord-010', 'ecce10bb740de22d68713771ab8f4f4a', null, '6304bd94904d6d3616c0f771b9a1a546', 0, 'efdc8158eb690f7e5dd2b64b8f9cff37'),
    ('ovn-ord-011', 'c533185f72536985cb588360379115dc', null, 'd9f8b699e96f2016ef0fc6f8b752ee79', 4, '25ce3b58f287eb6f56d02e481a8cb85a'),
    ('ovn-ord-012', '8106583ac70eefae31f4d1c754cb6f69', null, 'ca569b0b0396fdf9687c4ba53d07832a', 1, '601cb8becb92e992693c2fcf3855d3fe'),
    ('ovn-ord-013', 'd766788e502e81354b901a2c5697decc', null, '03f0184815c81842b01f5a0d69192702', 3, 'bd8a26b9ab876883d8a3ebbba78c6f73'),
    ('ovn-ord-014', '788a86f5ce363456027efadd1ded8b04', null, '8635a334653167377e0ae6a5da0db030', 0, '0f7734d342bd1fdbb401bee6a2f1fd8e'),
    ('ovn-ord-015', 'ac664ea54cc8371b6165a80e5b77fd17', null, '733188e95f9ad06894602b6ed8cf8528', 2, 'e39801e9f8f0973e36c4d4ba8585be36'),
    ('ovn-ord-016', '30176c085a739c1e5c3d52db3cd0a7d1', null, 'de77c8455257abd0f274d953e4f90e28', 4, '056f9b79e1845260ddcdb6560aa833fb'),
    ('ovn-ord-017', '15841f32bbcc8456a6d407dc91a0f6f5', null, '6deabf29e10115b89a9cb5fa12b59e4e', 0, '81a3d91eb7020f17aa8a504f1b0a0551'),
    ('ovn-ord-018', '8c62e263bac5ec5d5cc98c28ded75cdc', null, 'b6b16b76abedbb28c1226511244f1230', 2, 'b91996162f7760e9cd92656d5644998b'),
    ('ovn-ord-019', '2090c27f9d01981a7848c79e2cd82263', null, '3146492d2b95a5422ed9a080870a58a0', 3, '23451128b3322329618299bbf26d2d06'),
    ('ovn-ord-020', '57a59646a0fa99cb6a3bd7136871f1ba', null, '4b104a698d174488080c16124543a268', 1, '3719d163a9e60b7e37a2d889feb15fc6'),
    ('ovn-kva-001', '4696048d1e2ef7b79697b9022eaebda2', '8dfa23e65f05f77d3fca14a8d4a96793', 'fc6ac794693594fce1dc84d6d58c856b', 3, '8a1e51046b1ea5c4474211b65198b8c7'),
    ('ovn-kva-002', '4696048d1e2ef7b79697b9022eaebda2', '3b5f650c7a6bf93bf314020410f9c67f', 'fc6ac794693594fce1dc84d6d58c856b', 0, 'd712775a725135bdde01e1379b9e2e47'),
    ('ovn-kva-003', '4696048d1e2ef7b79697b9022eaebda2', 'ad63ad0223a56e024ef56a38900ce08e', 'fc6ac794693594fce1dc84d6d58c856b', 2, '50cd6fb53bf6ca3b07f63c8260a225ea'),
    ('ovn-kva-004', '4696048d1e2ef7b79697b9022eaebda2', '3a66585df039854c217909a4cc3e6cc4', 'fc6ac794693594fce1dc84d6d58c856b', 1, '1213d60240b1a7cfb716c02b2c7f629e'),
    ('ovn-kva-005', '4696048d1e2ef7b79697b9022eaebda2', '64b212eca8026e3a3420f587a1197fc6', 'fc6ac794693594fce1dc84d6d58c856b', 3, '8013eb96a8221d4e24c53e5d3df8809f'),
    ('ovn-kva-006', '4696048d1e2ef7b79697b9022eaebda2', 'fc3afc4f5ca551654d037bd5c9eedca0', 'fc6ac794693594fce1dc84d6d58c856b', 2, '5b456bd9b5e59a5e4f64a9a4d00a13dd'),
    ('ovn-kva-007', '4696048d1e2ef7b79697b9022eaebda2', '534dff60b5055e558087fe31571dd03b', 'fc6ac794693594fce1dc84d6d58c856b', 0, '198b78ee4f4f37c1f3164f67851262e6'),
    ('ovn-kva-008', '4696048d1e2ef7b79697b9022eaebda2', 'b845837e5bb782f8d45963d65d937f42', 'fc6ac794693594fce1dc84d6d58c856b', 1, 'bed8531cc487de4b945404b29163b980'),
    ('ovn-kva-009', '4696048d1e2ef7b79697b9022eaebda2', '2752660251519958abb093fda49edabd', 'fc6ac794693594fce1dc84d6d58c856b', 2, '491c3148aea4d5caa86da4c936814cfd'),
    ('ovn-kva-010', '4696048d1e2ef7b79697b9022eaebda2', '8543274424a7e8d0853fd9bebd1d4bc7', 'fc6ac794693594fce1dc84d6d58c856b', 3, '87eb332960ea8a1ed2894379dc86fce1'),
    ('ovn-kva-011', '4696048d1e2ef7b79697b9022eaebda2', '83759ab0c35648e1605ba9473722c776', 'fc6ac794693594fce1dc84d6d58c856b', 1, '784842caf57f58979d6e29dd324adf41'),
    ('ovn-kva-012', '4696048d1e2ef7b79697b9022eaebda2', '2cfe30b32ccd3b0ecd925188a1f20630', 'fc6ac794693594fce1dc84d6d58c856b', 1, '6edfe580d504777fe78837f4c9dc3d92'),
    ('ovn-kva-013', '4696048d1e2ef7b79697b9022eaebda2', '5063c78a037342084711d948f4f7bc55', 'fc6ac794693594fce1dc84d6d58c856b', 0, '6cdaafed6710dc365ed72f1c48898bc8'),
    ('ovn-kva-014', '4696048d1e2ef7b79697b9022eaebda2', 'bd2e2a9f6c8a09fb13663ca08f92259a', 'fc6ac794693594fce1dc84d6d58c856b', 3, 'e3049bfe9a6fceca005d0e7df127d91f'),
    ('ovn-kva-015', '4696048d1e2ef7b79697b9022eaebda2', '606b72f3f4373ac1d046234af4a3b0fc', 'fc6ac794693594fce1dc84d6d58c856b', 2, '6e590ccabc8439aff5095c1853872350'),
    ('ovn-kva-016', '4696048d1e2ef7b79697b9022eaebda2', '29c84c59da52f0e822d8db68bac9d2cf', 'fc6ac794693594fce1dc84d6d58c856b', 0, '0160c3a1c2e197b60327413acb344fa0'),
    ('ovn-kva-017', '4696048d1e2ef7b79697b9022eaebda2', '018697179480300a582e2850656495b5', 'fc6ac794693594fce1dc84d6d58c856b', 3, '4dac86514403449f54a5284d11898494'),
    ('ovn-kva-018', '4696048d1e2ef7b79697b9022eaebda2', '8104d8086bc5a2232f66b256cab9891c', 'fc6ac794693594fce1dc84d6d58c856b', 1, 'aa0f32d24c8f9483e5184d761122c99d'),
    ('ovn-kva-019', '4696048d1e2ef7b79697b9022eaebda2', '492a94a7d053d629f971faf9024f7cee', 'fc6ac794693594fce1dc84d6d58c856b', 2, '99af567d227ddedfafd2facf641c5f2a'),
    ('ovn-kva-020', '4696048d1e2ef7b79697b9022eaebda2', 'c80fa86e304503850b4a2c4d916fe867', 'fc6ac794693594fce1dc84d6d58c856b', 0, 'aa93578bb78149fc55a2e4300366d894'),
    ('ovn-kva-021', '4696048d1e2ef7b79697b9022eaebda2', 'e9e41a988348a429145ae13ad5950560', 'fc6ac794693594fce1dc84d6d58c856b', 2, 'c5ae84d709ed0e87dc5e0c22ecf74b34'),
    ('ovn-kva-022', '4696048d1e2ef7b79697b9022eaebda2', 'fef46dde67e0225ad7fac597c307c556', 'fc6ac794693594fce1dc84d6d58c856b', 1, 'b6f19dfa1235d53c908ffa3eff97a5d6'),
    ('ovn-kva-023', '4696048d1e2ef7b79697b9022eaebda2', '6358f5a40a0a1b95d26effcf273da2d3', 'fc6ac794693594fce1dc84d6d58c856b', 3, 'c93fdc5b5f9869a0c7462c1cd0d48a7d'),
    ('ovn-kva-024', '4696048d1e2ef7b79697b9022eaebda2', '8f9ff3c0f762cfe1c9be00c7397e9381', 'fc6ac794693594fce1dc84d6d58c856b', 0, '19ba59f1c7c9760762ef42283e392e7b'),
    ('ovn-kva-025', '4696048d1e2ef7b79697b9022eaebda2', 'c799b61bc0d891315227b04473be7f5b', 'fc6ac794693594fce1dc84d6d58c856b', 2, '3d638038e2c51a879ba65e26b8158735'),
    ('ovn-kva-026', '4696048d1e2ef7b79697b9022eaebda2', '91b71d518ef9b0a9d8cf9a90139282c3', 'fc6ac794693594fce1dc84d6d58c856b', 0, '2de749a4a9278fc462798ef46ba2839d'),
    ('ovn-kva-027', '4696048d1e2ef7b79697b9022eaebda2', '27ab785f9f427f27f7d7e07346995b57', 'fc6ac794693594fce1dc84d6d58c856b', 3, '0eb481e8a69a0c8bbec78401f3ba33cd'),
    ('ovn-kva-028', '4696048d1e2ef7b79697b9022eaebda2', '3025cf36f10e998240daa26e31882d69', 'fc6ac794693594fce1dc84d6d58c856b', 1, '90ab1f6f9ba06477e89b00e9940fb3c1'),
    ('ovn-kva-029', '4696048d1e2ef7b79697b9022eaebda2', '0769addd5a89f90c168f2e1776da2016', 'fc6ac794693594fce1dc84d6d58c856b', 3, '5f113c5f405e209157435c5f3e38f789'),
    ('ovn-kva-030', '4696048d1e2ef7b79697b9022eaebda2', '8ebd2d03e5ca5768fc2aac3f81b44d20', 'fc6ac794693594fce1dc84d6d58c856b', 2, 'e0501ba53421af5510af0c6774788f73'),
    ('ovn-kva-031', '4696048d1e2ef7b79697b9022eaebda2', '6330e4b88e40a2a9c5968141b11505bc', 'fc6ac794693594fce1dc84d6d58c856b', 0, '0fb3d588d6d056952f972e443a636a3c'),
    ('ovn-kva-032', '4696048d1e2ef7b79697b9022eaebda2', 'cf71fd56748af09d66fe9e8df386f7f6', 'fc6ac794693594fce1dc84d6d58c856b', 1, '1231808966372c9c97b3271541872efa'),
    ('ovn-kva-033', '4696048d1e2ef7b79697b9022eaebda2', 'f314d42f8837653a325d7138011a5b5b', 'fc6ac794693594fce1dc84d6d58c856b', 2, '17765d677b821ff363529697b592d125'),
    ('ovn-kva-034', '4696048d1e2ef7b79697b9022eaebda2', '591e1d33cab0d3d684e248a53a1d8d58', 'fc6ac794693594fce1dc84d6d58c856b', 1, '32d43204f8c854e98bd72610a192b81e'),
    ('ovn-kva-035', '4696048d1e2ef7b79697b9022eaebda2', '2fd9799d52cb2e55e6f6b3a59ad270b7', 'fc6ac794693594fce1dc84d6d58c856b', 0, '47d5218813b5e5b23279750f221715a0'),
    ('ovn-kva-036', '4696048d1e2ef7b79697b9022eaebda2', 'e4d368ff78cf15a7eac0b6c457f2325c', 'fc6ac794693594fce1dc84d6d58c856b', 3, '9471ca02fcdd522bc8d1d5be812a2eba'),
    ('ovn-kva-037', '4696048d1e2ef7b79697b9022eaebda2', '3ea204cd35968920e8c2b1070f9a320d', 'fc6ac794693594fce1dc84d6d58c856b', 1, 'e7386746304c0bda58e791b31af3e4a7'),
    ('ovn-kva-038', '4696048d1e2ef7b79697b9022eaebda2', '35fc899adf07b58d2fb45fe5b0c1fa1a', 'fc6ac794693594fce1dc84d6d58c856b', 0, '6aeab20da659bc6ab2361bd592c242da'),
    ('ovn-kva-039', '4696048d1e2ef7b79697b9022eaebda2', 'fd6fcad68ff3388cb8dc1b78cd2eeade', 'fc6ac794693594fce1dc84d6d58c856b', 2, 'c37fbaeabc7384d82a97bc912128bbce'),
    ('ovn-kva-040', '4696048d1e2ef7b79697b9022eaebda2', 'f01960f4e4ab19604d6177f367489aa0', 'fc6ac794693594fce1dc84d6d58c856b', 3, '02e565c1b0d46b86935a9b08c480d0cd')
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
    raise notice '0023: de nya frågorna finns inte i databasen; inget görs.';
    return;
  end if;

  update public.questions set status = 'published' where id = any(ok);

  update public.questions
     set status = 'rejected'
   where id in ('ovn-nog-026')
     and status <> 'rejected';

  raise notice '0023: % publicerade, % hoppades över: %', coalesce(array_length(ok, 1), 0),
    coalesce(array_length(skipped, 1), 0), array_to_string(skipped, ', ');
end
$$;
