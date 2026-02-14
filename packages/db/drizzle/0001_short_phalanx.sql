ALTER TABLE `token_usage` ADD `cache_creation_tokens` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `token_usage` ADD `cache_read_tokens` integer DEFAULT 0 NOT NULL;