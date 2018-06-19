<?php 
class ModelExtensionPitchprintProcess extends Model {
	public function install() {
		$qry = $this->db->query("SELECT * from `" . DB_PREFIX . "option` where `type` = 'web2print'");
		
		if ($qry->num_rows == 0) {
			$query = $this->db->query("INSERT INTO `" . DB_PREFIX . "option` set `type` = 'web2print', sort_order = 0");
			$lastid = $this->db->getLastId();
			$langset = $this->db->query("SELECT language_id from `" . DB_PREFIX . "language`");
			foreach ($langset->rows as $row){	
				$this->db->query("INSERT INTO " . DB_PREFIX . "option_description(option_id, language_id, name) VALUES(" . $lastid . ", " . $row['language_id'] . ", 'Web2Print')");
			}
		}
	}
	
	public function getWeb2Print($pid) {
		$optid = $this->db->query("SELECT * FROM `" . DB_PREFIX . "option` WHERE `type` = 'web2print'");
		$optid = $optid->row['option_id'];
		$opt_qry = $this->db->query("SELECT * FROM " . DB_PREFIX . "product_option WHERE product_id=" . $pid. " and option_id=". $optid);
		return ($opt_qry->num_rows == 1) ? $opt_qry->row['value'] : '';
	}
}
?>