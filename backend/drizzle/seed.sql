# Kwame Nkrumah University of Science and Technology (KNUST) Transcript Registry Data Seed
INSERT INTO universities (university_id, name, contract_addr, registrar, deployed_at, is_active, tx_hash, block_number)
VALUES (0, 'Kwame Nkrumah University of Science and Technology', '0x9e0a1bd17c0f0190FB64dABe8cB54E871D3712D3', '0x6912bC40f1446Dd8A2201F797f2c09dca3CeB88c', NOW(), true, '0x0000000000000000000000000000000000000000000000000000000000000000', 6200000)
ON CONFLICT (university_id) DO UPDATE 
SET contract_addr = EXCLUDED.contract_addr, registrar = EXCLUDED.registrar;

# University of Ghana (UG) Transcript Registry Data Seed
INSERT INTO universities (university_id, name, contract_addr, registrar, deployed_at, is_active, tx_hash, block_number)
VALUES (1, 'University of Ghana', '0xD207B844f595AF7A6b43191633D8bF11C9bB8316', '0x96353bB2369Ad3946Bc3E97434F916F451899762', NOW(), true, '0x0000000000000000000000000000000000000000000000000000000000000000', 6200000)
ON CONFLICT (university_id) DO UPDATE 
SET contract_addr = EXCLUDED.contract_addr, registrar = EXCLUDED.registrar;

# University of Cape Coast (UCC) Transcript Registry Data Seed
INSERT INTO universities (university_id, name, contract_addr, registrar, deployed_at, is_active, tx_hash, block_number)
VALUES (2, 'University of Cape Coast', '0x049e478B03eb3a2f8B83C0e58895488b51EE971C', '0xd673A8bEBDe8cCF133078eDf7B44005cC4f1DdcD', NOW(), true, '0x0000000000000000000000000000000000000000000000000000000000000000', 6200000)
ON CONFLICT (university_id) DO UPDATE 
SET contract_addr = EXCLUDED.contract_addr, registrar = EXCLUDED.registrar;
