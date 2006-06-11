
//className.getName()
function SieveOptionsDiv(id,tag,element)
{
    return "<html:div class='"+tag+"'\n" 
    + "  onmouseover='document.getElementById(\""+id+"_opt\").style.display=\"block\";" 
    + "               document.getElementById(\""+id+"\").style.borderWidth=\"2px\"'\n"
    + "  onmouseout='document.getElementById(\""+id+"_opt\").style.display=\"none\";"
    + "              document.getElementById(\""+id+"\").style.borderWidth=\"0px\"'\n"
    + "  id='"+id+"' >\n"
    + "  <html:div class='"+tag+"Text'>\n"
    + element.toString()
    + "  </html:div>\n"
    + "  <html:div id='"+id+"_opt' class='SieveOptions' >\n"
    + "    <html:div class='SieveOptionsAdd' onclick='blubb();'></html:div>\n"
    + "    <html:div class='SieveOptionsDelete' onclick='blubb();'></html:div>\n"
    + "  </html:div>\n"
    + "</html:div>\n";  
}