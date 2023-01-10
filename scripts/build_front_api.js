const path = require("path");
const fse = require("fs-extra");
const fs = require("fs");

const srcAPI = path.join(__dirname, "api");
const destAPI = path.join(__dirname, "..", "frontend", "src", "api");

const srcTypes = path.join(__dirname, "..", "typechain");
const destTypes = path.join(__dirname, "..", "frontend", "src", "typechain");

// To copy a folder or file, select overwrite accordingly
try {
  fse.copySync(srcAPI, destAPI, { overwrite: true });
  fse.copySync(srcTypes, destTypes, { overwrite: true });

  // Loop through all the files in the temp directory
  const files = fs.readdirSync(destAPI);

  files.forEach(function (file, index) {
    const data = fs.readFileSync(path.join(destAPI, file), "utf-8");

    const fixEthers = data.replace(
      `import { ethers } from "hardhat"`,
      `import { ethers } from "ethers"`
    );

    const fixTypeChain = fixEthers.replace(
      `"../../typechain"`,
      `"../typechain"`
    );

    const fixEsLint = fixTypeChain
      .replace(`// eslint-disable-next-line node/no-unpublished-import`, "")
      .replace(`/* eslint-disable no-unused-vars */`, "");

    fs.writeFileSync(path.join(destAPI, file), fixEsLint, "utf-8");
  });
  console.log("Successfuly build front-end API");
} catch (err) {
  console.error(err);
}
