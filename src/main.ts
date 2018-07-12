import fs = require("fs");
import path = require("path");
import util = require("util");
import stream = require("stream");

import tar = require("tar");
import mkdirp = require("mkdirp");
import uuid = require("uuid/v4");
// uuid() -> string of the format: "4ec6f100-dc76-4e60-b43b-1a55eb9d8262"

import fetch from "node-fetch";

const pipeline = util.promisify(stream.pipeline);
const mkdir = util.promisify(mkdirp);
const readfile = util.promisify(fs.readFile);
const writefile = util.promisify(fs.writeFile);

export class Generator {
    // TODO: Update definitelyTyped with the "process.release" declaration
    releases: { [url: string]: string } = (process as any).release;

    // Along the lines of: https://nodejs.org/download/release/v10.1.0/node-v10.1.0-headers.tar.gz
    headersUrl = this.releases.headersUrl;

    // Along the lines of: https://nodejs.org/download/release/v10.1.0/win-{x64,x86}/node.lib
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

        await Promise.all([headerPromise, libPromise]);
        await this.writeFiles();
    }

    async writeFiles() {
        const toCopy = ["ADDONNAME.vcxproj.xml", "main.cc.txt", "test.js.txt"];
        for (let filename of toCopy) {
            const templatePath = path.join(__dirname, "../template", filename);
            filename = filename.replace("ADDONNAME", this.addinName).slice(0, -4);
            let fullpath = path.join(this.outDir, filename);

            const filetext = await readfile(templatePath, 'utf8');
            const newtext = filetext
                .replace(/\{\{ADDONNAME\}\}/g, this.addinName)
                .replace(/\{\{PROJECTGUID\}\}/g, `{${uuid().toUpperCase()}}`)
                .replace(/\{\{OUTDIR\}\}/g, this.outDir);
            await writefile(fullpath, newtext);
            console.log(`Wrote file: ${fullpath}`);
        }
    }
};
