// Import everything from express and assign it to the express variable
import * as express from 'express';
import * as bodyParser from 'body-parser';

// First, ensure that the config file exists (is generated)
const fs = require('fs');
const fs_extra = require('fs-extra')
const config_default_path = "config/config-default.json";
const config_path = "config/config.json";
if (!fs.existsSync(config_path)) {
  fs_extra.copySync(config_default_path, config_path);
  console.log('Default Config was copied to ' + config_path + " => Please restart");
  process.exit();
}

var conf = require('./config/config.json');
import { sProcessRunner } from './src/process/service_process_runner';
import { ProcessType, ConsoleLine, ProcessState, ProccessRunState } from './src/process/schema_process_runner';
import { sInterTechnoDecoder } from './src/InterTechnoDecoder';
import { sPacketAnalyzer } from './src/packet_analyzer';
import { logger } from './src/utils/logger';

// Create a new express application instance
const app: express.Application = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const port : number = 4500;

// app.use('/api', APIController);
// app.use(express.static('web'));

// Serve the application at the given port
/*
app.listen(port,"localhost", () => {
    // Success callback
    console.log(`Listening at http://localhost:${port}/`);
});
*/

function processStateUpdated (state: ProcessState) {
  if (state.running == ProccessRunState.STOPPED || state.running == ProccessRunState.ERROR){
    logger.log("RFSwitch Process stopped ... initiate restart ..");
    setTimeout(startRfReceiver, 500);
  }
}

function startRfReceiver () {
  logger.log("Start RFSwitch ...");
  sProcessRunner.startProcess(0, {
    app_cmd: conf.conf_exec_rfswitch,
    command: [],
    process_type: ProcessType.APPLICATON,
    info_text: "The RFReceiver",
    send_cout: true,
    run_dir: conf.conf_path_rfswitch,
    statusCallback: processStateUpdated,
    consoleCallback: sPacketAnalyzer.processConsoleLines
  });
}
setTimeout(startRfReceiver, 500); // inital start, delayed to wait for all service instances to be started