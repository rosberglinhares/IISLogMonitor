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

        private const int ARG_INDEX_SERVICE_NAME = 1;
        private const int ARG_INDEX_POWERSHELL_SCRIPT_PATH = 2;
        
        private string powershellScriptPath;
        private EventLog eventLog;

        public PowershellScriptAsService()
        {
            InitializeComponent();

            this.GetServiceArgs();

            this.eventLog = new EventLog();
            this.eventLog.Source = this.ServiceName;
            this.eventLog.Log = this.ServiceName;

            if (!EventLog.SourceExists(this.eventLog.Source))
            {
                EventLog.CreateEventSource(this.eventLog.Source, this.eventLog.Log);
            }
        }

        private void GetServiceArgs()
        {
            string[] serviceImagePathArgs = Environment.GetCommandLineArgs();

            this.ServiceName = serviceImagePathArgs[ARG_INDEX_SERVICE_NAME];
            this.powershellScriptPath = serviceImagePathArgs[ARG_INDEX_POWERSHELL_SCRIPT_PATH];
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