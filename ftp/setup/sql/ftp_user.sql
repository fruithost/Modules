DROP TABLE IF EXISTS `[DATABASE_PREFIX]ftp_user`;

CREATE TABLE `[DATABASE_PREFIX]ftp_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `path` varchar(255) DEFAULT NULL,
  `time_login` datetime DEFAULT NULL,
  `time_modified` datetime DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `time_created` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;