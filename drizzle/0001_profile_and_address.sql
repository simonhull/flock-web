-- Migration: Add address table and update profile table
-- This migration restructures the profile table for onboarding

-- Create address table
CREATE TABLE `address` (
	`id` text PRIMARY KEY NOT NULL,
	`line1` text,
	`line2` text,
	`city` text,
	`state` text,
	`postal_code` text,
	`country` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

-- SQLite doesn't support adding NOT NULL columns without defaults to existing tables,
-- and doesn't support DROP COLUMN in older versions. We need to recreate the table.

-- Step 1: Rename old profile table
ALTER TABLE `profile` RENAME TO `profile_old`;

-- Step 2: Create new profile table with updated schema
CREATE TABLE `profile` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`birthday` text NOT NULL,
	`gender` text NOT NULL,
	`display_name` text NOT NULL,
	`phone_number` text,
	`avatar_url` text,
	`bio` text,
	`marital_status` text,
	`anniversary` text,
	`address_id` text,
	`onboarding_complete` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`address_id`) REFERENCES `address`(`id`) ON UPDATE no action ON DELETE set null
);

-- Step 3: Create index (use IF NOT EXISTS for idempotency)
CREATE UNIQUE INDEX IF NOT EXISTS `profile_user_id_idx` ON `profile` (`user_id`);

-- Step 4: Drop old table (no data migration needed for dev - profiles are empty or can be recreated)
DROP TABLE `profile_old`;
