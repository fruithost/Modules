SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `[DATABASE_PREFIX]protected_users`;

CREATE TABLE `[DATABASE_PREFIX]protected_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `directory` int(11) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `time_created` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;

SET FOREIGN_KEY_CHECKS=1;
