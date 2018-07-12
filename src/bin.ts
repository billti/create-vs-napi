﻿#!/usr/bin/env node

import path = require("path");
import fs = require("fs");
import program = require("commander");

import { Generator} from "./main";

const defaultOutDir = process.cwd();
const defaultName = path.basename(defaultOutDir);

program
    .version("0.0.1")
    .name("create-vs-napi")
    .option("-n, --addonName <addonName>", "The name for the add-in. " +
        "Should be a valid file name and C/C++ identifer. " +
        "Defaults to current directory name.", defaultName)
    .option("-o, --outDir <dir>", "The path to write the template to. " +
        "Defaults to current directory", defaultOutDir)
    .parse(process.argv);

if (!fs.existsSync(program["outDir"])) {
    console.error("'outDir' must already exist");
    process.exit(1);
}

if (!/^[_a-zA-Z][\w]*$/.test(program["addonName"])) {
    console.error("'addonName' should be a valid identifier, using only " +
        "alphanumeric and underscore characters")
    process.exit(1);
}

run();

async function run() {
    try {
        const instance = new Generator(program["addonName"], program["outDir"]);
        const result = await instance.generate();
        console.log("Finished");
    }
    catch (err) {
        console.log(`Failed with: ${err}`)
    }
}
