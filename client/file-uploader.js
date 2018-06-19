/*
		PITCHPRINT File Uploader.
*/

class PitchPrintFileUploader {
	constructor (_vars = {}) {
		if (!_vars.cdnBase) _vars.cdnBase = 'https://pitchprint.io/rsc/';
		this._vars = {
			uploadArr: [],
			uploadStack: [],
			idx: 0,
			params: _vars
		};
		switch (_vars.client) {
			case 'oc':
				_vars.thumbsSrc = 'image/data/files/';
			break;
			case 'sp':
				_vars.thumbsSrc = `${_vars.cdnBase}images/files/`;
			break;
			default:
				_vars.thumbsSrc = 'images/files/';
			break;
		}
	}
	show() {
		if (!this._ui) {
			this._ui = window.jQuery(`<section style="width:100%;height:100%;display:flex;justify-content:center;align-items:center">
								<div id="ppc-upload-panel-div" style="width:90%; max-width:500px; height:90%; max-height: 500px; display: flex; background-color:white;justify-content:center; flex-direction:column;">
									<div style="width: 100%; height: 50px; background-color: black; text-align:center; color: #ccc; padding: 15px 0; text-transform:uppercase; cursor:pointer; position:relative">
										${this._vars.params.lang ? this._vars.params.lang['add_files'] : 'Add Files'}<input id="ppc-upload-input" style="cursor: pointer;position: absolute;width:100%;height:100%;left:0;top:0;opacity:0" type="file" name="files[]" multiple></div>
									<div id="ppc-upload-stack" style="display: flex; flex-wrap: wrap; overflow-y: auto; padding: 10px;width: 100%; height: 100%; background-image:url(${this._vars.params.cdnBase}images/uploadicon.png); background-repeat:no-repeat; background-position:center"></div>
									<div style="width: 100%; height: 60px; padding: 10px 0"><input type="button" id="ppc-stop-upload-btn" value="✗ ${this._vars.params.lang ? this._vars.params.lang['button_label_cancel']:'Cancel'}"> &nbsp;&nbsp; <input type="button" disabled="disabled" id="ppc-start-upload-btn" value="✓ ${this._vars.params.lang['submit_tip']}"></div>
								</div>
								<div id="ppc-upload-prgs-parent" style="box-sizing: content-box; webkit-box-sizing: content-box; width: 80px; margin: 0 auto; margin-top: 120px; position: relative;">
									<div id="ppc-upload-prgs" style="float: left; width: 80px; height: 80px;" ></div>
							</section>`);
			this._initUploader();
		}
		this._showModal(this._ui);
		this._panelDiv.show();
		this._ui.show();
		this._uploadProgress.hide();
	}
	_initUploader() {
		window.jQuery('body').append(this._ui);
		
		this._btnStartUpload = window.jQuery('#ppc-start-upload-btn');
		this._btnStartUpload[0].onclick = this._plsUpload.bind(this);
		this._btnStopUpload = window.jQuery('#ppc-stop-upload-btn');
		this._btnStopUpload[0].onclick = this._hideUpload.bind(this);
		this._uploadStack = window.jQuery('#ppc-upload-stack');
		this._uploadProgress = window.jQuery('#ppc-upload-prgs-parent').hide();
		this._panelDiv = window.jQuery('#ppc-upload-panel-div');
		
		let _rBtn = window.jQuery(`<img src="${this._vars.params.cdnBase}images/cross.png" style="cursor:pointer; left: 10px;top: 10px;position: absolute;width: 16px;height: 16px;" >`)
			.click((_e) => {
				var data = window.jQuery(_e.currentTarget).data();
				data.context.remove();
				data.abort();
				this._vars.uploadArr[data.idx] = null;
				data = null;
				this._checkUploads();
			});
		
		this._uploader = window.jQuery("#ppc-upload-input").fileupload( {
			url: this._vars.params.uploadUrl,
			dataType: 'json',
			autoUpload: false,
			dropZone: this._uploadStack,
			pasteZone: null,
			singleFileUploads: true,
			sequentialUploads: true,
			maxFileSize: 50000000,
			disableImageResize: true,
			previewMaxWidth: this._vars.params.client === 'sp' ? 500 : 125,
			previewMaxHeight: this._vars.params.client === 'sp' ? 500 : 125,
			//paramName: this._vars.params.client === 'sp' ? 'file' : undefined,
			previewCrop: true,
			formData: { convert: true },
			submit: (_e, _data) => {
				if (this._vars.params.client === 'sp' && !_data.files[0].pprint) {
					window.ppclient._comm(`${this._vars.params.apiBase}upload`, { ext: _data.files[0].name.split('.').pop().toLowerCase(), contentType: _data.files[0].type, isUpload: true } )
						.then(_val => {
							_data.url  = _val.url;
							_data.formData = _val.fields;
							_data.formData['x-amz-meta-pprint'] = "{ code: 'Hello love' }";
							_data.formData['Content-Type'] = _data.files[0].type;
							_data.files[0].pprint = _val.fields.Key;
							_data.submit();
						})
						.catch(_err => console.log(_err));
					return false;
				} else {
					return true;
				}
			}
		}).on('fileuploadadd', (_e, _data) => {
			_data.context = window.jQuery(`<div style="width: 135px; height:165px; background-color: #ccc;margin: 8px;border-radius: 3px; position:relative; overflow:hidden; padding: 5px;font-size: 12px;" >
										<div style="font-size:10px; overflow:hidden">${_data.files[0].name}</div></div>`).prependTo(this._uploadStack);
		}).on('fileuploadprocessalways', (_e, _data) => {
			let _file = _data.files[_data.index],
				_node = window.jQuery(_data.context);
			if (_data.files.error) {
				window.jQuery(_data.context).remove();
			} else {
				if (_file.preview) {
					_node.prepend(`<img src="${_file.preview.toDataURL()}" style="height: 125px" />`);
				} else {
					_node.prepend(window.jQuery(`<img src="${(this._vars.params.pluginRoot || '')}${this._vars.params.thumbsSrc}${_file.name.split('.').pop().toLowerCase()}.png" style="height: 125px" />`));
				}
				_data.idx = this._vars.idx;
				window.jQuery(_data.context).append(_rBtn.clone(true).data(_data));
				this._vars.uploadArr.push(_data);
				this._vars.idx++;
				this._checkUploads();
			}
		}).on('fileuploaddone', (_e, _data) => {
			if (this._vars.params.client === 'sp') {
				this._vars.uploadStack.push( { url: _data.formData.Key, thumbnailUrl: _data.files[0].preview ? _data.files[0].preview.toDataURL() : `${this._vars.params.thumbsSrc}${_data.files[0].name.split('.').pop().toLowerCase()}.png` } );
			} else {
				window.jQuery.each(_data.result.files, (_index, _file) => {
					if (_file.url) {
						this._vars.uploadStack.push(_file);
					} else if (_file.error) {
						this._alert(this._vars.params.lang['upload_error']);
						window.jQuery.unblockUI();
					}
				});
			}
			if (this._vars.uploadArr.length > 0) {
				this._plsUpload();
			} else {
				window.jQuery.unblockUI();
				this._finishedUploading();
			}
		}).on('fileuploadprogressall', (_e, _data) => {
			this._uploadProgressAnim.circleProgress('value', _data.loaded / _data.total);
		}).on('fileuploadfail', (e, data) => {
			this._alert(this._vars.params.lang['upload_error']);
			window.jQuery.unblockUI();
		});
		
		this._uploadStack.on('dragleave', (_e) => {
			window.jQuery(_e.target).css('background-color', 'transparent');
		}).on('dragenter', (_e) => {
			window.jQuery(_e.target).css('background-color', '#BFBFBF');
		}).on('drop', (_e) => {
			window.jQuery(_e.target).css('background-color', 'transparent');
		});
		this._ui = this._ui.detach();
	}
	_hideUpload () {
		this._ui = this._ui.detach();
		window.jQuery.unblockUI();
	}
	_plsUpload (_e) {
		if (_e) this._showUploadProgress();
		if (this._checkUploads()) {
			let _l = this._vars.uploadArr.length, _poped;
			for (let _i = 0; _i < _l; _i++) {
				_poped = this._vars.uploadArr.pop();
				if (_poped) {
					_poped.submit();
					return;
				}
			}
		}
	}
	_showUploadProgress () {
		if (!this._uploadProgressAnim) this._uploadProgressAnim = window.jQuery('#ppc-upload-prgs').circleProgress( { value: 0, size: 80, thickness: 10, fill: { color: "#EEEEEE" } });
		this._uploadProgress.show();
		this._panelDiv.hide();
	}
	_finishedUploading () {
		let _prevs = [], _imgs = [], _projectId, _cValue;
		this._vars.uploadStack.forEach((_itm) => {
			if (!_itm.thumbnailUrl) {
				if (_itm.vectorThumbs) {
					_prevs = _prevs.concat(_itm.vectorThumbs);
				} else {
					_itm.thumbnailUrl = `${this._vars.params.pluginRoot || ''}${this._vars.params.thumbsSrc}${_itm.url.split('.').pop().toLowerCase()}.png`;
				}
			}
			_prevs.push(_itm.thumbnailUrl);
			_imgs.push(_itm.url);
		});
		this._vars.params.mode = 'upload';
		if (this._vars.params.client === 'sp') _projectId = `U-${this._vars.params.env.uniqueId}`;
		_cValue = encodeURIComponent(JSON.stringify( { 
			projectId: _projectId,
			files: _imgs,
			previews: _prevs,
			meta: {},
			userId: this._vars.params.userId,
			product: this._vars.params.product,
			type: 'u' 
		} ) );
		if (this._vars.params.client === 'sp' && window.jQuery("#_pitchprint").length) {
			window.jQuery("#_pitchprint").val(_projectId);
		} else if (window.jQuery(this._vars.params.selectors.qryCval).length) {
			window.jQuery(this._vars.params.selectors.qryCval).val(_cValue);
		}
		window.ppclient.saveSess( { values: _cValue, isUpload: true, projectId: _projectId,  productId: this._vars.params.product.id } );
		window.ppclient.updatePreviews(_prevs, '', false);
		window.ppclient.setBtnPref();
	}
	_alert(_val) {
		console.log(_val);
	}
	_checkUploads () {
		for (let _i = 0; _i < this._vars.uploadArr.length; _i++) {
			if (this._vars.uploadArr[_i] !== null) {
				this._btnStartUpload.prop('disabled', false);
				return true;
			}
		}
		this._btnStartUpload.prop('disabled', true);
		return false;
	}
	
	_showModal (_msg) {
		window.jQuery.blockUI( {
			message: _msg,
			css: {
				padding:        '0',
				margin:         '0',
				width:          "100%",
				left:           '0',
				right:          '0',
				top:            '0',
				bottom:         '0',
				textAlign:      'center',
				background:     'rgba(0,0,0,0)',
				border:			"none",
				cursor:         'default'
			},
			overlayCSS: { cursor: 'default', opacity: 0.5 },
			baseZ: 9999999
		});
	}
}