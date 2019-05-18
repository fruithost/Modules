DROP TABLE IF EXISTS `[DATABASE_PREFIX]cronjobs`;

CREATE TABLE `[DATABASE_PREFIX]cronjobs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `task_minute` varchar(255) DEFAULT NULL,
  `task_hour` varchar(255) DEFAULT NULL,
  `task_day` varchar(255) DEFAULT NULL,
  `task_month` varchar(255) DEFAULT NULL,
  `task_weekday` varchar(255) DEFAULT NULL,
  `command_type` enum('URL','PHP') DEFAULT NULL,
  `command_value` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `time_created` datetime DEFAULT NULL,
  `time_running` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;

SET FOREIGN_KEY_CHECKS=1;