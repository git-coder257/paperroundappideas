CREATE TABLE postofficeuser (
    user_id: SERIAL PRIMARY KEY,
    username: VARCHAR(40),
    password: VARCHAR(40),
    postofficename: VARCHAR(50)
)

CREATE TABLE paperprice (
    postoffice_id: INT,
    papername: VARCHAR(40),
    paperprice: FLOAT,
)

CREATE TABLE deliveruser (
    user_id: SERIAL PRIMARY KEY,
    postoffice_id: INT,
    username: VARCHAR(40),
    password: VARCHAR(40)
)

CREATE TABLE papertodeliver (
    papername: VARCHAR(40),
    houselocationlong: FLOAT,
    houselocationlat: FLOAT
)

CREATE TABLE ordereruser (
    postoffice_id: INT, 
    username: VARCHAR(40),
    password: VARCHAR(40),
    location: VARCHAR(75),
    houselocationlong: FLOAT,
    houselocationlat: FLOAT
)
