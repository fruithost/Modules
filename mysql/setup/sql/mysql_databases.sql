DROP TABLE IF EXISTS `[DATABASE_PREFIX]mysql_databases`;

CREATE TABLE `[DATABASE_PREFIX]mysql_databases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `time_created` datetime DEFAULT NULL,
  `time_deleted` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;