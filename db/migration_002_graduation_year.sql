-- migration_002_graduation_year.sql
-- playersテーブルに卒業予定年度カラムを追加
-- デフォルト値は2027（現在の6年生相当）

ALTER TABLE players ADD COLUMN graduation_year INTEGER NOT NULL DEFAULT 2027;
