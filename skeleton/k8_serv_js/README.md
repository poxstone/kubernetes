# k8_serv_js

## 1. Local Install - start
```bash
# install dependencies
npm install;

# run app port 3000
npm start;
```

## 2. Run Build/Docker
```bash
# build
docker build -t poxstone/k8_serv_js:v0.0.01 ./;

# run ---net required for external connection
docker run --rm -it --name k8_serv_js --net host -p 3000:3000 \
-e APP_PORT=3000 \
-e DB_HOST='my_db_host' \
-e DB_USER='my_db_user' \
-e DB_PASS='my_db_secret' \
-e DB_SCHE='items' \
poxstone/k8_serv_js:v0.0.01;
```

## Populate DB
```sql
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

```