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
// On Off switch for lights and other ON/Off controls
//
class OnOffSwitch {

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

		//*****************************************************************************
		// Connect to MQTT broker
		// the broker name and port are defined in common.js (TBC)
		// https://www.eclipse.org/paho/clients/js/
		//*****************************************************************************

		this.mqtt_client = new Paho.MQTT.Client(mqtt_broker, Number(mqtt_port), "/ws",randomString(20));
		this.mqtt_client.onMessageArrived = this.onMessageArrived.bind(this);

		this.mqtt_client.connect({
			onSuccess: this.onConnect.bind(this),
			keepAliveInterval: 3,
//			reconnect: true,
			timeout: 3
		});

		this.mqtt_client.onConnectionLost = this.onConnectionLost.bind(this);
		this.mqtt_client.onFailure = this.onFailure.bind(this);
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
		//
		// when connected, subscribe for status messages
		//
		this.mqtt_client.subscribe(this.mqtt_base+ this.address + this.mqtt_status);
		//
		// acquire current status
		//
		// the current model status is automagically acquired when
		// subscribing to the topic mqtt_status IF the messages are sent
		// by physical devices controllers in retained mode
		//
	}

	onMessageArrived(mqtt_message) {
		console.log(this.caption+ "." + this.address+ "." +
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
		this.mqtt_client.send(message);
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



class OnOffSwitch2 {

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
				border: 1px solid black;
				background-color: rgb(230,230,230);

				border-color: light-grey;
				width: 300px;
				padding-top: 2px;
				padding-bottom: 0px;
				margin-bottom: 2px;
				font-family: arial;
			">
				<table>
					<tr>
						<td style="padding-left: 5px;">
							<img width="160px" src="images/slider_off.jpg" id=` + domElementId + mangled_address + `>
						</td>
						<td style="font-size: 18px; color: dark-grey; padding-left: 10px;">
					    	` + caption + `
					    </td>
				    </tr>
			    </table>
			</div>
		`);
		this.doConnect();
	}

	doConnect() {
		//*****************************************************************************
		// Connect to MQTT broker
		// the broker name and port are defined in common.js (TBC)
		// https://www.eclipse.org/paho/clients/js/
		//*****************************************************************************

		this.mqtt_client = new Paho.MQTT.Client(mqtt_broker, Number(mqtt_port), "/ws",randomString(20));
		this.mqtt_client.onMessageArrived = this.onMessageArrived.bind(this);

		this.mqtt_client.connect({
			onSuccess: this.onConnect.bind(this),
			keepAliveInterval: 3,
//			reconnect: true,
			timeout: 3
		});

		this.mqtt_client.onConnectionLost = this.onConnectionLost.bind(this);
	}

	onConnectionLost(response) {
		console.log("Connection lost ! " + this.caption+ "." + this.address+ " " +
					response.errorCode + "-" + response.errorMessage
		);
	}

	onConnect() {
		console.log("Connected." + this.caption+ "." + this.address+ ".");
		//
		// when connected, subscribe for status messages
		//
		this.mqtt_client.subscribe(this.mqtt_base+ this.address + this.mqtt_status);
		//
		// acquire current status
		//
		// the current model status is automagically acquired when
		// subscribing to the topic mqtt_status IF the messages are sent
		// by physical devices controllers in retained mode
		//
	}

	onMessageArrived(mqtt_message) {
		console.log(this.caption+ "." + this.address+ "." +
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
		this.mqtt_client.send(message);
	}

	set_state_off() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/slider_off.jpg");
		this.state = State.OFF;
	}

	set_state_on() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/slider_on.jpg");
		this.state = State.ON;
	}

	set_state_transition() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/slider_off.jpg");
		this.state = State.TRANSITION;
	}
}



	const UpDnState = {
		HOLD:        0,
		RISING:      8,
		FALLING:     9,
		TRANSITION: -1
	};




class UpDownSwitch {

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
				width: 150px;
				padding-top: 2px;
				padding-bottom: 0px;
				margin-bottom: 2px;
				font-family: arial;
			">
				<div style="padding-left: 5px;">
					<img object-fit="fill"; src="images/updown_black_fit.png" id=` + domElementId + mangled_address + `>
				</div>
				<div style="font-size: 18px; color: dark-grey; padding-left: 10px;">
			    	` + caption + `
			    </div>


			</div>
		`);
		this.doConnect();
	}

	doConnect() {
		//*****************************************************************************
		// Connect to MQTT broker
		// the broker name and port are defined in common.js (TBC)
		// https://www.eclipse.org/paho/clients/js/
		//*****************************************************************************

		this.mqtt_client = new Paho.MQTT.Client(mqtt_broker, Number(mqtt_port), "/ws",randomString(20));
		this.mqtt_client.onMessageArrived = this.onMessageArrived.bind(this);

		this.mqtt_client.connect({
			onSuccess: this.onConnect.bind(this),
			keepAliveInterval: 3,
//			reconnect: true,
			timeout: 3
		});

		this.mqtt_client.onConnectionLost = this.onConnectionLost.bind(this);


	}

	onConnectionLost(response) {
		console.log("Connection lost ! " + this.caption+ "." + this.address+ " " +
					response.errorCode + "-" + response.errorMessage
		);
	}

	onConnect() {
		console.log("Connected." + this.caption+ "." + this.address+ ".");
		//
		// when connected, subscribe for status messages
		//
		this.mqtt_client.subscribe(this.mqtt_base+ this.address + this.mqtt_status);
		//
		// acquire current status
		//
		// the current model status is automagically acquired when
		// subscribing to the topic mqtt_status IF the messages are sent
		// by physical devices controllers in retained mode
		//
	}

	onMessageArrived(mqtt_message) {
		console.log(this.caption+ "." + this.address+ "." +
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
		this.mqtt_client.send(message);
	}

	set_state_hold() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/updown_hold.png");
		this.state = UpDnState.HOLD;
	}

//	set_state_on() {
//		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/updown_red.png");
//		this.state = State.ON;
//	}

	set_state_rising() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/updown_rising.png");
		this.state = UpDnState.RISING;
	}

	set_state_lowering() {
		$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/updown_lowering.png");
		this.state = UpDnState.FALLING;
	}
}




class UpDownSwitchHalfSize {

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
		this.doConnect();
	}

	doConnect() {
		//*****************************************************************************
		// Connect to MQTT broker
		// the broker name and port are defined in common.js (TBC)
		// https://www.eclipse.org/paho/clients/js/
		//*****************************************************************************

		this.mqtt_client = new Paho.MQTT.Client(mqtt_broker, Number(mqtt_port), "/ws",randomString(20));
		this.mqtt_client.onMessageArrived = this.onMessageArrived.bind(this);

		this.mqtt_client.connect({
			onSuccess: this.onConnect.bind(this),
			keepAliveInterval: 3,
//			reconnect: true,
			timeout: 3
		});

		this.mqtt_client.onConnectionLost = this.onConnectionLost.bind(this);


	}

	onConnectionLost(response) {
		console.log("Connection lost ! " + this.caption+ "." + this.address+ " " +
					response.errorCode + "-" + response.errorMessage
		);
	}

	onConnect() {
		console.log("Connected." + this.caption+ "." + this.address+ ".");
		//
		// when connected, subscribe for status messages
		//
		this.mqtt_client.subscribe(this.mqtt_base+ this.address + this.mqtt_status);
		//
		// acquire current status
		//
		// the current model status is automagically acquired when
		// subscribing to the topic mqtt_status IF the messages are sent
		// by physical devices controllers in retained mode
		//
	}

	onMessageArrived(mqtt_message) {
		console.log(this.caption+ "." + this.address+ "." +
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
		this.mqtt_client.send(message);
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

