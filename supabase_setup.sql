-- Colle ce SQL dans Supabase > SQL Editor > Run

-- Table des groupes WhatsApp
create table if not exists groups (
  id uuid default gen_random_uuid() primary key,
  whatsapp_id text unique not null,
  name text not null,
  description text default '',
  participant_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table des communautés (groupements de groupes)
create table if not exists communities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text default '',
  created_at timestamptz default now()
);

-- Table de liaison communauté <-> groupes
create table if not exists community_groups (
  id uuid default gen_random_uuid() primary key,
  community_id uuid references communities(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  unique(community_id, group_id)
);

-- Historique des messages envoyés
create table if not exists message_history (
  id uuid default gen_random_uuid() primary key,
  type text not null, -- 'group', 'community', 'private'
  target_id text not null,
  target_name text not null,
  message text not null,
  results text, -- JSON des résultats
  sent_at timestamptz default now()
);

-- Désactiver RLS pour usage perso (ou configure selon tes besoins)
alter table groups disable row level security;
alter table communities disable row level security;
alter table community_groups disable row level security;
alter table message_history disable row level security;
