import { spawn, ChildProcess } from "child_process";
import { logger } from "./../utils/logger";
import { help } from "./../utils/help_functions";
import { sProcessRunner } from "./service_process_runner";
import * as Moment from 'moment';
import { ProcessOutputType, ProcessState, ConsoleLine, ProcessConfig, ProccessRunState, ProcessTime } from "./schema_process_runner";
// Process CPU and Memory Usage: https://github.com/soyuka/pidusage

const CONF_INTERVAL_OUT_PUSH_MS = 50;


export class ProcessRunInstance {
    private state:     ProcessState;
    private spawn_ref: ChildProcess | null = null;
    public  console_log: ConsoleLine[] = [];
    private console_log_tx_buffer: ConsoleLine[] = [];
    private interval_log_tx_id: NodeJS.Timer | null = null;

    private getTimeNow(): ProcessTime{
        let m_now = Moment();
        return {
            epoch_js: m_now.valueOf(),
            iso_str: m_now.format("YYYY-MM-DDTHH:mm:ss.SSS")
        }
    }

    constructor (user_id: number, config: ProcessConfig, instance_id: string){
        this.state = {
           config: config,
           instance_id: instance_id,
           pid: null,
           user_id: user_id,
           running: ProccessRunState.STOPPED,
           time_start: null,
           time_end: null
        }
        let self = this;
    }
    public getUserID = (): number => {
        return this.state.user_id;
    }
    public getState = (): ProcessState => {
        return this.state;
    }
    public getConsoleLog = () => {
        return this.console_log;
    }
    public start = async() => {
        let config = this.state.config;
        if (config && this.state.running !== ProccessRunState.RUNNING && this.state.running !== ProccessRunState.STOPPING) {
            this.interval_log_tx_id = setInterval(this.pushConsoleLog, CONF_INTERVAL_OUT_PUSH_MS);
            let proc =    config.app_cmd;
            let command = config.command;
            let run_dir = config.run_dir;
            logger.log("Starting app with cmd:", proc, command,"in dir:",run_dir);
            let self = this;
            try {
                this.spawn_ref = spawn(proc, (command ? command : []), {detached: true, stdio: [ 'ignore' ], cwd: (run_dir ? run_dir : "")});
                this.spawn_ref.on('error', (err) => {
                    logger.log('Failed to start child process, err: ', err);
                    self.state.running = ProccessRunState.ERROR;
                });
             } catch (e){
                logger.error("Spawn Error: ", e);
            }
            // logger.log("this.spawn_ref: ", this.spawn_ref)

            let wait_max_ms = 10 * 1000;
            let wait_sleep_ms = 10;
            let wait_count_max = wait_max_ms / wait_sleep_ms;
            let wait_count = 0;
            while (this.spawn_ref && !this.spawn_ref.pid && wait_count < wait_count_max 
                && this.state.running !==  ProccessRunState.ERROR) {
                let slept = await help.sleepAwaitMs(wait_sleep_ms)
                wait_count ++;
            }
            this.state.pid = this.spawn_ref ? this.spawn_ref.pid : null;
            if (!this.state.pid){
                logger.warn("Could not get PID for process: ", config);
            } else {
                this.state.running = ProccessRunState.RUNNING;
                this.state.time_start = this.getTimeNow();
                sProcessRunner.statusChanged(this.state);
                if (this.state.config.statusCallback){
                    this.state.config.statusCallback(this.state);
                }
            }
            logger.log("After App Starting -> PID:", this.state.pid);
            // configure the std out and std err reads:
            if (this.spawn_ref) {
                this.spawn_ref.stdout.on('data', (data) => {
                    if (config.send_cout) {
                        let lines = data.toString().split(/(?:\r\n|\r|\n)+/g);
                        this.processOutput(config, ProcessOutputType.STDOUT, lines);
                    }
                });
                this.spawn_ref.stderr.on('data', (data) => {
                    let lines = data.toString().split(/(?:\r\n|\r|\n)+/g);
                    this.processOutput(config, ProcessOutputType.STDERR, lines);
                });
                this.spawn_ref.on('exit', (code) => {
                    this.state.running = ProccessRunState.STOPPED;
                    this.state.time_end = this.getTimeNow();
                    logger.log('ProcessRunner: Child '+ config.app_cmd +' exited with code ' + code);
                    sProcessRunner.statusChanged(this.state);
                    if (this.state.config.statusCallback){
                        this.state.config.statusCallback(this.state);
                    }
                    this.pushConsoleLog(); // push eventual not pushed console lines
                    if (this.interval_log_tx_id) { // stop the push timer
                        clearInterval(this.interval_log_tx_id);
                        this.interval_log_tx_id = null;
                    }
                });
            }
        } else {
            logger.error("ProcessRunner: Tried to start a running ")
        }
    }

    public stop = () => {
        let pid = JSON.parse(JSON.stringify(this.spawn_ref ? this.spawn_ref.pid : null));
        logger.log("Try to stop: ", this.state.config.app_cmd);
        this.state.running = ProccessRunState.STOPPING;
        if (this.state.config.statusCallback){
            this.state.config.statusCallback(this.state);
        }
        let kill_by_kill = false;
        if (kill_by_kill && this.spawn_ref){
            if (this.state.running){
                this.spawn_ref.kill('SIGINT');
            }
        }else{
            if (pid) {
                process.kill(pid);
                logger.log("killed pid: "+ pid);
            } else {
                logger.log("Unknown PID");
            }
        }
    }

    private processOutput = (config: ProcessConfig, type_t: ProcessOutputType, lines: string[]) => {
        let line_e = lines.map((line_t) => { return {type: type_t, line: line_t, time_iso: Moment().format("YYYY-MM-DDTHH:mm:ss.SSS")}});
        this.console_log            = this.console_log.concat(line_e); // append to lines
        this.console_log_tx_buffer  = this.console_log_tx_buffer.concat(line_e); // append to lines
        if (config.consoleCallback){
            config.consoleCallback(line_e);
        }
    }
    private pushConsoleLog = () => {
        if (this.console_log_tx_buffer.length > 0 && this.state.config.send_cout) {
            sProcessRunner.uploadConsoleLog(this.state, this.console_log_tx_buffer);
            this.console_log_tx_buffer = [];
        }
    }
}