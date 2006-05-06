// This is our custom view, based on the treeview interface

var consoleService 
    = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
    
/*
 -> onChange
*/
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
}

SieveTreeView.prototype.getCellValue
	= function(row,column)
{
/*    consoleService.logStringMessage("xxx"+row+"/"+column.id+"/"+this.rules[row][1]);
    return this.rules[row][1];*/
    return "";
}

SieveTreeView.prototype.getCellText 
	= function(row,column)
{
    //consoleService.logStringMessage(row+"/"+column.id+"/"+column+"/"+column.cycler+"/"+column.type);
    
    if (column.id == "namecol") 
        return this.rules[row][0];
    else 
        return "";//this.rules[row][1];
         
/*	if ((new String(column.id)).indexOf("activeColumn") == 0)
	{
		return new Boolean(this.rules[row][1]);
	}
	else
	{
		return new String(this.rules[row][0]);
	}	*/
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
    
    if (this.rules[row][1])
    	return "chrome://sieve/content/images/active.png"
    else
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
    this.listener.onCycleCell(row,col,this.rules[row][0],this.rules[row][1]);
 		this.selection.select(row);
}