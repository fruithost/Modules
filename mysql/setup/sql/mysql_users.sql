SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `[DATABASE_PREFIX]mysql_users`;

CREATE TABLE `[DATABASE_PREFIX]mysql_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `database` int(11) DEFAULT NULL,
  `connection` enum('LOCAL','GLOBAL') DEFAULT 'LOCAL',
  `name` varchar(255) DEFAULT NULL,
  `time_created` datetime DEFAULT NULL,
  `time_deleted` datetime DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;

SET FOREIGN_KEY_CHECKS=1;
