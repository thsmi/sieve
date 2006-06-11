
//className.getName()
function SieveOptionsDiv(id,tag,element)
{
    return "<html:div class='"+tag+"'\n" 
    + "  onmouseover='document.getElementById(\""+id+"_opt\").style.display=\"block\";'\n"
    + "  onmouseout='document.getElementById(\""+id+"_opt\").style.display=\"none\";'\n" 
    + "  id='"+id+"' >\n" 
    + "  <html:div class='"+tag+"Text'>\n"
    + element.toString()
    + "  </html:div>\n"
    + "  <html:div id='"+id+"_opt' class='SieveOptions' >\n"
    + "    <html:div class='SieveOptionsAdd' onclick='blubb();' />\n"
    + "    <html:div class='SieveOptionsDelete' onclick='blubb();' />\n"
    + "  </html:div>\n"
    + "</html:div>\n";  
}

