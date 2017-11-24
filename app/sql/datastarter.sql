PRAGMA foreign_keys=ON;
BEGIN TRANSACTION;

-- INSERT INTO "images" VALUES('39e59d2a-c123-4892-873e-d9df477d1c04','png','First upload','right','','patient','2017-10-13 11:05:56');
-- INSERT INTO "images" VALUES('973bb5c3-c5bd-4a51-b033-1ec985f47ed6','png','second patient img','left','idk man','patient','2017-10-13 11:06:57');
-- INSERT INTO "images" VALUES('fd8bd45e-a1ce-4b45-9a75-5d9c04911471','png','3rd patient upload','right','mhm','patient','2017-10-13 11:08:59');
-- INSERT INTO "images" VALUES('457f0670-788d-4436-808b-7e011d9b8ae2','PNG','first normal','right','','normal','2017-10-13 11:10:09');

-- INSERT INTO "grids" VALUES('grid_39e59d2a-c123-4892-873e-d9df477d1c04.png',0.2,0.044921875,'39e59d2a-c123-4892-873e-d9df477d1c04',7.4551345962113657606e-01,2275,1633,1926,1688);
-- INSERT INTO "grids" VALUES('grid_973bb5c3-c5bd-4a51-b033-1ec985f47ed6.png',-8.92307692307692246203e-02,-7.38932291666666712925e-02,'973bb5c3-c5bd-4a51-b033-1ec985f47ed6',9.22731804586241266541e-01,1503,1624,1935,1660);
-- INSERT INTO "grids" VALUES('grid_fd8bd45e-a1ce-4b45-9a75-5d9c04911471.png',2.47692307692307683852e-01,7.45442708333333287074e-02,'fd8bd45e-a1ce-4b45-9a75-5d9c04911471',7.4551345962113657606e-01,2461,1724,2112,1810);
-- INSERT INTO "grids" VALUES('grid_457f0670-788d-4436-808b-7e011d9b8ae2.PNG',0.18,3.87369791666666643537e-02,'457f0670-788d-4436-808b-7e011d9b8ae2',7.77666999002991077283e-01,2262,1679,1898,1715);

INSERT INTO "optionType" (name, description) VALUES
('Capillary loss', 'Patches of absent capillary net. Should be in sharp contrast to nearby clearly visible capillary nets.'),
('Capillary dilatation', 'Broadening of the vessel caliber.'),
('IRMA', 'Abnormally branched vessels which appear as shunts for poorly perfused areas.'),
('Narrowing', 'Decreased vessel caliber with short.'),
('Pruning', 'Terminal perpendicular side branches.'),
('Arteriolar staining', 'Increased permeability of vessel wall visible when the arteriolar segment appears more hyperflorescent than adjacent segments. Margins remain distinct.'),
('Arteriolar contour', 'Blurring of the vessel wall contour (i.e. margins are not sharp).'),
('Leakage', 'Abnormal pooling of dye from abnormal blood vessels. Seen as gradual enlargement and blurring of vessel margins.'),
('New vessel', 'Perfuse haze of intense hyperflorescent leakage in late-phase.'),
('Artifact', 'Photographic artifact i.e. lashes.'),
('Not sure', '');

INSERT INTO "optionExamples" (type, filename, format) VALUES
('Arteriolar staining', 'arstain_1', 'png'),
('Arteriolar staining', 'arstain_2', 'png'),
('Arteriolar staining', 'arstain_3', 'png'),
('Arteriolar staining', 'arstain_4', 'png'),
('Arteriolar staining', 'arstain_5', 'png'),
('Capillary loss', 'cl_1', 'png'),
('Capillary loss', 'cl_2', 'png'),
('Capillary loss', 'cl_3', 'png'),
('Capillary loss', 'cl_4', 'png'),
('Capillary loss', 'cl_5', 'png'),
('Capillary loss', 'cl_6', 'png'),
('Capillary loss', 'cl_7', 'png'),
('IRMA', 'irma_1', 'png'),
('IRMA', 'irma_2', 'png'),
('IRMA', 'irma_3', 'png'),
('IRMA', 'irma_4', 'png'),
('IRMA', 'irma_5', 'png'),
('Leakage', 'leak_1', 'png'),
('Leakage', 'leak_2', 'png'),
('Leakage', 'leak_3', 'png'),
('New vessel', 'newv_1', 'png'),
('New vessel', 'newv_2', 'png'),
('New vessel', 'newv_3', 'png'),
('New vessel', 'newv_4', 'png'),
('Pruning', 'p_1', 'png'),
('Pruning', 'p_2', 'png'),
('Pruning', 'p_3', 'png'),
('Pruning', 'p_4', 'png');


COMMIT;
