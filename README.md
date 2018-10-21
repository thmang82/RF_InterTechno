RF InterTechno Decoder

A small tool to decode the packets received by RFSwitch: https://github.com/wguerlich/RFSwitch
RFSwitch is a small tool that detects the Intertechno RF signals from an CC1101/CC1100 tranceiver that is connected directly to a Raspberry PI by SPI. RFSwitch does not decode the RF symbols though.

This small Typescript based Node Server decodes the RF Symbols based on Javascript Code from wguerlich: https://github.com/wguerlich/RFSwitch/issues/1

Install Instructions:

1. Install node and npm
  - The code was tested with node v8.12.0 and npm 6.4.1
  - This versions are not included in Raspbian apt. Search the web for install instructions for node binaries.
  - The code wil likely not work with node versions before 8.5

2. Install Typescript: 
  - npm install -g typescript
3. Install Packages: 
  - npm install
4. Compile Typescript: 
  - tsc

Run the server by: 
  - sudo node server

Sudo is required as RFSwitch otherwise cannot connect to SPI

Edit config/config.json as you like
-> Set the URL of your MQTT Server

The received button presses are by default transmitted as topic "intertechno_event" over MQTT.
You can change the topic in the config.

## ------------------------------------------------------
In case you want to run this as a service:
1. Copy rfintertechno.service to /etc/systemd/system/rfintertechno.service
- sudo cp rfintertechno.service /etc/systemd/system/rfintertechno.service
- sudo systemctl daemon-reload
- sudo systemctl enable rfintertechno.service
- Edit the path to yours!!!
2. Edit the sudoers file
- sudo visudo -f /etc/sudoers.d/smarthome
-  Add this line:  root ALL = NOPASSWD:/usr/bin/node /home/pi/RF_InterTechno/server
- (the path must match the line in service)
