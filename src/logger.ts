import * as ddebug from 'debug'

const APP_NAME = 'recorder'

export default class Logger
{
    debug:any
    warn:any
    error:any 

	constructor(prefix?:string)
	{
		if (prefix)
		{
			this.debug = ddebug(APP_NAME + ':' + prefix);
			this.warn = ddebug(APP_NAME + ':WARN:' + prefix);
			this.error = ddebug(APP_NAME + ':ERROR:' + prefix);
		}
		else
		{
			this.debug = ddebug(APP_NAME);
			this.warn = ddebug(APP_NAME + ':WARN');
			this.error = ddebug(APP_NAME + ':ERROR');
		}

		this.debug.log = console.info.bind(console);
		this.warn.log = console.warn.bind(console);
		this.error.log = console.error.bind(console);
	}

}