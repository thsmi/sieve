# Build instructions

Over the time building and releasing the addon got more and more complicated, so that yarn and gulp is now used to build and package the artifacts.

# Getting started

To get started clone the project for github.

Then use either ``yarn`` or ``npm install`` to download the dependencies.
This will download gulp as well as jquery and code mirror which are needed for this addon to work.

As Editor I suggest [Visual Studio Code](https://code.visualstudio.com/)

# Developing

Typically a build cycle would be change the code, build the xpi, update it in thunderbird and then test it. This is typically very timeconsuming and needs lots of restarting thunderbird.

In order to speedup development there are some tweaks.

First uninstall the addon in thunderbird. And enable all the developer options as described on the mozilla developer portal.

Then build the project, this will create a build directory relative to your sources root directory.

    gulp addon:package

As next step ensure thunderbird is closed and locate to your [thunderbird profile](https://support.mozilla.org/en-US/kb/profiles-where-thunderbird-stores-user-data). Browse there to the extensions directory and create a new file named "sieve@mozdev.org". The files content needs to be the path to the build directory e.g.:

    D:\Projekte\Sieve\build\thunderbird\

The path has to end with a path separator (slash on Linux or backslash on Windows). Do not add a linebreak at the end. Otherwise it will not work. Also ensure there is no file other folder named "sieve@mozdev.org" somewhere else in the extension directory.

Start thunderbird and it should prompt a new addon named sieve is ready to install. Accept the installation.

Finally start gulp in watch mode. This means when you change something within the sources it will automatically update the build directory so that thunderbird can pickup the changes immediately. But keep in mind xul files are typically cached by thunderbird. So you may need to restart thunderbird after changing a xul file.

    gulp addon:watch
