CREATE TABLE postofficeuser (user_id SERIAL PRIMARY KEY, username VARCHAR(40), password VARCHAR(40), postofficename VARCHAR(50));

CREATE TABLE paperprice (postoffice_id INT, papername VARCHAR(40), paperprice FLOAT);

CREATE TABLE deliveruser (user_id SERIAL PRIMARY KEY, postoffice_id INT, username VARCHAR(40), password VARCHAR(40));

CREATE TABLE district (postofficeuser_id INT, districtname VARCHAR(65));

CREATE TABLE papertodeliver (paper_id SERIAL PRIMARY KEY,postoffice_id INT, ordereruser_id INT, papername VARCHAR(40), location VARCHAR(75), houselocationlong FLOAT(20), houselocationlat FLOAT(20), deliver_id INT, cancelpaper BOOLEAN);

CREATE TABLE ordereruser (postoffice_id INT, username VARCHAR(40), password VARCHAR(40), location VARCHAR(75), houselocationlong FLOAT(20), houselocationlat FLOAT(20), id SERIAL PRIMARY KEY)

CREATE TABLE daystodeliver (paper_id INT, day VARCHAR(20));

CREATE TABLE dayspapercanbedelivered (postoffice_id INT, papername: VARCHAR(40), day: VARCHAR(20));
