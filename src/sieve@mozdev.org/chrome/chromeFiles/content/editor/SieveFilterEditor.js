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

// Enable Strict Mode
"use strict";

if (typeof(Cc) == 'undefined')
  { Cc = Components.classes; }

if (typeof(Ci) == 'undefined')
  { Ci = Components.interfaces; } 

var gSid = null;
var gCid = null;

var gBackHistory = new Array();
var gForwardHistory = new Array();

var gPrintSettings = null;

var gEditorStatus =
{
  insertString: function (text, select)
  {
    var txtScript = document.getElementById("sivContentEditor");
    
    var params = Cc["@mozilla.org/embedcomp/command-params;1"].createInstance(Ci.nsICommandParams);
    params.setStringValue("state_data",text);  
  
    txtScript.controllers
        .getControllerForCommand("cmd_insertText")
        .QueryInterface(Ci.nsICommandController)
        .doCommandWithParams("cmd_insertText",params);
    
    txtScript.focus();
    
    if (!select)
      return;
      
    var selStart = txtScript.selectionStart;  
    txtScript.setSelectionRange(selStart - text.length, selStart);
  },

  selectionStart    : -1,
  selectionEnd      : -1,
  selectionChanged  : false,
  
  hasContent        : false,
  contentChanged    : false,
  
  scrollChanged     : false,
  rowCount          : 1,
  
  checkScriptDelay  : 200,
  checkScriptTimer  : null,
  
  isClosing         : false,
  
  scriptName        : "unnamed"
}

var event = 
{
  
  onChannelCreated : function(sieve)
  { 
    event.onChannelReady(gCid);
  },
  
  onChannelReady : function(cid)
  {
    // We observe only our channel...
    if (gCid != cid)
      return;
              
    if (gEditorStatus.defaultScript)
    {
      event.onScriptLoaded(gEditorStatus.defaultScript);
      gEditorStatus.contentChanged = true;
      return;
    }
      
    
    var request = new SieveGetScriptRequest(gEditorStatus.scriptName);
    request.addGetScriptListener(event);
    request.addErrorListener(event);

    sivSendRequest(gSid,gCid,request);    
  },
  
  onChannelClosed : function(cid)
  {
    // some other channel died we don't care about that...
  },
  
  onChannelStatus : function(id,text)
  {
     sivSetStatus(id,text);
  },
  
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
    document.getElementById("sivContentEditor").editor.enableUndo(false);
    document.getElementById("sivContentEditor").value = script;
    document.getElementById("sivContentEditor").setSelectionRange(0, 0);
    document.getElementById("sivContentEditor").editor.enableUndo(true);
  
    UpdateCursorPos();
    UpdateLines();
    
    document.getElementById("sivContentEditor").focus();    
  },

  /**
   * @param {SievePutScriptResponse} response
   */
  onPutScriptResponse: function(response)
  {
    gEditorStatus.contentChanged = false;
    
    if (!gEditorStatus.isClosing)
      return

    if (!onWindowClose(true))
      return
            
    // just calling close is for some reason broken, so we use our helper...
    window.arguments[0].wrappedJSObject["close"]();   
  },

  /**
   * @param {SieveSimpleResponse} response
   */
  onError: function(response)
  {
    alert("FATAL ERROR:"+response.getMessage());
  },

  onTimeout: function()
  {
    sivDisconnect(1,"warning.timeout");
  },
  
  onDisconnect:function(response)
  {
    sivSetStatus(9);
  },
  
  observe : function(aSubject, aTopic, aData)
  {
    if (aTopic != "quit-application-requested")
      return;
    
      
    if (onWindowClose() == false)
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
        = document.getElementById("strings").getString("syntax.ok");

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
          = document.getElementById("strings").getString("syntax.quota");
          
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
                   .getChannel(gSid,gCid).getCompatibility()
                   .checkscript;

  if (canCheck)
  {
    // ... we use can the CHECKSCRIPT command
    request = new SieveCheckScriptRequest(script);
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

function onEditorKeyDown(event)
{
  // we need this bypass the default onKeyDown only for the tab key...
  if (event.keyCode != 9)
    return;
 
  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)
    return;
    
  gEditorStatus.insertString(String.fromCharCode(9));
           
  event.preventDefault();
  
  onInput();
  //event.stopPropagation();
}

function onWindowPersist()
{
  // we just mirror the open dialogs
  var args = {};
  
  if (gEditorStatus.contentChanged)
  {
    args["scriptBody"] = document.getElementById("sivContentEditor").value;
    args["contentChanged"] = gEditorStatus.contentChanged;
  }
    
  args["scriptName"] = gEditorStatus.scriptName;
  args["compile"] = document.getElementById('btnCompile').checked;
  args["account"] = gEditorStatus.account;  
  
  return args; 
}

function onWindowLoad()
{ 
        
  document.getElementById("sivContentEditor")
      .addEventListener("scroll", function() {onEditorScroll();},false);

  // add event listeners to Editor
  document.getElementById("sivContentEditor")
      .addEventListener("input",function() {onInput();},false);   
      
  document.getElementById("sivContentEditor")
      .addEventListener("mousemove",function() {onUpdateCursorPos(250);},false);
      
  document.getElementById("sivContentEditor")
      .addEventListener("keypress",function() {onUpdateCursorPos(50);},false);

  document.getElementById("sivContentEditor")
       .addEventListener("keydown", function(ev) { onEditorKeyDown(ev)},true);
  // hack to prevent links to be opened in the default browser window...
  document.getElementById("ifSideBar").
    addEventListener(
      "click",
      function(event) {onSideBarBrowserClick(event);},
      false);
      
  document.getElementById("sivWidgetEditor")
    .setAttribute("src","chrome://sieve/content/libs/libSieveDOM/SieveGui.html")
    
  document.getElementById("sivEditorStatus").contentWindow
    .onAttach(account,function() { onReconnectClick() });    

  var args = window.arguments[0].wrappedJSObject;
  
  // There might be a default or persisted script...
  if (args["scriptBody"])
    gEditorStatus.defaultScript = args["scriptBody"];
  
  
  gEditorStatus.account = args["account"];
  var account = (new SieveAccounts()).getAccount(gEditorStatus.account);
  
  gEditorStatus.checkScriptDelay = account.getSettings().getCompileDelay();
  
  gEditorStatus.scriptName = args["scriptName"];
  document.title = ""+args["scriptName"]+" - Sieve Filters";

  document.getElementById("lblErrorBar").firstChild.nodeValue
      = document.getElementById("strings").getString("syntax.ok");
    
  sivSetStatus(3,"status.loading");

  // Connect to the Sieve Object...  
  var sivManager = Cc["@sieve.mozdev.org/transport-service;1"]
                     .getService().wrappedJSObject; 
  
  gSid = sivManager.createSession(account.getKey());
  sivManager.addSessionListener(gSid,event);
  
  gCid = sivManager.createChannel(gSid);
  sivManager.openChannel(gSid,gCid);
    
  //preload sidebar...
  onSideBarHome();
  
  if (!args["compile"])
    args["compile"] = account.getSettings().hasCompileDelay();

  onErrorBar(args["compile"]);
  onSideBar(true);
  onSearchBar(false);
  /*onViewSource(true);*/

  Cc["@mozilla.org/observer-service;1"]
      .getService (Ci.nsIObserverService)
      .addObserver(event,"quit-application-requested", false);               
}

function onIgnoreOffline()
{
  // try to go online again
  try 
  {
    var oldSid  = gSid;   
               
    // Cid is removed, but try to reconnect...
    gCid = Cc["@sieve.mozdev.org/transport-service;1"]
               .getService().wrappedJSObject
               .createChannel(gSid);
               
    Cc["@sieve.mozdev.org/transport-service;1"]
               .getService().wrappedJSObject
               .closeChannel(oldSid);               
    
    // TODO: this is code exists twice remove me...
    if (gEditorStatus.hasContent == false)
    {
      sivSetStatus(3,"status.loading");
      
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


function onReconnectClick()
{
 
  gEditorStatus.defaultScript = document.getElementById("sivContentEditor").value;
  
  var account = (new SieveAccounts()).getAccount(gEditorStatus.account);
  
  sivSetStatus(3,"status.loading");

  // Connect to the Sieve Object...  
  var sivManager = Cc["@sieve.mozdev.org/transport-service;1"]
                     .getService().wrappedJSObject; 
  
  gSid = sivManager.createSession(account.getKey());
  sivManager.addSessionListener(gSid,event);
  
  gCid = sivManager.createChannel(gSid);
  sivManager.openChannel(gSid,gCid);   
}

function onDonate()
{
  var url = Cc["@mozilla.org/network/io-service;1"]
              .getService(Ci.nsIIOService)
              .newURI("https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=EAS576XCWHKTC", null, null)
              
  Cc["@mozilla.org/uriloader/external-protocol-service;1"]
    .getService(Ci.nsIExternalProtocolService)
    .loadUrl(url);
}

function onViewSource(visible)
{
  if (typeof(visible) == "undefined")
    visible = document.getElementById('btnViewSource').checked
  
  var deck = document.getElementById('dkView');
    
  if (visible)
  {
    // show Source
    deck.selectedIndex = 0;
    document.getElementById("btnViewSource").setAttribute('checked', 'true')
    
    document.getElementById("btnUndo").removeAttribute('disabled');
    document.getElementById("btnRedo").removeAttribute('disabled');
    document.getElementById("btnCut").removeAttribute('disabled');
    document.getElementById("btnCopy").removeAttribute('disabled');
    document.getElementById("btnPaste").removeAttribute('disabled'); 
    document.getElementById("btnCompile").removeAttribute('disabled');
    document.getElementById("btnSearchBar").removeAttribute('disabled');
    
    document.getElementById("sivContentEditor").value =
      document.getElementById("sivWidgetEditor").contentWindow.getSieveScript()
      
    document.getElementById("sivContentEditor").focus();    
    onInput();
    
    return;
  }
   
  document.getElementById("btnViewSource").removeAttribute('checked')
  
  document.getElementById("btnUndo").setAttribute('disabled',"true");
  document.getElementById("btnRedo").setAttribute('disabled',"true");
  document.getElementById("btnCut").setAttribute('disabled',"true");
  document.getElementById("btnCopy").setAttribute('disabled',"true");
  document.getElementById("btnPaste").setAttribute('disabled',"true"); 
  document.getElementById("btnCompile").setAttribute('disabled',"true");
  document.getElementById("btnSearchBar").setAttribute('disabled',"true");
  
  onSearchBarHide();
    
  deck.selectedIndex = 1;
  
  // Make GUI seem to be more agile...
  window.setTimeout( function() {updateWidgets()} ,0);    
}

function updateWidgets()
{
  try {
    var capabilities = Cc["@sieve.mozdev.org/transport-service;1"]
      .getService().wrappedJSObject
      .getChannel(gSid,gCid).extensions;
            
    document.getElementById("sivWidgetEditor").contentWindow.setSieveScript(
      document.getElementById("sivContentEditor").value,
      capabilities)
  }
  catch (ex){
    // TODO Display real error message....
    alert(ex);
  }
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

function onSave(script)
{
  if (typeof(script) === "undefined")
    script = new String(document.getElementById("sivContentEditor").value);
    
  var request = new SievePutScriptRequest(
                  new String(gEditorStatus.scriptName),
                  script);
  request.addPutScriptListener(event);
  request.addErrorListener(event);
  
  sivSendRequest(gSid,gCid,request);
}

function onWindowClose()
{   
  if (!gEditorStatus.isClosing)
  {
    var script = document.getElementById("sivContentEditor").value;
     
    // Update the editor window when needed...
    if (!document.getElementById('btnViewSource').checked)
    {
      script = document.getElementById("sivWidgetEditor").contentWindow.getSieveScript();
      gEditorStatus.contentChanged = true;
    }    
  
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
      {
        gEditorStatus.isClosing = true;
        onSave(script);
      }
   
      // ... and abort quitting if the user clicked on "Save" or "Cancel"
      if (result != 2)
        return false;                          
    }
  }
   
  try
  {
    Cc["@mozilla.org/observer-service;1"]
        .getService (Ci.nsIObserverService)
        .removeObserver(event,"quit-application-requested");
  }
  catch (ex) {}
  
  clearTimeout(gEditorStatus.checkScriptTimer);
    
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

  var inputStream = Cc["@mozilla.org/network/file-input-stream;1"]
                        .createInstance(Ci.nsIFileInputStream);
  var scriptableStream = Cc["@mozilla.org/scriptableinputstream;1"]
                             .createInstance(Ci.nsIScriptableInputStream);

  inputStream.init(filePicker.file, 0x01, parseInt("0444", 8), null);
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
  var filePicker = Cc["@mozilla.org/filepicker;1"]
			.createInstance(Ci.nsIFilePicker);

	filePicker.defaultExtension = ".siv";
	filePicker.defaultString = gEditorStatus.scriptName + ".siv";

	filePicker.appendFilter("Sieve Scripts (*.siv)", "*.siv");
	filePicker.appendFilter("Text Files (*.txt)", "*.txt");
	filePicker.appendFilter("All Files (*.*)", "*.*");
	filePicker.init(window, "Export Sieve Script", filePicker.modeSave);

	var result = filePicker.show();

	if ((result != filePicker.returnOK) && (result != filePicker.returnReplace))
		return;

	var file = filePicker.file;

	if (file.exists() == false)
		file.create(Ci.nsIFile.NORMAL_FILE_TYPE, parseInt("0644", 8));

	var outputStream = Cc["@mozilla.org/network/file-output-stream;1"]
			.createInstance(Ci.nsIFileOutputStream);

	outputStream.init(file, 0x04 | 0x08 | 0x20, parseInt("0644", 8), null);

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
    document.getElementById("boxSearchError").removeAttribute('hidden');
    return -1;
  }

  document.getElementById("boxSearchError").setAttribute('hidden','true');
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
  
  var replace = document.getElementById("txtReplace").value;
  gEditorStatus.insertString(replace,true);
  
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
         + gEditorStatus.scriptName
       + "</title>\r\n"
       + "<SieveScriptName>\r\n" 
         + gEditorStatus.scriptName
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
    sivDisconnect(6);
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
    sivDisconnect(1);       
  }
}

function sivDisconnect(state,message)
{
  
  if (state)
    sivSetStatus(state,message);
    
  if ((!gSid) || (!gCid))
    return;
    
  Cc["@sieve.mozdev.org/transport-service;1"]
      .getService().wrappedJSObject
      .closeChannel(gSid,gCid); 
}

function sivSetStatus(state, message)
{
  if (state == 0)
  {
    document.getElementById("sivEditorStatus").setAttribute('hidden','true');    
    document.getElementById('sivEditor').removeAttribute('collapsed');    
    return;
  }
    
  // The rest has to be redirected to the status window...
  document.getElementById('sivEditor').setAttribute('collapsed','true');    
  document.getElementById("sivEditorStatus").contentWindow.onStatus(state,message)
  document.getElementById("sivEditorStatus").removeAttribute('hidden');    
  
}
         
