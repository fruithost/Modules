ALTER TABLE `eav_entities` ADD COLUMN `uuid` CHAR(35) NOT NULL AFTER `id`;
ALTER TABLE `eav_entities` ADD COLUMN `parent_uuid` CHAR(35) NOT NULL AFTER `uuid`;