ALTER TABLE coaches
MODIFY class_type ENUM('SL','3A','2A','1A','CC','EC') NOT NULL;

ALTER TABLE fares
MODIFY class_type ENUM('SL','3A','2A','1A','CC','EC') NOT NULL;

ALTER TABLE seats
MODIFY berth_type ENUM('LB','MB','UB','SL','SU','WS','MS','AS') NOT NULL;