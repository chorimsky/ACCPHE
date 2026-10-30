CREATE TABLE `fellow_events` (
	`id` text PRIMARY KEY NOT NULL,
	`fellow_id` text NOT NULL,
	`status` text NOT NULL,
	`designation` text NOT NULL,
	`effective` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`fellow_id`) REFERENCES `fellows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `fellow_events_fellow_idx` ON `fellow_events` (`fellow_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `fellows` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`verification` text NOT NULL,
	`honorific` text DEFAULT '' NOT NULL,
	`name` text NOT NULL,
	`designation` text NOT NULL,
	`country` text NOT NULL,
	`position` text DEFAULT '' NOT NULL,
	`affiliation` text DEFAULT '' NOT NULL,
	`citation` text DEFAULT '' NOT NULL,
	`effective` text DEFAULT '' NOT NULL,
	`review` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`application_id` text,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fellows_slug_uq` ON `fellows` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `fellows_verification_uq` ON `fellows` (`verification`);--> statement-breakpoint
CREATE INDEX `fellows_status_idx` ON `fellows` (`status`);--> statement-breakpoint
ALTER TABLE `applications` ADD `fellow_designation` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `fellow_route` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `fellow_email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `fellow_position` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `fellow_affiliation` text DEFAULT '' NOT NULL;