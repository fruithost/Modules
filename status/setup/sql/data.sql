INSERT INTO `[DATABASE_PREFIX]status`
	(`id`, `service`, `name`, `port`, `status`, `time`)
VALUES
	(18, 'FTP', 'ProFTP', '21', 'OFFLINE', NULL),
	(19, 'SSH', 'SSH', '22', 'OFFLINE', NULL),
	(20, 'SMTP', 'Mailserver', '25', 'OFFLINE', NULL),
	(21, 'HTTP', 'Apache2', '80', 'OFFLINE', NULL),
	(22, 'POP3', 'Mailserver', '110', 'OFFLINE', NULL),
	(23, 'IMAP', 'Mailserver', '143', 'OFFLINE', NULL),
	(24, 'HTTPS', 'Apache2', '443', 'OFFLINE', NULL);