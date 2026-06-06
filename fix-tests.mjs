import fs from "fs";
import path from "path";

const files = [
  "test/TranscriptRegistry.t.sol",
  "test/UniversityFactory.t.sol"
];

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, "utf8");
  
  // Replace 3-arg registerTranscript with 4-arg
  content = content.replace(/registerTranscript\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, "registerTranscript($1, $2, $3, student)");
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
