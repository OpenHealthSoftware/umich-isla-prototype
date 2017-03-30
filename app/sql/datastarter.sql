PRAGMA foreign_keys=ON;
BEGIN TRANSACTION;

INSERT INTO "images" VALUES('602ce16367953b1918b50f6de627a438','png','','right','','patient');
INSERT INTO "images" VALUES('d3e4031ed0db569da777eed7f5871bf2','png','','right','','patient');
INSERT INTO "images" VALUES('80294a447861296e3de8d4ecc9293ae8','png','','right','','patient');

INSERT INTO "grids" VALUES('grid_602ce16367953b1918b50f6de627a438.png',-3.57435897435897431684e-01,-6.52994791666666629659e-01,'602ce16367953b1918b50f6de627a438',4.01756311745334837581e+00,2266,1656,1839,1719);
INSERT INTO "grids" VALUES('grid_d3e4031ed0db569da777eed7f5871bf2.png',-2.96153846153846156408e-01,-5.88541666666666629659e-01,'d3e4031ed0db569da777eed7f5871bf2',3.80076838638858394148e+00,2307,1656,1903,1697);
INSERT INTO "grids" VALUES('grid_80294a447861296e3de8d4ecc9293ae8.png',-2.93333333333333334813e-01,-0.5791015625,'80294a447861296e3de8d4ecc9293ae8',3.66904500548847423146e+00,2198,1565,1808,1701);

INSERT INTO "optionType" (name, description) VALUES
('Capillary loss', 'Patches of absent capillary net. Should be in sharp contrast to nearby clearly visible capillary nets.'),
('Capillary dilatation', 'Broadening of the vessel caliber.'),
('IRMA', 'Abnormally branched vessels which appear as shunts for poorly perfused areas.'),
('Narrowing/pruning', 'Decreased vessel caliber with short/terminal perpendicular side branches.'),
('Arteriolar staining', 'Increased permeability of vessel wall visible when the arteriolar segment appears more hyperflorescent than adjacent segments. Margins remain distinct.'),
('Arteriolar contour', 'Blurring of the vessel wall contour (i.e. margins are not sharp).'),
('Leakage', 'Abnormal pooling of dye from abnormal blood vessels. Seen as gradual enlargement and blurring of vessel margins.'),
('New vessel', 'Perfuse haze of intense hyperflorescent leakage in late-phase.'),
('Artifact', 'Photographic artifact i.e. lashes.'),
('Not sure', '');

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
