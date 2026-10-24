CREATE TABLE `program_record_events` (
	`id` text PRIMARY KEY NOT NULL,
	`program_id` text NOT NULL,
	`status` text NOT NULL,
	`award` text NOT NULL,
	`effective` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`program_id`) REFERENCES `program_records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `program_record_events_program_idx` ON `program_record_events` (`program_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `program_records` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`verification` text NOT NULL,
	`title` text NOT NULL,
	`provider` text NOT NULL,
	`country` text NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`award` text NOT NULL,
	`effective` text DEFAULT '' NOT NULL,
	`review` text DEFAULT '' NOT NULL,
	`scope` text DEFAULT '' NOT NULL,
	`conditions` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`application_id` text,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `program_records_slug_uq` ON `program_records` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `program_records_verification_uq` ON `program_records` (`verification`);--> statement-breakpoint
CREATE INDEX `program_records_status_idx` ON `program_records` (`status`);--> statement-breakpoint
ALTER TABLE `applications` ADD `kind` text DEFAULT 'institution' NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `program_title` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `program_category` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `program_delivery` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `program_duration` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `program_learners` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `applications_kind_idx` ON `applications` (`kind`);