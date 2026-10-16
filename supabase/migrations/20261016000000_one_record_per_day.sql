-- 하루 1기록: (user_id, KST 날짜) 유일. 참고: docs/adr/0007-one-record-per-day.md

-- 1) 기존 하루 중복 정리 — KST 날짜별로 가장 최근 1건만 남긴다.
delete from public.records
where id in (
  select id
  from (
    select
      id,
      row_number() over (
        partition by user_id, ((created_at at time zone 'Asia/Seoul')::date)
        order by created_at desc, id desc
      ) as rn
    from public.records
  ) ranked
  where rn > 1
);

-- 2) KST 날짜 생성 컬럼. 유니크 제약의 충돌 대상(upsert onConflict)으로 쓴다.
alter table public.records
  add column record_date date
  generated always as ((created_at at time zone 'Asia/Seoul')::date) stored;

-- 3) 사용자당 하루 1건
alter table public.records
  add constraint records_user_id_record_date_key unique (user_id, record_date);
