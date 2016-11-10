# IIS Log Monitor

A tool for monitoring IIS logs encapsulating the Elasticsearch, Logstash, Filebeat and Kibana tools.

### How to build

1. If you get an error like this:

    > error: unable to create file IISLogMonitor.Setup.Files/logstash-5.0.0/vendor/bundle/jruby/1.9/gems/logstash-input-beats-3.1.6-java/vendor/jar-dependencies/com/fasterxml/jackson/module/jackson-module-afterburner/2.7.5/jackson-module-afterburner-2.7.5.jar (Filename too long)

    you must change your long path git preference:

        git config --system core.longpaths true

2. If you get an error opening the solution, saying that the project _IISLogMonitor.Setup_ is incompatible, you must install the [InstallShield Limited Edition](http://learn.flexerasoftware.com/content/IS-EVAL-InstallShield-Limited-Edition-Visual-Studio).