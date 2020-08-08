# Build instructions

Over the time building and releasing got more and more complicated, so that yarn and gulp is now used to build and package the artifacts.

The electron app, the thunderbird addon as well as the thunderbird webextension share a common code base.

You find all app specific code in `src/app`, the WebExtension code is in `src/wx` and all the shared code can be found in `src/common`.

# Getting started

To get started clone the project for github.

Then use either [yarn](https://yarnpkg.com/) or `npm install` to download the dependencies.
This will download gulp as well as codemirror, bootstrap, electron and everything else which is needed.

As editor I suggest [Visual Studio Code](https://code.visualstudio.com/)

# Developing the App

The app is based upon electron. It is a JavaScript runtime which ships a Browser as UI. This makes developing is very straight forward and easy compared to a thunderbird addon.

To package the app call:

`gulp app:package`

Then give it a test and start the electron:

`yarn run start`

To speedup the development you can also use `gulp app:watch`. It will automatically update all changed files. The change will be instantly available in electron. You may need to reload the rendering process, by going to the menu bar and select `View->Reload` or `View->Force Reload`

To finally package the electron app just run `gulp app:package-win32` or `gulp app:package-linux`.

In case you need to inspect the UI's HTML debug the JavaScript, just select `View->Toggle Developer Tools`.

# Developing the WebExtension

WebExtensions are the new addon api for Thunderbird.

Internally they show similarities to electron.

The background page is the main entry point, it is a single instance and has neither direct access to the UI nor to any XPCOM functions.

The UI is realized by content tabs. These tabs contain normal HTML pages and communicate via a special messaging system with background page. They are basically only dumb renderers.

Calls to Thunderbird's core (XPCOM) are done in WebExtension Experiments. An Experiment is special privileged code which is allowed to access XPCOM. But only be accessed through a predefined and very limited API from the background page. You can find the APIs in `src/wx/api/sieve`

To build the webextension call `gulp wx:package`. It creates a build directory (`build\thunderbird-wx`) relative to your sources root directory.

Then load the extension. Go to `Tools->Developer Tools->Debug Addons`, click on the `Load Temporary Extension` button and select the `manifest.json` in the build directory. This will load the addon in developer mode.

The UI offers buttons to reload and inspect the extension. Keep in mind, a reload just invalidates the background page and any content tabs. It does not reload the API. The only way to reload the API is a restart. Similarly the inspect button can only access the background page and the content tabs but not the Experiments privileged code.

In order to have the build folder updates upon changes to the source folder, just call `gulp wx:watch`. Gulp will monitor the source files and copies them upon change to the source directory.