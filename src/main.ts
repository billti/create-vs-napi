﻿import fs = require("fs");
import path = require("path");
import util = require("util");
import stream = require("stream");

import tar = require("tar");
import mkdirp = require("mkdirp");
import uuid = require("uuid/v4");
// uuid() => string of the format: "4ec6f100-dc76-4e60-b43b-1a55eb9d8262"
// to get the ProjectGuid: `{${uuid.toUpperCase()}}`

import fetch from "node-fetch";

const pipeline = util.promisify(stream.pipeline);
const mkdir = util.promisify(mkdirp);

export class Generator {
    // TODO: Update definitelyTyped with the "process.release" declaration
    releases: { [url: string]: string } = (process as any).release;

    headersUrl = this.releases.headersUrl;
    libUrl = this.releases.libUrl;
    arch = process.arch; // => "x64" || "ia32" on Windows
    libDir: string;
    libFile: string;

    constructor(private addinName: string, private outDir: string) {
        const majorNodeVersion = parseInt(process.versions.node.split(".")[0]);
        if (majorNodeVersion < 10) {
            throw Error("Node 10 or later required");
        }

        if (!/^(x64|ia32)$/.test(this.arch)) {
            throw Error(`Architecture of ${this.arch} is not supported`);
        }

        if (process.platform != "win32") {
            throw Error("This utility only runs on Windows");
        }

        if (!this.libUrl || !this.headersUrl) {
            throw Error("The libUrl or headersUrl are not specificed for this Node.js release");
        }
        this.libDir = path.join(this.outDir, "lib", "node", this.arch);
        this.libFile = path.basename(this.libUrl);
    }

    async generate() {
        const headerPromise = fetch(this.headersUrl)
            // Headers files are contained in "node-v10.0.0\include\node". Remove the top level.
            .then(resp => pipeline(resp.body, tar.x({ C: this.outDir, strip: 1 })))
            .then(
                ok => {
                    console.log(`Headers downloaded from ${this.headersUrl} to ${
                        path.join(this.outDir, "include", "node")}`)
                },
                err => {
                    console.log(`Headers download from ${this.headersUrl} failed with: ${err}`);
                    throw err;
                }
            );

        const libPath = path.join(this.libDir, this.libFile);

        const libPromise = mkdir(this.libDir)
            .then(ok => fetch(this.libUrl))
            .then(resp => pipeline(resp.body, fs.createWriteStream(libPath)))
            .then(
                ok => {
                    console.log(`Lib downloaded from ${this.libUrl} to ${libPath}`);
                },
                err => {
                    console.log(`Lib download from ${this.libUrl} failed with: ${err}`);
                    throw err;
                }
            );

        return Promise.all([headerPromise, libPromise]);
    }

    async writeFiles() {
        const toCopy = ["ADDONNAME.vcxproj.xml", "main.cc.txt", "test.js.txt"];
        for (let filename in toCopy) {
            filename = filename.replace("ADDONNAME", this.addinName).substring(0, -4);
            let fullpath = path.join(this.outDir, filename);
            // TODO: Read file, replace contents, write output.
        }
    }
};
