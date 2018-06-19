if (typeof window.pp_data !== 'undefined') {

    jQuery('#product_customization_id').val(pp_data.id_customization);

    ajaxsearch = undefined;
    (function(_doc) {
        pp_data.clientVersion = '1.7';
        window.ppclient = new PitchPrintClient(window.pp_data);
    })(document);
}
