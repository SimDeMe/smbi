-- Lydfeedback på simulationerne: privat lager, metadata og afprøvningskoder.
-- Deltagere har ingen direkte adgang. Alt fra dem går gennem funktionen
-- modtag-lydfeedback, der kører med tjenestenøglen på serveren. Kun ejeren kan
-- logge ind og læse eller slette, og kun efter at stå i tabellen ejere.

create table public.ejere (
  bruger uuid primary key references auth.users (id) on delete cascade
);

create table public.afproevningskoder (
  kode text primary key check (length(kode) >= 12),
  simulation text not null,               -- fx 'geografi/luftmasser'
  aktiv boolean not null default true,
  udloeber timestamptz not null,
  maks_afleveringer integer not null default 100 check (maks_afleveringer > 0),
  note text,                              -- ejerens egen huskeseddel
  oprettet timestamptz not null default now()
);

create table public.lydfeedback (
  session uuid primary key,               -- sat af browseren; gør genforsøg ufarlige
  kode text not null references public.afproevningskoder (kode),
  simulation text not null,
  version text,
  opgave text,
  startet timestamptz not null,
  varighed_ms integer not null check (varighed_ms > 0),
  lydformat text not null,
  stoerrelse integer not null check (stoerrelse > 0),
  lydsti text not null unique,
  starttilstand jsonb not null default '{}',
  log jsonb not null default '[]',
  status text not null default 'modtager' check (status in ('modtager', 'modtaget')),
  oprettet timestamptz not null default now(),
  slet_efter timestamptz not null default now() + interval '90 days'
);
create index lydfeedback_kode_oprettet on public.lydfeedback (kode, oprettet);
create index lydfeedback_slet_efter on public.lydfeedback (slet_efter);

alter table public.ejere enable row level security;
alter table public.afproevningskoder enable row level security;
alter table public.lydfeedback enable row level security;

revoke all on public.ejere, public.afproevningskoder, public.lydfeedback from anon;
revoke all on public.ejere, public.afproevningskoder, public.lydfeedback from authenticated;
grant select on public.ejere to authenticated;
grant select, delete on public.lydfeedback to authenticated;
grant select, insert, update, delete on public.afproevningskoder to authenticated;

create policy "se egen ejerrække" on public.ejere
  for select to authenticated using (bruger = auth.uid());

create policy "ejeren læser feedback" on public.lydfeedback
  for select to authenticated
  using (exists (select 1 from public.ejere e where e.bruger = auth.uid()));
create policy "ejeren sletter feedback" on public.lydfeedback
  for delete to authenticated
  using (exists (select 1 from public.ejere e where e.bruger = auth.uid()));

create policy "ejeren styrer koder" on public.afproevningskoder
  for all to authenticated
  using (exists (select 1 from public.ejere e where e.bruger = auth.uid()))
  with check (exists (select 1 from public.ejere e where e.bruger = auth.uid()));

-- Privat lager: ingen offentlige adresser, loft over størrelse og filtype.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lydfeedback', 'lydfeedback', false, 12582912,
        array['audio/webm', 'audio/mp4', 'audio/ogg']);

create policy "ejeren henter lyd" on storage.objects
  for select to authenticated
  using (bucket_id = 'lydfeedback'
         and exists (select 1 from public.ejere e where e.bruger = auth.uid()));
create policy "ejeren sletter lyd" on storage.objects
  for delete to authenticated
  using (bucket_id = 'lydfeedback'
         and exists (select 1 from public.ejere e where e.bruger = auth.uid()));
