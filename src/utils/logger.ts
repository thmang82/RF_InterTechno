import * as bunyan from 'bunyan';
import * as stacktrace from 'stack-trace';
import * as momentTz from 'moment-timezone';
var conf = require('./../../config/config.json');
var LOG_ENABLED = true;

interface caller {
    filename: string, 
    filepath: string,
    line: number
}
let directory_path = __dirname.split("\\").join("/");;
let dir_base_path = directory_path.replace("/modules_typescript/src/utils/","");
console.log("Logger - dir_base_path: " + dir_base_path);

class Logger {
    private logging_enabled = LOG_ENABLED;
    private log_path = "";

    private bunyan_instance : bunyan;
    private log_std_out = false;
    private orig_log = console.log;
    private orig_warn = console.warn;
    private orig_error = console.error;

    constructor(){
        this.log_std_out  = conf.log_std_out;

        this.log_path = conf.log_path;

        let streams: Object[] = [];
        if (conf.log_to_file){
            streams.push({
                type: 'rotating-file',
                path: this.log_path,
                period: '1h',           // hourly rotation
                count: 3*24,            // keep 3 days (48*1h) of logs
            })
        }
    
        this.bunyan_instance = bunyan.createLogger({
            name: 'RfInterTechno',
            streams: streams
        });
    }

    public getConfLogStdOut():boolean{
        return conf.log_std_out;
    }
    public disableLogging(){
        this.logging_enabled = false;
    }

    private getFileAndLine(pos_mod: number): caller {
        var trace = stacktrace.get();
        // console.log("trace:", trace);
        let pos = 2 + pos_mod;
        let path = trace[pos].getFileName().split("\\").join("/");
        let relative_path = path.replace(dir_base_path,"");
        // console.log("path: " + path, " - relative_path: " + relative_path)
        let filename = "";
        if (relative_path){
            let path_arr = relative_path.split("/");
            //console.log("path_arr: ",path_arr);
            filename = (path_arr && path_arr.length > 0) ? path_arr[path_arr.length - 1 ] : path;
        }
        let caller = {
            filename: filename,
            filepath: relative_path,
            line: trace[pos].getLineNumber()
        }
        return caller;
    }
    private getCallLocation() : string {
        let file_pos = this.getFileAndLine(1);
        return file_pos.filename + ":" + file_pos.line;
    }

    public getTime = (): string => {
        return momentTz.tz().format("YYYY-MM-DD hh:mm:ss.SSS") + ": "; 
    }

    public error = (...args: any[]) => {
        if (this.isLogEnabled()) {
            this.bunyan_instance.error({location: this.getCallLocation()}, args);
            if (this.log_std_out){
                args.unshift(this.getTime());
                this.orig_error.apply(console, args);
            }
        }
        return;
    }

    public warn = (...args: any[]) => {
        if (this.isLogEnabled()) {
            this.bunyan_instance.warn({location: this.getCallLocation()}, args);
            if (this.log_std_out){
                args.unshift(this.getTime());
                this.orig_warn.apply(console, args);
            }
        }
        return;
    }
    public log = (...args: any[]) => {
        if (this.isLogEnabled()) {
            this.bunyan_instance.info({location: this.getCallLocation()}, args);
            if (this.log_std_out){
                args.unshift(this.getTime());
                // args.unshift(this.getCallLocation());
                this.orig_log.apply(console, args);
            }
        }
        return;
    }

    public isLogEnabled = () => {
        return this.logging_enabled;
    }
}
export const logger: Logger = new Logger();