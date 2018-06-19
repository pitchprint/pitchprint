/*
		PITCHPRINT Shopify Integration.
*/

(function(global) {
    'use strict';
    if (window.pprintset) return;
    
    var _cartForm = document.querySelector('[action="/cart/add"],[action="/cart/add.js"],#add-item-form,#add-to-cart-form'), _values, _productId, $ = window.jQuery;
    
    if (window.location.pathname.indexOf('/products/') !== -1) {
        if (!_cartForm) return;
        
        _cartForm.insertAdjacentHTML('afterbegin', '<div id="pp_main_btn_sec"><img src="https://pitchprint.io/rsc/images/loaders/spinner_new.svg"style="width:24px"></div>');
        
        _comm('https://api.pitchprint.io/admin/shopify-get-metafield', { id: window.__st.rid, shop: window.Shopify.shop } )
            .then(_data => {
                _data.metafields.forEach(_field => {
                    if (_field.key === 'pprint') {
                        _values = JSON.parse(_field.value);
                        if (_values && (_values.designId || _values.upload)) _fetchClient();
                    }
                    if (!_values) document.getElementById('pp_main_btn_sec').remove();
                });
            })
            .catch(_err => console.log(_err));
        
    } else if (window.location.pathname.indexOf('/cart') !== -1) {
        $.ajax({
			type: "GET",
			dataType: "json",
			url: '/cart.js',
			success: _sortCartImages
		});
    }
    
    function _getProject(_id) {
    	let _store = window.localStorage.getItem('pprint-projects') || {};
        if (typeof _store === 'string') _store = JSON.parse(_store);
        return _store[_id];
    }
    function _decode(_str) {
        let _val = JSON.parse(decodeURIComponent(_str));
        if (_val.projectId) _val.preview = `https://s3-eu-west-1.amazonaws.com/pitchprint.io/previews/${_val.projectId}_1.jpg`;
        return _val;
    }
    function _sortCartImages(_val) {
		if (_val.items) {
		    var _t, _str, _imgs = $('.product_image:visible,.cart_image:visible,.product-image:visible,.cpro_item_inner:visible,.cart__image:visible,.cart-image:visible,.cart-item .image:visible,.cart-item__image-container:visible,.cart_page_image:visible,.tt-cart__product_image:visible');
			_val.items.forEach(function(_itm, _idx) {
				if (_itm.properties && _itm.properties._pitchprint) {
					_t = _decode(_getProject(_itm.properties._pitchprint));
					if (_t.type !== 'u') {
						_str = `<div><img src="${_t.preview}" width="94" style="margin: 5px; opacity: 1"><br/></div>`;
						if ($(_imgs[_idx])[0].tagName === 'IMG') {
							$(_imgs[_idx]).parent().html(_str);
						} else {
							$(_imgs[_idx]).html(_str);
						}
					}
				}
			});
		}
	}
    
    function _doClient() {
        _productId = window.__st.rid;
        let _store = window.localStorage.getItem('pprint-sp') || {};
        if (typeof _store === 'string') _store = JSON.parse(_store);
        let _cValues = _store[_productId] || {};
        if (typeof _cValues === 'string') _cValues = _decode(_cValues);
        if (!document.getElementById('_pitchprint')) _cartForm.insertAdjacentHTML('afterbegin', `<input id="_pitchprint" name="properties[_pitchprint]" type="hidden" value="${_cValues.projectId || ''}">`);
        
        window.ppclient = new PitchPrintClient({
			userId: window.__st.cid || 'guest',
			langCode: window.jQuery('html').attr('lang') || 'en',
			enableUpload: _values.upload,
			designId: _values.designId,
			customizationRequired: _values.required,
			previews: _cValues.previews || _cValues.numPages,
			mode: _cValues.type === 'u' ? 'upload' : (_cValues.projectId ? 'edit' : 'new'),
			createButtons: true,
			projectId: _cValues.projectId || '',
			apiKey: window.Shopify.shop,
			client: 'sp',
			product: {
				id: _productId,
				name: window.__st.pageurl.split('/').pop().split('-').join(' ')
			}
		});
		
		window.ppclient.on('session-saved', _saveSession);
    }
    
    function _saveSession(_val) {
        var _el = document.getElementById('_pitchprint'), _projectId = _val.data.projectId;
        
        let _store = window.localStorage.getItem('pprint-sp') || {},
        	_projects = window.localStorage.getItem('pprint-projects') || {};
        	
		if (typeof _store === 'string') _store = JSON.parse(_store);
	    if (typeof _projects === 'string') _projects = JSON.parse(_projects);
	    
		if (_val.data.clear) {
		    _el.value = '';
		    delete _store[_productId];
		    delete _projects[_projectId];
		} else {
		    _el.value = _projectId;
		    _store[_productId] = _val.data.values;
		    _projects[_projectId] = _val.data.values;
		    if (_projectId.substr(0, 2) === 'U-') {
		    	delete _projects[_projectId].previews;
		    	_zipFiles(_val.data.values);
		    	console.log(_projects[_projectId]);
		    }
		}
	    window.localStorage.setItem('pprint-sp', JSON.stringify(_store));
	    window.localStorage.setItem('pprint-projects', JSON.stringify(_projects));
	    if (_val.data.clear) window.location.reload();
    }
    function _zipFiles(_val) {
    	_val = _decode(_val);
    	window.ppclient._comm('zip-uploads', { files: _val.files, id: _val.projectId } )
    		.catch(console.log);
    }
    
    function _comm (_url, _data, _method = 'POST', _dType = 'json', _cred = true) {
		return new Promise((_res, _rej) => {
			let _cType, _formData = '';
			
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
			_xhr.onload = () => _res(_dType === 'json' ? JSON.parse(_xhr.responseText) : _xhr.responseText);
			_xhr.onerror = () => _rej(_xhr.statusText);
			_xhr.withCredentials = (_method.toUpperCase() === 'GET' ? false : _cred);
			_xhr.setRequestHeader("Content-Type", _cType);
			_xhr.send(_formData);
		});
	}
	function _fetchClient() {
		var _script = document.createElement('script');
		_script.onload = _doClient;
		_script.src = 'https://pitchprint.io/rsc/js/client.js';
		document.getElementsByTagName('head')[0].appendChild(_script);
	}
	
	window.pprintset = true;
	
})(this);