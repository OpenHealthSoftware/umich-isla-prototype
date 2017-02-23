PRAGMA foreign_keys=ON;
BEGIN TRANSACTION;


INSERT INTO "images" VALUES('602ce16367953b1918b50f6de627a438','png','','right','','patient');
INSERT INTO "images" VALUES('b124154a1d5d0cac50b6ed7d2ec90bc0','png','','right','','patient');
INSERT INTO "images" VALUES('34639bf7cd5c8d9c2b6aab4c44972a86','png','','right','','patient');
INSERT INTO "images" VALUES('720ec3ed37139855d68c8a3ddd9ef6e9','png','','right','','patient');
INSERT INTO "images" VALUES('c23b63023c6af2ede13646890c34dfac','png','','right','','patient');
INSERT INTO "images" VALUES('1c35242fa249c70407374fdc168e51cc','PNG','','right','','normal');
INSERT INTO "images" VALUES('d29176c4a2046fb458c093e8ec08da98','PNG','','right','','normal');
INSERT INTO "images" VALUES('21587e40bc8dd429aefcabfed48de96c','PNG','','right','','normal');
INSERT INTO "images" VALUES('c1091a3d863f4278aa7c107e5d636cf9','PNG','','right','','normal');
INSERT INTO "images" VALUES('06250e5ae7e2896939d8d3394dedbf57','PNG','','right','','normal');
INSERT INTO "images" VALUES('b7cdcfb9f7cc4ca4525ced511867906b','PNG','','right','','patient');


INSERT INTO "grids" VALUES('grid_602ce16367953b1918b50f6de627a438.png',-1.92307692307692318367e-02,-6.51041666666666712925e-02,'602ce16367953b1918b50f6de627a438',1.2,0,0,0,0);
INSERT INTO "grids" VALUES('grid_b124154a1d5d0cac50b6ed7d2ec90bc0.png',-3.7179487179487179238e-02,-8.33333333333333287074e-02,'b124154a1d5d0cac50b6ed7d2ec90bc0',1.247435897435897445e+00,0,0,0,0);
INSERT INTO "grids" VALUES('grid_34639bf7cd5c8d9c2b6aab4c44972a86.png',4.94871794871794903891e-02,-5.53385416666666695578e-03,'34639bf7cd5c8d9c2b6aab4c44972a86',1.07410256410256410575e+00,0,0,0,0);
INSERT INTO "grids" VALUES('grid_720ec3ed37139855d68c8a3ddd9ef6e9.png',5.23076923076923050448e-02,0.0107421875,'720ec3ed37139855d68c8a3ddd9ef6e9',1.07410256410256410575e+00,0,0,0,0);
INSERT INTO "grids" VALUES('grid_c23b63023c6af2ede13646890c34dfac.png',6.61538461538461602939e-02,0.03125,'c23b63023c6af2ede13646890c34dfac',1.02923076923076917132e+00,0,0,0,0);
INSERT INTO "grids" VALUES('grid_1c35242fa249c70407374fdc168e51cc.PNG',6.51282051282051216434e-02,0.015625,'1c35242fa249c70407374fdc168e51cc',1.04589743589743600082e+00,0,0,0,0);
INSERT INTO "grids" VALUES('grid_d29176c4a2046fb458c093e8ec08da98.PNG',2.33333333333333343972e-02,-0.0546875,'d29176c4a2046fb458c093e8ec08da98',1.16923076923076929567e+00,0,0,0,0);
INSERT INTO "grids" VALUES('grid_21587e40bc8dd429aefcabfed48de96c.PNG',7.30769230769230809796e-02,1.79036458333333321768e-02,'21587e40bc8dd429aefcabfed48de96c',1.01256410256410256387e+00,0,0,0,0);
INSERT INTO "grids" VALUES('grid_c1091a3d863f4278aa7c107e5d636cf9.PNG',0.00641025641025641,-5.63151041666666643537e-02,'c1091a3d863f4278aa7c107e5d636cf9',1.17179487179487185066e+00,0,0,0,0);
INSERT INTO "grids" VALUES('grid_06250e5ae7e2896939d8d3394dedbf57.PNG',7.46153846153846111999e-02,0.046875,'06250e5ae7e2896939d8d3394dedbf57',1.01256410256410256387e+00,0,0,0,0);
INSERT INTO "grids" VALUES('grid_b7cdcfb9f7cc4ca4525ced511867906b.PNG',5.64102564102564110748e-02,-0.0078125,'b7cdcfb9f7cc4ca4525ced511867906b',1.06,0,0,0,0);


INSERT INTO "grades" VALUES(1,'2017-01-03_chrisnolan_b7cdcfb9f7cc4ca4525ced511867906b_1.json','chrisnolan','b7cdcfb9f7cc4ca4525ced511867906b','2017-01-03 22:02:30','31/240','false',1);
INSERT INTO "grades" VALUES(2,'2017-01-03_chrisnolan_c23b63023c6af2ede13646890c34dfac_1.json','chrisnolan','c23b63023c6af2ede13646890c34dfac','2017-01-03 22:04:00','10/240','false',1);
INSERT INTO "grades" VALUES(3,'2017-01-03_mavcook_c23b63023c6af2ede13646890c34dfac_1.json','mavcook','c23b63023c6af2ede13646890c34dfac','2017-01-03 22:05:40','5/240','false',1);
INSERT INTO "grades" VALUES(4,'2017-01-03_chrisnolan_b7cdcfb9f7cc4ca4525ced511867906b_2.json','chrisnolan','b7cdcfb9f7cc4ca4525ced511867906b','2017-01-03 22:10:25','3/240','false',2);
INSERT INTO "grades" VALUES(5,'2017-01-03_chrisnolan_b7cdcfb9f7cc4ca4525ced511867906b_3.json','chrisnolan','b7cdcfb9f7cc4ca4525ced511867906b','2017-01-03 22:10:26','4/240','false',3);
INSERT INTO "grades" VALUES(6,'2017-01-03_chrisnolan_c23b63023c6af2ede13646890c34dfac_2.json','chrisnolan','c23b63023c6af2ede13646890c34dfac','2017-01-03 22:12:21','9/240','false',2);
INSERT INTO "grades" VALUES(7,'2017-01-09_timburton_c23b63023c6af2ede13646890c34dfac_1.json','timburton','c23b63023c6af2ede13646890c34dfac','2017-01-10 01:01:14','2/240','false',1);


INSERT INTO "optionType" (name, description) VALUES
('Capillary loss', 'asdf asdf asd wefwef adsfasdf wef'),
('Capillary dilatation', 'asdfaosdfp wef-wo9fw masvier 0as9rfj2k  pasdon0r ad0v jrkfpa'),
('IRMA', 'asdfaosdfp wef-wo9fw masvier 0as9rfj2k  pasdon0r ad0v jrkfpa'),
('Narrowing/pruning', 'asdfaosdfp wef-wo9fw masvier 0as9rfj2k  pasdon0r ad0v jrkfpa'),
('Arteriolar staining', 'asdfaosdfp wef-wo9fw masvier 0as9rfj2k  pasdon0r ad0v jrkfpa'),
('Arteriolar contour', 'asdfaosdfp wef-wo9fw masvier 0as9rfj2k  pasdon0r ad0v jrkfpa'),
('Leakage', 'asdfaosdfp wef-wo9fw masvier 0as9rfj2k  pasdon0r ad0v jrkfpa'),
('New vessel', 'asdfaosdfp wef-wo9fw masvier 0as9rfj2k  pasdon0r ad0v jrkfpa'),
('Artifact', 'asdfaosdfp wef-wo9fw masvier 0as9rfj2k  pasdon0r ad0v jrkfpa'),
('Not sure', 'asdfaosdfp wef-wo9fw masvier 0as9rfj2k  pasdon0r ad0v jrkfpa');

INSERT INTO "optionExamples" (type, filename, format) VALUES
('Capillary loss', 'ex1', 'png'),
('Capillary loss', 'ex2', 'png'),
('Capillary loss', 'ex3', 'png'),
('Capillary loss', 'ex4', 'png'),
('Capillary dilatation', 'ex5', 'png'),
('IRMA', 'ex6', 'png'),
('IRMA', 'ex7', 'png'),
('Narrowing/pruning', 'ex8', 'png'),
('Arteriolar staining', 'ex9', 'png'),
('Arteriolar contour', 'ex10', 'png'),
('Leakage', 'ex11', 'png'),
('New vessel', 'ex12', 'png'),
('Artifact', 'ex13', 'png'),
('Not sure', 'ex14', 'png');




COMMIT;
