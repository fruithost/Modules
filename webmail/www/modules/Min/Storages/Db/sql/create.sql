
CREATE TABLE IF NOT EXISTS `%PREFIX%min_hashes` (
  `hash_id` varchar(32) NOT NULL DEFAULT '',
  `hash` varchar(20) NOT NULL DEFAULT '',
  `data` text,
  KEY `%PREFIX%min_hash_index` (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
