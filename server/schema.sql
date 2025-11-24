CREATE DATABASE IF NOT EXISTS `typescript1` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `typescript1`;

DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_number` VARCHAR(32) NOT NULL UNIQUE,
  `first_name` VARCHAR(80) NOT NULL,
  `last_name` VARCHAR(80) NOT NULL,
  `email` VARCHAR(160) NOT NULL,
  `contact_number` VARCHAR(40) NULL,
  `program` VARCHAR(120) NOT NULL,
  `year_level` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `admission_date` DATE NOT NULL,
  `status` ENUM('enrolled','leave','graduated','inactive') NOT NULL DEFAULT 'enrolled',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `fullname` VARCHAR(180) NOT NULL,
  `username` VARCHAR(120) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','registrar','student') NOT NULL DEFAULT 'student',
  `email` VARCHAR(160) NULL,
  `google_id` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

INSERT INTO `users` (fullname, username, password, role)
VALUES
  ('System Administrator', 'admin', 'admin123', 'admin')
ON DUPLICATE KEY UPDATE fullname = VALUES(fullname);

INSERT INTO `students` (
  student_number,
  first_name,
  last_name,
  email,
  contact_number,
  program,
  year_level,
  admission_date,
  status
)
VALUES
  (
    '2025-0001',
    'Ava',
    'Lopez',
    'ava.lopez@example.edu',
    '+63 917 222 1111',
    'BS Information Technology',
    2,
    '2023-08-15',
    'enrolled'
  ),
  (
    '2025-0002',
    'Noah',
    'Fernandez',
    'noah.fernandez@example.edu',
    '+63 917 555 8888',
    'BS Computer Science',
    3,
    '2022-08-10',
    'enrolled'
  ),
  (
    '2025-0003',
    'Luna',
    'Garcia',
    'luna.garcia@example.edu',
    '+63 917 999 0000',
    'BS Psychology',
    1,
    '2024-08-05',
    'leave'
  )
ON DUPLICATE KEY UPDATE
  email = VALUES(email),
  contact_number = VALUES(contact_number),
  program = VALUES(program),
  year_level = VALUES(year_level),
  admission_date = VALUES(admission_date),
  status = VALUES(status);

