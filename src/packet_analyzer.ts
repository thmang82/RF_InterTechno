import { sInterTechnoDecoder } from "./InterTechnoDecoder";
import { ConsoleLine } from "./process/schema_process_runner";
import { Moment } from "moment";
import * as moment from 'moment';
import { logger } from "./utils/logger";
import { mqttService } from "./utils/mqtt_service";
var conf = require('./../config/config.json');

const CONF_REPEAT_INSIDE_MS = conf.repeat_inside_ms;

class PacketAnalyzer {
    private events_first: {[event_id: string]: number} = {};

    constructor() {
        logger.log("Packet Analyzer - MQTT Topic: " + conf.mqtt_topic);
    }

    public processConsoleLines = (lines: ConsoleLine[]): void => {
        // logger.log("Lines: ", lines);
        lines.forEach(line => {
          // logger.log(line.time_iso, line.type, line.line);
          if (line.line.startsWith("JSON: ")){
            let line_str = line.line;
            line_str = line_str.replace("JSON: ", "");
            let json_o = JSON.parse(line_str);
            let payload_arr: number[] = json_o["Payload"];
            // logger.log("Payload: ", JSON.stringify(payload_arr));
            
            //let decoded_v1 = sInterTechnoDecoder.decodeIntertechno(payload_arr)
             //logger.log("decoded_v1: ", decoded_v1);
            let decoded_v3 = sInterTechnoDecoder.decodeIntertechnoV3(payload_arr);
            if (decoded_v3 && decoded_v3.startsWith("IT3-")){ // Filter out "nosync"
                let time_last_m = this.events_first[decoded_v3];
                let time_js = moment().valueOf();
                let elapsed_ms = !time_last_m ? null : (time_js - time_last_m);
                if (!elapsed_ms || elapsed_ms > CONF_REPEAT_INSIDE_MS){
                    this.events_first[decoded_v3] = time_js;
                    // It's the first packet
                    logger.log("decoded_v3: " + decoded_v3 + " => FIRST");
                    mqttService.sentMsg(conf.mqtt_topic, decoded_v3 );
                } else {
                    logger.log("decoded_v3: " + decoded_v3 + " => REPEAT");
                }
            } else {
                 logger.log("decoded_v3: " + decoded_v3 + " <= Not Ok");
            }
          }
        })
      }
}

export const sPacketAnalyzer = new PacketAnalyzer();