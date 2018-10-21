import { logger } from "./logger";

const mqtt = require('mqtt');
var conf   = require('./../../config/config.json');

class MqttClass {
    private client: any;
    private connected = false;

    constructor(){
        this.client = mqtt.connect(conf.mqtt_url);

        this.client.on('connect', () => {
            this.connected = true;
            logger.log('MQTT: connect');
            // this.client.subscribe('RfInterTechnoControl/#')
        })
        this.client.on('reconnect', () => {
            logger.log('MQTT: reconnect');
        })
        this.client.on('error', (error) => {
            logger.log('MQTT: error: ', error);
        })
        this.client.on('close', () => {
            this.connected = false;
            logger.log('MQTT: close');
        })
        this.client.on('offline', () => {
            logger.log('MQTT: offline');
        })
        
        this.client.on('message', (topic, message) => {
            let message_str = message.toString();
            let topic_elems = topic.split("/");
        })
    }

    public sentMsg = (topic: string, message: string): boolean => {
        if (this.connected){
            this.client.publish(topic, message);
            logger.log("MQTT: sentMsg()");
            return true;
        } else {
            logger.log("MQTT: sentMsg() - OFFLINE");
            return false;
        }
    }
    
    public getIsConnected(): boolean {
        return <boolean> this.client.connected;
    }
    
}

export const mqttService: MqttClass = new MqttClass();