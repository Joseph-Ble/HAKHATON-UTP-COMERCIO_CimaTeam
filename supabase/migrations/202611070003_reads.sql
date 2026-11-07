-- Paginated reads run with the caller's privileges and RLS, never as an admin.
begin;
create function app_private.normalized(value text) returns text language sql immutable set search_path='' as $$
 select translate(lower(coalesce(value,'')),'áéíóúüñ','aeiouun');
$$;
create function app_private.category_name(value text) returns text language sql immutable set search_path='' as $$
 select case value when 'shops' then 'Tiendas y minimarkets' when 'hardware' then 'Ferreterías' when 'education' then 'Educación y apoyo escolar' when 'food' then 'Alimentos y restaurantes' when 'health' then 'Salud y bienestar' when 'home' then 'Servicios técnicos y del hogar' when 'beauty' then 'Belleza y cuidado personal' when 'other' then 'Otros servicios y emprendimientos' when 'security' then 'Inseguridad ciudadana' when 'nature' then 'Fenómenos naturales' else '' end;
$$;
create function app_private.review_summary(p_scope text,p_id uuid,p_zone text) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('count',count(*),'average',coalesce(avg(rating),0),'local',count(*) filter(where recommends and barrio_id=p_zone))
 from public.reviews where scope=p_scope and entity_id=p_id;
$$;

create function public.get_listing(item_scope text,filters jsonb default '{}',page_index integer default 0,page_size integer default 24)
returns jsonb language plpgsql stable set search_path='' as $$
declare
 n integer:=least(greatest(page_size,1),50); offset_n integer:=greatest(page_index,0)*least(greatest(page_size,1),50);
 zone text:=filters->>'barrio_id'; term text:=app_private.normalized(trim(filters->>'search'));
 result jsonb; amount integer;
begin
 if item_scope='business' then
  select coalesce(jsonb_agg(j order by rank_n desc,created_at desc,id),'[]'::jsonb) into result from (
   select to_jsonb(b)||jsonb_build_object('_stats',app_private.review_summary('business',b.id,zone)) as j,
    case when filters->>'sort'='recommended' then (select count(*) from public.reviews r where r.scope='business' and r.entity_id=b.id and r.recommends and r.barrio_id=zone) else 0 end as rank_n,b.created_at,b.id
   from public.businesses b where b.deleted_at is null and b.visibility='visible' and b.status='active' and b.barrio_id=zone
    and (coalesce(filters->>'category','all')='all' or b.category=filters->>'category')
    and position(term in app_private.normalized(b.title||' '||b.description||' '||app_private.category_name(b.category)))>0
   order by rank_n desc,b.created_at desc,b.id limit n+1 offset offset_n
  ) q;
 elsif item_scope='post' then
  select coalesce(jsonb_agg(j order by created_at desc,id),'[]'::jsonb) into result from (
   select to_jsonb(p) as j,p.created_at,p.id from public.posts p
   where p.deleted_at is null and p.visibility='visible' and p.barrio_id=zone
    and (coalesce(filters->>'module','')='' or p.module=filters->>'module')
    and (coalesce(filters->>'type','all')='all' or p.type=filters->>'type')
    and (coalesce(filters->>'category','all')='all' or p.category=filters->>'category')
    and (coalesce(filters->>'intent','all')='all' or p.intent=filters->>'intent')
    and (not coalesce((filters->>'activeOnly')::boolean,false) or p.status in ('active','coordinating','open'))
    and position(term in app_private.normalized(p.title||' '||p.description||' '||p.offering||' '||p.requesting||' '||app_private.category_name(p.category)))>0
   order by p.created_at desc,p.id limit n+1 offset offset_n
  ) q;
 else raise exception 'Recurso no válido.';
 end if;
 amount:=jsonb_array_length(result);
 return jsonb_build_object('items',coalesce((select jsonb_agg(value order by ordinality) from jsonb_array_elements(result) with ordinality where ordinality<=n),'[]'::jsonb),'has_more',amount>n);
end; $$;

create function public.get_item(item_scope text,item_id uuid,zone text default '') returns jsonb language plpgsql stable set search_path='' as $$
declare item jsonb; r jsonb; c jsonb; o jsonb; responses jsonb; h jsonb; people jsonb; ids uuid[];
begin
 if item_scope='business' then select to_jsonb(b) into item from public.businesses b where b.id=item_id;
 elsif item_scope='post' then select to_jsonb(p) into item from public.posts p where p.id=item_id;
 else raise exception 'Recurso no válido.';
 end if;
 if item is null then return null; end if;
 select coalesce(jsonb_agg(to_jsonb(v) order by v.created_at desc,v.id),'[]'::jsonb) into r from public.reviews v where scope=item_scope and entity_id=item_id;
 select coalesce(jsonb_agg(to_jsonb(v)),'[]'::jsonb) into c from public.contacts v where scope=item_scope and entity_id=item_id;
 select coalesce(jsonb_agg(to_jsonb(v) order by v.created_at,v.id),'[]'::jsonb) into o from public.offers v where item_scope='post' and post_id=item_id;
 select coalesce(jsonb_agg(to_jsonb(v) order by v.created_at,v.id),'[]'::jsonb) into responses from public.responses v where scope=item_scope and entity_id=item_id;
 select coalesce(jsonb_agg(to_jsonb(v) order by v.created_at desc,v.id),'[]'::jsonb) into h from public.history v where scope=item_scope and entity_id=item_id;
 select array_agg(distinct id) into ids from (
  select (item->>'author_id')::uuid as id
  union select (value->>'author_id')::uuid from jsonb_array_elements(r)
  union select (value->>'volunteer_id')::uuid from jsonb_array_elements(o)
  union select (value->>'from_id')::uuid from jsonb_array_elements(responses)
 ) all_ids;
 select coalesce(jsonb_agg(to_jsonb(p)),'[]'::jsonb) into people from public.profiles p where id=any(ids);
 return jsonb_build_object('item',item||jsonb_build_object('_stats',app_private.review_summary(item_scope,item_id,zone)),'reviews',r,'contacts',c,'offers',o,'responses',responses,'history',h,'profiles',people);
end; $$;

-- The bootstrap contains a small home feed, the caller's own resources and
-- private activity. Browsing and direct details do not depend on this feed.
create function public.get_context(zone text) returns jsonb language sql stable set search_path='' as $$
 with offers_view as materialized (select * from public.offers),
 responses_view as materialized (select * from public.responses),
 reports_view as materialized (select * from public.reports),
 business_home as (select id from public.businesses where barrio_id=zone and visibility='visible' and status='active' and deleted_at is null order by created_at desc,id limit 3),
 post_home as (select id from public.posts where barrio_id=zone and module='solidarity' and visibility='visible' and status='active' and deleted_at is null order by created_at desc,id limit 3),
 businesses_view as materialized (
  select b.* from public.businesses b where b.deleted_at is null and (
   b.author_id=auth.uid() or b.id in(select id from business_home)
   or b.id in(select entity_id from responses_view where scope='business')
   or (app_private.is_moderator() and (b.visibility<>'visible' or b.id in(select entity_id from reports_view where scope='business' and status='open')))
  )
 ), posts_view as materialized (
  select p.* from public.posts p where p.deleted_at is null and (
   p.author_id=auth.uid() or p.id in(select id from post_home)
   or p.id in(select post_id from offers_view)
   or p.id in(select entity_id from responses_view where scope='post')
   or (app_private.is_moderator() and (p.visibility<>'visible' or p.id in(select entity_id from reports_view where scope='post' and status='open')))
  )
 ), people as (
  select auth.uid() as id union select author_id from businesses_view union select author_id from posts_view
  union select volunteer_id from offers_view union select from_id from responses_view union select author_id from responses_view
 )
 select jsonb_build_object(
  'profiles',coalesce((select jsonb_agg(to_jsonb(p)) from public.profiles p where id in(select id from people)),'[]'::jsonb),
  'businesses',coalesce((select jsonb_agg(to_jsonb(b)||jsonb_build_object('_stats',app_private.review_summary('business',b.id,zone))) from businesses_view b),'[]'::jsonb),
  'posts',coalesce((select jsonb_agg(to_jsonb(p)) from posts_view p),'[]'::jsonb),
  'offers',coalesce((select jsonb_agg(to_jsonb(o)) from offers_view o),'[]'::jsonb),
  'responses',coalesce((select jsonb_agg(to_jsonb(r)) from responses_view r),'[]'::jsonb),
  'reports',coalesce((select jsonb_agg(to_jsonb(r)) from reports_view r),'[]'::jsonb),
  'contacts',coalesce((select jsonb_agg(to_jsonb(c)) from public.contacts c where author_id=auth.uid()),'[]'::jsonb),
  'guidance',coalesce((select jsonb_agg(to_jsonb(g)) from public.guidance g),'[]'::jsonb),
  'services',coalesce((select jsonb_agg(to_jsonb(s)) from public.services s),'[]'::jsonb),
  'roles',coalesce((select jsonb_agg(to_jsonb(r)) from public.user_roles r),'[]'::jsonb),
  'history','[]'::jsonb,'reviews','[]'::jsonb
 );
$$;
revoke all on function app_private.normalized(text),app_private.category_name(text),app_private.review_summary(text,uuid,text) from public;
grant execute on function app_private.normalized(text),app_private.category_name(text),app_private.review_summary(text,uuid,text) to anon,authenticated;
revoke all on function public.get_listing(text,jsonb,integer,integer),public.get_item(text,uuid,text),public.get_context(text) from public;
grant execute on function public.get_listing(text,jsonb,integer,integer),public.get_item(text,uuid,text),public.get_context(text) to anon,authenticated;
commit;
