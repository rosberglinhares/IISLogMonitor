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
using System.ServiceProcess;

namespace Samsung.PowershellScriptAsService
{
    static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        static void Main()
        {
            ServiceBase[] servicesToRun = new ServiceBase[] { new PowershellScriptAsService() };
            ServiceBase.Run(servicesToRun);
        }
    }
}