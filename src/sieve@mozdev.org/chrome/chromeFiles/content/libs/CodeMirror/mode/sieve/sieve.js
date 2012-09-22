/*
 * The content of this file is licenced. You may obtain a copy of the 
 * license at http://sieve.mozdev.org or request it via email from the author. 
 *
 * Do not remove or change this comment.
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *   
 * Contributor(s):
 *   
 */

CodeMirror.defineMode("sieve", function(config) {
  
  function words(aWords) {
    var obj = {};
    for (var i = 0; i < aWords.length; ++i)
      obj[aWords[i]] = true;
    return obj;
  }
  
  var keywords = words(["if","elsif","else","stop","require"]);
  var atoms = words(["true","false","not"]);
  var indentUnit = config.indentUnit;
  
  function tokenBase(stream, state) {

    var ch = stream.next();

    switch (ch) {
      case "/" :
        if (stream.eat("*") == false)
          break;

        state.tokenize = tokenCComment;
        return tokenCComment(stream, state);
        
      case "#" :
        stream.skipToEnd();
        return "comment";
        
      case "\"" :
        state.tokenize = tokenString(ch);
        return state.tokenize(stream, state);      
      
      case "(":
       state._indent.push("("); 
      case "{" :
        state._indent.push("{");
        return null;
       
      case ")" :
        state._indent.pop();
      case "}" :
        state._indent.pop();
        return null;
           
      case "," :
      case ";" :
        return null;
      
      // ":" (ALPHA / "_") *(ALPHA / DIGIT / "_")
      case ":" :
        stream.eatWhile(/[a-zA-Z_]/);
        stream.eatWhile(/[a-zA-Z0-9_]/);
      
        return "operator";  
        
    }
    
    // 1*DIGIT "K" / "M" / "G"
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\d]/);
      stream.eat(/[KkMmGg]/)
      return "number";
    }    
    
    stream.eatWhile(/\w/);
    //stream.eatWhile(/[\w\$_]/);
    
    var cur = stream.current();
    
    // "text:" *(SP / HTAB) (hash-comment / CRLF)
    // *(multiline-literal / multiline-dotstart)
    // "." CRLF
    if ((cur == "text") && stream.eat(":"))
    {
      state.tokenize = tokenMultiLineString;
      return "string";
    }
    
    if (keywords.propertyIsEnumerable(cur))
      return "keyword";

    if (atoms.propertyIsEnumerable(cur))
      return "atom"; 
      
    return null;
  }

  function tokenMultiLineString(stream, state)
  {
    state._multiLineString = true;
    // the first line is special it may contain a comment
    if (!stream.sol()) {
      stream.eatSpace();
      
      if (stream.peek() == "#") {
        stream.skipToEnd();
        return "comment";        
      }
 
      stream.skipToEnd();
      return "string";
    }
    
    if ((stream.next() == ".")  && (stream.eol()))
    {
      state._multiLineString = false;
      state.tokenize = tokenBase;
    }
    
    return "string";   
  }
  
  function tokenCComment(stream, state) {
    var maybeEnd = false, ch;
    while ((ch = stream.next()) != null) {
      if (maybeEnd && ch == "/") {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped)
          break;
        escaped = !escaped && ch == "\\";
      }
      if (!escaped) state.tokenize = tokenBase;
      return "string";
    };
  }

    
  return {
    startState: function(base) {

      return {tokenize: tokenBase,
              baseIndent: base || 0,
              _indent: [],
              };
    },

    token: function(stream, state) {
            
      if (stream.eatSpace())
        return null;
        
      return (state.tokenize || tokenBase)(stream, state) 
      
    },

    indent: function(state, textAfter)
    {
      var length = state._indent.length;
      if (textAfter && (textAfter[0] == "}"))
        length--;
      
      if (length <0)
        length = 0;
      
      return length * indentUnit;      
    },

    electricChars: "}"
  };
});

CodeMirror.defineMIME("application/sieve", "sieve");
