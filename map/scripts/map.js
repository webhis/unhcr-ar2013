/*!
 *
 */
(function() {
   
   	// Data will be coming from Twine + Twine Leaflet class
	var topoJson = 'data/a_r_geolevels.json';
	var a_reports = 'data/ar2013.20140227.json';
   	// Map GeoJSON
    var gl3_json = {
        type: 'FeatureCollection',
        features: []
    };
   	// Leaflet layer
   	var gl1_Llayer = false;
   	var gl3_Llayer = false;
   	var selectionLayer = false;
	// Set map container height
	var h = $('.container-fluid').css('height');
	var w = $('.container-fluid').css('width');
	$('#leaflet_map').css('height', h);
	// D3 format
	format = d3.format("0,000");

	// Create a map in the "leaflet_map" div, set the view to a given place and zoom
	var map = new L.map('leaflet_map', {
        center: new L.LatLng(0,2),
        zoom: 3,
        minZoom: 3, 
        maxZoom: 14,
        maxBounds: [[-90,-180],[90,180]],
        zoomControl: false,
        attributionControl: false
    });
    // Zoom control to top right
    new L.Control.Zoom({ position: 'bottomright' }).addTo(map);
	// Remove mosuse scroll
    map.scrollWheelZoom.disable();

	// Fetch data (to be replaced with Twine API + Twine Geolevels Leaflet class)
	queue()
		.defer(d3.json, topoJson)
		.defer(d3.json, a_reports)
		.await(_setData);

	// _setData to be replaced with Twine Geolevels
	function _setData(error, _topoJson, _a_reports){

		// Update default label container
		$('#map_country_label').html("<h4 style='color:#FFF'>Select a country to view indicators</h4>");

        // TopoJSON to GeoJSON
        var geolevel3 = topojson.feature(_topoJson, _topoJson.objects.geolevel3);     

        // Create the base layer
        gl3_baseLlayer = L.geoJson(geolevel3, {
            style: { className: 'geolevel3-off' }
        });
        // Add to map
        map.addLayer(gl3_baseLlayer);        

        // For each report, add properties to gl3_json
        $.each(_a_reports.d, function(i, d){
			// Search geolevel with ISO A2 string
			var gl_feature = _getGeolevelBySearchId(geolevel3, d.countryiso);

			//
			if(gl_feature){
				// Add properties
				gl_feature.properties.iso_a2 = d.countryiso;
				gl_feature.properties.indicators = d;

				// Add region colors
				switch(true){
					case ((gl_feature.properties.locid.search('1')==0) && (gl_feature.properties.locid != '111AZ00000000000')):
						gl_feature.properties.color = '#ff845b';
						break;
					case (gl_feature.properties.locid.search('2')==0):
						gl_feature.properties.color = '#a5c361';
						break;
					case (gl_feature.properties.locid.search('3')==0):
						gl_feature.properties.color = '#7cc27c';
						break;
					case ((gl_feature.properties.locid.search('4')==0) || (gl_feature.properties.locid == '111AZ00000000000')):
						gl_feature.properties.color = '#73c5b7';
						break;
					case (gl_feature.properties.locid.search('5')==0):
						gl_feature.properties.color = '#facc74';
						break;
				}

				// Create new feature
				gl3_json.features.push({
                    type: 'Feature',
                    properties: gl_feature.properties,
                    geometry: gl_feature.geometry
                });				
			}
        });
		
		// Style colors by Region
		function style(feature) {
		    return {
		        fillColor: feature.properties.color,
		        fillOpacity: 0.5,
		       	color: '#FFF',
		        opacity: 1,
		        weight: 2,
		        className: 'geolevel3'
		    };
		}		

        // Create the Leaflet layer
        gl3_Llayer = L.geoJson(gl3_json, {
            style: style,
            onEachFeature: _onEachFeature
        });
        // Add to map
        map.addLayer(gl3_Llayer);

	}

    // Adds click event to each Polygon
    function _onEachFeature(feature, layer){
        var name = feature.properties.name;
        var iso_a2 = feature.properties.iso_a2;
        var locid = feature.properties.locid;

	    // Attached events
	    layer.on({
	        mouseover: function(e){
	            // Update map country label
	            if(!selectionLayer){
	            	$('#map_country_label').html("<h4 style='color:#FFF'>"+name+"</h4>");
	            }
	        },
	        mouseout: function(e){
	        	if(!selectionLayer){
					$('#map_country_label').html("<h4 style='color:#FFF'>Select a country to view indicators</h4>");
	        	}
	        },
	        click: function(e){
	        	//
	        	// Udpate reports panel
	        	$('#map_country_label').html("<h4 style='color:#FFF'>"+name+"</h4>");

	        	// Select map
	        	if(selectionLayer){
	        		selectionLayer.setStyle({fillOpacity: 0.5});
	        		selectionLayer = false;
	        	}
	        	selectionLayer = layer;
	        	selectionLayer.setStyle({fillOpacity: 1});
	        	// Selection exists
	        	$('#reset_map').css('display','block');        	

	        	//
				switch(true){
					case ((locid.search('1')==0) && (locid != '111AZ00000000000')):
						map.setView([-2,20], 4, {animate: true});
						break;
					case (locid.search('2')==0):
						map.setView([5,-85], 4, {animate: true});
						break;
					case (locid.search('3')==0):
						map.setView([10,80], 3, {animate: true});
						break;
					case ((locid.search('4')==0) || (locid == '111AZ00000000000')):
						map.setView([40,46], 5, {animate: true});
						break;
					case (locid.search('5')==0):
						map.setView([20,12], 4, {animate: true});
						break;															
				}

				// Set the indicator list
				_setIndicatorList(iso_a2);

				//
				$('#indicator-list').show('slide',200);

				// Report close onClick event
				$('#reset_map').live('click', function(){
					//
					selectionLayer.setStyle({fillOpacity: 0.5});
					selectionLayer = false;
					$('#reset_map').css('display','none');
					$('#twine_view').css('display','none');
					//$('#indicator-list').css('display','none');
					$('#map_country_label').html("<h4 style='color:#FFF'>Select a country to view indicators</h4>");
					map.setView([0,0], 3, {animate: true});
					$('#indicator-list').hide('slide',200);
					//document.location.hash = '';
				});        				

	        },
	        dblclick: function(e){
	        	// 
	        	map.zoomIn();
	        }
	    });
	}   
	function _setIndicatorList(_iso_a2){
		
		// Get indicator
		var ind = _getIndicatorByIsoA2(_iso_a2).properties.indicators;
		if(!ind){
			ind = {};
		}

		// Header
		var indHtml = '<figure class="">';
			indHtml += '<div class="pad1x contain">';
				indHtml += '<table class="table">';	
					indHtml += '<tbody>';
					
					// Popn
					if(!ind.gen_pop_total) {
						popn = '-';
					}else{
						popn = format(ind.gen_pop_total);
					}
					indHtml += '<tr id="gen_pop_total">';
						indHtml += '<td>';
							indHtml += 'Population';
						indHtml += '</td>';
						indHtml += '<td colspan="3">';
							indHtml += ''+popn+'';
						indHtml += '</td>';
		      		indHtml += '</tr>';
						
					indHtml += '<tr>';
						indHtml += '<th>Indicator</th>';
						indHtml += '<th>Standard</th>';
						indHtml += '<th>Min*</th>';
						indHtml += '<th>Max*</th>';
		      		indHtml += '</tr>';

			      	// Mort U5
					if(!ind.ph_mort_u5mr_min) {
						ind.ph_mort_u5mr_min = '-';
					}
					if(!ind.ph_mort_u5mr_max) {
						ind.ph_mort_u5mr_max = '-';
					}					

					indHtml += '<tr id="ph_mort_u5mr">';
						indHtml += '<td>';
							indHtml += 'Under 5 Mortality rate';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += '< 1.5 deaths/ 1000/ month';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += ''+ind.ph_mort_u5mr_min+'';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += ''+ind.ph_mort_u5mr_max+'';
						indHtml += '</td>';						
		      		indHtml += '</tr>';

			      	// Health utilisation
					if (!ind.ph_util_healthutil_min){
						ind.ph_util_healthutil_min = '-';
					}
					if (!ind.ph_util_healthutil_max){
						ind.ph_util_healthutil_max = '-';
					}
					indHtml += '<tr id="ph_util_healthutil">';
						indHtml += '<td>';
							indHtml += 'Health utilisation rate';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += '1-4 new visits/ refugee/ year';
						indHtml += '</td>';						
						indHtml += '<td>';
							indHtml += ''+ind.ph_util_healthutil_min+'';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += ''+ind.ph_util_healthutil_max+'';
						indHtml += '</td>';						
		      		indHtml += '</tr>';

			      	// Measles
					if (!ind.ph_vacc_meascov_min){
						ind.ph_vacc_meascov_min = '-';
					}
					if (!ind.ph_vacc_meascov_max){
						ind.ph_vacc_meascov_max = '-';
					}
					indHtml += '<tr id="ph_vacc_meascov">';
						indHtml += '<td>';
							indHtml += 'Measles vaccination coverage';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += '>95%';
						indHtml += '</td>';						
						indHtml += '<td>';
							indHtml += ''+ind.ph_vacc_meascov_min+'';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += ''+ind.ph_vacc_meascov_max+'';
						indHtml += '</td>';
		      		indHtml += '</tr>';

					// Skilled attendance at delivery
					if (!ind.rh_anc_skillatt_min){
						ind.rh_anc_skillatt_min = '-';
					}
					if (!ind.rh_anc_skillatt_max){
						ind.rh_anc_skillatt_max = '-';
					}					
					indHtml += '<tr id="rh_anc_skillatt">';
						indHtml += '<td>';
							indHtml += 'Skilled attendance at delivery';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += '>90%';
						indHtml += '</td>';						
						indHtml += '<td>';
							indHtml += ''+ind.rh_anc_skillatt_min+'';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += ''+ind.rh_anc_skillatt_max+'';
						indHtml += '</td>';						
		      		indHtml += '</tr>';

					// Proportion of rape survivors who recieve PEP
					if (!ind.rh_sgbv_pep_min){
						ind.rh_sgbv_pep_min = '-';
					}
					if (!ind.rh_sgbv_pep_max){
						ind.rh_sgbv_pep_max = '-';
					}
					indHtml += '<tr id="rh_sgbv_pep">';
						indHtml += '<td>';
							indHtml += 'Proportion of rape survivors/PEP';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += '100%';
						indHtml += '</td>';						
						indHtml += '<td>';
							indHtml += ''+ind.rh_sgbv_pep_min+'';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += ''+ind.rh_sgbv_pep_max+'';
						indHtml += '</td>';						
		      		indHtml += '</tr>';

					// PMTCT coverage
					if (!ind.hiv_pmtct_hiv_pmtctcov_min){
						ind.hiv_pmtct_hiv_pmtctcov_min = '-';
					}
					if (!ind.hiv_pmtct_hiv_pmtctcov_max){
						ind.hiv_pmtct_hiv_pmtctcov_max = '-';
					}
					indHtml += '<tr id="hiv_pmtct_hiv_pmtctcov">';
						indHtml += '<td>';
							indHtml += 'PMTCT coverage';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += '100%';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += ''+ind.hiv_pmtct_hiv_pmtctcov_min+'';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += ''+ind.hiv_pmtct_hiv_pmtctcov_max+'';
						indHtml += '</td>';						
		      		indHtml += '</tr>';

					// Average number of litres of potable water available per person per day
					if (!ind.wash_waterpppd_min){
						ind.wash_waterpppd_min = '-';
					}
					if (!ind.wash_waterpppd_max){
						ind.wash_waterpppd_max = '-';
					}					
					indHtml += '<tr id="wash_waterpppd">';
						indHtml += '<td>';
							indHtml += 'Litres water/person/day';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += '>20';
						indHtml += '</td>';						
						indHtml += '<td>';
							indHtml += ''+ind.wash_waterpppd_min+'';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += ''+ind.wash_waterpppd_max+'';
						indHtml += '</td>';						
		      		indHtml += '</tr>';

					// Average number of litres of potable water available per person per day
					if (!ind.wash_drophole_min){
						ind.wash_drophole_min = '-';
					}
					if (!ind.wash_drophole_max){
						ind.wash_drophole_max = '-';
					}					
					indHtml += '<tr id="wash_drophole">';
						indHtml += '<td>';
							indHtml += 'Number persons/latrine';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += '<20';
						indHtml += '</td>';						
						indHtml += '<td>';
							indHtml += ''+ind.wash_drophole_min+'';
						indHtml += '</td>';
						indHtml += '<td>';
							indHtml += ''+ind.wash_drophole_max+'';
						indHtml += '</td>';						
		      		indHtml += '</tr>';

					// Footer					
	                indHtml += '</tbody>';
	            indHtml += '</table>';
	        indHtml += '</div>';
	        indHtml += '<p>* data represent the minimum and maximum range of indicator values reported at site level.</p>';
	    indHtml += '</figure>';
			
       	// Update list
		$('#indicator_content').html(indHtml);
		var h = parseInt($('#indicator_content').css('height').replace("px",""));
		$('#twine_view').css('top',10+"px");
		$('#twine_view').css('display','block');
		$('#twine_view').off('click');
		$('#twine_view').on('click', function(){
			console.log(ind.action);
			window.open(ind.action,'_blank');
		});
	}
	//
	function _getIndicatorsByIso(_iso_a2){
        // For each, search string
        var indicator;
        $.each(indicators.d, function(i, ind){
            if (ind.countryiso === _iso_a2) {
                indicator = ind;
            }
        });		
        // Return the Geolevel indicator
        return indicator;         
	}
    //
	function _getIndicatorByIsoA2(_iso_a2){
        // Return gl feature by ISO A2
        var gl3_feature;
        // For each, search string
        $.each(gl3_json.features, function(i, gl3){
            if (gl3.properties.iso_a2 === _iso_a2) {
                gl3_feature = gl3;
            }
        });    	
        // Return the Geolevel GeoJSON feature
        return gl3_feature; 
	}
    //
    function _getGeolevelBySearchId(_geojson, _iso_a2){
        // Return gl feature by ISO A2
        var feature;
        // For each, search string
        $.each(_geojson.features, function(i, gl){
            if (gl.properties.locid.search(_iso_a2)>=0) {
                feature = gl;
            }
        });    	
        // Return the Geolevel GeoJSON feature
        return feature;            	
    }

})();