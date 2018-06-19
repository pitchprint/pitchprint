<?php

class PaymentModule extends PaymentModuleCore
{

    /**
     * Fetch the content of $template_name inside the folder current_theme/mails/current_iso_lang/ if found, otherwise in mails/current_iso_lang
     *
     * @param string  $template_name template name with extension
     * @param int $mail_type     Mail::TYPE_HTML or Mail::TYPE_TXT
     * @param array   $var           list send to smarty
     *
     * @return string
     */
    /*
	* module: pitchprint
	* date: 2016-03-19 01:58:50
	* version: 8
	*/
    protected function getEmailTemplateContent($template_name, $mail_type, $var)
    {
        if (!(strpos($template_name, 'order_conf_product_list') === FALSE)) {
            foreach($var as $k => $v) {
                if (isset($v['customization'])) {
                    foreach($v['customization'] as $key => $custom) {
                        if (strpos($custom['customization_text'], 'projectId')) $var[$k]['customization'][$key]['customization_text'] = '';
                    }
                }
            }
        }

        return parent::getEmailTemplateContent($template_name, $mail_type, $var);

    }
}
