# PAX - People Counter Dashboard Service

This server provides a simple backend and dashboard for the Pax Counters.  The Pax Counter is a device that counts the number of unique WiFi and Bluetooth devices it sees within a 5 minute time window. It then reports this count every 2 minutes via the [Span](https://span.lab5e.com/) service.

The Pax Counter counts the number of unique MAC addresses (WiFi and BT) it sees within a 5 minute time window. It never reports the actual MAC addresses, only the unique count within that time window. Most personal devices tend to have some form of MAC address randomization that will change the MAC address every 10-15 minutes.  We make no effort to try to identify devices beyond just counting the number of unique MAC addresses seen within a 5 minute window.
