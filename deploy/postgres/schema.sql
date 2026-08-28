CREATE TABLE IF NOT EXISTS profiles (
    profile_id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    region TEXT NOT NULL,
    move_in_period TEXT NOT NULL,
    stay_duration_months INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_interviews (
    profile_id TEXT PRIMARY KEY REFERENCES profiles(profile_id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_recommendations (
    profile_id TEXT PRIMARY KEY REFERENCES profiles(profile_id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    profile_id TEXT REFERENCES profiles(profile_id) ON DELETE SET NULL,
    nickname TEXT NOT NULL,
    email TEXT,
    profile_image_url TEXT,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    last_login_at TIMESTAMPTZ NOT NULL,
    UNIQUE (provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    session_name TEXT NOT NULL,
    student_count INTEGER NOT NULL,
    preset_id TEXT NOT NULL,
    status TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS match_results (
    session_id TEXT PRIMARY KEY REFERENCES sessions(session_id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_rooms (
    room_id TEXT PRIMARY KEY,
    participant_a_profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    participant_b_profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (participant_a_profile_id, participant_b_profile_id)
);

CREATE TABLE IF NOT EXISTS match_requests (
    request_id TEXT PRIMARY KEY,
    participant_a_profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    participant_b_profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    requester_profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    target_profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (participant_a_profile_id, participant_b_profile_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    message_id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
    sender_profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id_created_at
    ON chat_messages (room_id, created_at);

CREATE TABLE IF NOT EXISTS roommate_pacts (
    room_id TEXT PRIMARY KEY REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
    participant_a_profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    participant_b_profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
