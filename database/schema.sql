CREATE DATABASE IF NOT EXISTS job_tracker;

CREATE USER IF NOT EXISTS 'jobapp'@'%' IDENTIFIED BY 'jobapp123';

GRANT ALL PRIVILEGES ON job_tracker.* TO 'jobapp'@'%';

FLUSH PRIVILEGES;

USE job_tracker;

CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Applied',
    application_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

