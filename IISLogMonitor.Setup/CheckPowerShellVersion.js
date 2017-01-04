var powershellMinimumRequiredVersion = "5.0";
var powershellCheckVersionCmd = "powershell -WindowStyle Hidden -Command \"$PSVersionTable.PSVersion -ge [Version]'" + powershellMinimumRequiredVersion + "'\"";

var objShell = new ActiveXObject("WScript.Shell");
var ObjExec = objShell.Exec(powershellCheckVersionCmd);
var powershellCmdOutput = ObjExec.StdOut.ReadAll();

if (powershellCmdOutput.substr(0, 4) == "True") {
    Session.Property("IS_POWERSHELL_VERSION_OK") = true.toString();
}