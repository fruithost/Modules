SET @prefix = 'YOU_PREFIX'; #set you DBPrefix

SET @sql2 = CONCAT("CREATE TABLE IF NOT EXISTS ", @prefix, "eav_attributes_bigint (
 `id`        BIGINT(64) UNSIGNED NOT NULL AUTO_INCREMENT,
 `id_entity` BIGINT(64) UNSIGNED          DEFAULT NULL,
 `name`      VARCHAR(255)                 DEFAULT NULL,
 `value`     BIGINT(64),
 PRIMARY KEY (`id`),
 UNIQUE KEY `idx_unique` (`id_entity`, `name`),
 KEY `fk_id_entity_idx` (`id_entity`),
 CONSTRAINT ", @prefix, "fk_eav_attributes_bigint_id_entity FOREIGN KEY (`id_entity`) REFERENCES ", @prefix, "eav_entities (`id`)
  ON DELETE CASCADE
  ON UPDATE NO ACTION
 )
   ENGINE = InnoDB
   AUTO_INCREMENT = 1
   DEFAULT CHARSET = utf8;");

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;