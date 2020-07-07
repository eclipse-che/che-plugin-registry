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
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const moment = require('moment');

// Report title, description, and table column headers
var report = "# Automated Plugin Report\n";
var reportTime = moment.utc().format('YYYY-MM-DD HH:mm:ss');
report += `### Report accurate as of: ${reportTime} UTC\n`;
report += "| Plugin Name | Repository | Registry Version | Upstream Version |\n";
report += "| ------ | ------ | ------ | ------ |\n";

(async () => {
  // Type declaration for extensions
  /** @type {{ extensions: { repository: string, revision: string, directory?: string }[] }} */
  const { extensions } = JSON.parse(await fs.readFile('./../../vscode-extensions.json', 'utf-8'));
  
  for (const extension of extensions) {
    var upstreamVersion;
    var upstreamName;
    var registryVersion;
    
    // Clone repo with default branch to check current version
    try {
      await exec(`git clone ${extension.repository} /tmp/repository`, {stdio : 'pipe'});
    } catch (err) {
      console.log(`Error cloning ${extension.repository} ${err}`)
      continue;
    }

    // Parse package.json file and extract current version information
    var packageJSONPath;
    if (extension.directory) {
      packageJSONPath = path.join('/tmp/repository', extension.directory, 'package.json');
    } else {
      packageJSONPath = path.join('/tmp/repository', 'package.json');
    }
    let packageJSON = JSON.parse(await fs.readFile(packageJSONPath, 'utf-8'));
    upstreamVersion = packageJSON.version;
    upstreamName = packageJSON.name;

    // Checkout git repo @ 'revision' field specified, to get the version in the registry
    try {
      await exec(`git checkout ${extension.revision}`, { cwd: '/tmp/repository' })
    } catch (err) {
      console.log(`Failure checking out extension.revision for ${extension.repository}`);
      await exec('rm -rf /tmp/repository');
      continue;
    }
    packageJSON = JSON.parse(await fs.readFile(packageJSONPath, 'utf-8'));
    registryVersion = packageJSON.version;

    // Compare versions, publish table row with extension information
    try {
      let needsUpdating = semver.gt(upstreamVersion, registryVersion);
      if (needsUpdating) {
        report += `| ${upstreamName} | [${extension.repository}](${extension.repository}) | ${registryVersion} | **${upstreamVersion}** |\n`;
      } else {
        report += `| ${upstreamName} | [${extension.repository}](${extension.repository}) | ${registryVersion} | ${upstreamVersion} |\n`;
      }
    } catch(err) {
      console.log(`Error comparing versions ${registryVersion} and ${upstreamVersion} for ${upstreamName}`);
      await exec('rm -rf /tmp/repository');
      continue;
    }
    await exec('rm -rf /tmp/repository');
  }

  // Write the report file
  try {
    await fs.writeFile('./index.md', report);
  } catch (err) {
    console.log(`Failed to write the report file (index.md)`);
  }
})();