/*
 * The content of this file is licenced. You may obtain a copy of the license
 * at http://sieve.mozdev.org or request it via email from the author. 
 *
 * Do not remove or change this comment.
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *   
 * Hints for Spekt IDE autocomplete, they have to be in the first comment...
 *   @include "/sieve/src/sieve@mozdev.org/chrome/chromeFiles/content/libs/libManageSieve/SieveResponse.js"
 *   @include "/sieve/src/sieve@mozdev.org/chrome/chromeFiles/content/libs/libManageSieve/SieveRequest.js"   
 */
 
const Cc = Components.classes;
const Ci = Components.interfaces;

var gSid = null;
var gCid = null;

var gBackHistory = new Array();
var gForwardHistory = new Array();

var gPrintSettings = null;

var gEditorStatus =
{
  
  selectionStart    : -1,
  selectionEnd      : -1,
  selectionChanged  : false,
  
  hasContent        : false,
  contentChanged    : false,
  
  scrollChanged     : false,
  rowCount          : 1,
  
  checkScriptDelay  : 200,
  checkScriptTimer  : null
}

var event = 
{
  /**
   * @param {SieveGetScriptResponse} response
   */
  onGetScriptResponse: function(response)
  {
    event.onScriptLoaded(response.getScriptBody());    
  },
  
  /**
   * @param {String} script
   */
  onScriptLoaded: function(script)
  {
    gEditorStatus.hasContent = true;
    sivSetStatus(0);
    document.getElementById("sivContentEditor").value = script;
    document.getElementById("sivContentEditor").setSelectionRange(0, 0);
	  UpdateCursorPos();
    UpdateLines();
  },

  /**
   * @param {SievePutScriptResponse} response
   */
  onPutScriptResponse: function(response)
  {
    gEditorStatus.contentChanged = false;

    if (onClose())
      close();
  },

  /**
   * @param {SieveAbstractResponse} response
   */
  onError: function(response)
  {
    alert("FATAL ERROR:"+response.getMessage());
  },

  onTimeout: function()
  {
    sivSetStatus(2);
  },
  
  observe : function(aSubject, aTopic, aData)
  {
    if (aTopic != "quit-application-requested")
      return;
    
      
    if (onClose() == false)
      aSubject.QueryInterface(Ci.nsISupportsPRBool).data = true;
    else
      close();
  }
}

function onCompile()
{
  var lEvent =
  {
    onPutScriptResponse: function(response)
    {
      // the script is syntactically correct. This means the server accepted...
      // ... our temporary script. So we need to do some cleanup and remove...
      // ... the script again.   

      // Call delete, without response handlers, we don't care if the ...
      // ... command succeeds or fails.
      sivSendRequest(gSid,gCid,new SieveDeleteScriptRequest("TMP_FILE_DELETE_ME"));
      
      // Call CHECKSCRIPT's response handler to complete the hack...  
      lEvent.onCheckScriptResponse(response);
    },

    onCheckScriptResponse: function(response)
    {
      // TODO: The response might contain warnings, parse them
      document.getElementById("lblErrorBar").firstChild.nodeValue
        = "Server reports no script errors...";

      document.getElementById("imgErrorBar").src
        = "chrome://sieve/content/images/syntax-ok.png";      
    },
    
    onError: function(response)
    {
      // CHECKSCRIPT or PUTSCRIPT failed and the server rejected the script...
      // ... most likely because of syntax errors. 
      //
      // In case we used the PUTSCRIPT hack, we don't need to delete the...
      // ... temporary script because it was never stored on the server, due...
      // ... to this error...
      
      // we got an overquota warning, this means syntaxcheck can't be performed
      if (response.getResponseCode().equalsCode("QUOTA"))
      {
        document.getElementById("lblErrorBar").firstChild.nodeValue
          = "Server has not enough free resources to perform a syntax check"
          
        document.getElementById("imgErrorBar").src
          = "chrome://sieve/content/images/syntax-warning.png";
          
        return;
      }

      
      document.getElementById("lblErrorBar").firstChild.nodeValue
        = response.getMessage();

      document.getElementById("imgErrorBar").src
        = "chrome://sieve/content/images/syntax-error.png";
    },

    onTimeout: function()
    {
      // Forward timeouts to the global listener...
      event.onTimeout();
    }
  }
  
  var script = new String(document.getElementById("sivContentEditor").value);
  
  if (script.length == 0)
    return;
  
  // Use the CHECKSCRIPT command when possible, otherwise we need to ...
  // ... fallback to the PUTSCRIPT/DELETESCRIPT Hack...
    
  var request = null;
  
  var canCheck = Cc["@sieve.mozdev.org/transport-service;1"]
                   .getService().wrappedJSObject  
                   .getChannel(gSid,gCid)
                   .getCompatibility()
                   .checkscript;                

  if (canCheck)
  {
    // ... we use can the CHECKSCRIPT command
    request = new SieveCheckScriptRequest(script)
    request.addCheckScriptListener(lEvent);
  }
  else
  {
    // ... we have to use the PUTSCRIPT/DELETESCRIPT Hack...
    
    // First we use PUTSCRIPT to store a temporary script on the server...
    // ... incase the command fails, it is most likely due to an syntax error...
    // ... if it sucseeds the script is syntactically correct! 
    request = new SievePutScriptRequest("TMP_FILE_DELETE_ME",script);
    request.addPutScriptListener(lEvent);
  }
  
  request.addErrorListener(lEvent);
  
  sivSendRequest(gSid,gCid,request);
}

function onInput()
{
  // TODO use show/hide instead of changing the label...
  if (gEditorStatus.contentChanged == false)
    document.getElementById("sbChanged").label = "Changed";
  
  gEditorStatus.contentChanged = true;
  gEditorStatus.hasContent = true;
  
  // on every keypress we reset the timeout
  if (gEditorStatus.checkScriptTimer != null)
  {
    clearTimeout(gEditorStatus.checkScriptTimer);
    gEditorStatus.checkScriptTimer = null;
  }
  
  if (document.getElementById("btnCompile").checked)
    gEditorStatus.checkScriptTimer = setTimeout(function() {onCompile();}, gEditorStatus.checkScriptDelay);
  
  UpdateLinesLazy();
}

function onLoad()
{ 
  // checkbox buttons are buggy in Gecko 1.8, this has been fixed in ...
  // ...Gecko 1.9 (Thunderbird 3).
  // We implement the workaround mentioned in Bug 382457.

  document.getElementById("btnCompile").
    addEventListener(
      "command",
      function() {onErrorBar();},
      false);
  
  document.getElementById("btnReference").
    addEventListener(
      "command",
      function() {onSideBar(); },
      false);
  
  document.getElementById("btnSearchBar").
    addEventListener(
      "command",
      function() {onSearchBar();},
      false);
 
  // Gecko 1.8.1 does not propagate onscroll events for textboxes...
  // ... the bug is fixed in Gecko 1.9 (Thunderbird 3)
  // As the is no workaround, we simply deactivate line numbers in Gecko 1.8
  var version  = Components.classes["@mozilla.org/xre/app-info;1"]
                              .getService(Components.interfaces.nsIXULAppInfo)
                              .platformVersion.split(".");

  if (((version[0] == 1) && (version[1] >=9)) || version[0] >=2)
  {
    document.getElementById("sivLineNumbers").removeAttribute('hidden');
    document.getElementById("sivContentEditor")
        .addEventListener("scroll", function() {onEditorScroll();},false);
  }
  else
  {
    document.getElementById("sivLineNumbers").setAttribute('hidden', 'true');
  }

  // add event listeners to Editor
  document.getElementById("sivContentEditor")
      .addEventListener("input",function() {onInput();},false);   
      
  document.getElementById("sivContentEditor")
      .addEventListener("mousemove",function() {onUpdateCursorPos(250);},false);
      
  document.getElementById("sivContentEditor")
      .addEventListener("keypress",function() {onUpdateCursorPos(50);},false);
      
  // hack to prevent links to be opened in the default browser window...
  document.getElementById("ifSideBar").
    addEventListener(
      "click",
      function(event) {onSideBarBrowserClick(event);},
      false);
  
  var args = window.arguments[0].wrappedJSObject;    
      
  // Connect to the Sieve Object...  
  var sivManager = Components.classes["@sieve.mozdev.org/transport-service;1"]
                     .getService().wrappedJSObject; 
  
  gSid = args["sieve"];
  gCid = sivManager.createChannel(gSid);
  
  gEditorStatus.checkScriptDelay = args["compileDelay"];
  
  document.getElementById("txtName").value = args["scriptName"];
  document.title = ""+args["scriptName"]+" - Sieve Filters";
  
  document.getElementById("lblErrorBar").firstChild.nodeValue
    = "Server reports no script errors...";
  
  if (args["scriptBody"] != null)
  {
    event.onScriptLoaded(args["scriptBody"]);
  }
  else
  {
    sivSetStatus(1,"Loading Script...");
      
    var request = new SieveGetScriptRequest(args["scriptName"]);
    request.addGetScriptListener(event);
    request.addErrorListener(event);

    sivSendRequest(gSid,gCid,request);
  }
  
  //preload sidebar...
  onSideBarHome();
  
  onErrorBar(args["compile"]);
  onSideBar(true);
  onSearchBar(false);
  
  document.getElementById("sivContentEditor").setSelectionRange(0, 0);
  document.getElementById("sivContentEditor").focus();

  Cc["@mozilla.org/observer-service;1"]
      .getService (Ci.nsIObserverService)
      .addObserver(event,"quit-application-requested", false);
           
  /*
   * window.document.documentElement.addEventListener('focus', function(event) {
   * if (event.target.nodeName=='textbox' &&
   * event.target.hasAttribute('readonly')) {
   * window.document.documentElement.focus(); } }, true);
   */
}

function onIgnoreOffline()
{
  // try to go online again
  try 
  {
    // Cid is removed, but try to reconnect...
    gCid = Cc["@sieve.mozdev.org/transport-service;1"]
               .getService().wrappedJSObject
               .createChannel(gSid);
    
    // TODO: this is code exists twice remove me...
    if (gEditorStatus.hasContent == false)
    {
      sivSetStatus(1,"Loading Script...");
      
      var args = window.arguments[0].wrappedJSObject;
      
      var request = new SieveGetScriptRequest(args["scriptName"]);
      request.addGetScriptListener(event);
      request.addErrorListener(event);

      sivSendRequest(gSid,gCid,request);
      
      return;
    }
      
  } 
  catch (ex) {}
  
  sivSetStatus(0);
}

function onSideBarBrowserClick(event)
{     
  var href = null;
  
  if (event.target.nodeName == "A")
    href = event.target.href;
  else if (event.target.parentNode.nodeName == "A")
    href = event.target.parentNode.href;
  else
    return;

  event.preventDefault();

  if (gForwardHistory.length != 0)
    gForwardHistory = new Array();

  onSideBarGo(href);
}

function onSideBarBack()
{
  // store the current location in the history...
  gForwardHistory.push(gBackHistory.pop());
  // ... and go back to the last page
  onSideBarGo(gBackHistory.pop());
}

function onSideBarForward()
{
  onSideBarGo(gForwardHistory.pop());
}

function onSideBarHome()
{
  if (gForwardHistory.length != 0)
    gForwardHistory = new Array();

  //document.getElementById("ifSideBar").setAttribute('src',uri);
  onSideBarGo("http://sieve.mozdev.org/reference/en/index.html");
}

function onSideBarLoading(loading)
{
  if (loading)
    document.getElementById("dkSideBarBrowser").selectedIndex = 1;
  else
    document.getElementById("dkSideBarBrowser").selectedIndex = 0;
}

function onSideBarGo(uri)
{
  onSideBarLoading(true);
  
  gBackHistory.push(uri);
  
  if (gBackHistory.length > 20)
    gBackHistory.shift();
  
  if (gBackHistory.length == 1)
    document.getElementById("btnSideBarBack").setAttribute('disabled',"true");
  else
    document.getElementById("btnSideBarBack").removeAttribute('disabled');

  if (gForwardHistory.length == 0)
    document.getElementById("btnSideBarForward").setAttribute('disabled',"true");
  else
    document.getElementById("btnSideBarForward").removeAttribute('disabled');
  
  /*if (document.getElementById("ifSideBar").addEventListener)
    document.addEventListener(
      "DOMContentLoaded", function(event) { onSideBarLoading(false); }, false);*/
  if (document.getElementById("ifSideBar").addEventListener)
    document.getElementById("ifSideBar").addEventListener(
      "DOMContentLoaded", function(event) {	onSideBarLoading(false); }, false);
  
  document.getElementById("ifSideBar").setAttribute('src', uri);
}

function onSave()
{
  var request = new SievePutScriptRequest(
                  new String(document.getElementById("txtName").value),
                  new String(document.getElementById("sivContentEditor").value));
  request.addPutScriptListener(event);
  request.addErrorListener(event);
  
  sivSendRequest(gSid,gCid,request);
}

function onClose()
{
  if (gEditorStatus.contentChanged == true)
  {
    var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                          .getService(Ci.nsIPromptService);

    // The flags 393733 equals [Save] [Don't Save] [Cancel]
    var result =
      prompts.confirmEx(
        window, "Save Sieve Script",
        "Script has not been saved. Do you want to save changes?", 393733,
        "", "", "", null, { value : false });
   
    // Save the Script if the user descides to...
    if (result == 0)
      onSave();
   
    // ... and abort quitting if the user clicked on "Save" or "Cancel"
    if (result != 2)
      return false;                          
  }
   
  clearTimeout(gEditorStatus.checkScriptTimer);
  
  Cc["@mozilla.org/observer-service;1"]
      .getService (Ci.nsIObserverService)
      .removeObserver(event,"quit-application-requested");  
  
  // either the script has not changed or the user did not want to save... 
  // ... the script, so it's ok to exit.
  sivDisconnect();
                  
  return true;  
}

function onImport()
{
  var filePicker = Cc["@mozilla.org/filepicker;1"]
                       .createInstance(Ci.nsIFilePicker);

  filePicker.appendFilter("Sieve Scripts (*.siv)", "*.siv");
  filePicker.appendFilter("All Files (*.*)", "*.*");
  filePicker.init(window, "Import Sieve Script", filePicker.modeOpen);

  if (filePicker.show() != filePicker.returnOK)
    return;

  var inputStream = Components.classes["@mozilla.org/network/file-input-stream;1"]
                              .createInstance(Components.interfaces.nsIFileInputStream);
  var scriptableStream = Components.classes["@mozilla.org/scriptableinputstream;1"]
                                   .createInstance(Components.interfaces.nsIScriptableInputStream);

  inputStream.init(filePicker.file, 0x01, 0444, null);
  scriptableStream.init(inputStream);

  // todo insert imported snipplet instead of replacing the whole script
  var script = scriptableStream.read(scriptableStream.available());

  scriptableStream.close();
  inputStream.close();

  // Find the Start and End Position
  var el = document.getElementById("sivContentEditor");
  var start = el.selectionStart;
  var end = el.selectionEnd;

  /* Remember obj is a textarea or input field */
  el.value = el.value.substr(0, start)
    + script
    + el.value.substr(end, el.value.length);
  
  onInput();
}

function onExport()
{
  var filePicker = Components.classes["@mozilla.org/filepicker;1"]
			.createInstance(Components.interfaces.nsIFilePicker);

	filePicker.defaultExtension = ".siv";
	filePicker.defaultString = document.getElementById("txtName").value
			+ ".siv";

	filePicker.appendFilter("Sieve Scripts (*.siv)", "*.siv");
	filePicker.appendFilter("Text Files (*.txt)", "*.txt");
	filePicker.appendFilter("All Files (*.*)", "*.*");
	filePicker.init(window, "Export Sieve Script", filePicker.modeSave);

	var result = filePicker.show();

	if ((result != filePicker.returnOK) && (result != filePicker.returnReplace))
		return;

	var file = filePicker.file;

	if (file.exists() == false)
		file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0644);

	var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
			.createInstance(Components.interfaces.nsIFileOutputStream);

	outputStream.init(file, 0x04 | 0x08 | 0x20, 0644, null);

	var data = document.getElementById("sivContentEditor").value;
	outputStream.write(data, data.length);
	outputStream.close();
}

/**
 * Shows the sidebar containing script errors
 */
function onErrorBarShow()
{
  document.getElementById("btnCompile").setAttribute('checked', 'true')
  document.getElementById('spErrorBar').removeAttribute('hidden');
  document.getElementById('vbErrorBar').removeAttribute('hidden');

  onCompile();

  return;
}

/**
 * Hides the sidebar containing script errors...
 */
function onErrorBarHide()
{
  clearTimeout(gEditorStatus.checkScriptTimer);
  gEditorStatus.checkScriptTimer = null;
  
  document.getElementById("btnCompile").removeAttribute('checked');
  document.getElementById("vbErrorBar").setAttribute('hidden', 'true');
  document.getElementById('spErrorBar').setAttribute('hidden', 'true');
  
  return;
}

function onErrorBar(visible)
{
  if (visible == null)
    visible = document.getElementById('btnCompile').checked

  if (visible)
    onErrorBarShow();
  else
    onErrorBarHide();

  return;
}

/**
 * Shows the Sidebar containing the Sieve Reference
 */
function onSideBarShow()
{
  document.getElementById('btnReference').setAttribute('checked', 'true')
  document.getElementById('splitter').removeAttribute('hidden');
  document.getElementById('vbSidebar').removeAttribute('hidden');
  
  return;
}

/**
 * Shows the Sidebar containing the Sieve Reference
 */
function onSideBarHide()
{
  document.getElementById('btnReference').removeAttribute('checked');
  document.getElementById('splitter').setAttribute('hidden', 'true');
  document.getElementById('vbSidebar').setAttribute('hidden', 'true')
  
  onSearchBarHide();
  
  return;
}

function onSideBar(visible)
{
  if (visible == null)
    visible = document.getElementById('btnReference').checked
  
  if (visible)
    onSideBarShow();
  else
    onSideBarHide();
  
  return;
}

/**
 * Shows the SearchBar. As it is embedded in the SideBar, it will automatically
 * display the SideBar if it is not already visible
 */
function onSearchBarShow()
{
  onSideBarShow();
  
  document.getElementById('btnSearchBar').setAttribute('checked', 'true')
  document.getElementById('vbSearchBar').removeAttribute('hidden');
  
  return;
}

/**
 * Hides the in the SideBar embedded SearchBar...
 */
function onSearchBarHide()
{
  
  document.getElementById('vbSearchBar').setAttribute('hidden', 'true')
  document.getElementById('btnSearchBar').removeAttribute('checked');
  
  return;
}

function onSearchBar(visible)
{
  if (visible == null)
    visible = document.getElementById('btnSearchBar').checked

  if (visible)
    onSearchBarShow();
  else
    onSearchBarHide();

  return;
}

function OnFindString()
{
  var txtScript = document.getElementById("sivContentEditor");
  var script = new String(txtScript.value);
  
  if (script.length == 0)
    return;
  
  // Get the cursor position...
  var position = txtScript.selectionStart;
  
  if (txtScript.selectionStart != txtScript.selectionEnd)
    position = txtScript.selectionEnd;
  
  // ... and prepare strings for search...
  var token = new String(document.getElementById("txtToken").value);
  
  // ... convert to lowercase, if the search is not case sensitive...
  if (document.getElementById('cbxCaseSensitive').checked == false)
  {
    script = script.toLowerCase();
    token = token.toLowerCase();
  }
  
  var result = -1;
  
  // ... the backward search is a bit tricky...
  if (document.getElementById('cbxBackward').checked)
  {
    // The search result has to be before the current cursor...
    // ... position, this means we can drop anything behind it.
    script = script.substring(0, position - 1);
    result = script.lastIndexOf(token);
    
    position = script.length - position;
  }
  else
  {
    result = script.indexOf(token, position);
  }

  // start search from cursor pos...
  if (result == -1)
  {
    alert('Phrase not found...')
    return -1;
  }

  txtScript.focus();

  txtScript.setSelectionRange(result, result + token.length);
  txtScript.editor.selectionController.scrollSelectionIntoView(1, 1, true);

  return 0;
}

function OnReplaceString()
{
  var txtScript = document.getElementById("sivContentEditor");
  var token = new String(document.getElementById("txtToken").value);
  
  var selectedToken =
    txtScript.value.substring(txtScript.selectionStart,txtScript.selectionEnd);
  
  if (selectedToken != token)
    this.OnFindString();
  
  selectedToken = 
    txtScript.value.substring(txtScript.selectionStart,txtScript.selectionEnd);
  
  if (selectedToken != token)
    return;
  
  var newToken = new String(document.getElementById("txtReplace").value);
  var selStart = txtScript.selectionStart;
  var selEnd = txtScript.selectionEnd
  /* Remember obj is a textarea or input field */
  txtScript.value = txtScript.value.substr(0, selStart) + newToken
    + txtScript.value.substr(selEnd, txtScript.value.length);
  
  txtScript.focus();
  
  txtScript.setSelectionRange(selStart, selStart + newToken.length);
  txtScript.editor.selectionController.scrollSelectionIntoView(1, 1, true);
  
  this.onInput();
  
}

/*function onBlubb()
{
  
  
  var txtScript = document.getElementById("sivContentEditor");
  
  alert(txtScript.editor);
  
  if (txtScript.editor instanceof Components.interfaces.nsIHTMLEditor)
    alert("HTML");
    
  if (txtScript.editor instanceof Components.interfaces.nsIPlaintextEditor)
    alert("plain text");
    
  return;
  
  var myDocument = txtScript.editor.document;

  
  var neuB = myDocument.createElement("b");
  var neuBText = myDocument.createTextNode("mit fettem Text ");
  neuB.appendChild(neuBText);
  
  //document.getElementById("derText").insertBefore(neuB, document.getElementById("derKursiveText"));
 
  var root = txtScript.editor.rootElement;

//106           const nsIDOMNSEditableElement = Components.interfaces.nsIDOMNSEditableElement;
//107           return this.inputField.QueryInterface(nsIDOMNSEditableElement).editor;

  root.appendChild(neuB);
  //root.firstChild.insertBefore(neuB, document.getElementById("derKursiveText"));
  
  for (var item = root.firstChild; item; item = item.nextSibling) 
    alert(item);
}*/

function UpdateCursorPos()
{
  
  var el = document.getElementById("sivContentEditor");
  
  // We can skip if the cursor position did not change at all...
  if ((gEditorStatus.selectionStart == el.selectionStart) 
        && (gEditorStatus.selectionEnd == el.selectionEnd))
    return;  
  
  var lines = el.value.substr(0, el.selectionStart).split("\n");

  document.getElementById("sbCursorPos")
          .label = lines.length+":"+(lines[lines.length - 1].length + 1);
  
  if (el.selectionEnd != el.selectionStart)
  {
    lines = el.value.substr(0, el.selectionEnd).split("\n");
    document.getElementById("sbCursorPos")
            .label += " - " + lines.length+ ":" + (lines[lines.length - 1].length + 1);
  }
  
  gEditorStatus.selectionStart = el.selectionStart;
  gEditorStatus.selectionEnd = el.selectionEnd;
  
  gEditorStatus.selectionChanged = false;
  
  return;
}



function onEditorScroll()
{
  var first = document.getAnonymousElementByAttribute(document.getElementById("sivLineNumbersEditor"), 'anonid', 'input');
  var second = document.getAnonymousElementByAttribute(document.getElementById("sivContentEditor"), 'anonid', 'input');

  if (first.scrollTop != second.scrollTop);
      first.scrollTop= second.scrollTop;
}

function UpdateLines()
{
  if (document.getElementById("sivLineNumbers").hasAttribute('hidden'))
    return;
   
  // TODO do lazy update 100ms ...
  var first = document.getAnonymousElementByAttribute(document.getElementById("sivLineNumbersEditor"), 'anonid', 'input');
  var second = document.getAnonymousElementByAttribute(document.getElementById("sivContentEditor"), 'anonid', 'input');

  // the scroll height can be equal or bigger than clientHeight. If its bigger we can take a shortcut...
  // ... to test if the linecount changed...
  if ((second.scrollHeight > second.clientHeight) && (second.scrollHeight == first.scrollHeight))
    return;
  
  // Count linebreaks...
  var textRows = (second.value).split('\n');

  // no line breaks changed?
  if (gEditorStatus.rowCount == textRows.length)
   return;
 
  gEditorStatus.rowCount = textRows.length;

 // TODO calculate how many lines changed instead of rebuilding all...
 var str= "1";
  for (var i=1; i < gEditorStatus.rowCount; i++)
    str+= "\n"+ (i+1);

  first.value = str;

  onEditorScroll();
}

function UpdateLinesLazy()
{
  if (document.getElementById("sivLineNumbers").hasAttribute('hidden'))
    return;
    
  if (gEditorStatus.scrollChanged)
    return;

  setTimeout(function () {gEditorStatus.scrollChanged=false;UpdateLines();},75);

  gEditorStatus.scrollChanged = true;
}

function onUpdateCursorPos(timeout)
{
  if (gEditorStatus.selectionChanged)
    return;

  setTimeout(function() {UpdateCursorPos();	gEditorStatus.selectionChanged = false;}, 200);

  gEditorStatus.selectionChanged = true;
}

function onBtnChangeView()
{
 /* var deck = document.getElementById("dkView");
  
  if (deck.selectedIndex == 0)
    document.getElementById("dkView").selectedIndex = 1;
  else
    document.getElementById("dkView").selectedIndex = 0;*/
  
}

function getPrintSettings()
{
  var pref = Components.classes["@mozilla.org/preferences-service;1"]
               .getService(Components.interfaces.nsIPrefBranch);
  if (pref) 
  {
    var gPrintSettingsAreGlobal = pref.getBoolPref("print.use_global_printsettings", false);
    var gSavePrintSettings = pref.getBoolPref("print.save_print_settings", false);
  }
 
  var printSettings;
  try 
  {
    var PSSVC = Components.classes["@mozilla.org/gfx/printsettings-service;1"]
                  .getService(Components.interfaces.nsIPrintSettingsService);
    if (gPrintSettingsAreGlobal) 
    {
      printSettings = PSSVC.globalPrintSettings;
      this.setPrinterDefaultsForSelectedPrinter(PSSVC, printSettings);
    }
    else
    {
      printSettings = PSSVC.newPrintSettings;
    }
  }
  catch (e)
  {
    alert("getPrintSettings: "+e+"\n");
  }
  return printSettings;
}


function onPrint()
{
  // we print in xml this means any specail charaters have to be html entities...
  // ... so we need a dirty hack to convert all entities...
  alert("Print");
  var script = document.getElementById("sivContentEditor").value;
  script = (new XMLSerializer()).serializeToString(document.createTextNode(script));
  
  script = script.replace(/\r\n/g,"\r");
  script = script.replace(/\n/g,"\r");
  script = script.replace(/\r/g,"\r\n");
 
  var data = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n" 
     + "<?xml-stylesheet type=\"text/css\" href=\"chrome://sieve/content/editor/print.css\"?>\r\n"
     + "<SieveScript>\r\n"
       + "<title xmlns=\"http://www.w3.org/1999/xhtml\">\r\n"
         + document.getElementById("txtName").value
       + "</title>\r\n"
       + "<SieveScriptName>\r\n" 
         + document.getElementById("txtName").value
       + "</SieveScriptName>\r\n"   
       + "<SieveScriptLine>\r\n"       
         + script
       + "</SieveScriptLine>\r\n"          
     + "</SieveScript>\r\n";    
  
  data =  "data:application/xml;base64,"+btoa(data);  

   /*// get URI and add to list for printing
  var messageList =  new Array(1);
  messageList[0] = data;
     
  var prevPS = gPrintSettings;
 
  var printSettingsService = 
        Components.classes["@mozilla.org/gfx/printsettings-service;1"]
          .getService(Components.interfaces.nsIPrintSettingsService);
   
  var printSettings = printSettingsService.CreatePrintSettings();
  // var printSettings = printSettingsService.globalPrintSettings;

  printEngineWindow = window.openDialog("chrome://messenger/content/msgPrintEngine.xul",
                                        "",
                                        "chrome,dialog=no,all,centerscreen",
                                        messageList.length, messageList, statusFeedback, 
                                        printSettings, false, 
                                        Components.interfaces.nsIMsgPrintEngine.MNAB_PRINT_MSG,
                                        window)*/
                  

   var printSettings;// = getPrintSettings();
   /* get the print engine instance */
   var printEngine = Components.classes["@mozilla.org/messenger/msgPrintEngine;1"].createInstance();
   printEngine.QueryInterface(Components.interfaces.nsIMsgPrintEngine);

   var printSettingsService = 
        Components.classes["@mozilla.org/gfx/printsettings-service;1"]
          .getService(Components.interfaces.nsIPrintSettingsService);
   var printSettings = printSettingsService.newPrintSettings;
   
   printEngine.setWindow(window);
   printEngine.doPrintPreview = false;
   printEngine.showWindow(false);
   printEngine.setMsgType(Components.interfaces.nsIMsgPrintEngine.MNAB_PRINT_MSG);
   printEngine.setParentWindow(null);
   //printEngine.setParentWindow(window);   

   var messageList =  new Array(1);
   messageList[0] = data;
 
   printEngine.setPrintURICount(messageList.length);
   printEngine.addPrintURI(messageList);
   
   printEngine.startPrintOperation(printSettings);
 
//     printEngine.setStatusFeedback(statusFeedback);
//     printEngine.setStartupPPObserver(gStartupPPObserver);
                     
  alert("End Print");
}
/*function onPrint()
{  
  var statusFeedback;
  statusFeedback = Components.classes["@mozilla.org/messenger/statusfeedback;1"].createInstance();
  statusFeedback = statusFeedback.QueryInterface(Components.interfaces.nsIMsgStatusFeedback);

  // we print in xml this means any specail charaters have to be html entities...
  // ... so we need a dirty hack to convert all entities...
  
  var script = document.getElementById("sivContentEditor").value;
  script = (new XMLSerializer()).serializeToString(document.createTextNode(script));
  
  script = script.replace(/\r\n/g,"\r");
  script = script.replace(/\n/g,"\r");
  script = script.replace(/\r/g,"\r\n");
 
  var data = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n" 
     + "<?xml-stylesheet type=\"text/css\" href=\"chrome://sieve/content/editor/print.css\"?>\r\n"
     + "<SieveScript>\r\n"
       + "<title xmlns=\"http://www.w3.org/1999/xhtml\">\r\n"
         + document.getElementById("txtName").value
       + "</title>\r\n"
       + "<SieveScriptName>\r\n" 
         + document.getElementById("txtName").value
       + "</SieveScriptName>\r\n"   
       + "<SieveScriptLine>\r\n"       
         + script
       + "</SieveScriptLine>\r\n"          
     + "</SieveScript>\r\n";    
  
  data =  "data:application/xml;base64,"+btoa(data);  
  

  if (gPrintSettings == null) 
    gPrintSettings = PrintUtils.getPrintSettings();    

  printEngineWindow = window.openDialog("chrome://messenger/content/msgPrintEngine.xul",
                                         "",
                                         "chrome,dialog=no,all,centerscreen",
                                          1, [data], statusFeedback,
                                          gPrintSettings,false,
                                          Components.interfaces.nsIMsgPrintEngine.MNAB_PRINT_MSG,
                                          window);

  return;
}*/

function sivSendRequest(sid,cid,request)
{
  // we do not send requests while in offline mode...
  var ioService = Cc["@mozilla.org/network/io-service;1"]
                      .getService(Ci.nsIIOService);  
    
  if (ioService.offline)
  {        
    sivDisconnect(2);
    return;
  }
  
  // ... we are not so let's try. If the channel was closed...
  // ... getChannel will throw an exception.
  try
  {
    Cc["@sieve.mozdev.org/transport-service;1"]
        .getService().wrappedJSObject
        .getChannel(sid,cid)
        .addRequest(request);  
  }
  catch (e)
  {
    // most likely getChannel caused this exception, but anyway we should ...
    // ... display error message. If we do not catch the exception a timeout ...
    // ... would accure, so let's display the timeout message directly.
    
    alert("SivFilerExplorer.sivSendRequest:"+e);
    sivDisconnect(2);       
  }
}

function sivDisconnect(state)
{
  
  if (state)
    sivSetStatus(state);
    
  if ((!gSid) || (!gCid))
    return;
    
  Cc["@sieve.mozdev.org/transport-service;1"]
      .getService().wrappedJSObject
      .closeChannel(gSid,gCid); 
}

function sivSetStatus(state, message)
{
  document.getElementById('sivEditorWarning').setAttribute('hidden','true');
  document.getElementById('sivEditorWait').setAttribute('hidden','true');
  document.getElementById('sivEditor').setAttribute('collapsed','true');
  
  switch (state)
  {
    case 2: document.getElementById('sivEditorWarning').removeAttribute('hidden');
            break;    
    case 1: document.getElementById('sivEditorWait').removeAttribute('hidden');
            document.getElementById('sivEditorWaitMsg')
                .firstChild.nodeValue = message;    
            break;
    case 0: document.getElementById('sivEditor').removeAttribute('collapsed');
            break;
  }
  
}

