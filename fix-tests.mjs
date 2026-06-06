import fs from "fs";
import path from "path";

const files = [
  "test/TranscriptRegistry.t.sol",
  "test/UniversityFactory.t.sol"
];

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, "utf8");
  
  content = content.replaceAll("registry.registerTranscript(studentHash, metadataCID, bytes32(0))", "registry.registerTranscript(studentHash, metadataCID, bytes32(0), student)");
  content = content.replaceAll("registry.registerTranscript(studentHash, metadataCID, fileHash)", "registry.registerTranscript(studentHash, metadataCID, fileHash, student)");
  content = content.replaceAll("registry.registerTranscript(studentHash, \"QmDifferentCID\", keccak256(\"different_content\"))", "registry.registerTranscript(studentHash, \"QmDifferentCID\", keccak256(\"different_content\"), student)");
  content = content.replaceAll("registry.registerTranscript(studentHash, \"QmDifferent\", keccak256(\"different\"))", "registry.registerTranscript(studentHash, \"QmDifferent\", keccak256(\"different\"), student)");
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}

const deployFile = path.join(process.cwd(), "script/Deploy.s.sol");
if (fs.existsSync(deployFile)) {
  let deployContent = fs.readFileSync(deployFile, "utf8");
  deployContent = deployContent.replace(
    /registry\.registerTranscript\(\s*studentHash,\s*metadataCID,\s*fileHash\s*\)/g,
    "registry.registerTranscript(studentHash, metadataCID, fileHash, address(0x3333333333333333333333333333333333333333))"
  );
  fs.writeFileSync(deployFile, deployContent);
  console.log("Updated script/Deploy.s.sol");
}
