CREATE TABLE IF NOT EXISTS `chat_provider_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`base_url` text DEFAULT '' NOT NULL,
	`api_key` text DEFAULT '' NOT NULL,
	`model_id` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
