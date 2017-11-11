# Build instructions

Over the time building and releasing the addon got more and more complicated, so that gulp is now used to build and package the artifacts.

# Developing

Typically a build cycle would be change the code, build the xpi, update it in thunderbird and then test it. This is typically very timeconsuming and needs lots of restarting thunderbird.

In order to speedup development there are some tweaks.

First uninstall the addon in thunderbird. And enable all the developer options as described on the mozilla developer portal. Then close thunderbird.

Then build the project, this will create a build directory relative to your sources root directory.

    gulp package-addon

As next step locate to your [thunderbird profile](https://support.mozilla.org/en-US/kb/profiles-where-thunderbird-stores-user-data). And go there into the extensions directory and create a new file named "sieve@mozdev.org". The files content shold be the path the the build directory e.g.:

    D:\Projekte\Sieve\build\thunderbird\

The path has to end with a slash or backslash, and do not add a linebreak at the end. Otherwise it will not work. Also ensure there is no file other folder named "sieve@mozdev.org" somewhere else in the extension directory.

Start thunderbird and it should prompt a new addon was installed.

Finally start gulp in watch mode. This means when you change something within the sources it will automatically update the build directory so that thunderbird can pickup the changes immediately.

    gulp watch-addon