CREATE TABLE `monthly_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`model` text NOT NULL,
	`month` text NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`cache_creation_tokens` integer DEFAULT 0 NOT NULL,
	`cache_read_tokens` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_monthly_model_month` ON `monthly_usage` (`model`,`month`);