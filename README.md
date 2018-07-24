# create-vs-napi

This project creates a Visual Studio 2017 C++ project for building native Node.js add-ons using
the N-API API. (See https://nodejs.org/dist/latest-v10.x/docs/api/n-api.html for API details).

The VS 2017 project generated is to be used for quickly getting started and prototyping ideas on the Windows platform.
For a true cross-platform Node.js add-on, using the [node-gyp](https://github.com/nodejs/node-gyp) approach.

## Usage
The easiest way to use this utility is to run it directly from NPM via the `npm init vs-napi` command
(available in npm >= 6, included since Node.js 10.3). This will automatically fetch and run the
`create-vs-napi` package.

Command line options are viewable by running with the `--help` switch, but for simplest use:

1. Ensure you have Node.js 10.3 or later installed.
2. Create a directory to host the project, giving the directory a name that is valid as an add-on
name (e.g. a Node.js module name), and a C++ identifier. (e.g. `./myaddon`)
3. Make the directory the current directory (e.g. `cd ./myaddon`) and run `npm init vs-napi`.
4. The necessary project files will be downloaded and/or created in the directory.
5. Open the project file created in the directory (e.g. `myaddon.vcxproj`) in Visual Studio 2017.
6. Edit the C++ code as desired. You can set breakpoints in the C++ code and press F5 to debug.
The project is configured to launch Node.js and run the `test.js` file (which loads and calls into
the N-API add-on) under the Visual Studio C++ debugger.

## Motivation
Getting native Node.js modules to build on Windows using the official `node-gyp` approach can
be very challenging (e.g. see [these issues](https://github.com/nodejs/node-gyp/issues?q=is%3Aopen+is%3Aissue+label%3AWindows)),
and requires several software packages and configuration steps that can be problematic and time
consuming. At the end of it all however, on Windows at least, all you end up with is a C++ project
referencing the appropriate header and lib files. This package downloads these files directly,
and generates that necessary C++ project, making getting started on Windows very quick and painless
for those just wanting to experiment with Node.js add-ons using the new N-API.

This project however is not intended for building & shipping __real__ Node.js native modules.
For those, the official docs and `node-gyp` approach should be followed, in order to build a
package that can be used cross-platform.

## Notes
 - The project generated includes the header and lib files for the Node.js version in use, so
may not be compatible with earlier Node.js releases.
 - The project generated is only enabled for the bitness (32 or 64) of the Node.js version in use.
This is because the native module must be compiled for the same bitness as the Node.js binary
loading it, and reduces the change of error due to a mismatch. (The project file has the other
_bitness_ commented out. So just remove these comments to enable both platforms for the project).
