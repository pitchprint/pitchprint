/*! PitchPrint Copyright 2007-2018 */

var PPADMIN = PPADMIN || { version: "9.0.0", readyFncs: [] };

(function(global) {
    'use strict';
	
	if (!jQuery) throw new Error('jQuery required for PitchPrint!');
	var $ = jQuery, ppa = global.PPADMIN;
	if (!ppa.vars) ppa.vars = {};
	var vars;
	
	ppa.init = function() {
		vars = ppa.vars;
		vars.ioBase = 'https://pitchprint.io/';
		vars.adminBase = 'https://admin.pitchprint.io/';
		vars.apiBase = 'https://api.pitchprint.io/runtime/';
		vars.pdfBase = 'http://pdf.pitchprint.io/';
		$("small[pp-value]").each(function() {
			var _this = $(this);
			if (_this.attr('pp-value').trim() == 'true') {
				
				if (_this.html().indexOf('<span data="') > -1) {
					_this.text(_this.html().replace('<span data="', '').replace('"><i w2p-data="file_upload"></i></span>', ''));
				}
				if (isValidPP(_this.text())) {
					parsePP(JSON.parse(decodeURIComponent(_this.text())), _this);
				} else {
					var $val = _this.html().split(':'), $temp;
					if ($val[0] == 'u') {
						$temp = { files:[] };
						$temp.type = 'u';
						$val[1].split(',').forEach (function (_itm, _i) {
							$temp.files.push(_itm);
						});
					} else {
						$temp = { projectId: $val[1], userId: $val[4], mata: {}, product: {}, legacy: true, type: 'p' };
					}
					parsePP($temp, _this);
				}
			}
		});
		
		function parsePP (_val, _elem) {
			var $str = '';
			if (_val.type === 'u') {
				$str = 'Uploaded Files: &nbsp;&nbsp;&nbsp;';
				_val.files.forEach (function (_itm, _i) {
					$str += '<a target="_blank" href="' + _itm + '" >File ' + (_i + 1) +'</a> &nbsp;&nbsp;&nbsp;';
				});
			} else {
				$str = '<div style="display: inline-block; -webkit-inline-box; vertical-align: top; margin-top:10px;">&#8226; <a target="_blank" href="' + vars.pdfBase + '?id=' + _val.projectId + '">Download PDF File</a>';
				$str += '<br/>&#8226; <a target="_blank" href="' + vars.pdfBase + '?id=' + _val.projectId+ '&raster=1" >Download Raster Renderings</a>';
				if (_val.userId) $str += '<br/>&#8226; <a target="_blank" href="' + vars.adminBase + 'projects#' + _val.projectId + '">Load Project and Modify</a>';
				if (_val.designTitle) $str += '<br/>&#8226; Design: ' + _val.designTitle;
				$str = '</div><img style="margin-top:10px; margin-right:10px" src="' + vars.ioBase + 'previews/' + _val.projectId + '_1.jpg' + '" width="150" />' + $str;
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
			ppa.invalidCredentials( { message: 'Kindly provide your API and Secret Keys. Thank you!' } );
			return;
		}
		
		ppa.comm(`${vars.apiBase}fetch-designs`, vars.credentials)
			.then(_data => {
				if (_data.error) {
					ppa.alert(_data.error);
				} else {
					ppa.generateForm(_data.data);
				}
			});

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
		if ($("#web2print_init_option").length) $("#web2print_init_option").html($("#web2print_option_form").detach().html());
		
		var _dID;
		_val.forEach(function(_itm) {
			_dID = '*' + _itm.id;
			$("#ppa_pick").append('<option style="color:black;" iscategory="true" value="' + _dID + '">'+_itm.title+'</option>');
			if (_dID == vars.selectedOption) $("#ppa_pick").val(_dID);
			_itm.items.sort(function(a, b) { return (a.title > b.title) ? -1 : 1; }).reverse();
			
			_itm.items.forEach(function(_d) {
				$("#ppa_pick").append('<option style="color:#aaa" value="' + _d.id + '" >&nbsp; &nbsp; &nbsp; &#187; ' + _d.title + '</option>');
				if (_d.id == vars.selectedOption || _d.oldRef == vars.selectedOption) $("#ppa_pick").val(_d.id);
			});
		});
		
		$("#ppa_pick_upload").val(vars.current_upload_opt);
		ppa.changeOpts();
	};
	
	ppa.changeOpts = function() {
		var _sel = $("#web2print_option_values");
		if (!_sel.length && $('[value="Web2Print"]').length) {
			var _name = $('[value="Web2Print"]').prop('name').replace('[name]', '[value]');
			$('[value="Web2Print"]').parent().append('<input id="web2print_option_values" type="hidden" name="' + _name + '" value="' + ($('[name="ppa_pick"]').val() + ":" + $('[name="ppa_pick_upload"]').val()) + '" />');
			_sel = $("#web2print_option_values");
		}
		_sel.val($('[name="ppa_pick"]').val() + ":" + $('[name="ppa_pick_upload"]').val());
	};
	
	ppa.invalidCredentials = function(_val) {
		$('#web2print_init_option').html('<span style="color:#F00">PitchPrint: ' + _val.message + '</span>');
	};
	
	ppa.start = function() {
		ppa.readyFncs.forEach(function(_fnc) {
			ppa[_fnc]();
		});
		ppa.readyFncs = [];
	}
	
	ppa.start();
	
})(this);