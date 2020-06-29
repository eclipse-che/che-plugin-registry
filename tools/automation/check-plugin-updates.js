/********************************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 ********************************************************************************/


const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');
const execSync = require('child_process').execSync;
const moment = require('moment');

/**
 * Removes the '/tmp/repository' folder
 */
function cleanUpTempRepo() {
  try {
    fs.removeSync('/tmp/repository');
  } catch (err) {
    console.log("Failed to clean up repository");
  }
}

/**
 * @param {string | number | Buffer | import("url").URL} pathToPackageJSON
 * @return {object} Parsed package.json file.
 */
function readPackageJSON(pathToPackageJSON) {
  try {
    var rawData = fs.readFileSync(pathToPackageJSON, 'utf-8');
    return JSON.parse(rawData);
  } catch (err) {
    console.log("Error parsing package.json");
  }
}

// Report title, description, and table column headers
var report = "# Automated Plugin Report\n";
var reportTime = moment.utc().format('YYYY-MM-DD HH:mm:ss');
report += `### Report accurate as of: ${reportTime} UTC\n`;
report += "| Plugin Name | Repository | Registry Version | Upstream Version |\n";
report += "| ------ | ------ | ------ | ------ |\n";

// Read extension list and iterate over each one
const { extensions } = readPackageJSON('./../../vscode-extensions.json');
for (const extension of extensions) {
  var upstreamVersion;
  var upstreamName;
  var registryVersion = extension.version;
  
  // Clone the repo to the /tmp/repository location
  try {
    execSync(`git clone ${extension.repository} /tmp/repository`, {stdio : 'pipe'});
  } catch (err) {
    console.log(`Failed to clone repository " ${extension.repository}`);
    continue;
  }

  // Parse package.json file and extract version information
  var packageJSONPath;
  if (extension.vsixDir) {
    packageJSONPath = path.join('/tmp/repository', extension.vsixDir, 'package.json');
  } else {
    packageJSONPath = path.join('/tmp/repository', 'package.json');
  }
  let packageJSON = readPackageJSON(packageJSONPath);
  upstreamVersion = packageJSON.version;
  upstreamName = packageJSON.name;

  // Compare versions, publish table row with extension information
  try {
    let needsUpdating = semver.gt(upstreamVersion, registryVersion);
    if (needsUpdating) {
      report += `| ${upstreamName} | [${extension.repository}](${extension.repository}) | ${extension.version} | **${upstreamVersion}** |\n`;
    } else {
      report += `| ${upstreamName} | [${extension.repository}](${extension.repository}) | ${extension.version} | ${upstreamVersion} |\n`;
    }
  } catch(err) {
    console.log(`Error comparing versions ${registryVersion} and ${upstreamVersion} for ${upstreamName}`);
    cleanUpTempRepo();
    continue;
  }

  // Clean up repository folder
  cleanUpTempRepo();
}

// Write the file
try {
  fs.writeFileSync('./../../index.md', report);
} catch(err) {
  console.log(`Error writing report file ${err.stderr}`);
}
