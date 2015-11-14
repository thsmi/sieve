

function SieveAbstractLogger() {
	this._level = 0x00;
	this._prefix = "";
}

/**
 * 
 * @param {} message
 * @optional @param {} level
 */
SieveAbstractLogger.prototype.log
  = function (message, level)
{
	throw "Implement log()";
}


/**
 * Tests if the loglevel should log.
 *
 * @param {int} level
 *   the level which should be checked.
 * @return {boolean}
 *   true in case the log level is activated otherwise false
 */
SieveAbstractLogger.prototype.isLoggable
  = function (level)
{
	if (typeof(level) === "undefined")
	  return true;
	
	return !!(this.level() & level);
}

/**
 * Gets and sets the log level to the given bit mask.
 * Note that the loglevel is a bit mask, every bit in the 
 * bitmask corresponds to a special logger. 
 * 
 * In order to activate or deactivate a logger you need to 
 * get the level toggle the desired bits and set the new level.
 * 
 * @optional @param {int} level
 *   the desired loglevel as bit mask.
 * @return {int}
 *   the current log level
 */
SieveAbstractLogger.prototype.level
  = function (level)
{
	if (typeof(level) !== "undefined")
	  this._level = level;
	  
	return this._level;
}


/**
 * Gets and sets the loggers prefix. The prefix is appended to every logmessage 
 * 
 * @param {String} prefix
 *   the new prefix.
 * @return {String}
 *   the current prefix.
 */
SieveAbstractLogger.prototype.prefix
  = function (prefix)
{
	
  if (typeof(level) !== "undefined")
    this._prefix = prefix;
    
  return this._prefix;
}
