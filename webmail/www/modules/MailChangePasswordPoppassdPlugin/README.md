# Aurora Mail Change Password Poppassd plugin module

Allows users to change passwords on their email accounts using POPPASSD protocol. To use this feature, your system must run POPPASSD service. Some systems (Plesk, for example) have it available out-of-box, and it usually runs on port 106.

How to install a module (taking WebMail Lite as an example of the product built on Aurora framework): [Adding modules in WebMail Lite](https://afterlogic.com/docs/webmail-lite-8/installation/adding-modules)

In admin interface, under "Poppassd" tab, you need to supply list of mailserver hostnames or IP addresses the feature is enabled for, one host per line. If you put "*" character there, it means the feature is enabled for all accounts.

On the same tab, you need to provide hostname/IP and port number for connecting to POPPASSD service.

# License
This module is licensed under AGPLv3 license if free version of the product is used or Afterlogic Software License if commercial version of the product was purchased.