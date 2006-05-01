// This is our custom view, based on the treeview interface

function SievePrefTreeView()
{
	// Load all the Libraries we need...
	var jsLoader = Components
										.classes["@mozilla.org/moz/jssubscript-loader;1"]
										.getService(Components.interfaces.mozIJSSubScriptLoader);
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/sievelib/SieveAccounts.js");
	
  this.sieveAccounts = new SieveAccounts();    
  this.accounts = this.sieveAccounts.getAccounts();
  this.rowCount = this.accounts.length;
}

SievePrefTreeView.prototype.update
	= function(rules)
{
    this.accounts = this.sieveAccounts.getAccounts();
	this.rowCount = this.accounts.length;
}

SievePrefTreeView.prototype.getCellValue
	= function(row,column)
{
    return "";
}

SievePrefTreeView.prototype.getCellText 
	= function(row,column)
{
    //consoleService.logStringMessage(row+"/"+column.id+"/"+column+"/"+column.cycler+"/"+column.type);
    
    if (column.id == "namecol") 
        return this.accounts[row].getDescription();
    else 
        return "";         
}
    
SievePrefTreeView.prototype.setTree
	= function(treebox){ this.treebox = treebox; }
		
SievePrefTreeView.prototype.isContainer
	= function(row){ return false; }

SievePrefTreeView.prototype.isSeparator
	= function(row){ return false; }

SievePrefTreeView.prototype.isSorted
	= function(row){ return false; }
	
SievePrefTreeView.prototype.getLevel
	= function(row){ return 0; }

SievePrefTreeView.prototype.getImageSrc
	= function(row,column)
{
    if (column.id == "namecol")
    	return null; 
    
    if (this.accounts[row].isEnabled())
    	return "chrome://sieve/content/images/active.png"
    else
    	return "chrome://sieve/content/images/passive.png"
}
	
SievePrefTreeView.prototype.getRowProperties
	= function(row,props){}
	
SievePrefTreeView.prototype.getCellProperties
	= function(row,col,props){}
	
SievePrefTreeView.prototype.getColumnProperties
	= function(colid,col,props){}

SievePrefTreeView.prototype.cycleHeader
	= function(col){}
	
SievePrefTreeView.prototype.cycleCell
    = function(row, col)
{
    this.accounts[row].setEnabled( ! this.accounts[row].isEnabled())
}

SievePrefTreeView.prototype.getAccount
    = function(row) { return this.accounts[row]; }
