
export enum ProccessRunState {
    UNDEFINED = <any>"UNDEFINED",
    RUNNING   = <any>"RUNNING",
    STOPPING  = <any>"STOPPING",
    STOPPED   = <any>"STOPPED",
    ERROR   = <any>"ERROR",
}

export enum ProcessOutputType {
    STDOUT = <any>"STDOUT",
    STDERR = <any>"STDERR"
}

export enum ProcessType {
    APPLICATON = <any>"APPLICATON"
}
export type processStatusCallback = (state: ProcessState) => void;
export type processLinesCallback = (lines: ConsoleLine[]) => void;
export interface ProcessConfig {
    process_type: ProcessType;
    info_text: string;
    app_cmd:   string;   // e.g. top;
    command:   string[]; // ['-b','-d','1']
    run_dir:   string;
    send_cout: boolean;
    statusCallback?: processStatusCallback | null;
    consoleCallback?: processLinesCallback | null;
}
export interface ProcessTime {
    iso_str: string,
    epoch_js: number
}
export interface ProcessState {
    config:      ProcessConfig;

    instance_id: string; // will be filled by the process runner
    running:     ProccessRunState;
    pid:         number | null;
    user_id:     number;
    time_start:  ProcessTime | null;
    time_end:    ProcessTime | null;
};

export interface ConsoleLine {
    time_iso: string;
    type: ProcessOutputType;
    line: string;
}


export interface ProcessRunnerLinesPacket {
    process_state: ProcessState;
    lines: ConsoleLine[]
}