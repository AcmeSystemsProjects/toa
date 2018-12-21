

///////////////////////////////////////////////////////////////////////
//
//   Sonoff Tasmota Controller Base class
//
//   An object oriented evolution of TOA (C) Sergio Tanzilli
//
//
///////////////////////////////////////////////////////////////////////

class Sonoff_Tasmota_Controller_Base {


    static doConnect () {
		Sonoff_Tasmota_Controller_Base.mqtt_client = new Paho.MQTT.Client(mqtt_broker, Number(mqtt_port), "/ws",randomString(20));
		Sonoff_Tasmota_Controller_Base.mqtt_client.onMessageArrived = Sonoff_Tasmota_Controller_Base.onMqttMessageArrived.bind(Sonoff_Tasmota_Controller_Base);

		Sonoff_Tasmota_Controller_Base.mqtt_client.connect({
			onSuccess: Sonoff_Tasmota_Controller_Base.onConnect.bind(Sonoff_Tasmota_Controller_Base),
			keepAliveInterval: 3,
			reconnect: true,
			timeout: 3
		});

		Sonoff_Tasmota_Controller_Base.mqtt_client.onConnectionLost = Sonoff_Tasmota_Controller_Base.onConnectionLost.bind(SCS_Controller_Base);
		Sonoff_Tasmota_Controller_Base.mqtt_client.onFailure        = Sonoff_Tasmota_Controller_Base.onFailure.bind(SCS_Controller_Base);
	}


	static onConnect() {
		console.log("Instance  ",  Sonoff_Tasmota_Controller_Base.instanceCount, " instance connected ! ");

		//
		// when connected, subscribe for status messages
		//

		var i = 0,
        l = Sonoff_Tasmota_Controller_Base.allInstances.length;
		for (; i < l; i++) {
			var x = Sonoff_Tasmota_Controller_Base.allInstances[i];

			// console.log("***** ", i, " ", x.caption+ "." + x.address+ "." );

			Sonoff_Tasmota_Controller_Base.mqtt_client.subscribe(x.mqtt_status+'/'+
													  x.address + "/"+ "#"
													  );
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
		console.log("Connection lost Sonoff_Tasmota_Controller_Base ! "	);
	}

	static onFailure(response) {
		console.log("Connection FAILURE Sonoff_Tasmota_Controller_Base ! " );
	}

	static onMqttMessageArrived (mqtt_message) {
		console.log("onMqttMessageArrived >>"+
					mqtt_message.destinationName + "." +
					mqtt_message.payloadString);

		var i = 0,
        l = Sonoff_Tasmota_Controller_Base.allInstances.length;
		for (; i < l; i++) {
			var x = Sonoff_Tasmota_Controller_Base.allInstances[i];

			console.log("***** ", i, " ", x.caption+ "-" + x.mqtt_status + "/" + x.address);

			if (mqtt_message.destinationName == x.mqtt_status+"/"+x.address+"/POWER") {
				// call "virtual" method overridden in the derived classes
				x.virtualMqttMessageProcessing (mqtt_message);

			}
		}
	}


	constructor(caption, address, domElementId, mqtt_status, mqtt_cmd) {
		this.domElementId = domElementId;
		this.address = address;
		this.caption = caption;

		this.mqtt_status = mqtt_status;
		this.mqtt_cmd    = mqtt_cmd

		//
		// increase instance counter
		// instanceCount is a class variable (i.e., a variable
		// associated to the class and shared between all instances
		//
		Sonoff_Tasmota_Controller_Base.instanceCount = Sonoff_Tasmota_Controller_Base.instanceCount ? Sonoff_Tasmota_Controller_Base.instanceCount + 1 : 1;

		// if we are the first instance, we start the MQTT connection
		if (Sonoff_Tasmota_Controller_Base.instanceCount == 1) {
			Sonoff_Tasmota_Controller_Base.doConnect();
		}
		// register ourselves in class instance list
		Sonoff_Tasmota_Controller_Base.allInstances.push(this);
	}

	sendMqttMessage (message) {
		Sonoff_Tasmota_Controller_Base.mqtt_client.send(message);
	}
}

Sonoff_Tasmota_Controller_Base.allInstances = [];


//////////////////////////////////////////////////////////////////////
//
// On Off switch for lights and other Sonoff Touch with Tasmota
//
//
//////////////////////////////////////////////////////////////////////


class OnOffSwitch_SonoffTouch_Tasmota_SD  extends Sonoff_Tasmota_Controller_Base {

	constructor(caption, address, domElementId, mqtt_status, mqtt_cmd, icon_slider = false) {

		super (caption, address, domElementId, mqtt_status, mqtt_cmd);

		this.address = address;
		this.state   = UpDnState.OFF;
		this.icon_slider = icon_slider;

		// Note: function bind() usage taken from
		// Access class properties outside of mqtt callback scope
		// https://stackoverflow.com/questions/42233090/access-class-properties-outside-of-mqtt-callback-scope
		// Note: function bind() usage taken from
		// Access class properties outside of mqtt callback scope
		// https://stackoverflow.com/questions/42233090/access-class-properties-outside-of-mqtt-callback-scope

		$("#" + this.domElementId).click(this.click_handler.bind(this));

		var mangled_address = address.replace(/\//g, "-");

		if (icon_slider == false) {
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
		} else {
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
		}
	}

	virtualMqttMessageProcessing (mqtt_message) {
		console.log("virtualMqttMessageProcessing >>>>>>>>"+
					mqtt_message.destinationName + "." +
					mqtt_message.payloadString);

		if (mqtt_message.payloadString=="OFF") {
			this.set_state_off();
		} else {
			this.set_state_on();
		}
	}


	click_handler() {
		var message;

		switch (this.state) {
		case State.OFF:
			message = new Paho.MQTT.Message("ON");
			this.set_state_transition ();
			break;
		case State.ON:
			message = new Paho.MQTT.Message("OFF");
			break;
		case State.TRANSITION:
			message = new Paho.MQTT.Message("OFF");
			break;
		default:
			// should ever happen
			console.log(this.caption+ " " + this.address+ " " + "FATAL: WRONG STATUS");
			message = new Paho.MQTT.Message("OFF");
			return;
		}
		// set the topic for the command to be sent
		message.destinationName = this.mqtt_cmd + "/" + this.address + "/POWER";

		console.log("Publishing... " + message.destinationName + " - " + message);

		// send the message to the topic
		this.sendMqttMessage(message);
	}

	// controller internal status management: it is indipendent from MQTT messages
	set_state_off() {
		if (this.icon_slider == false) {
			$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/off.png");
		} else {
			$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/slider_off.jpg");
		}
		this.state = State.OFF;
	}

	set_state_on() {
		if (this.icon_slider == false) {
			$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/on.png");
		} else {
			$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/slider_on.jpg");
		}
		this.state = State.ON;
	}

	set_state_transition() {
		if (this.icon_slider == false) {
			$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/off.png");
		} else {
			$("#" +  this.domElementId + this.address.replace(/\//g, "-") ).attr("src","images/slider_off.jpg");
		}
		this.state = State.TRANSITION;
	}
}
