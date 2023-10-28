CREATE TABLE IF NOT EXISTS `[DATABASE_PREFIX]domains` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `directory` varchar(255) DEFAULT NULL,
  `type` enum('DOMAIN','SUBDOMAIN','ALIAS','PARKED','REDIRECT') DEFAULT NULL,
  `active` enum('YES','NO') DEFAULT 'NO',
  `enabled` enum('YES','NO','') DEFAULT 'NO',
  `time_created` datetime DEFAULT NULL,
  `time_deleted` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;