-- 프로필 아바타 저장용 Storage 버킷: 공개 읽기, 본인 파일만 쓰기/수정/삭제

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy avatars_select_public on storage.objects
  for select using (bucket_id = 'avatars');

create policy avatars_insert_own on storage.objects
  for insert with check (bucket_id = 'avatars' and owner = auth.uid());

create policy avatars_update_own on storage.objects
  for update using (bucket_id = 'avatars' and owner = auth.uid())
  with check (bucket_id = 'avatars' and owner = auth.uid());

create policy avatars_delete_own on storage.objects
  for delete using (bucket_id = 'avatars' and owner = auth.uid());
