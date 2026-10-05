create table if not exists public.glof_observations (
	id uuid primary key default gen_random_uuid(),
	lake_id integer not null check (lake_id > 0),
	location_name text,
	latitude double precision,
	longitude double precision,
	observed_area_sq_km numeric,
	maximum_extent_2025_sq_km numeric,
	imagery_date date not null,
	observation_status text check (observation_status in ('frozen', 'unfrozen')),
	source text not null,
	source_url text not null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint glof_observations_identity_unique unique (source, lake_id, imagery_date),
	constraint glof_observations_latitude_range check (latitude is null or latitude between -90 and 90),
	constraint glof_observations_longitude_range check (longitude is null or longitude between -180 and 180),
	constraint glof_observations_coordinate_pair check ((latitude is null) = (longitude is null)),
	constraint glof_observations_observed_area_nonnegative check (observed_area_sq_km is null or observed_area_sq_km >= 0),
	constraint glof_observations_maximum_extent_nonnegative check (maximum_extent_2025_sq_km is null or maximum_extent_2025_sq_km >= 0)
);

comment on table public.glof_observations is
	'Source-backed satellite observations of potentially dangerous glacial lakes; observations are not risk scores or emergency alerts.';

create index if not exists glof_observations_imagery_date_idx
	on public.glof_observations (imagery_date desc);

alter table public.glof_observations enable row level security;

create policy "Public can read GLOF observations"
	on public.glof_observations for select
	to anon, authenticated
	using (true);

grant select on table public.glof_observations to anon, authenticated;
grant select, insert, update, delete on table public.glof_observations to service_role;
