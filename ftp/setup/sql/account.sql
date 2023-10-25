CREATE USER 'ftp'@'localhost';
GRANT SELECT ON fruithost.[DATABASE_PREFIX]users TO 'ftp'@'localhost';
GRANT SELECT, UPDATE ON fruithost.[DATABASE_PREFIX]ftp_user TO 'ftp'@'localhost';
GRANT SELECT, UPDATE ON fruithost.[DATABASE_PREFIX]ftp_quota_limits TO 'ftp'@'localhost';