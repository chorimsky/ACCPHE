CREATE TABLE `content_blocks` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_by_id` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `message_replies` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`body` text NOT NULL,
	`who` text NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `message_replies_msg_idx` ON `message_replies` (`message_id`);--> statement-breakpoint
CREATE TABLE `record_events` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`status` text NOT NULL,
	`cls` text NOT NULL,
	`effective` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `record_events_record_idx` ON `record_events` (`record_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `cases` ADD `party_email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `cases` ADD `application_id` text REFERENCES applications(id);