-- PHASE B - destructive cleanup. Do NOT run this now.
-- Run this only once the app has been confirmed working for a while on band_id.
-- Drops the now-unused period_id columns and the periods table entirely.

alter table gigs drop column period_id;

alter table availability drop constraint availability_pkey;
alter table availability drop constraint availability_band_member_date_key;
alter table availability drop column period_id;
alter table availability add primary key (band_id, member_id, date);

drop table periods;
