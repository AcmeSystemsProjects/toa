//
//
// Controllers for domotic applications
//
//
//

//const STATES = {
//  WIP: "Work in progress",
//  ONLINE: "Online",
//  ONLINE_MODIFIED: "Online, modified",
//  HIDDEN: "Hidden"
//};
//

	const State = {
		ON:          1,
		OFF:         0,
		TRANSITION: -1
	};

//
// On Off switch for lights and other SCS ON/Off controls
// Excerpted from: https://github.com/tanzilli/toa
//
class OnOffSwitch_S {

	constructor(caption, address, domElementId, mqtt_base, mqtt_status, mqtt_cmd) {
		this.domElementId = domElementId;
		this.address = address;
		this.state   = State.OFF;
		this.caption = caption;

		this.mqtt_base   = mqtt_base;
		this.mqtt_status = mqtt_status;
		this.mqtt_cmd    = mqtt_cmd

		// Note: function bind() usage taken from
		// Access class properties outside of mqtt callback scope
		// https://stackoverflow.com/questions/42233090/access-class-properties-outside-of-mqtt-callback-scope

		$("#" + this.domElementId).click(this.click_handler.bind(this));

		var mangled_address = address.replace(/\//g, "-");

		//
		// create the HTML code that renders the GUI in the page
		// where the object is instantiated
		//
		$("#" + this.domElementId).html(`
			<div style="
				border: 2px solid black;
				background-color: grey;
				background-color:rgba(0, 0, 0, 0.5);
				border-color: light-grey;
				width: 240px;
				padding-top: 2px;
				padding-bottom: 0px;
				margin-bottom: 20px;
				font-family: arial;
			">
				<table>
					<tr>
						<td style="padding-left: 5px;">
							<img width="60px" src="images/off.png" id=` + domElementId + mangled_address + `>
						</td>
						<td style="font-size: 26px; color: white; padding-left: 10px;">
					    	` + caption + `
					    </td>
				    </tr>
			    </table>
			</div>
		`);

		OnOffSwitch_S.instanceCount = OnOffSwitch_S.instanceCount ? OnOffSwitch_S.instanceCount + 1 : 1;

		//*****************************************************************************
		// Connect to MQTT broker
		// the broker name and port are defined in common.js (TBC)
		// https://www.eclipse.org/paho/clients/js/
		//*****************************************************************************

		if (OnOffSwitch_S.instanceCount == 1) {
			OnOffSwitch_S.mqtt_client = new Paho.MQTT.Client(mqtt_broker, Number(mqtt_port), "/ws",randomString(20));
			OnOffSwitch_S.mqtt_client.onMessageArrived = this.onMessageArrived.bind(this);

			OnOffSwitch_S.mqtt_client.connect({
				onSuccess: this.onConnect.bind(this),
				keepAliveInterval: 3,
				reconnect: true,
				timeout: 3
			});

			OnOffSwitch_S.mqtt_client.onConnectionLost = this.onConnectionLost.bind(this);
			OnOffSwitch_S.mqtt_client.onFailure = this.onFailure.bind(this);

		} else {
		}
		OnOffSwitch_S.allInstances.push(this);
	}

	onConnectionLost(response) {
		console.log("Connection lost ! " + this.caption+ "." + this.address+ " " +
					response.errorCode + "-" + response.errorMessage
		);
	}

	onFailure(response) {
		console.log("Connection FAILURE ! " + this.caption+ "." + this.address+ " " +
					response.errorCode + "-" + response.errorMessage
		);
	}

	onConnect() {
		console.log("Instance  ",  OnOffSwitch_S.instanceCount, " instance connected ! ");

		//
		// when connected, subscribe for status messages
		//

		var i = 0,
        l = OnOffSwitch_S.allInstances.length;
		for (; i < l; i++) {
			var x = OnOffSwitch_S.allInstances[i];

			//console.log("***** ", i, " ", x.caption+ "." + x.address+ "." );

			OnOffSwitch_S.mqtt_client.subscribe(x.mqtt_base+
												x.address +
												x.mqtt_status);
		}

		//
		// acquire current status
		//
		// the current model status is automagically acquired when
		// subscribing to the topic mqtt_status IF the messages are sent
		// by physical devices controllers in retained mode
		//
	}

	onMessageArrived(mqtt_message) {
		console.log("onMessageArrived >>"+
					mqtt_message.destinationName + "." +
					mqtt_message.payloadString);

		var i = 0,
        l = OnOffSwitch_S.allInstances.length;
		for (; i < l; i++) {
			var x = OnOffSwitch_S.allInstances[i];

			//console.log("***** ", i, " ", x.caption+ "-" + x.mqtt_base+ "."  + x.address);

			if (mqtt_message.destinationName == x.mqtt_base+x.address+"/status") {
				if (mqtt_message.payloadString=="1") {
					x.set_state_off();
				} else {
					x.set_state_on();
				}
			}

		}


	}

	click_handler() {
		var message;

		switch (this.state) {
		case State.OFF:
			message = new Paho.MQTT.Message("0");
			this.set_state_transition ();
			break;
		case State.ON:
			message = new Paho.MQTT.Message("1");
			break;
		case State.TRANSITION:
			message = new Paho.MQTT.Message("1");
			break;
		default:
			// should ever happen
			console.log(this.caption+ " " + this.address+ " " + "FATAL: WRONG STATUS");
			message = new Paho.MQTT.Message("1");
			return;
		}
		// set the topic for the command to be sent
		message.destinationName = this.mqtt_base + this.address + this.mqtt_cmd;

		console.log("Publishing... " + message.destinationName + " - " + message);

		// send the message to the topic
		OnOffSwitch_S.mqtt_client.send(message);
	}

	set_state_off() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/off.png");
		this.state = State.OFF;
	}

	set_state_on() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/on.png");
		this.state = State.ON;
	}

	set_state_transition() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/off.png");
		this.state = State.TRANSITION;
	}
}

OnOffSwitch_S.allInstances = [];




//////////////////////////////////////////////////////////////////////
//
// Controller for UP/DOWN switches
// used for blinds and curtains
//
//////////////////////////////////////////////////////////////////////


const UpDnState = {
	HOLD:        0,
	RISING:      8,
	FALLING:     9,
	TRANSITION: -1
};

class UpDownSwitchHalfSize_S {

    static doConnect () {
		UpDownSwitchHalfSize_S.mqtt_client = new Paho.MQTT.Client(mqtt_broker, Number(mqtt_port), "/ws",randomString(20));
		UpDownSwitchHalfSize_S.mqtt_client.onMessageArrived = UpDownSwitchHalfSize_S.onMqttMessageArrived.bind(UpDownSwitchHalfSize_S);

		UpDownSwitchHalfSize_S.mqtt_client.connect({
			onSuccess: UpDownSwitchHalfSize_S.onConnect.bind(UpDownSwitchHalfSize_S),
			keepAliveInterval: 3,
			reconnect: true,
			timeout: 3
		});

		UpDownSwitchHalfSize_S.mqtt_client.onConnectionLost = UpDownSwitchHalfSize_S.onConnectionLost.bind(UpDownSwitchHalfSize_S);
		UpDownSwitchHalfSize_S.mqtt_client.onFailure = UpDownSwitchHalfSize_S.onFailure.bind(UpDownSwitchHalfSize_S);
	}


	static onConnect() {
		console.log("Instance  ",  UpDownSwitchHalfSize_S.instanceCount, " instance connected ! ");

		//
		// when connected, subscribe for status messages
		//

		var i = 0,
        l = UpDownSwitchHalfSize_S.allInstances.length;
		for (; i < l; i++) {
			var x = UpDownSwitchHalfSize_S.allInstances[i];

			// console.log("***** ", i, " ", x.caption+ "." + x.address+ "." );

			UpDownSwitchHalfSize_S.mqtt_client.subscribe(x.mqtt_base+
														 x.address +
														 x.mqtt_status);
		}

		//
		// acquire current status
		//
		// the current model status is automagically acquired when
		// subscribing to the topic mqtt_status IF the messages are sent
		// by physical devices controllers in retained mode
		//
	}

	static onConnectionLost(response) {
		console.log("Connection lost UpDownSwitchHalfSize_S ! "	);
	}

	static onFailure(response) {
		console.log("Connection FAILURE UpDownSwitchHalfSize_S ! " );
	}

	static onMqttMessageArrived (mqtt_message) {
		console.log("onMessageArrived >>"+
					mqtt_message.destinationName + "." +
					mqtt_message.payloadString);

		var i = 0,
        l = UpDownSwitchHalfSize_S.allInstances.length;
		for (; i < l; i++) {
			var x = UpDownSwitchHalfSize_S.allInstances[i];

			// console.log("***** ", i, " ", x.caption+ "-" + x.mqtt_base + x.address);

			if (mqtt_message.destinationName == x.mqtt_base+x.address+"/status") {

				if (mqtt_message.payloadString=="17") {
					x.set_state_hold();
				} else
				if (mqtt_message.payloadString=="8") {   // status: going up
					x.set_state_rising();
				} else
				if (mqtt_message.payloadString=="9") {   // status: going down
					x.set_state_lowering();
				}
			}
		}
	}


	constructor(caption, address, domElementId, mqtt_base, mqtt_status, mqtt_cmd) {
		this.domElementId = domElementId;
		this.address = address;
		this.state   = UpDnState.HOLD;
		this.caption = caption;

		this.mqtt_base   = mqtt_base;
		this.mqtt_status = mqtt_status;
		this.mqtt_cmd    = mqtt_cmd

		// Note: function bind() usage taken from
		// Access class properties outside of mqtt callback scope
		// https://stackoverflow.com/questions/42233090/access-class-properties-outside-of-mqtt-callback-scope

		$("#" + this.domElementId).click(this.click_handler.bind(this));

		var mangled_address = address.replace(/\//g, "-");

		//
		// create the HTML code that renders the GUI in the page
		// where the object is instantiated
		//
		$("#" + this.domElementId).html(`
			<div style="
				border: 1px solid black;
				background-color: rgb(230,230,230);

				border-color: light-grey;
				width: 90px;
				padding-top: 2px;
				padding-bottom: 0px;
				margin-bottom: 2px;
				font-family: arial;
			">
				<div style="padding-left: 5px;">
					<img object-fit="fill"; src="images/updown_black_half.png" id=` + domElementId + mangled_address + `>
				</div>
				<div style="font-size: 14px; color: dark-grey; padding-left: 10px;">
			    	` + caption + `
			    </div>
			</div>
		`);

		//
		// increase instance counter
		// instanceCount is a class variable (i.e., a variable
		// associated to the class and shared between all instances
		//
		UpDownSwitchHalfSize_S.instanceCount = UpDownSwitchHalfSize_S.instanceCount ? UpDownSwitchHalfSize_S.instanceCount + 1 : 1;

		// if we are the first instance, we start the MQTT connection
		if (UpDownSwitchHalfSize_S.instanceCount == 1) {
			UpDownSwitchHalfSize_S.doConnect();
		}
		// register ourselves in class instance list
		UpDownSwitchHalfSize_S.allInstances.push(this);
	}



	click_handler(e) {
		//
		// https://stackoverflow.com/questions/3234977/using-jquery-how-to-get-click-coordinates-on-the-target-element
		//
		var posX = $("#" + this.domElementId).offset().left,
            posY = $("#" + this.domElementId).offset().top,
            hh   = $("#" + this.domElementId).height();

		// determine if click is on the top part
		var move_up;
		if ((e.pageY - posY) < (hh / 2) ) { move_up = true; }
		else { move_up = false; }

        console.log((e.pageX - posX) + ' , ' + (e.pageY - posY), ',' , hh , ',' , move_up);


		var message;

		switch (this.state) {

		case UpDnState.HOLD:
			if (move_up) {
				message = new Paho.MQTT.Message("8");
			} else {
				message = new Paho.MQTT.Message("9");
			}
			break;

		case UpDnState.RISING:
			if (move_up) {
				message = new Paho.MQTT.Message("8");
			} else {
				message = new Paho.MQTT.Message("9");
			}
			break;

		case UpDnState.FALLING:
			if (move_up) {
				message = new Paho.MQTT.Message("8");
			} else {
				message = new Paho.MQTT.Message("9");
			}
			break;

		default:
			// should ever happen
			console.log(this.caption+ " " + this.address+ " " + "FATAL: WRONG STATUS");
			message = new Paho.MQTT.Message("1");
			return;
		}
		// set the topic for the command to be sent
		message.destinationName = this.mqtt_base + this.address + this.mqtt_cmd;

		console.log("Publishing... " + message.destinationName + " - " + message);

		// send the message to the topic
		UpDownSwitchHalfSize_S.mqtt_client.send(message);
	}

	set_state_hold() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/updown_hold_half.png");
		this.state = UpDnState.HOLD;
	}

//	set_state_on() {
//		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/updown_black_half.png");
//		this.state = State.ON;
//	}

	set_state_rising() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/updown_rising_half.png");
		this.state = UpDnState.RISING;
	}

	set_state_lowering() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/updown_lowering_half.png");
		this.state = UpDnState.FALLING;
	}
}

UpDownSwitchHalfSize_S.allInstances = [];








///////////////////////////////////////////////////////////////////////
//
//   SCS Controller Base class
//
//   An object oriented evolution
//
//
//   Andrea Montefusco 2018
//
//
//
///////////////////////////////////////////////////////////////////////
class SCS_Controller_Base {


    static doConnect () {
		SCS_Controller_Base.mqtt_client = new Paho.MQTT.Client(mqtt_broker, Number(mqtt_port), "/ws",randomString(20));
		SCS_Controller_Base.mqtt_client.onMessageArrived = SCS_Controller_Base.onMqttMessageArrived.bind(SCS_Controller_Base);

		SCS_Controller_Base.mqtt_client.connect({
			onSuccess: SCS_Controller_Base.onConnect.bind(SCS_Controller_Base),
			keepAliveInterval: 3,
			reconnect: true,
			timeout: 3
		});

		SCS_Controller_Base.mqtt_client.onConnectionLost = SCS_Controller_Base.onConnectionLost.bind(UpDownSwitchHalfSize_S);
		SCS_Controller_Base.mqtt_client.onFailure = SCS_Controller_Base.onFailure.bind(UpDownSwitchHalfSize_S);
	}


	static onConnect() {
		console.log("Instance  ",  SCS_Controller_Base.instanceCount, " instance connected ! ");

		//
		// when connected, subscribe for status messages
		//

		var i = 0,
        l = SCS_Controller_Base.allInstances.length;
		for (; i < l; i++) {
			var x = SCS_Controller_Base.allInstances[i];

			// console.log("***** ", i, " ", x.caption+ "." + x.address+ "." );

			SCS_Controller_Base.mqtt_client.subscribe(x.mqtt_base+
													  x.address +
													  x.mqtt_status);
		}

		//
		// acquire current status
		//
		// the current model status is automagically acquired when
		// subscribing to the topic mqtt_status IF the messages are sent
		// by physical devices controllers in retained mode
		//
	}

	static onConnectionLost(response) {
		console.log("Connection lost UpDownSwitchHalfSize_S ! "	);
	}

	static onFailure(response) {
		console.log("Connection FAILURE UpDownSwitchHalfSize_S ! " );
	}

	static onMqttMessageArrived (mqtt_message) {
		console.log("onMessageArrived >>"+
					mqtt_message.destinationName + "." +
					mqtt_message.payloadString);

		var i = 0,
        l = SCS_Controller_Base.allInstances.length;
		for (; i < l; i++) {
			var x = SCS_Controller_Base.allInstances[i];

			// console.log("***** ", i, " ", x.caption+ "-" + x.mqtt_base + x.address);

			if (mqtt_message.destinationName == x.mqtt_base+x.address+"/status") {
				// call "virtual" method overridden in the derived classes
				x.virtualMqttMessageProcessing (mqtt_message);

			}
		}
	}


	constructor(caption, address, domElementId, mqtt_base, mqtt_status, mqtt_cmd) {
		this.domElementId = domElementId;
		this.address = address;
		this.caption = caption;

		this.mqtt_base   = mqtt_base;
		this.mqtt_status = mqtt_status;
		this.mqtt_cmd    = mqtt_cmd

		//
		// increase instance counter
		// instanceCount is a class variable (i.e., a variable
		// associated to the class and shared between all instances
		//
		SCS_Controller_Base.instanceCount = SCS_Controller_Base.instanceCount ? SCS_Controller_Base.instanceCount + 1 : 1;

		// if we are the first instance, we start the MQTT connection
		if (SCS_Controller_Base.instanceCount == 1) {
			SCS_Controller_Base.doConnect();
		}
		// register ourselves in class instance list
		SCS_Controller_Base.allInstances.push(this);
	}

	sendMqttMessage (message) {
		SCS_Controller_Base.mqtt_client.send(message);
	}
}

SCS_Controller_Base.allInstances = [];



// deribed classes  for specific controllers

class UpDownSwitchHalfSize_SD extends SCS_Controller_Base {

	constructor(caption, address, domElementId, mqtt_base, mqtt_status, mqtt_cmd) {

		super (caption, address, domElementId, mqtt_base, mqtt_status, mqtt_cmd);

		this.address = address;
		this.state   = UpDnState.HOLD;


		// Note: function bind() usage taken from
		// Access class properties outside of mqtt callback scope
		// https://stackoverflow.com/questions/42233090/access-class-properties-outside-of-mqtt-callback-scope

		$("#" + this.domElementId).click(this.click_handler.bind(this));

		var mangled_address = address.replace(/\//g, "-");

		//
		// create the HTML code that renders the GUI in the page
		// where the object is instantiated
		//
		$("#" + this.domElementId).html(`
			<div style="
				border: 1px solid black;
				background-color: rgb(230,230,230);

				border-color: light-grey;
				width: 90px;
				padding-top: 2px;
				padding-bottom: 0px;
				margin-bottom: 2px;
				font-family: arial;
			">
				<div style="padding-left: 5px;">
					<img object-fit="fill"; src="images/updown_black_half.png" id=` + domElementId + mangled_address + `>
				</div>
				<div style="font-size: 14px; color: dark-grey; padding-left: 10px;">
			    	` + caption + `
			    </div>
			</div>
		`);

	}

	virtualMqttMessageProcessing (mqtt_message) {
		console.log("virtualMqttMessageProcessing >>>>>>>>"+
					mqtt_message.destinationName + "." +
					mqtt_message.payloadString);

		if (mqtt_message.payloadString=="17") {
			this.set_state_hold();
		} else
		if (mqtt_message.payloadString=="8") {   // status: going up
			this.set_state_rising();
		} else
		if (mqtt_message.payloadString=="9") {   // status: going down
			this.set_state_lowering();
		}
	}


	click_handler(e) {
		//
		// https://stackoverflow.com/questions/3234977/using-jquery-how-to-get-click-coordinates-on-the-target-element
		//
		var posX = $("#" + this.domElementId).offset().left,
            posY = $("#" + this.domElementId).offset().top,
            hh   = $("#" + this.domElementId).height();

		// determine if click is on the top part
		var move_up;
		if ((e.pageY - posY) < (hh / 2) ) { move_up = true; }
		else { move_up = false; }

        console.log((e.pageX - posX) + ' , ' + (e.pageY - posY), ',' , hh , ',' , move_up);


		var message;

		switch (this.state) {

		case UpDnState.HOLD:
			if (move_up) {
				message = new Paho.MQTT.Message("8");
			} else {
				message = new Paho.MQTT.Message("9");
			}
			break;

		case UpDnState.RISING:
			if (move_up) {
				message = new Paho.MQTT.Message("8");
			} else {
				message = new Paho.MQTT.Message("9");
			}
			break;

		case UpDnState.FALLING:
			if (move_up) {
				message = new Paho.MQTT.Message("8");
			} else {
				message = new Paho.MQTT.Message("9");
			}
			break;

		default:
			// should ever happen
			console.log(this.caption+ " " + this.address+ " " + "FATAL: WRONG STATUS");
			message = new Paho.MQTT.Message("1");
			return;
		}
		// set the topic for the command to be sent
		message.destinationName = this.mqtt_base + this.address + this.mqtt_cmd;

		console.log("Publishing... " + message.destinationName + " - " + message);

		// send the message to the topic
		this.sendMqttMessage(message);
	}

	set_state_hold() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/updown_hold_half.png");
		this.state = UpDnState.HOLD;
	}

//	set_state_on() {
//		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/updown_black_half.png");
//		this.state = State.ON;
//	}

	set_state_rising() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/updown_rising_half.png");
		this.state = UpDnState.RISING;
	}

	set_state_lowering() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/updown_lowering_half.png");
		this.state = UpDnState.FALLING;
	}

}



//////////////////////////////////////////////////////////////////////
//
// On Off switch for lights and other SCS ON/Off controls
// Excerpted from: https://github.com/tanzilli/toa
//
//////////////////////////////////////////////////////////////////////
class OnOffSwitch_SD  extends SCS_Controller_Base {

	constructor(caption, address, domElementId, mqtt_base, mqtt_status, mqtt_cmd) {

		super (caption, address, domElementId, mqtt_base, mqtt_status, mqtt_cmd);

		this.address = address;
		this.state   = UpDnState.OFF;


		// Note: function bind() usage taken from
		// Access class properties outside of mqtt callback scope
		// https://stackoverflow.com/questions/42233090/access-class-properties-outside-of-mqtt-callback-scope
		// Note: function bind() usage taken from
		// Access class properties outside of mqtt callback scope
		// https://stackoverflow.com/questions/42233090/access-class-properties-outside-of-mqtt-callback-scope

		$("#" + this.domElementId).click(this.click_handler.bind(this));

		var mangled_address = address.replace(/\//g, "-");

		//
		// create the HTML code that renders the GUI in the page
		// where the object is instantiated
		//
		$("#" + this.domElementId).html(`
			<div style="
				border: 2px solid black;
				background-color: grey;
				background-color:rgba(0, 0, 0, 0.5);
				border-color: light-grey;
				width: 240px;
				padding-top: 2px;
				padding-bottom: 0px;
				margin-bottom: 20px;
				font-family: arial;
			">
				<table>
					<tr>
						<td style="padding-left: 5px;">
							<img width="60px" src="images/off.png" id=` + domElementId + mangled_address + `>
						</td>
						<td style="font-size: 26px; color: white; padding-left: 10px;">
					    	` + caption + `
					    </td>
				    </tr>
			    </table>
			</div>
		`);
	}

	virtualMqttMessageProcessing (mqtt_message) {
		console.log("virtualMqttMessageProcessing >>>>>>>>"+
					mqtt_message.destinationName + "." +
					mqtt_message.payloadString);

		if (mqtt_message.payloadString=="1") {
			this.set_state_off();
		} else {
			this.set_state_on();
		}
	}


	click_handler() {
		var message;

		switch (this.state) {
		case State.OFF:
			message = new Paho.MQTT.Message("0");
			this.set_state_transition ();
			break;
		case State.ON:
			message = new Paho.MQTT.Message("1");
			break;
		case State.TRANSITION:
			message = new Paho.MQTT.Message("1");
			break;
		default:
			// should ever happen
			console.log(this.caption+ " " + this.address+ " " + "FATAL: WRONG STATUS");
			message = new Paho.MQTT.Message("1");
			return;
		}
		// set the topic for the command to be sent
		message.destinationName = this.mqtt_base + this.address + this.mqtt_cmd;

		console.log("Publishing... " + message.destinationName + " - " + message);

		// send the message to the topic
		this.sendMqttMessage(message);
	}

	set_state_off() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/off.png");
		this.state = State.OFF;
	}

	set_state_on() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/on.png");
		this.state = State.ON;
	}

	set_state_transition() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/off.png");
		this.state = State.TRANSITION;
	}
}
