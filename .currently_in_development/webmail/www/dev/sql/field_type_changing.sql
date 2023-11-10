#Transferring a field in EAV after changing it's type.
#TABLE_TO - destination table
#	youprefix_eav_attributes_bool - if field type changes on bool
#	datetime, int, string, text - respectively
#TABLE_FROM - source table
#FIELD_NAME - name of EAV-field that type was changed
#
#Example:
#INSERT INTO au_eav_attributes_string (`id_entity`, `name`, `value`)
#SELECT id_entity, name, value FROM au_eav_attributes_int WHERE `name` = 'Sales::ShareItProductId';
#DELETE FROM au_eav_attributes_int WHERE `name` = 'Sales::ShareItProductId';


INSERT INTO TABLE_TO (`id_entity`, `name`, `value`)
SELECT id_entity, name, value FROM TABLE_FROM WHERE `name` = 'FIELD_NAME';
DELETE FROM TABLE_FROM WHERE `name` = 'FIELD_NAME';