/*
 * Copyright (c) 2016 Samsung Electronics Co., Ltd. , (c) Center of Informatics
 * Federal University of Pernambuco.
 * All rights reserved.
 *
 * This software is a confidential and proprietary information of Samsung
 * Electronics, Inc. ("Confidential Information"). You shall not disclose such
 * Confidential Information and shall use it only in accordance with the terms
 * of the license agreement you entered into with Samsung Electronics.
 */
using System;
using System.ServiceProcess;
using System.Diagnostics;

namespace Samsung.PowershellScriptAsService
{
    partial class PowershellScriptAsService : ServiceBase
    {
        private enum PowershellScriptAction
        {
            Start,
            Stop
        }

        // An exception occurred in the service when handling the control request.
        private const int ERROR_EXCEPTION_IN_SERVICE = 1064;
        private const int EXIT_SUCCESS = 0;

        private const string ARG_LOG_NAME = "-LogName";
        private const string ARG_POWERSHELL_SCRIPT_PATH = "-ScriptPath";
        
        private string powershellScriptPath;
        private EventLog eventLog;

        public PowershellScriptAsService()
        {
            InitializeComponent();

            string logName;

            this.ParseServiceArgs(out logName, out this.powershellScriptPath);

            this.eventLog = new EventLog();
            this.eventLog.Log = logName;
            this.eventLog.Source = logName;

            if (!EventLog.SourceExists(this.eventLog.Source))
            {
                EventLog.CreateEventSource(this.eventLog.Source, this.eventLog.Log);
            }
        }

        private void ParseServiceArgs(out string logName, out string powershellScriptPath)
        {
            string[] serviceImagePathArgs = Environment.GetCommandLineArgs();
            logName = null;
            powershellScriptPath = null;

            // Step two by two items. One item is the argument name and the another one is the argument value
            for (int i = 1; i <= serviceImagePathArgs.Length - 2; i += 2)
            {
                switch (serviceImagePathArgs[i])
                {
                    case ARG_LOG_NAME:
                        logName = serviceImagePathArgs[i + 1];
                        break;

                    case ARG_POWERSHELL_SCRIPT_PATH:
                        powershellScriptPath = serviceImagePathArgs[i + 1];
                        break;

                    default:
                        throw new Exception("Unknown argument: " + serviceImagePathArgs[i]);
                }
            }

            if (logName == null)
            {
                throw new Exception(string.Format("The argument '{0}' must be informed", ARG_LOG_NAME));
            }

            if (powershellScriptPath == null)
            {
                throw new Exception(string.Format("The argument '{0}' must be informed", ARG_POWERSHELL_SCRIPT_PATH));
            }
        }

        protected override void OnStart(string[] args)
        {
            try
            {
                this.CallPowershellScript(PowershellScriptAction.Start);

                this.eventLog.WriteEntry("Service started successfully");
            }
            catch (Exception ex)
            {
                this.eventLog.WriteEntry("Error starting service:" + Environment.NewLine + ex.ToString(), EventLogEntryType.Error);

                // Display an error message to the user
                this.ExitCode = ERROR_EXCEPTION_IN_SERVICE;
                this.Stop();
            }
        }

        protected override void OnStop()
        {
            try
            {
                this.CallPowershellScript(PowershellScriptAction.Stop);

                this.eventLog.WriteEntry("Service stopped successfully");
            }
            catch (Exception ex)
            {
                this.eventLog.WriteEntry("Error stopping service:" + Environment.NewLine + ex.ToString(), EventLogEntryType.Error);

                // Display an error message to the user
                this.ExitCode = ERROR_EXCEPTION_IN_SERVICE;
            }
        }

        private void CallPowershellScript(PowershellScriptAction action)
        {
            string powershellScriptErrorOutput;
            int powershellScriptExitCode;

            using (Process process = new Process())
            {
                process.StartInfo.FileName = "powershell.exe";
                process.StartInfo.Arguments = string.Format("-ExecutionPolicy Bypass -File \"{0}\" -Action {1}", this.powershellScriptPath, Enum.GetName(typeof(PowershellScriptAction), action));
                process.StartInfo.UseShellExecute = false;
                process.StartInfo.RedirectStandardError = true;

                process.Start();

                // To avoid deadlocks, always read the output stream first and then wait.
                powershellScriptErrorOutput = process.StandardError.ReadToEnd();
                process.WaitForExit();
                powershellScriptExitCode = process.ExitCode;
            }

            if (powershellScriptExitCode != EXIT_SUCCESS)
            {
                throw new Exception(powershellScriptErrorOutput);
            }
        }
    }
}