# Improvement introduced in branch "montefusco"

## Browser limitations on the number of WebSockets sessions allowed (per page)

During the initial deployment of TOA system on my home domotic system, I discovered a major drawback in the original code that makes it unusable even on small plants (at least using the single page paradigm).

In fact, I created big pages (or tabbed pages), with much more controllers and only the first ten or twelve (browser depending) were working properly.
So, it seems that there is a limitation in the number of WebSocket session *per page* allowed by the browser.
Finally, I rewrote all the controllers (see js/controllers_s.js js/controllers_sd.js) that are creating a connection
for each class of controllers (instead of one for each instance).
So the limitation is removed as far as you are using less than twelve type of different controllers in the same page.

## Tasmota controller

As further improvement I wrote even a Tasmota specific controller (controllers_st_sd.js), neded in order to interface Sonoff devices
in my home network.


# Tanzo Office Automation 


## Messaggi MQTT

	toa/light
		id/setval			Set the brightness value (0,255)
		id/getval			Get the brightness value
		id/currentval		Send the brightness current value
		
	toao/cm3panel
		{"cmd":pageload","value":"page.html"}	Change the CM3-panel web page
		{"cmd":videoload","value":"video.mp4"}	Load a background video
		{"cmd":clock_off"}						Hide clock
		{"cmd":clock_on"}						Show clock
		{"cmd":"message","value":"text"}		Send a message

## Software to install on the CM3-Panel

	sudo apt-get update
	sudo apt-get install chromium-browser
	sudo apt-get install xorg

Create the systemd file __/lib/systemd/system/startx.service__

	[Unit]
	Description=Launch xorg
	After=systemd-user-sessions.service
	
	[Service]
	ExecStart=/usr/bin/xinit -bg black -fg white -geometry 132x36 -e "runuser pi -c 'chromium-browser --incognito  -kiosk --window-position=0,0 --window-size=800,480 http://www.tanzolab.it/panel'"
	Restart=on-abort
	User=root
	WorkingDirectory=/home/pi
	
	[Install]
	WantedBy=multi-user.target
	

## Software to install on the CM3-Home

NodeJS

```
bash <(curl -sL https://raw.githubusercontent.com/node-red/raspbian-deb-package/master/resources/update-nodejs-and-nodered)
```
