/*! PitchPrint Copyright 2007-2018 */

var PPADMIN = PPADMIN || { version: "9.0.0", readyFncs: [] };

(function(global) {
    'use strict';
	
	if (!jQuery) throw new Error('jQuery required for PitchPrint!');
	var $ = jQuery, ppa = global.PPADMIN;
	if (!ppa.vars) ppa.vars = { };
	var vars;
	
	
	ppa.init = function() {
		vars = ppa.vars;
		vars.ioBase = 'https://pitchprint.io/';
		vars.adminBase = 'https://admin.pitchprint.io/';
		vars.apiBase = 'https://api.pitchprint.io/runtime/';
		vars.pdfBase = 'http://pdf.pitchprint.io/';
		vars.previews = [];
		var _cntr = 0, _val, _temp;
		
		$("table p").each(function() {
        	var _this = $(this);
			if (isValidPP(_this.html())) {
				parsePP(JSON.parse(decodeURIComponent(_this.html())), _this);
			} else if (_this.html().indexOf(vars.customID) >= 0) {
				_val = _this.html().split('|');
				if (_val[2] == 'u') {
					_temp = { files:[] };
					_temp.type = 'u';
					_val[3].split(',').forEach (function (_itm, _i) {
						_temp.files.push(_itm);
					});
				} else {
					_temp = { projectId: _val[2], userID: _val[1], mata: {}, product: {}, numPages: _val[3].split(',').length, legacy: true, type: 'p' };
				}
				parsePP(_temp, _this);
			}
		});
		
		$("th").each(function() {
			if ($(this).html().indexOf('_w2p_set_option') >= 0) {
				if (vars.previews[_cntr]) {
					var $previewimg = (typeof vars.previews[_cntr] === 'string') ? vars.previews[_cntr] : '<img src="' + (vars.previews[_cntr][0]) + '" width="150" />';
					$(this).html($previewimg);
					_cntr++;
				}
			}
		});
		
		function parsePP (_val, _elem) {
			var $str = '';
			if (_val.type === 'u') {
				$str = 'Uploaded Files: &nbsp;&nbsp;&nbsp;';
				_val.files.forEach (function (_itm, _i) {
					$str += '<a target="_blank" href="' + _itm + '" >File ' + (_i+1) +'</a> &nbsp;&nbsp;&nbsp;';
				});
				vars.previews.push('PitchPrint:');
			} else {
				var _createStr = (_id, _title) => {
					$str += '&#8226; <a target="_blank" href="' + vars.pdfBase + '?id=' + _id + '">Download PDF File</a>';
					$str += '<br/>&#8226; <a target="_blank" href="' + vars.pdfBase + '?id=' + _id + '&raster=1" >Download Raster Renderings</a>';
					$str += '<br/>&#8226; <a target="_blank" href="' + vars.adminBase + 'projects#' + _id + '">Load Project and Modify</a>';
					if (_title || _val.designTitle) $str += '<br/>&#8226; Design: ' + (_title || _val.designTitle);
					vars.previews.push([ (_val.legacy ? ('../wp-content/plugins/pitchprint/image/data/previews/') : (vars.ioBase + 'previews/')) + _id + '_1.jpg' ]);
					$str += '<br/><br/>';
				};
				if (_val.projectId.indexOf(':') > -1) {
					_val.projectId.split(':').forEach((_id, _idx) => _createStr(_id, _val.designTitle ? _val.designTitle.split(':')[_idx] : false));
				} else {
					_createStr(_val.projectId);
				}
				
			}
			_elem.html($str);
		}

		function isValidPP (_dat) {
			try {
				var $j = JSON.parse(decodeURIComponent(_dat));
				if ($j.type && $j.product) {
					return true;
				} else {
					return false;
				}
			} catch (e) {
				return false;
			}
			return true;
		}
	}
	
	ppa.fetchDesigns = function() {
		if (!vars.credentials) return;
		if (vars.credentials.apiKey === '' || vars.credentials.signature === '') {
			ppa.alert( { message: 'Kindly provide your API and Secret Keys. Thank you!' } );
			return;
		}
		
		ppa.comm(`${vars.apiBase}fetch-designs`, vars.credentials)
			.then(_data => {
				if (_data.error) {
					ppa.alert(_data);
				} else {
					ppa.generateForm(_data.data);
				}
			})
			.catch(ppa.alert);
	};
	
	ppa.comm = function(_url, _data, _method = 'POST', _dType = 'json', _cred = true) {
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
	};
	
	ppa.generateForm = function(_val) {
		_val.sort(function(a, b) { return (a.title > b.title) ? -1 : 1; } ).reverse();
		
		var _dID;
		_val.forEach(function(_itm) {
			_dID = '*' + _itm.id;
			$('#ppa_pick').append('<option style="color:black;" iscategory="true" value="' + _dID + '">' + _itm.title + '</option>');
			
			if (_dID == vars.selectedOption) $('#ppa_pick').val(_dID);
			
			_itm.items.sort(function(a, b) { return (a.title > b.title) ? -1 : 1; } ).reverse();
			
			_itm.items.forEach(function(_i) {
				$('#ppa_pick').append('<option style="color:#aaa" value="' + _i.id + '" >&nbsp; &nbsp; &nbsp; &#187; ' + _i.title + '</option>');
				if (_i.id == vars.selectedOption || _i.oldRef == vars.selectedOption) $("#ppa_pick").val(_i.id);
			});
		});

		$('#ppa_pick,#ppa_pick_upload,#ppa_pick_hide_cart_btn').on('change', ppa.changeOpts);
	};
	
	ppa.changeOpts = function() {
		var _str = $('#ppa_pick').val();
		_str += ':' + ($('#ppa_pick_upload').is(':checked') ? 1 : 0);

		if ($('#ppa_pick_hide_cart_btn').length) {
			_str += ':' + ($('#ppa_pick_hide_cart_btn').is(':checked') ? 1 : 0);
		}
		$('#ppa_values').val(_str);
	};
	
	ppa.alert = function(_val) {
		$('#ppa_pick').parent().prepend('<span style="color:#F00">' + _val.message + '</span>');
		$('#ppa_pick').hide();
		$('.ppa_pick_hide_cart_btn_field').hide();
		$('.ppa_pick_upload_field').hide();
	};
	
	ppa.start = function() {
		ppa.readyFncs.forEach(function(_fnc) {
			ppa[_fnc]();
		});
		ppa.readyFncs = [];
	}
	
	ppa.start();
	
})(this);