CREATE TABLE IF NOT EXISTS "chat_provider_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"base_url" text DEFAULT '' NOT NULL,
	"api_key" text DEFAULT '' NOT NULL,
	"model_id" text DEFAULT '' NOT NULL,
	"updated_at" text DEFAULT to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') NOT NULL
);
