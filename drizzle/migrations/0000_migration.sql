create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  lat double precision not null default 33.4013,
  lon double precision not null default -111.9624,
  rotation double precision not null default 0,
  scale double precision not null default 1,
  kind text not null default 'sample',
  model_path text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null,
  x double precision not null default 0,
  z double precision not null default 0,
  rotation double precision not null default 0,
  floors int not null default 3,
  cols int not null default 2,
  rows int not null default 2,
  layout text not null default 'one_bed',
  color text not null default 'sand'
);
create table public.units (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  building_id uuid references public.buildings(id) on delete cascade,
  object_name text not null,
  apt_number text not null,
  floor int not null default 1,
  col int not null default 0,
  row int not null default 0,
  layout text,
  beds int,
  baths numeric,
  area_sqft int,
  rent numeric,
  status text not null default 'available',
  notes text,
  created_at timestamptz not null default now(),
  unique(site_id, object_name)
);
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  object_name text not null,
  name text not null,
  type text,
  model text,
  install_year int,
  energy_kwh int,
  status text not null default 'online',
  notes text,
  unique(unit_id, object_name)
);
grant select, insert, update, delete on public.sites, public.buildings, public.units, public.devices to authenticated;
grant all on public.sites, public.buildings, public.units, public.devices to service_role;
alter table public.sites enable row level security;
alter table public.buildings enable row level security;
alter table public.units enable row level security;
alter table public.devices enable row level security;
create policy "team all sites" on public.sites for all to authenticated using (true) with check (true);
create policy "team all buildings" on public.buildings for all to authenticated using (true) with check (true);
create policy "team all units" on public.units for all to authenticated using (true) with check (true);
create policy "team all devices" on public.devices for all to authenticated using (true) with check (true);

-- Seed sample sites
insert into public.sites (id,name,city,lat,lon,kind) values
 ('11111111-0000-0000-0000-000000000001','MAA Fountainhead','Phoenix, AZ',33.40133,-111.96239,'sample'),
 ('11111111-0000-0000-0000-000000000002','Garden Court','Phoenix, AZ',33.4043,-111.9605,'sample'),
 ('11111111-0000-0000-0000-000000000003','Mesa Lofts','Tempe, AZ',33.4255,-111.9400,'sample');

insert into public.buildings (site_id,name,x,z,rotation,floors,cols,rows,layout,color) values
 ('11111111-0000-0000-0000-000000000001','Poolside',8,-14,0,4,2,3,'one_bed','sand'),
 ('11111111-0000-0000-0000-000000000001','West Courtyard',-30,0,0,3,4,2,'studio','terracotta'),
 ('11111111-0000-0000-0000-000000000001','South Courtyard',-30,22,0,3,2,4,'two_bed','sand'),
 ('11111111-0000-0000-0000-000000000001','East Courtyard',26,4,0,3,2,4,'one_bed','terracotta'),
 ('11111111-0000-0000-0000-000000000001','Demo North',16,-46,0,5,2,2,'two_bed','slate'),
 ('11111111-0000-0000-0000-000000000002','Garden West',-24,-14,0,2,1,3,'two_bed','sage'),
 ('11111111-0000-0000-0000-000000000002','Garden North',-4,-28,0,2,3,1,'two_bed','sage'),
 ('11111111-0000-0000-0000-000000000002','Garden East',22,-6,0,2,1,2,'three_bed','sand'),
 ('11111111-0000-0000-0000-000000000003','Loft A',-18,-10,0,6,3,2,'studio','slate'),
 ('11111111-0000-0000-0000-000000000003','Loft B',18,-10,0,6,3,2,'one_bed','slate'),
 ('11111111-0000-0000-0000-000000000003','Townhomes',0,22,0,2,5,1,'three_bed','terracotta');

insert into public.units (site_id,building_id,object_name,apt_number,floor,col,row,layout,beds,baths,area_sqft,rent,status)
select b.site_id, b.id,
  'APT_' || (row_number() over (partition by b.site_id order by b.name, f, c, r) + (case b.site_id when '11111111-0000-0000-0000-000000000001' then 4000 when '11111111-0000-0000-0000-000000000002' then 4300 else 5100 end))::text,
  (row_number() over (partition by b.site_id order by b.name, f, c, r) + (case b.site_id when '11111111-0000-0000-0000-000000000001' then 4000 when '11111111-0000-0000-0000-000000000002' then 4300 else 5100 end))::text,
  f, c, r, b.layout,
  case b.layout when 'studio' then 0 when 'one_bed' then 1 when 'two_bed' then 2 else 3 end,
  case b.layout when 'three_bed' then 2 when 'two_bed' then 1.5 else 1 end,
  case b.layout when 'studio' then 520 when 'one_bed' then 760 when 'two_bed' then 980 else 1320 end,
  case b.layout when 'studio' then 1350 when 'one_bed' then 1690 when 'two_bed' then 2150 else 2790 end,
  case when (f+c+r) % 5 = 0 then 'leased' else 'available' end
from public.buildings b, generate_series(1,b.floors) f, generate_series(0,b.cols-1) c, generate_series(0,b.rows-1) r;

insert into public.devices (unit_id,object_name,name,type,model,install_year,energy_kwh,status)
select u.id, d.obj, d.name, d.type, d.model, 2019 + ((u.floor + u.col + d.k) % 6), d.kwh,
  case when (u.floor*7 + u.col*3 + d.k) % 11 = 0 then 'offline' else 'online' end
from public.units u cross join (values
  ('DEV_thermostat','Thermostat','Smart thermostat','SR-THERM-2',1,12),
  ('DEV_fridge','Refrigerator','Fridge-freezer','DEMO-FRIDGE-01',2,420),
  ('DEV_range','Cooker','Electric range / oven','DEMO-RANGE-01',3,240),
  ('DEV_tv','Television','LED television','DEMO-TV-01',4,90),
  ('DEV_lock','Smart lock','Door lock','SR-LOCK-1',5,4)
) as d(obj,name,type,model,k,kwh);