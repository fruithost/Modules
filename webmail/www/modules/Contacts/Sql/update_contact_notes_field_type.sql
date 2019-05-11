INSERT INTO `%PREFIX%eav_attributes_text` (`id_entity`, `name`, `value`)
SELECT id_entity, name, value FROM au_eav_attributes_string as attrs 
	INNER JOIN au_eav_entities as ents ON ents.id = attrs.id_entity AND ents.entity_type = 'Aurora\\Modules\\Contacts\\Classes\\Contact'
WHERE `name` = 'Notes';

DELETE attrs FROM `%PREFIX%eav_attributes_string` as attrs 
	INNER JOIN au_eav_entities as ents ON ents.id = attrs.id_entity AND ents.entity_type = 'Aurora\\Modules\\Contacts\\Classes\\Contact'
WHERE `name` = 'Notes';