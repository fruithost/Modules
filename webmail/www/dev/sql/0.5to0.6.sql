USE `YOU_DB_NAME`; #set you db name
SET @prefix = 'YOU_PREFIX'; #set you DBPrefix

SET @sql1 = CONCAT("UPDATE ", @prefix, "eav_entities SET entity_type='Aurora\\\\Modules\\\\StandardAuth\\\\Classes\\\\Account' WHERE entity_type='CAccount'");
SET @sql2 = CONCAT("UPDATE ", @prefix, "eav_entities SET entity_type='Aurora\\\\Modules\\\\Mail\\\\Classes\\\\Account' WHERE entity_type='CMailAccount'");
SET @sql3 = CONCAT("UPDATE ", @prefix, "eav_entities SET entity_type='Aurora\\\\Modules\\\\OAuthIntegratorWebclient\\\\Classes\\\\Account' WHERE entity_type='COAuthAccount'");
SET @sql4 = CONCAT("UPDATE ", @prefix, "eav_entities SET entity_type='Aurora\\\\Modules\\\\Core\\\\Classes\\\\Channel' WHERE entity_type='CChannel'");
SET @sql5 = CONCAT("UPDATE ", @prefix, "eav_entities SET entity_type='Aurora\\\\Modules\\\\Contacts\\\\Classes\\\\Contact' WHERE entity_type='CContact'");
SET @sql6 = CONCAT("UPDATE ", @prefix, "eav_entities SET entity_type='Aurora\\\\Modules\\\\AfterlogicDownloadsWebclient\\\\Classes\\\\DownloadItem' WHERE entity_type='CDownloadItem'");
SET @sql7 = CONCAT("UPDATE ", @prefix, "eav_entities SET entity_type='Aurora\\\\Modules\\\\Contacts\\\\Classes\\\\Group' WHERE entity_type='CGroup'");
SET @sql8 = CONCAT("UPDATE ", @prefix, "eav_entities SET entity_type='Aurora\\\\Modules\\\\SimpleChat\\\\Classes\\\\Post' WHERE entity_type='CSimpleChatPost'");
SET @sql9 = CONCAT("UPDATE ", @prefix, "eav_entities SET entity_type='Aurora\\\\Modules\\\\Mail\\\\Classes\\\\Server' WHERE entity_type='CMailServer'");
SET @sql10 = CONCAT("UPDATE ", @prefix, "eav_entities SET entity_type='Aurora\\\\Modules\\\\Core\\\\Classes\\\\Tenant' WHERE entity_type='CTenant'");
SET @sql11 = CONCAT("UPDATE ", @prefix, "eav_entities SET entity_type='Aurora\\\\Modules\\\\Core\\\\Classes\\\\User' WHERE entity_type='CUser'");
SET @sql12 = CONCAT("UPDATE ", @prefix, "eav_entities SET entity_type='Aurora\\\\Modules\\\\Contacts\\\\Classes\\\\GroupContact' WHERE entity_type='CGroupContact'");
SET @sql13 = CONCAT("UPDATE ", @prefix, "eav_entities SET entity_type='Aurora\\\\Modules\\\\Mail\\\\Classes\\\\GroupContact' WHERE entity_type='SystemFolder'");

PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

PREPARE stmt5 FROM @sql5;
EXECUTE stmt5;
DEALLOCATE PREPARE stmt5;

PREPARE stmt6 FROM @sql6;
EXECUTE stmt6;
DEALLOCATE PREPARE stmt6;

PREPARE stmt7 FROM @sql7;
EXECUTE stmt7;
DEALLOCATE PREPARE stmt7;

PREPARE stmt8 FROM @sql8;
EXECUTE stmt8;
DEALLOCATE PREPARE stmt8;

PREPARE stmt9 FROM @sql9;
EXECUTE stmt9;
DEALLOCATE PREPARE stmt9;

PREPARE stmt10 FROM @sql10;
EXECUTE stmt10;
DEALLOCATE PREPARE stmt10;

PREPARE stmt11 FROM @sql11;
EXECUTE stmt11;
DEALLOCATE PREPARE stmt11;

PREPARE stmt12 FROM @sql12;
EXECUTE stmt12;
DEALLOCATE PREPARE stmt12;

PREPARE stmt13 FROM @sql13;
EXECUTE stmt13;
DEALLOCATE PREPARE stmt13;