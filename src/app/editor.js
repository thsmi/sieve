/* global CodeMirror */

var editor = null;

/*CodeMirror.on(window, "resize", function() {
  document.body.getElementsByClassName("CodeMirror-fullscreen")[0]
    .CodeMirror.getWrapperElement().style.height = winHeight() + "px";
});*/

editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  lineNumbers : true,
  lineWrapping: true,

  theme : "eclipse",
  matchBrackets : true,
  
  inputStyle : "contenteditable"
  
});

var charWidth = editor.defaultCharWidth(), basePadding = 4;
editor.on("renderLine", function(cm, line, elt) {
  var off = CodeMirror.countColumn(line.text, null, cm.getOption("tabSize")) * charWidth;
  elt.style.textIndent = "-" + off + "px";
  elt.style.paddingLeft = (basePadding + off) + "px";
});
editor.refresh();


//hlLine = editor.addLineClass(0, "background", "activeline");

//editor.on("cursorActivity", function() { onActiveLineChange(); });        
//editor.on("change", function() { onChange(); });   