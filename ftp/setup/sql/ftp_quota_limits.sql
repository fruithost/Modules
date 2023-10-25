DROP TABLE IF EXISTS `[DATABASE_PREFIX]ftp_quota_limits`;

CREATE TABLE `[DATABASE_PREFIX]ftp_quota_limits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `type` enum('USER','GROUP','CLASS','ALL') DEFAULT 'USER',
  `session` enum('TRUE','FALSE') DEFAULT 'FALSE',
  `limit` enum('SOFT','HARD') DEFAULT 'SOFT',
  `bytes_in` bigint(20) DEFAULT NULL,
  `bytes_out` bigint(20) DEFAULT 0,
  `bytes_transfer` bigint(20) DEFAULT 0,
  `files_in` bigint(10) DEFAULT 0,
  `files_out` bigint(10) DEFAULT 0,
  `files_transfer` bigint(10) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;