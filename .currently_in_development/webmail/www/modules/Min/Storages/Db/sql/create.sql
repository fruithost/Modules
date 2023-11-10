
CREATE TABLE IF NOT EXISTS `%PREFIX%min_hashes` (
  `hash_id` varchar(32) NOT NULL DEFAULT '',
  `user_id` BIGINT(64) NULL DEFAULT NULL,
  `hash` varchar(20) NOT NULL DEFAULT '',
  `data` text,
  KEY `%PREFIX%min_hash_index` (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
