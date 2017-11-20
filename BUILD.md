# Build instructions

Over the time building and releasing the addon got more and more complicated, so that yarn and gulp is now used to build and package the artifacts.

The electron app and the thunderbird addon share a common code base.

You find all app specific code in `src/app`, the addon specific code is located in `src/addon` and all the shared code can be found in `src/common`.

# Getting started

To get started clone the project for github.

Then use either `yarn` or `npm install` to download the dependencies.
This will download gulp as well as jquery, code mirror, bootstrap, electon and everything else which is needed.

As Editor I suggest [Visual Studio Code](https://code.visualstudio.com/)

# Developing the Addon

Typically a build cycle would be change the code, build the xpi, update it in thunderbird and then test it. This is typically very timeconsuming and needs lots of restarting thunderbird.

In order to speedup development there are some tweaks.

First uninstall the addon in thunderbird. And enable all the developer options as described on the mozilla developer portal.

Then build the project, this will create a build directory relative to your sources root directory.

`gulp addon:package`

As next step ensure thunderbird is closed and locate to your [thunderbird profile](https://support.mozilla.org/en-US/kb/profiles-where-thunderbird-stores-user-data). Browse there to the extensions directory and create a new file named `sieve@mozdev.org`. The files content needs to be the path to the build directory e.g.:

`D:\Projekte\Sieve\build\thunderbird\`

The path has to end with a path separator (slash on Linux or backslash on Windows). Do not add a linebreak at the end. Otherwise it will not work. Also ensure there is no file other folder named `sieve@mozdev.org` somewhere else in the extension directory.

Start thunderbird and it should prompt a new addon named sieve is ready to install. Accept the installation.

Finally start gulp in watch mode. This means when you change something within the sources it will automatically update the build directory so that thunderbird can pickup the changes immediately. But keep in mind xul files are typically cached by thunderbird. So you may need to restart thunderbird after changing a xul file.

`gulp addon:watch`


# Developing the App

Developing the app very similar to the addon. As first step you need to package everything:

`gulp app:package`

Then give it a test and start the electron:

`yarn run start`

To speedup the development you can also use `gulp app:watch`. It will automatically update all changed files. The change will be instantly available in electron. You may need to reload the rendering process, by going to the menu bar and select `View->Reload` or `View->Force Reload`

To finally package the electron app just run `gulp app:package-win32` or `gulp app:package-linux`.
