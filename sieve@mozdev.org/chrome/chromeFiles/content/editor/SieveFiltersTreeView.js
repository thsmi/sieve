/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
// This is our custom view, based on the treeview interface
    
function SieveTreeView(rules, listener)
{
  this.listener     = listener;
  this.rules        = rules;
  this.rowCount     = rules.length;
}

SieveTreeView.prototype.update
    = function(rules)
{
  this.rules 		= rules;
  this.rowCount	= this.rules.length;
    
  this.rules.sort( function(a,b){ 
      if (a.script.toLowerCase() > b.script.toLowerCase()) return 1; 
      if (a.script.toLowerCase() < b.script.toLowerCase()) return -1;
      return 0;});
}

SieveTreeView.prototype.getCellValue
    = function(row,column)
{
  if (column.id == "namecol") 
    return this.rules[row].script;
  else
    return this.rules[row].active;
}

SieveTreeView.prototype.getCellText 
    = function(row,column)
{
  if (column.id == "namecol") 
    return this.rules[row].script;
  else 
    return "";
}

SieveTreeView.prototype.setTree
    = function(treebox){ this.treebox = treebox; }

SieveTreeView.prototype.isContainer
    = function(row){ return false; }

SieveTreeView.prototype.isSeparator
    = function(row){ return false; }

SieveTreeView.prototype.isSorted
    = function(row){ return false; }

SieveTreeView.prototype.getLevel
    = function(row){ return 0; }

SieveTreeView.prototype.getImageSrc
    = function(row,column)
{
  if (column.id == "namecol")
    return null;
  
  if (this.rules[row].active)
    return "chrome://sieve/content/images/active.png"
  
  return "chrome://sieve/content/images/passive.png"
}

SieveTreeView.prototype.getRowProperties
    = function(row,props){}

SieveTreeView.prototype.getCellProperties
    = function(row,col,props){}

SieveTreeView.prototype.getColumnProperties
    = function(colid,col,props){}

SieveTreeView.prototype.cycleHeader
    = function(col){}

SieveTreeView.prototype.cycleCell
    = function(row, col)
{    
  this.listener.onCycleCell(row,col,this.rules[row].script,this.rules[row].active);
  this.selection.select(row);
}
