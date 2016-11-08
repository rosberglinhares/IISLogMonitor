[CmdletBinding()]
param
(
    [parameter(Mandatory=$true)]
    [ValidateSet('Start', 'Stop')]
    [string] $Action
)

function OnStart()
{
    "OnStart" > C:\Temp\PowershellOut.txt
}

function OnStop()
{
    "OnStop" > C:\Temp\PowershellOut.txt
}

switch ($Action)
{
    "Start" { OnStart }
    "Stop" { OnStop }
}