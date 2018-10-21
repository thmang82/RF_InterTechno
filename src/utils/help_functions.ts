import * as moment from 'moment';
import * as momentTz from 'moment-timezone';


class Help {
	public stringContains = (str: string, search: string) => {
		return (str.indexOf(search) > -1);
	}

	public stringContainsRegex = (str: string, search_reg_str: string) => {
		var str_elem = String(str);
		return (str_elem.search(new RegExp(search_reg_str, "i")) != -1);
	}
	
	// Help function that enables a "sleep" inside an async function
	// call with "await", Example: let slept = await help.sleepAwaitMs(200);
	public sleepAwaitMs(timeout_ms: number): Promise<boolean>{
		return new Promise<boolean>((resolve, reject) => {
			setTimeout(() => { resolve(true); }, timeout_ms);
		});
	}
}

export const help: Help = new Help();
