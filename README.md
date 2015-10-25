# How I modernize alarm home

To modernize an old wired home alarm and extend feature, I want used an Arduino to control the I/O like sensors and an Rapsberry Pi for the "IA" who embedeed an WebServer.

![breadboard](https://cloud.githubusercontent.com/assets/1721344/10715220/908bc742-7b0e-11e5-9957-a4dfac3c091e.PNG)

## Existing Alarm

![before](https://cloud.githubusercontent.com/assets/1721344/10712836/e2be0a70-7aa5-11e5-81f6-7684dad65220.png)

## New Feature
![after](https://cloud.githubusercontent.com/assets/1721344/10712534/82d5be08-7a9d-11e5-82f7-b06847f0f823.png)

## Hardware

![hardware](https://cloud.githubusercontent.com/assets/1721344/10712517/33840bca-7a9d-11e5-9c53-4485d3077dc3.PNG)

Arduino and Rapsberry Pi are linked by USB cable.

To extend the I/O port number on the Arduino, I plugged an [MCP23017](http://mchobby.be/wiki/index.php?title=MCP23017) 16 bit input/output port extender.
### Shield board

To plugged sensors and alarm on Arduino. I've build an Shield board with screw terminal and MCP23017.

### Power Supply

To provide power supply, I used the existing 14v supply decoupage and the 12v backup battery. I add an 5v linear voltage regultor 7805 for the Raspberry Pi (the Arduino is supply by USB cable)

Future feature:
  - Add power supply backup used sensor to detect outage


## Software

### Arduino
On Arduino I used Firmata library and NodeJS to manage the Arduino from Pi via firmata.

Basically to managed Arduino from Firmata you can used the nodeJS module [johnny-five](https://www.npmjs.com/package/johnny-five) who is an top level framework of [firmata](https://www.npmjs.com/package/firmata)

To managed the MCP23017 from NodeJS, I developped an node module based to I2C protocol throught the firmata instance exposed by johnny-five.
```javascript
i2cWrite(address, [...bytes])
i2cWrite(address, register, [...bytes])
```

Note: Since the MCP23017 is now supported by johnny-five.

### Raspberry PI
On Raspberry Pi I used the [MEANJS](http://meanjs.org/) solution to develop quickly an modern web application for any devices.

When an sensor is hit the event is catch on nodeJs by arduino module.
This module save the event to MongoDB and emit the event to Socket IO.
Then the connected client views are dynamiclly updated, and the new client have current event from MongoDb
It's the same mecanism to push command to Arduino from the application.

For the SMS feature I used Freemobile API and I developed the [sms-freemobile-api](https://www.npmjs.com/package/sms-freemobile-api) npm module to easy use.

To launch application on raspberry PI startup I use init.d script with [Forever](https://github.com/foreverjs/forever)

## Overall scheme
![overall](https://cloud.githubusercontent.com/assets/1721344/10712543/aecda412-7a9d-11e5-94f8-8548489e5c3a.PNG)




### Development environnement installation

For the development environement you can use your computer and use your favorite IDE to managed the Arduino (i.e. without Rapsberry PI).
You need mongoDB, nodeJS and MEAN.JS installed. Follow the MEANJS [documentation](http://meanjs.org/docs.html)
Then go to the projet directory and use standar npm install command

```sh
$ npm install
```
Upload the Standard Firmata sample with the Arudino IDE:

![alt tag](https://cloud.githubusercontent.com/assets/1721344/10712765/91b34ab6-7aa3-11e5-9fda-25ccee856608.png)


You need also configure the USB device path of your Arduino in the **_[project]\config\env\all.js_** file:
```sh
arduino: {
		serialport: 'COM3' //Windows
		//serialport: '/dev/tty.usbmodemfa131' //Linux
	}
```
If you want enable SMS feature set environement variable SMS_USER and SMS_PWD with your FreeMobile API values.

Now you can launch default **Grunt** command:
```sh
$ grunt
```
![IntelliJ grunt](https://cloud.githubusercontent.com/assets/1721344/10712671/5dead732-7aa1-11e5-9796-09ef0bf7ac53.PNG)

Launch your browser on http://localhost:3000/

![home page](https://cloud.githubusercontent.com/assets/1721344/10712788/6af7338c-7aa4-11e5-9d05-2813f8b480a6.png)
![events page](https://cloud.githubusercontent.com/assets/1721344/10712829/8a594714-7aa5-11e5-9721-d8b07fc00fa1.png)

**Enjoy !**

### Todos
 - Change views presentation with dashboard style (like [AdminLTE](https://almsaeedstudio.com/) )
 - Add other domestic connected objects (electric power or heating control)

### Useful links
 - [How to deploy MEAN.js (Node.js) application to Production environment]( http://stackoverflow.com/questions/24516497/how-to-deploy-mean-js-node-js-application-to-production-environment)
 - [Install raspberry pi Nginx and Nodejs](http://stackoverflow.com/questions/5009324/node-js-nginx-and-now)
