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
docker build -t poxstone/k8_serv_js:vp.0.0.1b ./;

# run ---net required for external connection
docker run --rm -it --name k8_serv_js --net host -p 3000:3000 \
-e APP_PORT=3000 \
-e DB_HOST='127.0.0.1' \
-e DB_USER='my_db_user' \
-e DB_PASS='my_db_secret' \
-e DB_SCHE='items' \
-e REDIS_HOST='localhost' \
poxstone/k8_serv_js:vp.0.0.1b;
```

##. Run redis
```bash
# run container
docker run --rm -it --name my_redis_db --net host -p 6379:6379 redis:5.0.3-alpine;

# connect to container
docker exec -it my_db_host sh;

# paste next script to populate;
```

##. Run mysql and populate
```bash
# run container
docker run --rm -it --name my_db_host -p 3306:3306 \
-e MYSQL_USER=my_db_user \
-e MYSQL_PASSWORD=my_db_secret \
-e MYSQL_DATABASE=items \
-e MYSQL_ROOT_PASSWORD=my_db_secret \
-v ../mysql-db:/var/lib/mysql \
mysql:5.7;

# connect to container
docker exec -it my_db_host sh;

# paste next script to populate;
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