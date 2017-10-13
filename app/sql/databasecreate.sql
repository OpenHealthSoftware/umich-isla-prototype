-- SQLite3
PRAGMA foreign_keys=ON;

CREATE TABLE patient(
	patientId INTEGER NOT NULL, --MRN
	name VARCHAR(50),           --get rid of
	gender VARCHAR(15) NOT NULL,
	birthYear INTEGER NOT NULL,

	PRIMARY KEY(patientId)
);

CREATE TABLE visit(
	visitId INTEGER NOT NULL,
	date DATETIME NOT NULL,
	patientId INTEGER NOT NULL,

	PRIMARY KEY(visitId),
	FOREIGN KEY(patientId) REFERENCES patient(patientId) ON DELETE CASCADE
);

-- each row contains an imageId and patient for X visit
CREATE TABLE link_visitImages(
	imgId CHAR(32) NOT NULL,
	visitId INTEGER NOT NULL,
	patientId INTEGER NOT NULL,
	
	PRIMARY KEY(imgId),
	FOREIGN KEY(imgid) REFERENCES images(imgId) ON DELETE CASCADE,
	FOREIGN KEY(visitId) REFERENCES visit(visitId) ON DELETE CASCADE,
	FOREIGN KEY(patientId) REFERENCES patient(patientId) ON DELETE CASCADE
);

CREATE TABLE images(
	imgId CHAR(32) NOT NULL,
	format CHAR(3) NOT NULL,
	referenceName CHAR(250),
	side CHAR(5) NOT NULL,
	comments TEXT,
	type VARCHAR(7) NOT NULL,
	uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
	--captureTime INTEGER, --num seconds after injection the picture was taken
	PRIMARY KEY(imgId)
);

-- each row contains information about a grid for one image
CREATE TABLE grids(
	gridId CHAR(37) NOT NULL,
	xOffsetPerc DECIMAL(10,9) NOT NULL,
	yOffsetPerc DECIMAL(10,9) NOT NULL,
	imgId CHAR(32) NOT NULL,
	scaleRatio DECIMAL(10,9) NOT NULL,
	xDisc DECIMAL (10,9) NOT NULL,
	yDisc DECIMAL (10,9) NOT NULL,
	xFovea DECIMAL (10,9) NOT NULL,
	yFovea DECIMAL (10,9) NOT NULL,
	FOREIGN KEY(imgId) REFERENCES images(imgId) ON DELETE CASCADE
);


-- each row contains information to about grading for one image
CREATE TABLE grades(
	gradeId INTEGER,
	gradeFile CHAR(65) NOT NULL,
	userId CHAR(12) NOT NULL,
	imgId CHAR(32) NOT NULL,
	timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
	cellsGraded VARCHAR(8) NOT NULL,
	finishedGrading BOOLEAN NOT NULL,
	sessionId INT NOT NULL,
	PRIMARY KEY(gradeId),
	FOREIGN KEY(imgId) REFERENCES images(imgId) ON DELETE CASCADE
);



-- contains example images for grading associated features
CREATE TABLE optionExamples(
	optionExId INTEGER NOT NULL,
	type VARCHAR(50) NOT NULL,
	filename VARCHAR(54) NOT NULL,
	format CHAR(3) NOT NULL,

	PRIMARY KEY(optionExId),
	FOREIGN KEY(type) REFERENCES optionType(name)
);


-- defines what options are available
CREATE TABLE optionType(
	optionId INTEGER NOT NULL,
	name VARCHAR(30) NOT NULL UNIQUE,
	description TEXT,
	
	PRIMARY KEY(optionId)
);
