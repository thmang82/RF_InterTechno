import { ProcessRunInstance } from "./process_runner";
import { ProcessState, ConsoleLine, ProcessConfig, ProccessRunState, ProcessRunnerLinesPacket } from "./schema_process_runner";
import * as Moment from "moment";
var btoa = require('btoa');

class ServiceProcessRunner {
    private process_instances: {[instance_id: string]: ProcessRunInstance} = {};

    constructor(){
        setInterval(this.cleanTerminatedInstances, 60*1000); // every minute
    }

    private randomString(length: number) {
        let rtn = "";
        do {
            rtn += btoa("" + Math.floor(Math.random() * 100000)).substring(0, length);
        }
        while(rtn.length < length);
        return rtn;
    }

    public startProcess = (user_id: number, config: ProcessConfig): ProcessRunInstance =>{
        let instance_id = this.randomString(10);
        while (this.process_instances[instance_id]){
            instance_id = this.randomString(10); // get a not used instance ID
        }
        let runner = new ProcessRunInstance(user_id, config, instance_id);
        this.process_instances[instance_id] = runner;
        runner.start();
        return runner; // state will not be running here !!!
    }
    public statusChanged = (state: ProcessState) => {
        // status changed
    }
    public uploadConsoleLog = (state: ProcessState, lines: ConsoleLine[]) => {
        let packet: ProcessRunnerLinesPacket = {
            process_state: state,
            lines: lines
        }
    }

    private cleanTerminatedInstances = () => {
        let now_js = Moment().valueOf();
        let keys = Object.keys(this.process_instances);
        let min_time_since_terminated_ms = 1 * 60 * 1000;
        keys.forEach(key => {
            let instance = this.process_instances[key];
            let state = instance.getState();
            let t_end = state.time_end;
            if (state.running !== ProccessRunState.RUNNING && t_end && (now_js - t_end.epoch_js) >  min_time_since_terminated_ms){
                delete this.process_instances[key];
            }
        })
    };
}

export const sProcessRunner  = new ServiceProcessRunner();