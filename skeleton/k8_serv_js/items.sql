CREATE DATABASE `items`;

USE `items`;

CREATE TABLE `items`.`books` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `cant` INT NULL,
  PRIMARY KEY (`id`));

INSERT INTO `items`.`books` (`name`,`cant`) VALUES ("book 1", 12);
INSERT INTO `items`.`books` (`name`,`cant`) VALUES ("book 2", 18);
INSERT INTO `items`.`books` (`name`,`cant`) VALUES ("book 3", 1);
INSERT INTO `items`.`books` (`name`,`cant`) VALUES ("book 4", 3);
INSERT INTO `items`.`books` (`name`,`cant`) VALUES ("book 5", 25);

SELECT * FROM `items`.`books`;