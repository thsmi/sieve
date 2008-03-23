
  // TODO make sure that the scripts are imported only once.
  // TODO place imports in the corresponding files like the header import in c...
  
  // Load all the Libraries we need...
  var jsLoader = Components
                   .classes["@mozilla.org/moz/jssubscript-loader;1"]
                   .getService(Components.interfaces.mozIJSSubScriptLoader);
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveWatchDog.js");
    
  // we are done importing script, so free ... 
  // ... the loader inorder to prevent XPCOM leaks
  jsLoader = null;    


var gSieve = null;
var gSieveWatchDog = null

var gCompileTimeout = null;
var gCompile = null
var gCompileDelay = null;

var gChanged = false;

var gBackHistory = new Array();
var gForwardHistory = new Array();

var gPrintSettings = null;

var event = 
{
  onGetScriptResponse: function(response)
  {		
    document.getElementById("txtScript").value = response.getScriptBody();
    UpdateCursorPos();
  },  
	
  onPutScriptResponse: function(response)
  {    
    gChanged = false;
       
    clearTimeout(gCompileTimeout);
    gSieve.removeWatchDogListener();
    close();
  },
	
  onError: function(response)
  {
    alert("FATAL ERROR:"+response.getMessage());
  },
  
  onTimeout: function()
  {
    alert("A Timeout occured");
  },

  onIdle: function ()
  { 
    // as we send a keep alive request, we don't care
    // about the response...
    var request = new SieveCapabilitiesRequest();
    request.addErrorListener(event);
    
    gSieve.addRequest(request);
  },
    
  onWatchDogTimeout : function()
  {
    // call sieve object indirect inoder to prevent a 
    // ring reference
    gSieve.onWatchDogTimeout();
  }     
}

function onCompile()
{
  var lEvent = 
  {
    onPutScriptResponse: function(response)
    {
      // we need no handlers thus we don't care if the call succseeds
      gSieve.addRequest(new SieveDeleteScriptRequest("TMP_FILE_DELETE_ME"));
      
      document.getElementById("lblErrorBar").firstChild.nodeValue
        = "Server reports no script errors...";
        
      document.getElementById("imgErrorBar").src
        = "chrome://sieve/content/images/syntax-ok.png";        
    },
    	
    onError: function(response)
    {
      document.getElementById("lblErrorBar").firstChild.nodeValue            
         = response.getMessage();    		

      document.getElementById("imgErrorBar").src
        = "chrome://sieve/content/images/syntax-error.png";
      // the server did not accept our script therfore we can't delete it...   		
    },
    
    onTimeout: function()
    {
      alert("A Timeout occured");
    }
  }

  var request = new SievePutScriptRequest(
                  "TMP_FILE_DELETE_ME",
                  new String(document.getElementById("txtScript").value));
  request.addPutScriptListener(lEvent);
  request.addErrorListener(lEvent);
  
  gSieve.addRequest(request);
}



function onInput()
{
  if (gChanged == false)
    document.getElementById("sbChanged").label = "Changed";
    
  gChanged = true;
  
  
  // on every keypress we reset the timeout
  if (gCompileTimeout != null)
  {
    clearTimeout(gCompileTimeout);
    gCompileTimeout = null;
  }
            
  if (gCompile)
    gCompileTimeout = setTimeout("onCompile()",gCompileDelay);    
}

function onLoad()
{
  // script laden
  gSieve = window.arguments[0]["sieve"];
  
  gSieveWatchDog = new SieveWatchDog();
  gSieveWatchDog.addListener(event);
  gSieve.addWatchDogListener(gSieveWatchDog);
  
  gCompile = window.arguments[0]["compile"];        
  gCompileDelay = window.arguments[0]["compileDelay"];
    
  document.getElementById("txtName").value = window.arguments[0]["scriptName"];    
  
  if (window.arguments[0]["scriptBody"] != null)
  {
    document.getElementById("txtScript").value = window.arguments[0]["scriptBody"];    
  }
  else
  {
    var request = new SieveGetScriptRequest(window.arguments[0]["scriptName"]);
    request.addGetScriptListener(event);
    request.addErrorListener(event);

    gSieve.addRequest(request);
  }        

  // hack to prevent links to be opened in the default browser window...       
  document.getElementById("ifSideBar").
    addEventListener("click",onSideBarBrowserClick,false);    
  
  onSideBarGo();
  
  document.getElementById("btnCompile").checked = gCompile;
  onErrorBar(document.getElementById("btnCompile").checked);
  
  onSideBar();
  
  document.getElementById("txtScript").focus();
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

function onSideBarLoaded(event)
{
  onSideBarLoading(false);
/*  var result ="";
  for (var i in event)
  {
    result += "." + i + " = " + event[i] + "<br>";
  }
  
  alert(result);*/
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
  
  if (uri == null)
    uri = "http://sieve.mozdev.org/reference/en/index.html"
    
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

  if (document.getElementById("ifSideBar").addEventListener)
    document.addEventListener("DOMContentLoaded", onSideBarLoaded, false);
         
  document.getElementById("ifSideBar").setAttribute('src',uri);
}



function onSave()
{
  var request = new SievePutScriptRequest(
                  new String(document.getElementById("txtName").value),
                  new String(document.getElementById("txtScript").value));
  request.addPutScriptListener(event);
  request.addErrorListener(event);

  gSieve.addRequest(request);
}

function onClose()
{
  if (gChanged == false)
  {
    gSieve.removeWatchDogListener();
    return true;    
  }
    

  var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                          .getService(Components.interfaces.nsIPromptService);
                          
  var result = prompts.confirm(window, "Title", "Do you want to save changes?");
    
  if (result != true)
  {
    gSieve.removeWatchDogListener();
    return true;
  }
    
  onSave();
    
  return false;
}

function onImport()
{
    var filePicker   = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);

    filePicker.appendFilter("Sieve Scripts (*.siv)", "*.siv");
    filePicker.appendFilter("All Files (*.*)", "*.*");
    filePicker.init(window, "Import Sieve Script", filePicker.modeOpen);

    // If the user selected a style sheet
    if(filePicker.show() != filePicker.returnOK)
        return
        
    var inputStream      = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
    var scriptableStream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);

    inputStream.init(filePicker.file, 0x01, 00444, null);
    scriptableStream.init(inputStream);

    // todo insert imported snipplet instead of replacing the whole script
    var script  = scriptableStream.read(scriptableStream.available());

    scriptableStream.close();
    inputStream.close();
    
    // Find the Start and End Position  
    var el = document.getElementById("txtScript");
    var start = el.selectionStart; 
    var end   = el.selectionEnd; 
 
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
    filePicker.defaultString    = document.getElementById("txtName").value+".siv";

    filePicker.appendFilter("Sieve Scripts (*.siv)", "*.siv");
    filePicker.appendFilter("Text Files (*.txt)", "*.txt");
    filePicker.appendFilter("All Files (*.*)", "*.*");
    filePicker.init(window, "Export Sieve Script", filePicker.modeSave);

    var result = filePicker.show();
    
    if ((result != filePicker.returnOK) && (result != filePicker.returnReplace))
        return
        
    var file = filePicker.file;
    
    if(file.exists() == false)
        file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 00444);

    var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                            .createInstance(Components.interfaces.nsIFileOutputStream);
                            
    outputStream.init(file, 0x04 | 0x08 | 0x20, 00444, null);

    var data = document.getElementById("txtScript").value;
    outputStream.write(data, data.length);
    outputStream.close();
}

function onSideBarClose()
{
  document.getElementById("btnReference").removeAttribute('checked');
  onSideBar(false);
}

function onErrorBarClose()
{ 
  document.getElementById("btnCompile").removeAttribute('checked'); 
  onErrorBar(false);  
}

function onErrorBar(state)
{  
  if (state == true)
  {
    document.getElementById('spErrorBar').removeAttribute('hidden');
    document.getElementById('vbErrorBar').removeAttribute('hidden');
    gCompile = true;
    onCompile();
    return 
  }
  
  clearTimeout(gCompileTimeout);
  gCompileTimeout = null;
    
  gCompile = false;
  document.getElementById("vbErrorBar").setAttribute('hidden','true');
  document.getElementById('spErrorBar').setAttribute('hidden','true');
  
  return;
}

function onSideBar()
{  
  if (document.getElementById("btnReference").getAttribute("checked"))
  {
    document.getElementById('splitter').removeAttribute('hidden');
    document.getElementById('vbSidebar').removeAttribute('hidden');    
    return;    
  }

  document.getElementById('splitter').setAttribute('hidden','true');
  document.getElementById('vbSidebar').setAttribute('hidden','true');
  return;   
}

var gUpdateScheduled = false;

function UpdateCursorPos()
{
  var el = document.getElementById("txtScript");
  var lines = el.value.substr(0,el.selectionStart).split("\n");
  
  document.getElementById("sbCursorPos")
          .label = lines.length +":" +(lines[lines.length-1].length +1);
          
  if(el.selectionEnd != el.selectionStart)
  {
    lines = el.value.substr(0,el.selectionEnd).split("\n");
    document.getElementById("sbCursorPos")
          .label += " - " + lines.length +":" +(lines[lines.length-1].length +1);
  }
    
  
  gUpdateScheduled=false;
}


function onUpdateCursorPos(timeout)
{
  if (gUpdateScheduled)
    return;

  setTimeout(function () {UpdateCursorPos();gUpdateScheduled=false;},200);

  gUpdateScheduled = true; 
}

function onBtnChangeView()
{
 /* var deck = document.getElementById("dkView");
  
  if (deck.selectedIndex == 0)
    document.getElementById("dkView").selectedIndex = 1;
  else
    document.getElementById("dkView").selectedIndex = 0;*/
  
}

function onPrint()
{  
  var statusFeedback;
  statusFeedback = Components.classes["@mozilla.org/messenger/statusfeedback;1"].createInstance();
  statusFeedback = statusFeedback.QueryInterface(Components.interfaces.nsIMsgStatusFeedback);

  // we print in xml this means any specail charaters have to be html entities...
  // ... so we need a dirty hack to convert all entities...
  
  var script = document.getElementById("txtScript").value;
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
}


