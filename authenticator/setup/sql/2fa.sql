CREATE TABLE IF NOT EXISTS `[DATABASE_PREFIX]2fa_devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `secret` varchar(255) DEFAULT NULL,
  `time_created` datetime DEFAULT NULL,
  `time_revoked` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;