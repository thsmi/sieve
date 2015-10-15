"use strict"

if (!net)
  var net = {}
  
if (!net.tschmid)
  net.tschmid = {};
  
if (!net.tschmid.sieve)
  net.tschmid.sieve = {};

if (!net.tschmid.sieve.editor)
  net.tschmid.sieve.editor = {};

if (!net.tschmid.sieve.editor.text)
  net.tschmid.sieve.editor.text = {};  
  
if (!net.tschmid.sieve.editor.text.service)
  net.tschmid.sieve.editor.text.service = {};  
  
// We need two global variables for backward compatiblity...
// they may be removed as soon as the editor communication is migrated to post message
var editor = null;
var onActiveLineChange = null;


/**
 * Glues two frame via html5 post message.
 **/
  
(function() {

  var hlLine = null;
  var listener = {}
  
  var broker = new net.tschmid.sieve.Broker();  	
  broker.setListener(function(event, data) { listener.onMessage(event, data) });  
		
  
  function winHeight() {
    return window.innerHeight || (document.documentElement || document.body).clientHeight;
  }
  
  function setFullScreen(cm) {
    var wrap = cm.getWrapperElement();
    wrap.className += " CodeMirror-fullscreen";
    wrap.style.height = winHeight() + "px";
    document.documentElement.style.overflow = "hidden";
    cm.refresh();
  }        
    
  // This function is called externaly upon reloading and updating scripts  
  onActiveLineChange = function() 
  {
    var cur = editor.getLineHandle(editor.getCursor().line);
        
    if (cur == hlLine)
      return;
    	
    editor.removeLineClass(hlLine, "background", "activeline");
    hlLine = editor.addLineClass(cur, "background", "activeline");
  }    	  

  function onChange() {
  	broker.sendMessage("onChange");
  }

  function findString(token, isCaseSensitive, isReverse) { 
  	
    // ... convert to lowercase, if the search is not case sensitive...
  
    function maxCursor(start,end)
    {
      if (start.line > end.line)
        return start

      if (start.line < end.line)
        return end;
    
      // start.line == end.line
      if (start.ch > end.ch)
        return start;
      
      return end;
    }
  
    function minCursor(start,end)
    {
      if (start.line <end.line)
        return start

      if (start.line > end.line)
        return end;
    
      // start.line == end.line
      if (start.ch > end.ch)
        return end;
      
      return start;
    }
  
    var start = editor.getCursor(true);
    var end = editor.getCursor(false);
  
    var cursor = editor.getSearchCursor(
      token,
      isReverse ? minCursor(start,end) : maxCursor(start,end),
      !isCaseSensitive);
  
    if (!cursor.find(isReverse))
    { 
      // warp search at top or bottom
      cursor = editor.getSearchCursor(
        token,
        isReverse ? {line: editor.lineCount() - 1} : {line: 0, ch: 0},
        !isCaseSensitive);
    
      if (!cursor.find(isReverse))
        return;
    }
  
    if (isReverse)
      editor.setSelection(cursor.from(), cursor.to());
    else
      editor.setSelection(cursor.to(), cursor.from());

    broker.sendMessage("onStringFound", true);  
    return;
  }
  
  function replaceString(oldToken, newToken, isCaseSensitive, isReverse) {  	
  	
    if (isCaseSensitive) 
    {
      if (editor.getSelection() != oldToken)
        findString(oldToken, isSensitive, isReverse);
      
      if (editor.getSelection() != oldToken)
        return;
    }
    
    if (!isCaseSensitive)
    {
      if (editor.getSelection().toLowerCase() != oldToken.toLowerCase())
        findString(oldToken, isCaseSensitive, isReverse);
      
      if (editor.getSelection().toLowerCase() != oldToken.toLowerCase())
        return;
    }

    editor.replaceSelection(newToken);    

    onChange();
  }
  
  function getStatus() {
	var status = {};
	  
	status.canDelete = editor.somethingSelected();
	status.canUndo = (editor.historySize().undo > 0);
	  
	broker.sendMessage("onGetStatus", status);
    return;  	
  }
  
  function loadScript(data) {
  	// Load a new script. It will discard the current script
  	// the history and the cursorposition are reset to defaults.
  	
    editor.setValue(data);
    editor.setCursor({line:0,ch:0});
    editor.clearHistory();
      
    // ensure the active line cursor changed...
    onActiveLineChange();
      
    broker.sendMessage("onScriptLoaded");
  }
  
  function setScript(data) {
    editor.setValue(data);
  }
  
  function getScript() {
	  	
	  // Get the current script...
	  var script = editor.getValue();
	  // ... and ensure the line endings are sanatized
	  script = script.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g,"\r\n");
	  	
	  broker.sendMessage("onGetScript", script);  	
  }
  
  function replaceSelection(data) {
    editor.replaceSelection(data);
	return;
  }
  
  function selectAll() {
    editor.setSelection({line:0,ch:0},{line: editor.lineCount() - 1});  	
  	return;
  }
  
  function undo() {
  	editor.undo();
  	return;
  }
  
  function redo() {
  	editor.redo();
  	return;
  }
  
  function setOptions(options) {

    if (options.indention && options.indention.width)
      editor.setOption("indentUnit", options.indention.width);
    
  	if (options.indention && ("policy" in options.indention)) 
  	  editor.setOption("indentWithTabs", (options.indention.policy == 1));

  	if (options.tab && options.tab.width)
      editor.setOption("tabSize", options.tab.width);
    
    if (options.tab && ("policy" in options.tab)) {    
    	
      if (options.tab.policy == 1) {
      	// Keep tabs as they are
        editor.setOptions("extraKeys", null);
      } 
      else {
        // insert spaces instead of tabs
        editor.setOption("extraKeys", {
          Tab: function(cm) {
            var spaces = Array(cm.getOption("tabSize") + 1).join(" ");
            cm.replaceSelection(spaces);
          }
        });              	
      }
    }       
  }

  	 	 
  listener.onMessage = function(event, data) {  
  	
  	if (event == "focus") {
      editor.focus();
      return;
  	}

  	  	// Updates the current script. The history as well as 
  	// the cursor position is maintained.

  	if (event == "loadScript")
  	  return loadScript(data);

	if (event == "setScript")
	  return setScript(data);
		
	if (event == "getScript")	    
	  return getScript();
	  
	if (event == "replaceSelection")
	  return replaceSelection(data);
	  
	if (event == "selectAll")
	  return selectAll();
	  
	if (event == "undo")
	  return undo();
	  
	if (event == "redo")	  
	  return redo();
	  
	if (event == "replaceString")	
	  return replaceString(data.oldToken, data.newToken, data.isSensitive, data.isReverse);
	  
	if (event == "findString")
	  return findString(data.token, data.isCaseSensitive, data.isReverse);
	
	if (event == "getStatus")
	  return getStatus();
	  
	if (event == "setOptions")
	  return setOptions(data);
  };

  // Export the constructor...
  net.tschmid.sieve.editor.text.service.init = function() {
  	
    CodeMirror.on(window, "resize", function() {
      document.body.getElementsByClassName("CodeMirror-fullscreen")[0]
        .CodeMirror.getWrapperElement().style.height = winHeight() + "px";
    });
    
    editor = CodeMirror.fromTextArea(document.getElementById("code"), {
      lineNumbers : true,
      theme : "eclipse",
      matchBrackets : true,
      
      inputStyle : "contenteditable"
      
    });
  
    setFullScreen(editor,true);
    
    hlLine = editor.addLineClass(0, "background", "activeline");
  
    editor.on("cursorActivity", function() { onActiveLineChange(); });        
    editor.on("change", function() { onChange(); });       
        
  };
  
}());
  