if (typeof Components === 'undefined')
  window["Components"] = {}
  
if (!Components.classes)
  Components["classes"] = {}
  
if (!Components.utils) {
  Components["utils"] = {}
  
  Components.utils.import = function() {};
  
}