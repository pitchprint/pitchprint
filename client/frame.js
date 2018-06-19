/*
		PITCHPRINT iFrame.
*/

if (!window.PPCLIENT) window.PPCLIENT = {};

class PitchPrintFrame {
	constructor () {
		this.name = 'frame';
		this._version = '9.0.0';
		this._act = {
			eventStack: []
		};
		
		window.onmessage = this._handleMsg.bind(this);
		window.parent.postMessage('hello', document.referrer);
	}
	
	_handleMsg (_e) {
		var _dat = this._parse(_e.data);
		if (_dat) {
			switch (_dat.event) {
				case 'hello':
					this._vars = _dat.value;
					if (this._vars.apiKey) this._validate();
				break;
				case 'design-selected':
					this._changeDesign(_dat.value);
				break;
				case 'token':
					if (_dat.token) window.localStorage.setItem(_dat.name, _dat.token);
				break;
				case 'setData':
					this._setData(_dat.value);
				break;
				case 'getData':
					this._getData(_dat.value);
				break;
				default:
					if (typeof _dat.event === 'string') {
						if (this.iEvents) {
							this.iEvents.fire(_dat.event, _dat.value);
						} else {
							this._act.eventStack.push(_dat);
						}
					}
				break;
			}
		}
	}
	
	_getData(_data) {
		if (_data.path && typeof _data.path === 'string') {
			_data.path = _data.path.split('.');
			let _ref = this, _stage;
			do {
				_stage = _data.path.shift();
				_ref = _ref[_stage];
				if (!_ref) break;
			} while (_data.path.length > 0);
			this._sendMsg('dataReady', null, { ref: _data.ref, data: _ref });
		}
	}
	_setData(_data) {
		if (_data.path && typeof _data.path === 'string') {
			_data.path = _data.path.split('.');
			let _ref = this, _stage;
			do {
				_stage = _data.path.shift();
				_ref = _ref[_stage];
				if (!_ref) break;
			} while (_stage && _data.path.length > 1);
			
			_stage = _data.path.shift();
			try { _ref[_stage] = _data.value; } catch(_e) {}
		}
	}
	
	_comm(_url, _data, _method = 'POST', _dType = 'json', _cred = true) {
		return new Promise((_res, _rej) => {
			let _cType, _formData = '',
				_token = window.localStorage.getItem('pptoken');
				
			if (_token && _method === 'POST' && _url.split('/').pop() !== 'init') {
				if (_data) {
					_data.token = _token;
				} else {
					_data = { token: _token };
				}
			}
			if (_data && _method === 'GET') {
				_formData = [];
				for (let _key in _data) {
					if (typeof _data[_key] !== 'undefined' && _data[_key] !== null) _formData.push(encodeURIComponent(_key) + '=' + encodeURIComponent(_data[_key]));
				}
				_formData = _formData.join('&').replace(/%20/g, '+');
			}
			if (_method === 'POST') {
				_cType = 'application/x-www-form-urlencoded';
				if (_data) _formData = JSON.stringify(_data);
			} else if (_method === 'GET') {
				_cType = 'text/plain';
				if (_formData) _url += `?${_formData}`;
			}
			
			const _xhr = new XMLHttpRequest();
			_xhr.open(_method, _url, true);
			_xhr.onload = () => {
				let _response = _dType === 'json' ? this._parse(_xhr.responseText) : _xhr.responseText;
				if (_response.token) {
					window.localStorage.setItem('pptoken', _response.token);
					delete _response.token;
				}
				_res(_response);
			};
			_xhr.onerror = () => _rej(_xhr.statusText);
			_xhr.withCredentials = (_method.toUpperCase() === 'GET' ? false : _cred);
			_xhr.setRequestHeader("Content-Type", _cType);
			_xhr.send(_formData);
		});
	}
	
	_validate () {
		if (this._vars.config && this._vars.token) {
			this._config = this._vars.config;
			window.localStorage.setItem('pptoken', this._vars.token);
			this._act.validated = true;
			this._appendTags();
			this._init();
		} else {
			this._comm(`${this._vars.apiBase}init`, {
					userId: this._vars.userId,
					apiKey: this._vars.apiKey,
					client: this._vars.client,
					version: this._version,
					isFrame: true,
					isAdmin: this._vars.isAdmin
				}, 'POST')
			.then((_data) => {
				if (!_data.error) {
					this._vars.env = _data.validation;
					this._config = this._vars.config = _data.config;
					this._act.validated = true;
					this._appendTags();
					this._init();
				}
			})
			.catch((_err) => {
				console.log(_err);
			});
		}
	}
	
	_init () {
		if (!window.app) {
			console.log('App not in global');
			return;
		}
		this._app = new app.init(this._vars);
		this.iEvents = window.app.events;
		this.iModel = window.app.model;
		this.dModel = window.designer.model;
		
		this.iEvents.on('lib-ready', () => this._libReady());
		this.iEvents.on('editor-shown', () => this._editorShown());
		this.iEvents.on('project-saved', (_e) => this._projectSaved(_e));
		this.iEvents.on('close-frame', () => this._close());
		this.iEvents.on('app-validated', () => this._onValidated());
		this.iEvents.on('before-load-lib', () => this._beforeLoadLib());
		this.iEvents.on('listen-client', (_e) => this._clientListen(_e));
		this.iEvents.on('set-client', (_e) => this._clientSet(_e));
		
		if (this.iModel.runtime.startup.required.validate) this._onValidated();
		this._act.eventStack.forEach((_item) => { this.iEvents.fire(_item.event, _item.data); } );
		
		if (window.ppDesignerInitialized) window.ppDesignerInitialized(this);
		this._sendMsg('app-started');
		
		this.iEvents.on('design-shown', this._dispatchToClient.bind(this));
		this.iEvents.on('design-loaded', this._dispatchToClient.bind(this));
		this.iEvents.on('app-client-pageCount', this._dispatchToClient.bind(this));
		this.iEvents.on('app-client-templateChange', this._dispatchToClient.bind(this));
		this.iEvents.on('app-client-canvasResized', this._dispatchToClient.bind(this));
		this.iEvents.on('page-created', this._dispatchToClient.bind(this));
		this.iEvents.on('page-select-end', this._dispatchToClient.bind(this));
		this.iEvents.on('before-save', this._dispatchToClient.bind(this));
		//this.iEvents.on('project-saved', this._dispatchToClient.bind(this));
		this.iEvents.on('module-initialized', this._dispatchToClient.bind(this));
	}
	
	_dispatchToClient (_e) {
		this._sendMsg(_e.type, null, _e.data);
	}
	
	_changeDesign (_val) {
		this._vars.designId = this.iModel.vals.designId = _val;
		this.iEvents.fire('load-lib');
	}
	_libReady () {
		this._sendMsg('lib-ready', null, this._vars.designId);
	}
	
	_projectSaved (_e) {
		this._sendMsg('project-saved', null, _e.data);
		if (!this._vars.isUserProject) this._sendMsg('close-me');
	}
	_editorShown () {
		this._sendMsg('editor-shown');
	}
	_close () {
		this._sendMsg('close-me');
	}
	_clientListen (_e) {
		this._sendMsg('listen', null, _e.data);
	}
    _clientSet (_e) {
		this._sendMsg('set', null, _e.data);
	}
	
	_processCatModules (_val, _des) {
		if (_val) {
			var mods = typeof _val === 'string' ? JSON.parse(_val) : _val, _ret = false;
			if (!this.iModel.runtime.sources.extModules) this.iModel.runtime.sources.extModules = { };
			jQuery.each(mods, (_idx, _value) => {
				this.iModel.runtime.sources.extModules[_idx] = _value;
				if ((_idx === 'ds' && _value.enabled) || _value.overwriteCatSelector) {
					this.iModel.vals.designId = _value.default || _des[0].id;
					if (this.iModel.vals.designId === 'Pick default design' || this.iModel.vals.designId === '0') this.iModel.vals.designId = _des[0].id;
					this._vars.designId = this.iModel.vals.designId;
					this.iEvents.fire('load-lib');
					_ret = true;
				}
			});
			return _ret;
		}
	}
	
	_onValidated () {
		this._sendMsg('app-validated');
		if (this._vars.isCategory) this._fetchCatDetails();
	}
	_beforeLoadLib () {
		this._sendMsg('before-load-lib');
	}
	_fetchCatDetails() {
		this._comm(`${this._vars.apiBase}fetch-cat-details`, { id: this._vars.designId.substr(1) } )
			.then((_data) => {
				this.iModel.vals.designStack = { };
				if (!_data.error && _data.data.designs) {
					_data.data.designs.forEach(_itm => this.iModel.vals.designStack[_itm.id] = _itm);
					if (!this._processCatModules(_data.data.catModules, _data.data.designs)) {
						this._sendMsg('designs-fetched', null, _data.data.designs);
					} else {
						this._sendMsg('designs-fetched', null, null);
					}
				}
			})
			.catch((_err) => {
				console.log(_err);
			});
	}	
	_appendTags () {
		if (this._config.customJs) jQuery(`<script>${this._config.customJs}</script>`).appendTo("head");
		if (this._config.customCss) jQuery(`<style>${this._config.customCss}</style>`).appendTo("head");
		document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="${this._vars.domainBase}themes/${this._vars.isMobile ? 'm' : ''}${this._vars.isAdmin ? 'default' : this._vars.env.idx}.css" type="text/css">`);
	}
	
	_sendMsg (_event, _target, _value) {
		window.parent.postMessage(JSON.stringify( {
			event: _event,
			target: _target,
			value: _value
		} ), document.referrer);
	}
	
	_parse (_str) {
		try {
			return JSON.parse(_str);
		} catch (e) { return false; }
	}
	
	get eventBus() { return this.iEvents; }
	get eventModel() { return this.iModel; }
	
	fire (_e, _val) {
		this.iEvents.fire(_e, _val);
	}
}

(function(global) {
	window.ppframe = new PitchPrintFrame();
})(this);