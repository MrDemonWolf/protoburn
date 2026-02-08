CREATE TABLE `token_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`model` text NOT NULL,
	`input_tokens` integer NOT NULL,
	`output_tokens` integer NOT NULL,
	`date` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_date` ON `token_usage` (`date`);--> statement-breakpoint
CREATE INDEX `idx_model` ON `token_usage` (`model`);--> statement-breakpoint
CREATE INDEX `idx_model_date` ON `token_usage` (`model`,`date`);