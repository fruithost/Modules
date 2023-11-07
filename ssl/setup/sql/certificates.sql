DROP TABLE IF EXISTS `[DATABASE_PREFIX]certificates`;

CREATE TABLE `[DATABASE_PREFIX]certificates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NULL DEFAULT NULL,
  `domain` int(11) NULL DEFAULT NULL,
  `type` enum('LETSENCRYPT','SELFSIGNED','CERTIFICATE') NULL DEFAULT NULL,
  `time_created` datetime NULL DEFAULT NULL,
  `time_updated` datetime NULL DEFAULT NULL,
  `days_expiring` int(3) NULL DEFAULT NULL,
  `force_https` enum('YES','NO') NULL DEFAULT 'YES',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1;