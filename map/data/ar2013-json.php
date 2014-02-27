<?php
// utility to return json for AR 2013 brochure site

$dbname = "prod_siv_data";

mysql_connect("localhost","user","pwd");
mysql_select_db($dbname) or die('error:' . mysql_error());
   
//build main data json
$fields = array(array("PH_MORT_U5MR",2), array("PH_VACC_MEASCOV","%"), array("PH_UTIL_HEALTHUTIL",2), array("RH_ANC_SKILLATT","%"), array("RH_SGBV_PEP","%"), array("HIV_PMTCT_HIV_PMTCTCOV","%"), array("WASH_WATERPPPD",1), array("WASH_DROPHOLE",1));

foreach($fields as $field) {
	switch ($field[1]){
		case "%":
			$sql = $sql . 'CASE WHEN FORMAT(MIN(' . $field[0] . '),2)*100 > 100 THEN "100%" ELSE CONCAT(FORMAT(MIN(' . $field[0] . '),2)*100,"%") END AS ' . strtolower($field[0]) .  '_min, ';
			$sql = $sql . 'CASE WHEN FORMAT(MAX(' . $field[0] . '),2)*100 > 100 THEN "100%" ELSE CONCAT(FORMAT(MAX(' . $field[0] . '),2)*100,"%") END AS ' . strtolower($field[0]) .  '_max, ';
			break;
		default:
			$sql = $sql . 'FORMAT(MIN(' . $field[0] . '),' . $field[1] . ') AS ' . strtolower($field[0]) .  '_min, ';
			$sql = $sql . 'FORMAT(MAX(' . $field[0] . '),' . $field[1] . ') AS ' . strtolower($field[0]) .  '_max, ';
	}
}

$sql = 'SELECT MID(locid,4,2) AS countryiso, SUM(GEN_POP_TOTAL) AS gen_pop_total, ' . $sql . ' MIN(CONCAT("http://twine.unhcr.org/app/app.php#app=Explore&loc={{",MID(locid,4,2),"}}")) AS action FROM `de_ar` WHERE `reportdateiso8601` = "2013" GROUP BY MID(locid,4,2);';
// echo $sql;
$data = mysql_query($sql) or die('error:' . mysql_error());

while($row = mysql_fetch_object($data))
{
   $json = $json . json_encode($row) . ', ';
}

$json = '{"d": [' . substr($json, 0, -2) . '], "success": true}';

//substitute in proper country locids for the action into data json
$sql = 'SELECT locid, gl3_iso2 FROM locations WHERE geolevel = 3';
$data = mysql_query($sql) or die('error:' . mysql_error());

while($row = mysql_fetch_object($data))
{
  $json = str_replace('{{'.$row->gl3_iso2.'}}',$row->locid,$json);
}

echo $json;
mysql_close();

?>
