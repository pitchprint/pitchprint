/*
		PITCHPRINT Client.
*/
if (!window.PPCLIENT) window.PPCLIENT = {};

class PitchPrintClient {
	constructor (_vars = {}) {
		this.name = 'client';
		this._version = '9.0.0';
		this._vars = {
			apiKey: _vars.apiKey,
			product: _vars.product || {},
			langCode: _vars.langCode || 'en',
			uploadUrl: _vars.uploadUrl,
			userId: _vars.userId || 'guest',
			userData: _vars.userData,
			designId: (_vars.designId && _vars.designId !== '-1' && _vars.designId !== '0') ? _vars.designId : '',
			projectId: _vars.projectId,
			apiBase: _vars.apiBase || 'https://api.pitchprint.io/client/',
			
			frameDomain: _vars.frameDomain || 'https://pitchprint.io',
			domainBase: _vars.domainBase || 'https://pitchprint.io/',
			domainDirect: _vars.domainDirect || 'https://s3-eu-west-1.amazonaws.com/pitchprint.io/',
			buildPath: _vars.staging ? '' : '',
			
			pluginRoot: _vars.pluginRoot || '',
			mode: _vars.mode || 'new',
			isMobile: (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent)) && window.outerWidth <= 480,
			isTablet: window.innerWidth <= 1024,
			designStack: {},
			client: _vars.client,
			previews: _vars.previews,
			template: _vars.template,
			enableUpload: parseInt(_vars.enableUpload),
			createButtons: _vars.createButtons,
			displayMode: _vars.displayMode,
			isCheckoutPage: _vars.isCheckoutPage,
			isHistoryPage: _vars.isHistoryPage,
			ppOptionId: _vars.ppOptionId,
			clientVersion: _vars.clientVersion,
			customizationRequired: _vars.customizationRequired,
			cValues: _vars.cValues,
			parentHeight: window.innerHeight,
			custom: _vars.custom || false,
			staging: _vars.staging || false
		};
		this._handlers = {};
		this._vars.isCategory = this._vars.designId ? (this._vars.designId.length ? ((this._vars.designId[0] === '*') && (this._vars.mode !== 'edit')) : false) : false;
		this._vars.designCat = this._vars.isCategory ? this._vars.designId : undefined;
		this._vars.autoInitialize = !this._vars.isCategory;
		this._act = { }; this._pipe = { };
		this._ui = {
			spinner: `${this._vars.domainBase}rsc/images/loaders/spinner_new.svg`
		};
		this._vars.selectors = {
			imageQry: `#image-block`,
			qryCval: `#_w2p_set_option,#web2print_option_value`,
			qryHideCartBtn: ".single_add_to_cart_button,.kad_add_to_cart,.addtocart,#add-to-cart,.add_to_cart,#add,#AddToCart,#product-add-to-cart,#add_to_cart,#button-cart,#AddToCart-product-template,.product-details-wrapper .add-to-cart",
			qryThumbs: ".thumbnails,.thumbs,.flex-control-thumbs,.more-view-wrapper,#views_block"
		};
		this.validate(_vars.afterValidation);
		this._loadScripts();
	}
	_loadScripts() {
		if (this._vars.enableUpload) {
			let _s = document.createElement("script"),
				_u = document.createElement("script");
			_s.src = `${this._vars.domainBase}${this._vars.buildPath}rsc/js/uploader.js`;
			_u.src = `${this._vars.domainBase}${this._vars.buildPath}rsc/js/file-uploader.js`;
			document.head.appendChild(_s);
			document.head.appendChild(_u);
		}
	}
	_cleanup() {
		switch (this._vars.client) {
			case 'ps':
				let _cust = document.getElementById('customizationForm');
				if (_cust) _cust.parentElement.style.display = 'none';
			break;
		}
	}
	_parse(_str) {
		try {
			return JSON.parse(_str);
		} catch (e) { return false; }
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
			if (_url.indexOf('https://') !== 0) _url = `${this._vars.apiBase}${_url}`;
			const _xhr = new XMLHttpRequest();
			_xhr.open(_method, _url, true);
			_xhr.onload = () => {
				let _response = _dType === 'json' ? this._parse(_xhr.responseText) : _xhr.responseText;
				if (_response.token) window.localStorage.setItem('pptoken', _response.token);
				_res(_response);
			};
			_xhr.onerror = () => _rej(_xhr.statusText);
			_xhr.withCredentials = (_method.toUpperCase() === 'GET' ? false : _cred);
			_xhr.setRequestHeader("Content-Type", _cType);
			_xhr.send(_formData);
		});
	}
	_createUi() {
		this._cleanup();
		if (this._vars.isMobile) {
			this._vars.displayMode = 'modal';
		} else {
			if (!this._vars.displayMode) this._vars.displayMode = this._config.displayMode;
			if (this._vars.displayMode !== 'modal') {
				this._ui.frameParent = document.querySelector(this._config.inlineSelector);
				if (!this._ui.frameParent) this._vars.displayMode = 'modal';
			}
		}
		
		if (this._vars.projectId && !isNaN(parseInt(this._vars.previews))) {
			let _arr = [], _count = parseInt(this._vars.previews);
			for (let _i = 0; _i < _count; _i++) {
				_arr.push(`${this._vars.projectId}_${_i+1}.jpg`);
			}
			this._updatePreviews(_arr, `${this._vars.domainBase}previews/`, false);
			if (this._isValidPP(this._vars.cValues) && this._vars.mode === 'edit') this._vars.designId = this._parse(decodeURIComponent(this._vars.cValues)).designId;
		} else if (this._vars.mode === 'upload') {
			if (this._vars.previews || typeof this._vars.cValues === 'object') {
				this._updatePreviews(this._vars.previews || this._vars.cValues.previews, '', false);
			} else if (this._isValidPP(this._vars.cValues)) {
				this._updatePreviews(this._parse(decodeURIComponent(this._vars.cValues)).previews, '', false);
			}
		}
		
		this._ui.frame = document.createElement('iframe');
		this._ui.frame.src = `${this._vars.domainBase}index.html`;
		this._ui.frame.style.width = '100%';
		this._ui.frame.style.border = 'none';
		if (!this._vars.autoShow) this._vars.autoShow = this._config.showOnStartup && !this._vars.isMobile;
		
		switch (this._vars.displayMode) {
			case 'inline':
				this._ui.frameParent.insertBefore(this._ui.frame, this._ui.frameParent.firstChild);
				this._ui.frame.style.display = 'block';
				this._ui.frame.style.height = '700px';
				this._ui.frame.style.transition = "max-height 0.6s cubic-bezier(.05,.59,.14,1)";
				this._ui.frame.style['max-height'] = '0';
				this._ui.frame.style['margin-bottom'] = '10px';
			break;
			case 'mini':
			case 'modal':
				document.body.appendChild(this._ui.frame);
				this._ui.frame.style.display = 'none';
				this._ui.frame.style['z-index'] = -10;
				let _w, _h;
				if (this._vars.displayMode === 'mini') {
					_w = this._config.frameWidth || '880px';
					_h = this._config.frameHeight || '600px';
					this._vars.autoShow = true;
				} else if (this._vars.isMobile) {
					_w = '100%';
					_h = '100%';
				} else {
					_w = '100vw';
					_h = '100vh';
				}
				window.onresize = this._handleResize.bind(this);
				this._ui.frame.style.width = _w;
				this._ui.frame.style.height = _h;
			break;
		}
		window.onmessage = this._handleMsg.bind(this);
		this._act.uiCreated = true;
		this._trigger('ui-created');
	}
	_handleResize(_force) {
		if (this._act.editorShown || _force) {
			if (this._vars.displayMode === 'mini') {
				let _bound = document.querySelector(this._vars.selectors.imageQry);
				if (_bound) {
					_bound = _bound.getBoundingClientRect();
					this._ui.frame.style.left = `${_bound.left + window.scrollX}px`;
					this._ui.frame.style.top = `${_bound.top + window.scrollY}px`;
				}
			} else {
				this._ui.frame.style.width = window.innerWidth + 'px';
				this._ui.frame.style.height = window.innerHeight + 'px';
			}
		}
	}
	_isValidPP(_dat) {
		if (!_dat || _dat === '') return false;
		try {
			let _j = JSON.parse(decodeURIComponent(_dat));
			if (_j.type && _j.product) { return true; } else { return false; }
		} catch (e) { return false; }
		return true;
	}
	_sendMsg(_event, _target, _value) {
		const _msg = JSON.stringify({
			event: _event,
			target: _target,
			value: _value
		});
		if (!this._pipe.msgHandle) {
			this._pipe.msgCache = _msg;
			return;
		}
		this._pipe.msgHandle.postMessage(_msg, this._vars.frameDomain);
	}
	_handleMsg(_e) {
		if (_e.origin !== this._vars.frameDomain) return;
		if (_e.data === 'hello') {
			this._pipe.msgHandle = _e.source;
			this._sendMsg('hello', '', this._vars);
			if (this._pipe.msgCache) this._pipe.msgHandle.postMessage(this._pipe.msgCache, this._vars.frameDomain);
			this._pipe.msgCache = null;
			return;
		}
		
		const _dat = this._parse(_e.data);
		if (_dat) {
			if (_dat.event) this._trigger(_dat.event, _dat.value);
			switch (_dat.event) {
				case 'show-app':
					this.showApp();
				break;
				case 'project-saved':
					this._onSave(_dat.value);
				break;
				case 'app-validated':
					this._onFrameValidated();
				break;
				case 'designs-fetched':
					this._designsFetched(_dat.value);
				break;
				case 'before-load-lib':
					
				break;
				case 'editor-shown':
					this._act.editorShown = true;
					this._setBtnPref();
				break;
				case 'close-me':
					this.closeApp();
				break;
				case 'listen':
					this._listen(_dat.value);
				break;
				case 'set':
					this._set(_dat.value);
				break;
				case 'app-started':
					this._appStarted();
				break;
			}
		}
	}
	_appStarted() {
		if (window.ppDesignerInitialized) window.ppDesignerInitialized(this);
	}
	_set (_val) {
		if (_val.selector) {
			let _element = document.querySelector(_val.selector);
			if (_element) {
				switch (_element.nodeName.toLowerCase()) {
					case 'select':
						_element.value = _val.value;
						jQuery(_element).change();
					break;
				}
			}
		}
	}
	_listen (_val) {
		if (jQuery && _val.selector && _val.fire) {
			let _send = (_e) => {
				let _trg = jQuery(_e ? _e.currentTarget : _val.selector);
				this._sendMsg(_val.fire, null, {
					selector: _val.selector,
					value: _trg.val(),
					text: _trg.text(),
					event: _val.event
				});
			}
			if (_val.event) jQuery(_val.selector).on(_val.event, _send);
			_send();
		}
	}
	_getAccountPath () {
		if (this._vars.accountPath) return this._vars.accountPath;
		switch (this._vars.client) {
			case 'wp':
				return '/my-account/';
			break;
			case 'oc':
				return '?route=account/account';
			break;
			case 'ps':
				return '?controller=my-account';
			break;
			case 'sp':
				return '/account';
			break;
			case 'mg':
				
			break;
		}
	}
	_onSave(_val) {
		if (this._vars.custom) return;
		if (_val.saveForLater) {
			if (!this._vars.userId || this._vars.userId === 'guest' || this._vars.userId === '0') localStorage.setItem('pitchPrintTempSave', _val.projectId);
			window.location.href = this._getAccountPath();
		} else {
			this._vars.mode = 'edit';
			this._vars.projectSource = _val.source;
			this._vars.projectId = _val.projectId;
			this._vars.numPages = _val.numPages;
			this._vars.previews = _val.previews;
			this._vars.pdfDownload = _val.pdfDownload;
			this._vars.isCategory = false;
			
			if (_val.meta.records) $("[name='quantity'],[name='qty']").val(_val.meta.records).change().focus();
			
			let cValue = encodeURIComponent(JSON.stringify ( {
				projectId: _val.projectId,
				numPages: _val.numPages,
				meta: _val.meta,
				userId: this._vars.userId,
				product: this._vars.product,
				type: 'p',
				designTitle: _val.source.title,
				designId: _val.source.designId
			} ) );
			
			let _oc = document.querySelector(`#_w2p_set_option,#web2print_option_value,#${this._vars.ocInputOption}`);
			
			if (_oc) _oc.value = cValue;
			this._saveSess( { values: cValue, projectId: this._vars.projectId } );
			
			setTimeout(() => this._updatePreviews(_val.previews, '', false), 2000);
				
			this._setBtnPref(true);
			this._initPdfDownload();
		}
	}
	_initPdfDownload () {
		if (this._vars.pdfDownload) {
			this._ui.downloadBtn.removeAttribute('disabled');
			this._ui.downloadBtn.style.display = '';
		}
	}
	_triggerPdfDownload () {
		this._sendMsg('trigger-download');
	}
	_legacyComm (_url, _data, _method, _dType, _cred) {
		return new Promise((_resolve, _reject) => {
			jQuery.ajax( {
				url: _url,
				data: _data,
				type: _method || 'POST',
				dataType: _dType || 'json',
				success: (_res) => _resolve(_res),
				error: (_err) => _reject(_err),
				xhrFields: { withCredentials: _cred }
			} );
		});
	}
	_saveSess(_val) {
		if (this._vars.client === 'ps') _val.ajax = true;
		if (this._vars.client === 'sp') return this._trigger('session-saved', _val);
		
		this._legacyComm(this._getSavePath(this._vars.product.id), _val, 'POST', (_val.clear ? "text" : "json"), (this._vars.client === 'sp'))
			.then((_data) => {
				if (this._vars.client === 'ps' && this._vars.clientVersion === '1.7') {
					if (typeof _data.product_customization_id !== 'undefined') document.getElementById('product_customization_id').value = _data.product_customization_id;
					_val.clear && window.location.reload();
				} else if (_val.clear || this._vars.client === 'ps') {
					window.location.reload();
				}
				this._trigger('session-saved', _val);
			})
			.catch((_err) => {
				//TODO: Handle error
			});
	}
	_getSavePath(_id, _val) {
		switch (this._vars.client) {
			case 'wp':
				return `${this._vars.pluginRoot}app/saveproject.php?productId=${_id}`;
			break;
			case 'oc':
				return `${this._vars.self || ('index.php?route=product/product&product_id=' + _id)}&productId=${_id}`;
			break;
			case 'ps':
				return _val ? _val.product.url : window.location;
			break;
			case 'sp':
				return `${this._vars.apiBase}sp-save-session`;
			break;
			case 'mg':
				
			break;
		}
	}
	_designsFetched(_val) {
		if (_val) {
			let _str = `<option value="0">${this._vars.lang ? this._vars.lang['pick_design'] : ''}</option>`;
			_val.forEach (_itm =>{
				_str += `<option value="${_itm.id}">${_itm.title}</option>`;
				this._vars.designStack[_itm.id] = _itm;
			});
			this._ui.designSelect.innerHTML = _str;
			this._vars.designsFetched = true;
			this._ui.designSelect.dispatchEvent(new Event('change'));
		} else {
			this._vars.catModule = true;
		}
		this._setBtnPref();
	}
	_setSelectDesign() {
		if (this._ui.designSelect.value == '0') {
			this._vars.libReady = false;
			this._vars.designId = undefined;
		} else {
			let _val = this._ui.designSelect.value;
			this._vars.designId = this._vars.designStack[_val].id;
			this._sendMsg('design-selected', null, this._vars.designId);
			this._updatePreviews(_val, `${this._vars.domainBase}previews/`, true);
		}
		this._setBtnPref();
	}
	_clearDesign() {
		//this._ui.clearBtn.setAttribute('disabled', 'disabled');
		this._ui.customizeBtn.setAttribute('disabled', 'disabled');
		this._saveSess( { clear: true, projectId: this._vars.projectId } );
	}
	_updatePreviews(_val = '', _prePath = '', _isRef) {
		if (this._config.retainImages || this._vars.displayMode === 'mini') return;
		
		let _str = '', _design, _i, _rand = Math.random(), $ = window.jQuery; /*THE IMAGE GALLERIES ALL USE JQUERY*/
		if (_isRef === true) {
			_design = this._vars.designStack[_val];
			if (!_design) return;
			_val = [];
			for (_i = 0; _i < (_design.pages || _design.numPages); _i++) _val.push(`${_design.id}_${_i+1}.jpg`);
		}
		
		switch (this._vars.client) {
			case 'wp':
				let _qryWpImage = PPCLIENT.customImageSelector || ".product_image,.images";
				if (typeof $().magnificPopup === 'function') {
					$(_qryWpImage).last().html(`<a href="${_prePath}${_val[0]}?rand=${_rand}" itemprop=image class="woocommerce-main-image zoom" title="${this._vars.product.name}" rel=lightbox><img src="${_prePath}${_val[0]}?rand=${_rand}" class="attachment-shop_single wp-post-image ppc-img-width"></a>`);
					
					_val.forEach((_itm, _i) => {
						_str += (_i > 0) ? `<a href="${_prePath}${_itm}?rand=${_rand}" class="zoom first" title="${this._vars.product.name}" rel=lightbox><img class=ppc-preview-thumb src="${_prePath}${_itm}?rand=${_rand}" class=attachment-shop_thumbnail></a>` : '';
					});
					if (PPCLIENT.customThumbSelector) this._vars.selectors.qryThumbs = PPCLIENT.customThumbSelector;
					$(this._vars.selectors.qryThumbs).html(_str);
					
					$("a[rel^='lightbox']").magnificPopup( { type: 'image', gallery: { enabled: true } } );
					$('.kad-light-gallery').each(function() {
						$(this).find('a[rel^="lightbox"]').magnificPopup( { type: 'image', gallery: { enabled: true }, image: { titleSrc: 'title' } } );
					});
				} else {
					_str = `<a href="${_prePath}${_val[0]}?rand=${_rand}" itemprop=image class="woocommerce-main-image zoom" title="${this._vars.product.name}" rel="prettyPhoto[product-gallery]"><img src="${_prePath}${_val[0]}?rand=${_rand}" class="attachment-shop_single wp-post-image ppc-img-width" ></a>`;
					
					_val.forEach((_itm, _i) => _str += `<div class=thumbnails><a href="${_prePath}${_itm}?rand=${_rand}" class="zoom first" title="${this._vars.product.name}" rel="prettyPhoto[product-gallery]"><img width="150" height="90" src="${_prePath}${_itm}?rand=${_rand}" class="attachment-shop_thumbnail" ></a></div>`);
					
					$(_qryWpImage).html(_str);
					if ($.prettyPhoto !== undefined) $("a[rel='prettyPhoto[product-gallery]']").prettyPhoto();
				}
			break;
			case 'ps':
				if (this._vars.clientVersion === '1.7') {
					$(".images-container ul.product-images li.pp-custom").remove();
					
					$('.js-qv-product-cover').attr('src', _prePath + _val[0]);
					$(".images-container ul.product-images").empty();
					$.each(_val, (index, item) => {
						$(".images-container ul.product-images").append('<li class="thumb-container pp-custom"> <img class="thumb js-thumb  selected "data-image-medium-src="' + _prePath + item + '" data-image-large-src="' + _prePath + item + '" src="' + _prePath + item + '" width="100" itemprop="image"></li>');
					});
					
					$('.js-thumb').on( 'click', (event) => {
							$('.js-modal-product-cover').attr('src',$(event.target).data('image-large-src'));
							$('.selected').removeClass('selected');
							$(event.target).addClass('selected');
							$('.js-qv-product-cover').prop('src', $(event.currentTarget).data('image-large-src'));
						}
					);
				} else if ($.fancybox) {
					setTimeout(() => {
						$(document).unbind('click.fb-start');
						$('.fancybox').unbind('click.fb');
						$('.fancybox_').unbind('click.fb');
						
						$('#image-block').html('<a rel="fb__" class="fancybox_" href="' + (_prePath + _val[0]) + '"><img id="bigpic" itemprop="image" src="' + (_prePath + _val[0]) + '" width="458"></a>');
						$('#thumbs_list').html('').append('<ul id="thumbs__" style="width: 297px;"></ul>');
						
						for (let _i = 1; _i < _val.length; _i++) {
							$('#thumbs__').append('<li><a rel="fb__" href="' + (_prePath + _val[_i]) + '" class="fancybox_"><img itemprop="image" src="' + (_prePath + _val[_i]) + '" width="80"></a></li>');
						}
						$('#thumbs_list').parent().removeClass('hidden');
						$('.fancybox_').fancybox();
						$('.resetimg,.view_scroll_spacer').hide();
					}, 2000);
				}
			break;
			case 'oc':
				let _qryOcImage = PPCLIENT.customImageSelector || `.popup-gallery,.thumbnails,.image-container,.product-gallery,.image,.large-image`;
				if ($(_qryOcImage).length && $.magnificPopup) {
					_str = `<li><a class="thumbnail product-image" rel=magnific href="${_prePath}${_val[0]}" title="${this._vars.product.name}"><img src="${_prePath}${_val[0]}?r=${_rand}" ></a></li>`;
					_val.forEach((_itm, _i) => {
						if (_i > 0) _str += `<li class="image-additional image-thumb"><a rel="magnific" class="thumbnail" href="${_prePath}${_itm}?r=${_rand}"><img src="${_prePath}${_itm}?r=${_rand}"></a></li>`;
					});                        
					$(_qryOcImage).first().html(_str);
					$('a[rel="magnific"]').magnificPopup( { type: 'image', gallery: { enabled: true } } );
					
				} else if ($(".image").length && $.colorbox) {
					$(".image").html(`<a href="${_prePath}${_val[0]}?r=${_rand}" title="${this._vars.product.name}" class="colorbox cboxElement"><img style="width:${($(".image").width() || 300)}px" src="${_prePath}${_val[0]}?r=${_rand}" id="image"></a>`);
					_str = '';
					_val.forEach(function(_itm, _i) {
						if (_i > 0) _str += `<a href="${_prePath}${_itm}?r=${_rand}" class="colorbox cboxElement"><img style="width:76px" src="${_prePath}${_itm}?r=${_rand}"></a>`;
					});
					$(".image-additional").html(_str);
					$('.zoomContainer').remove();
					$(".colorbox").colorbox( { rel: 'colorbox' } );
				}
			break;
			case 'sp':
				let _qrySpImage = PPCLIENT.customImageSelector || ".image,#product-photo-container,.product-left-column,.main-image,.product-photo-container,.featured,#image-block,.product-single-photos,.product_slider,#product-image,.photos,.product-single__photos";
				_rand = `?rand=${_rand}`;
				
				$(document).unbind('click.fb-start');
				$(".image,.featured,.zoom,product-photo-container").unbind('click.fb').unbind('click');
				
				$(_qrySpImage).first().html('<a rel="_imgs" id="placeholder" href="' + _prePath + _val[0] + (_val[0].substr(0, 4) == 'data' ? '' : _rand) + '" class="fancybox_ zoom colorbox cboxElement"><img itemprop="image" src="' + _prePath + _val[0] + (_val[0].substr(0, 4) == 'data' ? '' : _rand) + '" class="ppc-img-width" ></a>');
				
				_str = '';
				_val.forEach(function(_itm, _i) {
					if (_i > 0 && _itm) _str += '<a rel="_imgs" style="margin-top:10px;" id="placeholder" href="' + _prePath + _itm + (_itm.substr(0, 4) == 'data' ? '' : _rand) + '" class="fancybox_ zoom colorbox cboxElement"><img itemprop="image" src="' + _prePath + _itm + (_itm.substr(0, 4) == 'data' ? '' : _rand) + '" class="ppc-img-width" ></a>';
				});
				
				if (PPCLIENT.customThumbSelector) this._vars.selectors.qryThumbs = PPCLIENT.customThumbSelector;
				$(this._vars.selectors.qryThumbs).empty().append(_str);
				
				if (typeof $.fancybox !== 'undefined') {
					$('.fancybox_').fancybox();
				} else if (typeof $.colorbox !== 'undefined') {
					$(".colorbox").colorbox( { rel: '_imgs' } );
				}
			break;
		}
	}
	_onFrameValidated() {
		this._act.frameValidated = true;
		this._setBtnPref();
		if (this._vars.autoShow) {
			setTimeout(() => this.showApp(), 1000);
		}
	}
	_createButtons() {
		this._trigger('before-create-buttons');
		let _ce = 'input', _sel;
		switch (this._vars.client) {
			case 'ps':
				_sel = document.querySelector("#add_to_cart,.product-add-to-cart,#ag_add_to_cart");
				if (!_sel) return;
				_sel.parentNode.insertAdjacentHTML('afterbegin', '<div class="ppc-main-btn-sec" id="pp_main_btn_sec"></div>');
			break;
			case 'sp':
				_sel = document.getElementById('pp_main_btn_sec');
				if (_sel) _sel.innerHTML = '';
				_ce = 'a';
			break;
			case 'oc':
				this._vars.ocInputOption = 'input-option' + this._vars.ppOptionId;
				_sel = `<div id="pp_main_btn_sec" class="form-group required"> <input type="hidden" id="${this._vars.ocInputOption}" name="option[${this._vars.ppOptionId}]" value="${(this._vars.cValues || '')}" />`;
				if (this._vars.clientVersion === 1) {
					let _cartBtn = document.getElementById('button-cart'),
						_optionsSel = document.querySelector('.options');
					if (_cartBtn) {
						_cartBtn.parentNode.insertAdjacentHTML('afterbegin', _sel);
					} else if (_optionsSel) {
						_optionsSel.parentNode.insertAdjacentHTML('afterbegin', _sel);
					}
				} else if (!document.getElementById('pp_main_btn_sec')) {
					let _productSel = document.getElementById('product'),
						_cartBtn = document.getElementById('button-cart');
					if (_cartBtn) {
						_cartBtn.parentNode.insertAdjacentHTML('afterbegin', _sel);
					} else if (_productSel) {
						_productSel.parentNode.insertAdjacentHTML('afterbegin', _sel);
					}
				}
			break;
		}
		let _mainSec = document.getElementById('pp_main_btn_sec');
		if (!_mainSec) {
			console.log('Could not create main button div');
			return;
		}
		_mainSec.insertAdjacentHTML('beforeend', `<select id="pp_design_select" class="ppc-main-ui form-control"></select>
								<${_ce} id="pp_customize_design_btn" class="ppc-main-ui btn btn-warning btn-block button" pp-lang="custom_design" class="ppc-pointer" type="button" ></${_ce}>
								<input id="pp_edit_btn" class="ppc-main-ui btn btn-success btn-block button" pp-lang="edit_design" type="button" />
								<input id="pp_download_btn" target="_blank" class="ppc-main-ui btn btn-success btn-block button" pp-lang="pdf_download" type="button" /a>
								<input id="pp_clear_design_btn" class="ppc-main-ui btn btn-default btn-block button" pp-lang="start_over" type="button" />
								<input id="pp_upload_btn" class="ppc-main-ui btn btn-default btn-block button" pp-lang="upload_files" type="button" />`);
								
		this._ui.designSelect = document.getElementById('pp_design_select');
		this._ui.customizeBtn = document.getElementById('pp_customize_design_btn');
		this._ui.editBtn = document.getElementById('pp_edit_btn');
		this._ui.downloadBtn = document.getElementById('pp_download_btn');
		this._ui.clearBtn = document.getElementById('pp_clear_design_btn');
		this._ui.uploadBtn = document.getElementById('pp_upload_btn');
		
		this._ui.designSelect.onchange = this._setSelectDesign.bind(this);
		this._ui.customizeBtn.onclick = this.showApp.bind(this);
		this._ui.editBtn.onclick = this.showApp.bind(this);
		this._ui.clearBtn.onclick = this._clearDesign.bind(this);
		this._ui.uploadBtn.onclick = this._showUpload.bind(this);
		this._ui.downloadBtn.onclick = this._triggerPdfDownload.bind(this);
		
		document.querySelectorAll('.ppc-main-ui').forEach(_elm => _elm.style.display = 'none');
		
		this._syncLang();
		this._ui.buttonsCreated = true;
	}
	_setBtnPref() {
		if (!this._ui.buttonsCreated) return;
		document.querySelectorAll('.ppc-main-ui').forEach(_elm => _elm.style.display = 'none');
		((this._config.customizationRequired || this._vars.customizationRequired) && this._vars.mode == 'new' && (this._vars.designId || this._vars.enableUpload)) ? jQuery(this._vars.selectors.qryHideCartBtn).hide() : jQuery(this._vars.selectors.qryHideCartBtn).show();
		
		switch (this._vars.mode) {
			case 'new':
				if (this._vars.isCategory && !this._act.editorShown && !this._vars.catModule) {
					this._ui.designSelect.style.display = '';
					if (this._vars.designsFetched) {
						this._ui.designSelect.removeAttribute('disabled');
					} else {
						this._ui.designSelect.setAttribute('disabled', 'disabled');
					}
				} else {
					this._ui.designSelect.style.display = 'none';
				}
				if (this._vars.displayMode === 'mini' || !this._vars.designId || this._act.editorShown) {
					this._ui.customizeBtn.style.display = 'none';
				} else {
					if (((this._vars.designId && this._vars.designId.substr(0, 1) !== '*') || this._vars.projectId) && this._act.frameValidated || this._vars.catModule) {
						this._ui.customizeBtn.style.display = '';
					} else {
						this._ui.customizeBtn.style.display = 'none';
					}
				}
				this._ui.uploadBtn.style.display = this._vars.enableUpload ? '' : 'none';
				this._ui.clearBtn.style.display = 'none';
			break;
			case 'edit':
				if (this._vars.projectId) {
					if (this._vars.displayMode !== 'mini') this._ui.editBtn.style.display = '';
					this._ui.clearBtn.removeAttribute('disabled');
					this._ui.clearBtn.style.display = '';
					this._ui.uploadBtn.style.display = 'none';
					
					if (this._vars.pdfDownload) {
						this._ui.downloadBtn.removeAttribute('disabled');
						this._ui.downloadBtn.style.display = '';
					}
				}
			break;
			case 'upload':
				this._ui.uploadBtn.style.display = '';
				this._ui.customizeBtn.style.display = 'none';
				this._ui.clearBtn.style.display = '';
			break;
		}
	}
	_mergeRecursive(_obj1, _obj2) {
		for (var _p in _obj2) {
			try {
				if (_obj2[_p].constructor == Object) {
					_obj1[_p] = this._mergeRecursive(_obj1[_p], _obj2[_p]);
				} else {
					_obj1[_p] = _obj2[_p];
				}
			} catch (_e) {
				_obj1[_p] = _obj2[_p];
			}
		}
		return _obj1;
	}
	_syncLang() {
		if (!this._vars.lang) return;
		let _vars = this._vars;
		document.querySelectorAll("[pp-lang]").forEach(_elm => _elm.value = _elm.innerHTML = _vars.lang[_elm.getAttribute('pp-lang')]);
	}
	_loadLang() {
		return new Promise((_resolve, _reject) => {
			if (this._vars.langCode.toLowerCase() === 'br') this._vars.langCode = 'pt-br';
			this._comm(`${this._vars.domainBase}rsc/${this._vars.buildPath}lang/${this._vars.langCode.toLowerCase()}`, null, 'GET')
			.then((_data) => {
				this._trigger('lang-loaded', _data);
				this._vars.lang = _data;
				if (window.PPCLIENT.langEdits) this._mergeRecursive(this._vars.lang, window.PPCLIENT.langEdits);
				if (this._act.uiCreated) this._sendMsg('set-lang', null, this._vars.lang);
				this._syncLang();
				_resolve();
			})
			.catch(console.log);
		});
	}
	_scrollTo(_elm, _to, _dur) {
		if (_dur <= 0) return;
		let _perTick = (_to - _elm.scrollTop) / _dur * 10;
			
		setTimeout(() =>{
			_elm.scrollTop = _elm.scrollTop + _perTick;
			if (_elm.scrollTop === _to) return;
			this._scrollTo(_elm, _to, _dur - 10);
		}, 10);
	}
	
	_showUpload() {
		if (!this.fileUploader) this.fileUploader = new PitchPrintFileUploader(this._vars);
		this.fileUploader.show();
	}
	
	_downloadPdf (_href) {
		//this._comm(`${this._vars.apiBase}pdf-download`, { id: _href, type: 'pdf' } )
		this._comm(`${this._vars.apiBase}pdf-download`, { id: _href, type: 'pdf' } )
			.then((_data) => window.location = _data.url)
			.catch((_err) => {
				console.log(_err);
			});
	}
	_sortCart() {
		let _val, _qry, _prev;
		this._trigger('before-sort-cart');
		switch (this._vars.client) {
			case 'wp':
				_qry = document.querySelectorAll('.pp-cart-order');
				if (_qry) {
					_qry.forEach((_elm) => {
						_val = JSON.parse(decodeURIComponent(decodeURIComponent(_elm.dataset.pp)));
						let _downloadPDF = (_val.type === 'p' && this._config.orderPdfDownload) ? `<a class=pp-order-pdf-download-btn data-id="${_val.projectId}" pp-lang=pdf_download style="cursor:pointer"></a>` : ``;
						_prev = _val.previews ? _val.previews[0] : `${this.vars.domainBase}previews/${_val['projectId'].split(':')[0]}_1.jpg`;
						_elm.parentNode.insertAdjacentHTML('beforeend', `<div style="pp-wp-order-div" ><img src="${_prev}" style="width:90px"></div><div>${_downloadPDF}</div>`);
						_elm.parentNode.removeChild(_elm);
					});
				}
				
				_qry = document.querySelectorAll('.pp-cart-label');
				if (_qry) _qry.forEach( (_elm) => _elm.setAttribute('pp-lang', (JSON.parse(decodeURIComponent(_elm.id)).type === 'p' ? 'design' : 'file_upload')));
				
				_qry = document.querySelectorAll('.pp-cart-data');
				if (_qry) _qry.forEach( (_elm) => {
					_val = JSON.parse(decodeURIComponent(_elm.id));
					if (this._vars.isCheckoutPage) {
						_prev = _val.previews ? _val.previews[0] : `${this.vars.domainBase}previews/${_val['projectId'].split(':')[0]}_1.jpg`;
						_elm.parentNode.insertAdjacentHTML('beforeend', `<img src="${_prev}" style="width:90px">`);
						_elm.parentNode.removeChild(_elm);
					} else {
						if (_val.type === 'p') {
							_elm.setAttribute('pp-lang', 'duplicate_design');
						} else {
							_elm.setAttribute('pp-lang', 'button_label_ok');
							_elm.setAttribute('href', "");
							_elm.style['pointer-events'] = 'none';
							_elm.classList.remove('button');
						}
					}
				});
			break;
			case 'ps':
				let _str;
				_qry = document.querySelectorAll('li');
				if (_qry) _qry.forEach( (_elm) => {
					if (_elm.innerHTML.indexOf('@PP@') > -1 || (_elm.innerHTML.indexOf('%7B%22') > -1 && _elm.innerHTML.indexOf('%22%7D') > -1)) {
						_str = '';
						_val = decodeURIComponent(_elm.innerHTML.split(':').pop().trim());
						if (this._isValidPP(_val)) {
							_val = JSON.parse(_val);
							if (_val.type === 'p' && _val.numPages) {
								if (this._vars.isHistoryPage && this._config.orderPdfDownload) _str += `<div style="padding:5px"><a class=pp-order-pdf-download-btn data-id="${_val.projectId}" pp-lang=pdf_download style="cursor:pointer"></a></div>`;
								_str += `<div style="padding:5px"><a href="#" id="${_elm.innerHTML.split(':').pop().trim()}" pp-lang=duplicate_design></a></div>`;
								for (let _i = 0; _i < _val.numPages; _i++) _str += `<a class=ppc-ps-img><img src="${this._vars.domainBase}previews/${_val.projectId}_${_i+1}.jpg" class="pp-90thumb" ></a>`;
							} else {
								_val.previews.forEach(_itm => _str += `<a class=ppc-ps-img><img src="${_itm}" class=pp-90thumb></a>`);
							}
							_elm.innerHTML = `<div>${_str}</div>`;
						}
					}
				});
			break;
			case 'oc':
				let _img, _thumb, _ppVal, $ = window.jQuery;
				_qry = document.querySelectorAll('span[pp-value]');
				if (_qry) _qry.forEach( (_elm) => {
					_ppVal = _elm.getAttribute('pp-value');
					if (_ppVal && _ppVal.trim() !== '') {
						_val = JSON.parse(decodeURIComponent(_ppVal.trim()));
						if (_elm.getAttribute('pp-image')) {
							_img = _elm.getAttribute('pp-image').trim();
							if (_val.type === 'p') {
								$($(_elm).closest('table').find(`img[src='${_img}']`)[0]).attr('src', `${this._vars.domainBase}previews/${_val.projectId}_1.jpg`).css('width', '90px');
								_elm.parentNode.innerHTML = `<span pp-lang=design ></span>: &nbsp;&nbsp; <a pp-lang=duplicate_design href="#" id="${_ppVal.trim()}"></a>`;
							} else {
								$($(_elm).closest('table').find(`img[src='${_img}']`)[0]).attr('src', _val.previews[0]).css('width', '90px');
								_elm.parentNode.innerHTML = `<span pp-lang=file_upload></span>: &nbsp;&nbsp; <img style="width:14px; height:14px" src="${this._vars.domainBase}rsc/images/ok.png">`;
							}
						} else {
							let _downloadPDF = (_val.type === 'p' && this._config.orderPdfDownload && window.location.href.indexOf('account/order/info') > -1) ? `<a class=pp-order-pdf-download-btn data-id="${_val.projectId}" pp-lang=pdf_download style="cursor:pointer"></a>` : ``;
							_thumb = _val.type === 'p' ? `${this._vars.domainBase}previews/${_val.projectId}_1.jpg` : _val.previews[0];
							_elm.parentNode.innerHTML = `<img style="margin-top:5px; border: 1px #eee solid;width:100px" src="${_thumb}"><br/>${_downloadPDF}`;
						}
					}
				});
			break;
		}
		
		this._syncLang();
		
		_qry = document.querySelectorAll('.pp-order-pdf-download-btn');
		if (_qry) _qry.forEach( (_elm) => _elm.onclick = this._downloadPdf.bind(this, _elm.dataset.id));
		
		_qry = document.querySelectorAll('[pp-lang="duplicate_design"]');
		if (_qry) _qry.forEach( (_elm) => {
			_elm.onclick = function () {
				_elm.classList.remove('button');
				_elm.innerHTML = `<img src="${this._ui.spinner}" class="ppc-ldr" >`;
				this._duplicateProject(_elm.id);
			}.bind(this);
		});
		this._trigger('after-sort-cart');
	}
	_fetchProjects() {
		let _div = document.getElementById('pp_mydesigns_div');
		if (!_div) return;
		
		if (!document.getElementById('my_recent_des_div')) _div.insertAdjacentHTML('beforeend', `<style>.pp-cntr img,.pp-cntr span{pointer-events:none;}.pp-cntr{text-align:center;}.pp-90thumb{width: 90px;}</style><div><h2 pp-lang=text_my_recent></h2><div id=my_recent_des_div><img src="${this._ui.spinner}" ><br/><br/></div></div>`);
		let _iDiv = document.getElementById('my_recent_des_div');
		
		this._comm(`${this._vars.apiBase}fetch-recent`, null)
			.then((_data) => {
				_data = _data.data;
				_data.reverse();
				this._vars.projects = _data;
				let _str = '', _resumeLang;
				if (_data.length === 0) {
					_iDiv.innerHTML = '';
					_iDiv.setAttribute('pp-lang', 'sorry_no_project');
				} else {
					_str += `<table id=pp-recent-table class="shop_table my_account_orders table table-bordered table-hover"><tbody>`;
					_data.forEach((_itm, _i) =>{
						_resumeLang = _itm.saveForLater ? 'resume_design' : 'duplicate_design_for_reorder';
						_str += `<tr class=order>
									<td class=pp-cntr><img src="${this._vars.domainBase}previews/${_itm.id}_1.jpg" class=pp-90thumb ></td>
									<td class=pp-cntr width=180 title="Modified ${new Date(_itm.lastEdit * 1000)}">${decodeURI(_itm.product.name || _itm.product.title || _itm.product || "")}</td>
									<td class=pp-cntr><a class="button btn btn-success" data-fnc=clone data-idx=${_i} data-resume=${_itm.saveForLater}><span pp-lang="${_resumeLang}"></a></td>
									<td class=pp-cntr><a class="button btn btn-default" data-fnc="view" data-idx=${_i}><img src="${this._vars.domainBase}rsc/images/eye.png" ></a></td>
									<td class=pp-cntr><a class="button btn btn-default" data-fnc=delete data-id=${_itm.id}><img src="${this._vars.domainBase}rsc/images/cross.png" ></a></td>
								</tr>`;
					});
					_iDiv.innerHTML = `${_str}</tbody></table>`;
				}
				this._syncLang();
				let _table = document.getElementById('pp-recent-table');
				if (_table) {
					_table.onclick = function (_e) {
						if (_e.target) {
							switch(_e.target.dataset.fnc) {
								case 'view':
									this._viewProjectGallery(_e.target.dataset.idx);
								break;
								case 'delete':
									this._deleteProject(_e.target.dataset.id);
								break;
								case 'clone':
									this._duplicateProject(_e.target.dataset.idx, _e.target.dataset.resume === 'true');
								break;
							}
						}
					}.bind(this);
				}
			})
			.catch((_err) => {
				console.log(_err);
			});
	}
	_deleteProject(_id) {
		if ( confirm( this._vars.lang['delete_message'] ) ) {
			let _iDiv = document.getElementById('my_recent_des_div');
			if (_iDiv) _iDiv.innerHTML = `<img src="${this._ui.spinner}">`;
			this._comm(`${this._vars.apiBase}remove-project`, { id: _id })
				.then(() => this._fetchProjects());
		}
	}
	_viewProjectGallery(_idx) {
		if (!this._vars.projects) return;
		if (this._vars.projects[_idx]) {
			let _api_images = [], $ = jQuery;
			for (let _i = 0; _i < this._vars.projects[_idx].pageLength; _i++) {
				_api_images.push(`${this._vars.domainBase}previews/${this._vars.projects[_idx].id}_${_i+1}.jpg`);
			}
			
			if ($.prettyPhoto) {
				$.prettyPhoto.open(_api_images);
			} else if ($.magnificPopup) {
				$.magnificPopup.open( { items: _api_images.map(_itm => ({ src:_itm })), type:'image', gallery: { enabled: true } } );
			} else if ($.colorbox) {
				$('body').append(`<div id=pp_cb_div style="display:none"></div>`);
				_api_images.forEach(_itm => $('#pp_cb_div').append(`<a href="${_itm}" rel=pp-cb-rel class=pp-cb-rel ></a>`));
				$('a.pp-cb-rel').colorbox( { open: true, rel: 'pp-cb-rel', onClosed: function() { $('#pp_cb_div').remove(); } } );
			}
		}
		return false;
	}
	_duplicateProject(_val, _resume) {
		if (!isNaN(parseInt(_val))) {
			let _prj = this._vars.projects[parseInt(_val)];
			_val = {
				projectId: _prj.id,
				numPages: _prj.pages || 1,
				meta: { },
				userId: this._vars.userId,
				product: _prj.product,
				designId: _prj.designId,
				type: 'p'
			};
		} else {
			_val = JSON.parse(decodeURIComponent(_val));
		}
		const _productId = _val.product.id,
			_doSave = () => {
				this._legacyComm(this._getSavePath(_productId, _val),  { clone: true, values: encodeURIComponent(JSON.stringify(_val)), productId: _productId, ajax: true }, 'POST', 'text', (this._vars.client === 'sp'))
					.then((__data) => {
						if (this._vars.client === 'ps') {
							window.location = _val.product.url;
						} else {
							window.location = __data.trim().replace(/&amp;/g, '&');
						}
					})
					.catch((_err) => {
						console.log(_err);
					});
			};
			
		if (_resume === true) {
			_doSave();
		} else {
			this._comm(`${this._vars.apiBase}clone-project`, { values: 1, id: (_val.projectId || _val.projectID) })
				.then((_data) => {
					if (!_data.error) {
						_val.projectId = _data.newId;
						_doSave();
					} else {
						this._alert(new Error('Error duplicating project!'));
					}
				})
			.catch((_err) => {
				console.log(_err);
			});

			var _rec = document.getElementById('my_recent_des_div');
			if (_rec) _rec.innerHTML = `<img src="${this._ui.spinner}" >`;
		}
	}
	showApp(_val) {
		this._trigger('before-show');
		if (!this._act.frameValidated) {
			this._vars.autoShow = true;
			if (_val) this._sendMsg('update-values', _val);		//Update designId or projectId or any other parameter..
			return;
		}
		
		switch(this._vars.displayMode) {
			case 'inline':
				if (!this._act.frameExpanded) {
					if (!this._ui.frame) return;
					this._scrollTo(document.documentElement, this._ui.frame.getBoundingClientRect().top + window.scrollY, 300);
					this._ui.frame.style['max-height'] = '700px';
					this._act.frameExpanded = true;
				}
				setTimeout(() => this._sendMsg('show-editor', null, _val), 1000);
			break;
			case 'mini':
				this._scrollTo(document.documentElement, this._ui.frame.getBoundingClientRect().top + window.scrollY, 300);
				this._ui.frame.style.display = 'block';
				this._ui.frame.style.position = 'absolute';
				this._handleResize(true);
				this._ui.frame.style['z-index'] = 99999999;
				this._sendMsg('show-editor', null, _val);
			break;
			case 'modal':
				this._scrollTo(document.documentElement, 0, 100);
				this._act.bodyStyles = {
					overflow: document.body.style.overflow,
					position: document.body.style.position
				};
				document.body.style.overflow = document.documentElement.style.overflow = 'hidden';
				document.body.style.position = 'relative';
				this._ui.frame.style.display = 'block';
				this._ui.frame.style.position = 'fixed';
				this._ui.frame.style.top = 0;
				this._ui.frame.style.left = 0;
				this._ui.frame.style['z-index'] = 99999999;
				this._sendMsg('show-editor', null, _val);
				
				if (this._vars.isMobile) {
					var _doc = document.documentElement;
					if (_doc.requestFullscreen) {
						_doc.requestFullscreen();
					}
					else if (_doc.mozRequestFullScreen) {
						_doc.mozRequestFullScreen();
					}
					else if (_doc.webkitRequestFullscreen) {
						_doc.webkitRequestFullscreen();
					}
					else if (_doc.msRequestFullscreen) {
						_doc.msRequestFullscreen();
					}
				}
			break;
		}
	}
	closeApp() {
		this._trigger('before-close-app');
		if (this._vars.displayMode === 'inline') {
			if (!this._ui.frame) return;
			this._ui.frame.style['max-height'] = '0';
			this._act.frameExpanded = false;
		} else {
			if (this._vars.isMobile) {
				var _doc = document.documentElement;
				if (_doc.exitFullscreen) {
					_doc.exitFullscreen();
				}
				else if (_doc.mozCancelFullScreen) {
					_doc.mozCancelFullScreen();
				}
				else if (_doc.webkitCancelFullScreen) {
					_doc.webkitCancelFullScreen();
				}
				else if (_doc.msExitFullscreen) {
					_doc.msExitFullscreen();
				}
			}
			if (this._act.bodyStyles) {
				document.body.style.overflow = this._act.bodyStyles.overflow;
				document.body.style.position = this._act.bodyStyles.position;
			}
			document.documentElement.style.overflow = '';
			this._ui.frame.style.display = 'none';
			this._ui.frame.style['z-index'] = -10;
		}
		this._act.editorShown = false;
		this._setBtnPref();
		this._trigger('after-close-app');
	}
	
	validate(_cb) {
		if (!this._vars || !this._vars.apiBase || this._vars.validated) return;
		this._comm(`${this._vars.apiBase}init`, {
				userId: this._vars.userId,
				apiKey: this._vars.apiKey,
				client: this._vars.client,
				version: this._version
			}, 'POST')
		.then((_data) => {
			if (!_data.error) {
				this._trigger('client-validated', _data);
				this._vars.env = _data.validation;
				this._vars.token = _data.token;
				this._vars.config = this._config = _data.config;
				this._act.validated = true;
				this._customScripts();
				if (typeof this[_cb] === 'function') {
					this[_cb]();
					this._loadLang();
				} else {
					if (this._vars.createButtons) this._createButtons();
					this._loadLang()
						.then(() => this._createUi());
				}
			}
		})
		.catch((_err) => console.log(_err));
	}
	_customScripts() {
		if (this._config.customJs) window.jQuery(`<script>${this._config.customJs}</script>`).appendTo("head");
		if (this._config.customCss) window.jQuery(`<style>${this._config.customCss}</style>`).appendTo("head");
	}
	_trigger (_type, _data) {
		let handlers = this._handlers[_type], i, len,
			event = { type: _type, data: _data };
		if (handlers instanceof Array) {
			handlers = handlers.concat();
			for (i = 0, len = handlers.length; i < len; i++) {
				handlers[i].call(this, event);
			}
		}
	}
	on (_type, _func) {
		let handlers = this._handlers[_type], i, len;
		if (typeof handlers === 'undefined') handlers = this._handlers[_type] = [];
		for (i = 0, len = handlers.length; i < len; i++) {
			if (handlers[i] === _func) return;
		}
		handlers.push(_func);
	}
	off (_type, _func) {
		let handlers = this._handlers[_type], i, len;
		if (handlers instanceof Array) {
			for (i = 0, len = handlers.length; i < len; i++) {
				if (handlers[i] === _func) {
					handlers.splice(i, 1);
					break;
				}
			}
		}
	}
	saveSess (_val) { return this._saveSess(_val); }
	updatePreviews (_val, _prePath, _isRef) { return this._updatePreviews(_val, _prePath, _isRef); }
	setBtnPref () { return this._setBtnPref(); }
	fire (_e, _val) {
		if (_e === 'show-app') return this.showApp();
		if (_e === 'close-app') return this.closeApp();
		this._sendMsg(_e, null, _val);
	}
	getFrameData (_path) {
		return new Promise((_resolve, _reject) => {
			let _ref = `${Math.random()}${Date.now()}`;
			var _fnc = (_e) => {
				var _dat = JSON.parse(_e.data);
				if (_dat.value.ref === _ref) {
					window.removeEventListener('message', _fnc);
					_resolve(_dat.value.data);
				} else {
					_reject();
				}
			};
			window.addEventListener('message', _fnc);
			this._sendMsg('getData', '', { path: _path, ref: _ref });
		});
	}
	setFrameData (_path, _value) {
		this._sendMsg('setData', '', { path: _path, value: _value });
	}
	get vars() { return this._vars; }
	get act() { return this._act; }
}