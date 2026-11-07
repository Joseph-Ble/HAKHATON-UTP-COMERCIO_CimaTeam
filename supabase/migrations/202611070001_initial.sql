-- EntreVecinos. Apply to a NEW Supabase project. No service key belongs in the app.
begin;
create schema if not exists app_private;
create table public.neighborhoods (id text primary key, name text not null);
insert into public.neighborhoods values ('san-miguel','San Miguel'),('pueblo-libre','Pueblo Libre');
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 2 and 70),
 barrio_id text not null references public.neighborhoods(id), created_at timestamptz not null default now()
);
create table public.user_roles (user_id uuid primary key references auth.users(id) on delete cascade, role text not null check (role = 'moderator'));
create table public.businesses (
 id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id), barrio_id text not null references public.neighborhoods(id),
 title text not null check(char_length(title) between 3 and 100), description text not null check(char_length(description) between 15 and 1800),
 category text not null check(category in ('shops','hardware','education','food','health','home','beauty','other')),
 area text not null check(char_length(area) between 3 and 120), hours text not null check(char_length(hours) between 3 and 120),
 status text not null default 'active' check(status in ('active','inactive')), visibility text not null default 'visible' check(visibility in ('visible','pending','hidden')),
 is_example boolean not null default false, deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.posts (
 id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id), barrio_id text not null references public.neighborhoods(id),
 module text not null check(module in ('solidarity','emergency')), type text not null,
 title text not null check(char_length(title) between 5 and 100), description text not null check(char_length(description) between 15 and 1800),
 category text not null, area text not null check(char_length(area) between 3 and 120),
 price numeric(12,2) check(price >= 0 and price <= 9999999), offering text not null default '' check(char_length(offering)<=300), requesting text not null default '' check(char_length(requesting)<=300),
 intent text check(intent in ('need','offer')), help_kind text check(help_kind in ('donation','loan','favor')), occurred_at timestamptz,
 status text not null default 'active', visibility text not null default 'visible' check(visibility in ('visible','pending','hidden')),
 is_example boolean not null default false, deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check ((module='solidarity' and type in ('sell','buy','swap','free') and category in ('shops','hardware','education','food','health','home','beauty','other') and status in ('active','coordinating','completed','cancelled')) or (module='emergency' and category in ('security','nature') and ((type='help' and status in ('open','coordinating','served','cancelled')) or (type='report' and status in ('active','archived'))))),
 check(type <> 'free' or (intent is not null and help_kind is not null and price is null)),
 check(type <> 'swap' or (char_length(offering)>0 and char_length(requesting)>0)),
 check(module <> 'emergency' or (occurred_at is not null and price is null))
);
create table public.reviews (
 id uuid primary key default gen_random_uuid(), scope text not null check(scope in ('business','post')), entity_id uuid not null,
 author_id uuid not null references public.profiles(id), rating integer not null check(rating between 1 and 5), comment text not null default '' check(char_length(comment)<=600),
 recommends boolean not null default false, barrio_id text not null references public.neighborhoods(id), created_at timestamptz not null default now(), unique(scope,entity_id,author_id)
);
create table public.offers (
 id uuid primary key default gen_random_uuid(), post_id uuid not null references public.posts(id), volunteer_id uuid not null references public.profiles(id),
 message text not null check(char_length(message) between 5 and 600), reply text not null default '' check(char_length(reply)<=600),
 status text not null default 'pending' check(status in ('pending','accepted','rejected','withdrawn')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(post_id,volunteer_id)
);
create table public.responses (
 id uuid primary key default gen_random_uuid(), scope text not null check(scope in ('business','post')), entity_id uuid not null, from_id uuid not null references public.profiles(id), author_id uuid not null references public.profiles(id),
 message text not null check(char_length(message) between 5 and 600), reply text not null default '' check(char_length(reply)<=600), status text not null default 'pending' check(status in ('pending','answered')), created_at timestamptz not null default now(), unique(scope,entity_id,from_id), check(from_id<>author_id)
);
create table public.contacts (
 id uuid primary key default gen_random_uuid(), scope text not null check(scope in ('business','post')), entity_id uuid not null, author_id uuid not null references public.profiles(id),
 channel text not null check(channel in ('whatsapp','email')), value text not null check(char_length(value) between 3 and 150), consent_at timestamptz not null default now(), unique(scope,entity_id)
);
create table public.history (
 id uuid primary key default gen_random_uuid(), scope text not null check(scope in ('business','post')), entity_id uuid not null, actor_id uuid not null references public.profiles(id), from_status text, to_status text not null, created_at timestamptz not null default now()
);
create table public.reports (
 id uuid primary key default gen_random_uuid(), scope text not null check(scope in ('business','post')), entity_id uuid not null, reporter_id uuid not null references public.profiles(id), reason text not null check(char_length(reason) between 5 and 600), status text not null default 'open' check(status in ('open','resolved')), created_at timestamptz not null default now()
);
create unique index report_once_open on public.reports(scope,entity_id,reporter_id) where status='open';
create table public.guidance (
 id uuid primary key default gen_random_uuid(), category text not null check(category in ('security','nature')), event text not null check(char_length(event) between 2 and 60),
 title text not null check(char_length(title) between 5 and 120), body text not null check(char_length(body) between 20 and 2000), institution text not null check(char_length(institution) between 2 and 100),
 source_url text not null check(source_url like 'https://%'), reviewed_at date not null, visible boolean not null default true
);
create table public.services (id text primary key, title text not null, category text not null, description text not null, phone text, source_url text not null check(source_url like 'https://%'), reviewed_at date not null);
create index businesses_browse on public.businesses(barrio_id,visibility,status,created_at desc);
create index posts_browse on public.posts(barrio_id,module,type,visibility,created_at desc);
create index offers_volunteer on public.offers(volunteer_id);
create index responses_author on public.responses(author_id);
create index reviews_target on public.reviews(scope,entity_id);
create index history_target on public.history(scope,entity_id,created_at desc);

create function app_private.is_moderator() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.user_roles where user_id=auth.uid() and role='moderator'); $$;
create function app_private.owns(s text, i uuid) returns boolean language sql stable security definer set search_path='' as $$
 select case s when 'business' then exists(select 1 from public.businesses where id=i and author_id=auth.uid() and deleted_at is null) when 'post' then exists(select 1 from public.posts where id=i and author_id=auth.uid() and deleted_at is null) else false end;
$$;
create function app_private.is_public(s text, i uuid) returns boolean language sql stable security definer set search_path='' as $$
 select case s when 'business' then exists(select 1 from public.businesses where id=i and visibility='visible' and deleted_at is null) when 'post' then exists(select 1 from public.posts where id=i and visibility='visible' and deleted_at is null) else false end;
$$;
create function app_private.can_read(s text, i uuid) returns boolean language sql stable security definer set search_path='' as $$
 select app_private.is_public(s,i) or app_private.owns(s,i) or (app_private.is_moderator() and case s when 'business' then exists(select 1 from public.businesses where id=i and deleted_at is null) when 'post' then exists(select 1 from public.posts where id=i and deleted_at is null) else false end);
$$;
create function app_private.require(ok boolean, message text) returns void language plpgsql set search_path='' as $$ begin if not coalesce(ok,false) then raise exception '%',message; end if; end; $$;
create function app_private.target(s text, i uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb;
begin
 if s='business' then select to_jsonb(b) into r from public.businesses b where id=i and deleted_at is null for update;
 elsif s='post' then select to_jsonb(p) into r from public.posts p where id=i and deleted_at is null for update;
 end if;
 perform app_private.require(r is not null,'Esta publicación ya no está disponible.'); return r;
end; $$;
create function app_private.log_event(s text,i uuid,old_state text,new_state text) returns void language sql set search_path='' as $$
 insert into public.history(scope,entity_id,actor_id,from_status,to_status) values(s,i,auth.uid(),old_state,new_state);
$$;
create function app_private.set_contact(s text,i uuid,c jsonb) returns void language plpgsql set search_path='' as $$
begin
 delete from public.contacts where scope=s and entity_id=i;
 if coalesce((c->>'consent')::boolean,false) then
  perform app_private.require((c->>'channel'='whatsapp' and c->>'value' ~ '^\+?[0-9]{8,15}$') or (c->>'channel'='email' and c->>'value' ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),'Revisa el contacto autorizado.');
  insert into public.contacts(scope,entity_id,author_id,channel,value) values(s,i,auth.uid(),c->>'channel',c->>'value');
 end if;
end; $$;

-- No client can grant themselves a role. Signup only creates a public profile.
create function app_private.new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,name,barrio_id) values(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),'Vecino'),coalesce(new.raw_user_meta_data->>'barrio_id','san-miguel'));
 return new;
end; $$;
create trigger create_neighbor after insert on auth.users for each row execute function app_private.new_user();

alter table public.neighborhoods enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.businesses enable row level security;
alter table public.posts enable row level security;
alter table public.reviews enable row level security;
alter table public.offers enable row level security;
alter table public.responses enable row level security;
alter table public.contacts enable row level security;
alter table public.history enable row level security;
alter table public.reports enable row level security;
alter table public.guidance enable row level security;
alter table public.services enable row level security;
create policy neighborhood_read on public.neighborhoods for select using(true);
create policy profile_read on public.profiles for select using(true);
create policy role_read on public.user_roles for select using(user_id=auth.uid());
create policy business_read on public.businesses for select using(deleted_at is null and (visibility='visible' or author_id=auth.uid() or app_private.is_moderator()));
create policy post_read on public.posts for select using(deleted_at is null and (visibility='visible' or author_id=auth.uid() or app_private.is_moderator()));
create policy review_read on public.reviews for select using(app_private.can_read(scope,entity_id));
create policy offer_read on public.offers for select using(app_private.can_read('post',post_id) and (volunteer_id=auth.uid() or app_private.owns('post',post_id)));
create policy response_read on public.responses for select using(app_private.can_read(scope,entity_id) and (from_id=auth.uid() or author_id=auth.uid()));
create policy contact_read on public.contacts for select using(auth.uid() is not null and (app_private.is_public(scope,entity_id) or app_private.owns(scope,entity_id)));
create policy history_read on public.history for select using(app_private.can_read(scope,entity_id));
create policy report_read on public.reports for select using(reporter_id=auth.uid() or app_private.is_moderator());
create policy guidance_read on public.guidance for select using(visible or app_private.is_moderator());
create policy service_read on public.services for select using(true);

-- All writes use this small, authenticated command boundary. Client fields such
-- as author_id, role, visibility, historical barrio and timestamps are ignored.
create function public.app_command(action_name text, payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare
 u uuid := auth.uid(); i uuid := nullif(payload->>'id','')::uuid; s text := payload->>'scope'; d jsonb := payload->'data'; r jsonb;
 o public.offers; response public.responses; v text; old_v text; expected_module text; expected_type text; result_id uuid; is_new boolean;
begin
 perform app_private.require(u is not null and exists(select 1 from public.profiles where id=u),'Inicia sesión para continuar.');
 case action_name
 when 'save_business' then
  s := 'business'; is_new := i is null;
  if is_new then i:=gen_random_uuid();
   insert into public.businesses(id,author_id,barrio_id,title,description,category,area,hours) values(i,u,d->>'barrio_id',trim(d->>'title'),trim(d->>'description'),d->>'category',trim(d->>'area'),trim(d->>'hours'));
   perform app_private.log_event(s,i,null,'active');
  else
   r:=app_private.target(s,i); perform app_private.require(r->>'author_id'=u::text,'Solo puedes editar tus propias publicaciones.');
   update public.businesses set barrio_id=d->>'barrio_id',title=trim(d->>'title'),description=trim(d->>'description'),category=d->>'category',area=trim(d->>'area'),hours=trim(d->>'hours'),updated_at=now() where id=i;
  end if;
  perform app_private.set_contact(s,i,payload->'contact'); result_id:=i;
 when 'save_post' then
  s:='post'; is_new:=i is null;
  if not is_new then
   r:=app_private.target(s,i); perform app_private.require(r->>'author_id'=u::text,'Solo puedes editar tus propias publicaciones.');
   perform app_private.require(r->>'type'=d->>'type' and r->>'module'=d->>'module','La modalidad no puede cambiarse después de publicar.');
  end if;
  perform app_private.require(d->>'module'<>'emergency' or (d->>'occurred_at')::timestamptz <= now()+interval '1 minute','La fecha no puede estar en el futuro.');
  if is_new then
   i:=gen_random_uuid();
   insert into public.posts(id,author_id,barrio_id,module,type,title,description,category,area,price,offering,requesting,intent,help_kind,occurred_at,status,visibility)
   values(i,u,d->>'barrio_id',d->>'module',d->>'type',trim(d->>'title'),trim(d->>'description'),d->>'category',trim(d->>'area'),(d->>'price')::numeric,coalesce(trim(d->>'offering'),''),coalesce(trim(d->>'requesting'),''),d->>'intent',d->>'help_kind',(d->>'occurred_at')::timestamptz,case when d->>'type'='help' then 'open' else 'active' end,case when d->>'module'='emergency' and d->>'category'='security' then 'pending' else 'visible' end);
   perform app_private.log_event(s,i,null,case when d->>'type'='help' then 'open' else 'active' end);
  else
   update public.posts set barrio_id=d->>'barrio_id',title=trim(d->>'title'),description=trim(d->>'description'),category=d->>'category',area=trim(d->>'area'),price=(d->>'price')::numeric,offering=coalesce(trim(d->>'offering'),''),requesting=coalesce(trim(d->>'requesting'),''),intent=d->>'intent',help_kind=d->>'help_kind',occurred_at=(d->>'occurred_at')::timestamptz,updated_at=now(),visibility=case when visibility='hidden' then 'hidden' when d->>'module'='emergency' and d->>'category'='security' then 'pending' else visibility end where id=i;
  end if;
  perform app_private.set_contact(s,i,payload->'contact'); result_id:=i;
 when 'status' then
  r:=app_private.target(s,i); perform app_private.require(r->>'author_id'=u::text,'Solo puedes modificar tus propias publicaciones.');
  old_v:=r->>'status'; v:=payload->>'status';
  perform app_private.require(
   (s='business' and ((old_v='active' and v='inactive') or (old_v='inactive' and v='active'))) or
   (s='post' and r->>'type'='report' and old_v='active' and v='archived') or
   (s='post' and r->>'type'='help' and ((old_v='open' and v in ('coordinating','cancelled')) or (old_v='coordinating' and v in ('served','cancelled')))) or
   (s='post' and r->>'module'='solidarity' and ((old_v='active' and v in ('coordinating','completed','cancelled')) or (old_v='coordinating' and v in ('completed','cancelled')))),'Este cambio de estado no está permitido.');
  if s='business' then update public.businesses set status=v,updated_at=now() where id=i; else update public.posts set status=v,updated_at=now() where id=i; end if;
  perform app_private.log_event(s,i,old_v,v);
  if v in ('served','cancelled') then update public.offers set status='rejected',updated_at=now() where post_id=i and status='pending'; end if; result_id:=i;
 when 'retire' then
  r:=app_private.target(s,i); perform app_private.require(r->>'author_id'=u::text,'Solo puedes retirar tus propias publicaciones.');
  if s='business' then update public.businesses set deleted_at=now(),updated_at=now() where id=i; else update public.posts set deleted_at=now(),updated_at=now() where id=i; end if;
  delete from public.contacts where scope=s and entity_id=i; perform app_private.log_event(s,i,r->>'status','retired'); result_id:=i;
 when 'review' then
  r:=app_private.target(s,i); perform app_private.require(r->>'visibility'='visible','Publicación no disponible para valorar.');
  perform app_private.require(r->>'author_id'<>u::text,'No puedes valorar tu propia publicación.');
  perform app_private.require(s='business' or (r->>'module'='solidarity' and r->>'status'='completed'),'Solo puedes valorar experiencias solidarias finalizadas.');
  perform app_private.require(not exists(select 1 from public.reviews where scope=s and entity_id=i and author_id=u),'Ya registraste una valoración de esta publicación.');
  insert into public.reviews(scope,entity_id,author_id,rating,comment,recommends,barrio_id) values(s,i,u,(d->>'rating')::integer,coalesce(trim(d->>'comment'),''),s='business' and coalesce((d->>'recommends')::boolean,false),(select barrio_id from public.profiles where id=u)) returning id into result_id;
 when 'offer' then
  r:=app_private.target('post',i);
  perform app_private.require(r->>'type'='help' and r->>'visibility'='visible' and r->>'status' in ('open','coordinating'),'Esta solicitud ya no recibe ofertas de ayuda.');
  perform app_private.require(r->>'author_id'<>u::text,'No puedes ofrecer ayuda a tu propia solicitud.');
  perform app_private.require(not exists(select 1 from public.offers where post_id=i and volunteer_id=u),'Ya enviaste una oferta para esta solicitud.');
  insert into public.offers(post_id,volunteer_id,message) values(i,u,trim(payload->>'message')) returning id into result_id;
 when 'reply_offer' then
  select * into o from public.offers where id=i;
  perform app_private.require(o.id is not null,'Oferta no disponible.');
  r:=app_private.target('post',o.post_id);
  select * into o from public.offers where id=i for update;
  perform app_private.require(r->>'status' in ('open','coordinating') and o.status='pending','La oferta o solicitud ya fue procesada.');
  v:=payload->>'status';
  perform app_private.require((v='withdrawn' and o.volunteer_id=u) or (v in ('accepted','rejected') and r->>'author_id'=u::text),'No puedes procesar esta oferta.');
  update public.offers set status=v,reply=coalesce(trim(payload->>'reply'),''),updated_at=now() where id=i;
  if v='accepted' and r->>'status'='open' then update public.posts set status='coordinating',updated_at=now() where id=o.post_id; perform app_private.log_event('post',o.post_id,'open','coordinating'); end if;
  result_id:=i;
 when 'request_contact' then
  r:=app_private.target(s,i); perform app_private.require(r->>'visibility'='visible' and r->>'author_id'<>u::text and r->>'status' in ('active','open','coordinating'),'No puedes enviar esta propuesta.');
  insert into public.responses(scope,entity_id,from_id,author_id,message) values(s,i,u,(r->>'author_id')::uuid,trim(payload->>'message')) returning id into result_id;
 when 'reply_contact' then
  select * into response from public.responses where id=i for update;
  perform app_private.require(response.author_id=u,'No puedes responder esta propuesta.'); perform app_private.target(response.scope,response.entity_id);
  update public.responses set reply=trim(payload->>'reply'),status='answered' where id=i returning id into result_id;
  perform app_private.require(char_length(trim(payload->>'reply'))>=5,'Escribe al menos 5 caracteres.');
 when 'report' then
  perform app_private.require(app_private.can_read(s,i),'Publicación no disponible.');
  insert into public.reports(scope,entity_id,reporter_id,reason) values(s,i,u,trim(payload->>'reason')) returning id into result_id;
 when 'moderate' then
  perform app_private.require(app_private.is_moderator(),'Esta acción requiere permisos de moderación.'); r:=app_private.target(s,i); v:=payload->>'visibility';
  perform app_private.require(v in ('visible','hidden'),'Acción no válida.');
  if s='business' then update public.businesses set visibility=v,updated_at=now() where id=i; else update public.posts set visibility=v,updated_at=now() where id=i; end if;
  update public.reports set status='resolved' where scope=s and entity_id=i;
  perform app_private.log_event(s,i,r->>'visibility',v); result_id:=i;
 when 'save_guidance' then
  perform app_private.require(app_private.is_moderator(),'Esta acción requiere permisos editoriales.');
  perform app_private.require((d->>'reviewed_at')::date<=current_date,'La fecha de revisión no puede estar en el futuro.');
  if i is null then
   insert into public.guidance(category,event,title,body,institution,source_url,reviewed_at,visible) values(d->>'category',trim(d->>'event'),trim(d->>'title'),trim(d->>'body'),trim(d->>'institution'),d->>'source_url',(d->>'reviewed_at')::date,(d->>'visible')::boolean) returning id into result_id;
  else
   update public.guidance set category=d->>'category',event=trim(d->>'event'),title=trim(d->>'title'),body=trim(d->>'body'),institution=trim(d->>'institution'),source_url=d->>'source_url',reviewed_at=(d->>'reviewed_at')::date,visible=(d->>'visible')::boolean where id=i returning id into result_id;
   perform app_private.require(result_id is not null,'Recomendación no encontrada.');
  end if;
 when 'update_profile' then
  update public.profiles set name=trim(payload->>'name'),barrio_id=payload->>'barrio_id' where id=u returning id into result_id;
 when 'revoke_contact' then
  r:=app_private.target(s,i); perform app_private.require(r->>'author_id'=u::text,'No puedes modificar este contacto.'); delete from public.contacts where scope=s and entity_id=i; result_id:=i;
 else raise exception 'Acción no reconocida.';
 end case;
 return result_id;
end; $$;

revoke all on all tables in schema public from anon,authenticated;
grant select on public.neighborhoods,public.profiles,public.user_roles,public.businesses,public.posts,public.reviews,public.offers,public.responses,public.contacts,public.history,public.reports,public.guidance,public.services to anon,authenticated;
revoke all on all functions in schema app_private from public,anon,authenticated;
grant usage on schema app_private to anon,authenticated;
grant execute on function app_private.is_moderator(),app_private.owns(text,uuid),app_private.is_public(text,uuid),app_private.can_read(text,uuid) to anon,authenticated;
revoke all on function public.app_command(text,jsonb) from public,anon;
grant execute on function public.app_command(text,jsonb) to authenticated;
commit;
