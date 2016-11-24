[CmdletBinding()]
param
(
    [parameter(Mandatory=$true)]
    [ValidateSet('Start', 'Stop')]
    [string] $Action
)

$winApiKernel32Code = @'
    // http://www.pinvoke.net/default.aspx/kernel32/FreeConsole.html
    [DllImport("kernel32.dll", SetLastError=true, ExactSpelling=true)]
    public static extern bool FreeConsole();

    // http://www.pinvoke.net/default.aspx/kernel32/AttachConsole,.html
    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool AttachConsole(uint dwProcessId);

    // http://www.pinvoke.net/default.aspx/kernel32/SetConsoleCtrlHandler.html
    // PS: the ConsoleCtrlDelegate delegate was omitted because it will not be necessary
    [DllImport("kernel32.dll")]
    public static extern bool SetConsoleCtrlHandler(uint HandlerRoutine, bool Add);

    // http://www.pinvoke.net/default.aspx/kernel32/GenerateConsoleCtrlEvent.html
    [DllImport("kernel32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GenerateConsoleCtrlEvent(uint dwCtrlEvent, uint dwProcessGroupId);

    public const UInt32 CTRL_C_EVENT = 0;
    public const UInt32 CTRL_BREAK_EVENT = 1;

    // http://www.pinvoke.net/default.aspx/kernel32/GetLastError.html
    [DllImport("kernel32.dll")]
    public static extern uint GetLastError();
'@

Set-Variable Kernel32 -Option Constant -Value (Add-Type -MemberDefinition $winApiKernel32Code -Namespace "WinApi" -Name "Kernel32" -PassThru)
Set-Variable WinApiNoHandlerRoutine -Option Constant -Value $null
Set-Variable WinApiIgnoreCtrlC -Option Constant -Value $true
Set-Variable WinApiGenerateToAllProcessesThatShareTheConsole -Option Constant -Value 0

Set-Variable LogsPath -Option Constant -Value (Join-Path $PSScriptRoot "Logs")

Set-Variable ElasticSearchExecutableName -Option Constant -Value "elasticsearch.bat"
Set-Variable ElasticSearchExecutablePath -Option Constant -Value ($PSScriptRoot | Join-Path -ChildPath "elasticsearch-5.0.0\bin" | Join-Path -ChildPath $ElasticSearchExecutableName)
Set-Variable ElasticSearchLogPath -Option Constant -Value (Join-Path $LogsPath "ElasticSearchOut.txt")

Set-Variable LogStashRootPath -Option Constant -Value (Join-Path $PSScriptRoot "logstash-5.0.0")
Set-Variable LogStashExecutableName -Option Constant -Value "logstash.bat"
Set-Variable LogStashExecutableRelativePath -Option Constant -Value ".\bin\$LogStashExecutableName"
Set-Variable LogStashConfigFileRelativePath -Option Constant -Value ".\config\logstash.conf"
Set-Variable LogStashLogPath -Option Constant -Value (Join-Path $LogsPath "LogStashOut.txt")

Set-Variable FileBeatRootPath -Option Constant -Value (Join-Path $PSScriptRoot "filebeat-5.0.0-windows-x86_64")
Set-Variable FileBeatExecutableName -Option Constant -Value "filebeat.exe"
Set-Variable FileBeatLogPath -Option Constant -Value (Join-Path $LogsPath "FileBeatOut.txt")

Set-Variable KibanaExecutableName -Option Constant -Value "kibana.bat"
Set-Variable KibanaExecutablePath -Option Constant -Value ($PSScriptRoot | Join-Path -ChildPath "kibana-5.0.0-windows-x86\bin" | Join-Path -ChildPath $KibanaExecutableName)
Set-Variable KibanaLogPath -Option Constant -Value (Join-Path $LogsPath "KibanaOut.txt")

Set-Variable StopProcessTimeoutMilliseconds -Option Constant -Value 5000

function OnStart()
{
    <#
        1. If RedirectStandardInput is used, the PowershellScriptAsService.exe will freeze in the Process#StandardError.ReadToEnd() method.

        2. The '< nul' expression is for avoid the 'Terminate batch job' user input confirmation.
    #>

    Start-Process $ElasticSearchExecutablePath "> `"$ElasticSearchLogPath`" < nul"

    Set-Location $LogStashRootPath
    Start-Process $LogStashExecutableRelativePath "-f `"$LogStashConfigFileRelativePath`" > `"$LogStashLogPath`" < nul"

    Set-Location $FileBeatRootPath
    Start-Process $FileBeatExecutableName "> `"$FileBeatLogPath`""

    Start-Process $KibanaExecutablePath "> `"$KibanaLogPath`" < nul"
}

function OnStop()
{
    function Stop-ProcessByCtrlC([string] $ExecutableName)
    {
        function Throw-WinApiError([string] $FunctionName)
        {
            $lastError = $Kernel32::GetLastError()
            throw "Error stopping '$ExecutableName': $FunctionName error code = $lastError"
        }

        $cimProcess = Get-CimInstance Win32_Process | where CommandLine -CLike "*$ExecutableName*"

        if (-not $cimProcess)
        {
            throw "Could not find a process corresponding to '$ExecutableName'"
        }

        $process = Get-Process -Id $cimProcess.ProcessId

        # To attach to another console, this process must detach itself from its console
        if (-not $Kernel32::FreeConsole())
        {
            Throw-WinApiError("FreeConsole")
        }

        if (-not $Kernel32::AttachConsole($process.Id))
        {
            Throw-WinApiError("AttachConsole")
        }

        # Once attached to the target process console, avoid listening for Ctrl+C signals to this process, or else it would be killed.
        if (-not $Kernel32::SetConsoleCtrlHandler($WinApiNoHandlerRoutine, $WinApiIgnoreCtrlC))
        {
            Throw-WinApiError("SetConsoleCtrlHandler")
        }

        if (-not $Kernel32::GenerateConsoleCtrlEvent($Kernel32::CTRL_C_EVENT, $WinApiGenerateToAllProcessesThatShareTheConsole))
        {
            Throw-WinApiError("GenerateConsoleCtrlEvent")
        }

        if (-not $process.WaitForExit($StopProcessTimeoutMilliseconds))
        {
            throw "Could not stop the process { Id = $($process.Id), CommandLine = '$($cimProcess.CommandLine)' }"
        }
    }

    Stop-ProcessByCtrlC($KibanaExecutableName)
    Stop-ProcessByCtrlC($FileBeatExecutableName)
    Stop-ProcessByCtrlC($LogStashExecutableName)
    Stop-ProcessByCtrlC($ElasticSearchExecutableName)
}

switch ($Action)
{
    "Start" { OnStart }
    "Stop" { OnStop }
}