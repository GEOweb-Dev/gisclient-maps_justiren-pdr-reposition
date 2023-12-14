// *******************************************************************************************
//********************************************************************************************
//**** Plugin for GEOweb - JUSTIren - Change PDR Position (geometry) using field GPS data (SAC) or manual placement
//********************************************************************************************

window.GCComponents.Functions.JUSTIrenPDRRepositionPanel = function (config) {
    if (config == null) {
        $('#justiren-pdr-reposition_panel_parent_content').html('');
        $('#justiren-pdr-reposition_panel_content').html('');
        $('#justiren-pdr-reposition_panel').css('height', 'auto');
        $('#justiren-pdr-reposition_panel').css('display', 'none');
        return;
    }
    $('#justiren-pdr-reposition_panel').css('height', 'auto');
    var panelTitle = 'Riposizionamento PRD';
    $('#justiren-pdr-reposition_panel_title').html(panelTitle);
    $('#justiren-pdr-reposition_panel_parent_content').html('');
    $('#justiren-pdr-reposition_panel_content').html('');
    var panelParentContent = '';
    var panelContent = '';

    $.each(config.pdr_list, function(pdrIDX, pdrData) {
        panelContent += '<div><a href="#" class="justiren-pdr-reposition_panel_toggle" pdrID="'+pdrIDX+'"><span class="justiren-pdr-reposition_panel_toggle_icon icon-hide-panel" style="margin-left: 10px;"></span></a>\
                        <span class="justiren-pdr-reposition_panel_separator"></span></div>';
        panelContent += '<div id="justiren-pdr-reposition_panel_'+pdrIDX+'">';
        panelContent += '<div id="justiren-pdr-reposition_pdr_panel_section_div_'+pdrIDX+'" class="pdr_section_container"><div><span class="pdr_data_header">PDR ID (tplnr)</span><span class="pdr_data_content">' + '<a href="#" id="justiren-pdr-reposition_panel_btn_'+pdrIDX+'" filterid="'+pdrIDX+'" class="olControlItemInactive olButton justiren-pdr-reposition_zoomto">'+pdrIDX+ '</a></span></div></div>';
        if (pdrData.distance_sac) {
            panelContent += '<div><span class="pdr_data_header">Spostamento da calcolo rilevamenti SAC</span><span class="pdr_data_content">' + pdrData.distance_sac + ' Mt.</span></div>';
        }
        panelContent += '<div><span class="pdr_data_header">Spostamento PDR</span><span class="pdr_data_content">' + pdrData.distance + ' Mt.</span></div>';
        var modLabel = pdrData.modified ? 'Si' : 'No';
        panelContent += '<div><span class="pdr_data_header">Modificato manualmente</span><span class="pdr_data_content">' + modLabel + '</span></div>';
        if (pdrData.modified) {
            panelContent += '<div><span class="pdr_data_header"></span><span class="pdr_data_content">' + '<a href="#" id="justiren-pdr-reposition_panel_btn_reset_'+pdrIDX+'" filterid="'+pdrIDX+'" class="olControlItemInactive olButton justiren-pdr-reposition_reset">Ripristina Posizione</a></span></div></div>';
        }
        panelContent += '</div>';
    });
    $('#justiren-pdr-reposition_panel_content').html(panelContent);
    var panelSize = $('#justiren-pdr-reposition_panel').height();
    var maxPanelSize = $('#map').height() - 50;
    if (panelSize > maxPanelSize) {
        $('#justiren-pdr-reposition_panel').css('height', maxPanelSize);
        $('#justiren-pdr-reposition_panel').css('overflow', 'auto');
    }

    $("#justiren-pdr-reposition_panel_content a").click(function() {
        var highlightLayer = GisClientMap.map.getLayersByName('layer-justiren-pdr-reposition')[0];
        event.stopPropagation();
        if ($(this).hasClass("justiren-pdr-reposition_panel_toggle")) {
            var circDisplay = '';
            var circColor = null;
            var pdrID = this.getAttribute('pdrID');
            var spanItem = $(this).find('.justiren-pdr-reposition_panel_toggle_icon')[0];
            if ($(spanItem).hasClass('icon-hide-panel')) {
                $(spanItem).removeClass('icon-hide-panel');
                $(spanItem).addClass('icon-show-panel');
                circDisplay = 'none';
                circColor = '#FFFFFF';

            }
            else {
                $(spanItem).removeClass('icon-show-panel');
                $(spanItem).addClass('icon-hide-panel');
                circDisplay = 'block';
            }
            $('#justiren-pdr-reposition_panel_'+pdrID).css('display', circDisplay);
        }
        else if ($(this).hasClass("justiren-pdr-reposition_zoomto")) {
            var itemID = this.getAttribute('filterid');
            var dstGeom;
            if (highlightLayer.data.pdr_list[itemID].id_pdr_dist.length > 0) {
                dstGeom = highlightLayer.getFeatureById(highlightLayer.data.pdr_list[itemID].id_pdr_dist).geometry.clone();
            }
            else {
                dstGeom = highlightLayer.data.pdr_list[itemID].geometry_pdr.clone();
            }
            dstGeom.calculateBounds();
            GisClientMap.map.zoomToExtent(dstGeom.getBounds());
        }
        else if ($(this).hasClass("justiren-pdr-reposition_reset")) {
            if (GisClientMap.map.currentControl.gc_id == 'control-justiren-pdr-reposition-modify') {
                GisClientMap.map.currentControl.deactivate();
                var controlMove = GisClientMap.map.getControlsBy('id', 'move')[0];
                controlMove.activate();
                GisClientMap.map.currentControl=controlMove;
            }
            var itemID = this.getAttribute('filterid');
            var origGeom = highlightLayer.data.pdr_list[itemID].geometry_pdr_sac.clone();
            var pdrGeometry, distGeometry, featurePDR, featureDist, removeItems = [], dist, tmpAttr = {};
            if (highlightLayer.data.pdr_list[itemID].id_pdr_new.length > 0) {
                removeItems.push(highlightLayer.getFeatureById(highlightLayer.data.pdr_list[itemID].id_pdr_new));
            }
            if (highlightLayer.data.pdr_list[itemID].id_pdr_dist.length > 0) {
                removeItems.push(highlightLayer.getFeatureById(highlightLayer.data.pdr_list[itemID].id_pdr_dist));
            }
            pdrGeometry = highlightLayer.data.pdr_list[itemID].geometry_pdr_sac.clone();
            distGeometry = new OpenLayers.Geometry.LineString([highlightLayer.data.pdr_list[itemID].geometry_pdr, pdrGeometry]);
            tmpAttr[clientConfig.JUSTIREN_PDRREPOSITION_PDR_ID_FIELD] = itemID;
            tmpAttr.distance = distGeometry.getGeodesicLength(GisClientMap.map.projection);
            featurePDR = new OpenLayers.Feature.Vector(pdrGeometry, tmpAttr);
            featurePDR.type = clientConfig.JUSTIREN_PDRREPOSITION_PDR_NEW_LAYER;
            featureDist = new OpenLayers.Feature.Vector(distGeometry, tmpAttr);
            featureDist.type = clientConfig.JUSTIREN_PDRREPOSITION_PDR_DIST_LAYER;
            highlightLayer.destroyFeatures(removeItems);
            highlightLayer.addFeatures([featurePDR,featureDist]);
            highlightLayer.data.pdr_list[itemID].id_pdr_new = featurePDR.id;
            highlightLayer.data.pdr_list[itemID].geometry_pdr_new = pdrGeometry.clone();
            highlightLayer.data.pdr_list[itemID].id_pdr_dist = featureDist.id;
            highlightLayer.data.pdr_list[itemID].distance = tmpAttr.distance;
            highlightLayer.data.pdr_list[itemID].modified = 0;
            highlightLayer.refresh();
            window.GCComponents.Functions.JUSTIrenPDRRepositionPanel(highlightLayer.data);
        }
        else {
            $("#justiren-pdr-reposition_panel_content a").removeClass("olControlItemActive");
            $("#justiren-pdr-reposition_panel_content a").addClass("olControlItemInactive");
            $(this).removeClass("olControlItemInactive");
            $(this).addClass("olControlItemActive");
        }
    });
    if (Object.keys(config.pdr_list).length > 0) {
        $('#justiren-pdr-reposition_panel').css('display', 'block');
    }
    else {
        $('#justiren-pdr-reposition_panel').css('display', 'none');
    }
};

window.GCComponents.Functions.JUSTIrenPDRRepositionGetNewFeatures = function(objLayers, idField, idValue, queryOp, queryLogicOp, queryAddCond) {
    var loadingControl = GisClientMap.map.getControlsByClass('OpenLayers.Control.LoadingPanel')[0];
    loadingControl.maximizeControl();
    var highlightLayer = GisClientMap.map.getLayersByName('layer-justiren-pdr-reposition')[0];
    var movePDRCtrl = GisClientMap.map.getControlsBy('gc_id', 'control-justiren-pdr-reposition-modify');
    movePDRCtrl[0].deactivate();
    if (!Array.isArray(objLayers)) objLayers = [objLayers];
    highlightLayer.data.pendingRequests = objLayers.length;
    if (idField.length == 0 || highlightLayer.data.pendingRequests == 0) {
        //window.GCComponents.Functions.modEESectionsPanel(null);
        loadingControl.minimizeControl();
        return;
    }
    if (!Array.isArray(idField)) idField = [idField];
    if (!Array.isArray(idValue)) idValue = [idValue];
    queryOp = typeof(queryOp) !== 'undefined' ? queryOp : '=';
    queryLogicOp = typeof(queryLogicOp) !== 'undefined' ? queryLogicOp : 'AND';
    if (!Array.isArray(queryOp)) queryOp = [queryOp];

    var reqQuery = '', fldValues = {};
    for (var i=0; i<idField.length; i++) {
        if (i>0) reqQuery += ' ' + queryLogicOp + ' ';
        reqQuery += idField[i]+queryOp+':param_'+i;
        fldValues['param_'+i] = idValue[i];
    }

    var params = {
        srid: GisClientMap.map.projection,
        projectName : GisClientMap.projectName,
        mapsetName : GisClientMap.mapsetName
    };

    params.query = '('+reqQuery+')';
    params.values = fldValues;

    for (var i=0; i < objLayers.length; i++) {
        var fTypeK = GisClientMap.getFeatureType(objLayers[i]);
        if(!fTypeK) return;
        params.featureType = objLayers[i];
        $.ajax({
            url: clientConfig.GISCLIENT_URL + '/services/xMapQuery.php',
            method: 'POST',
            dataType: 'json',
            data: params,
            beforeSend:function(jqXHR){
                jqXHR.featureType=objLayers[i];
            },
            success: function(response, textStatus, jqXHR) {
                if(!response || typeof(response) != 'object') {
                    alert('Errore di sistema, layer:' + jqXHR.featureType);
                    highlightLayer.data.pendingRequests--;
                }
                else {
                    var len = response.length, result, i, geometry, distGeometry, featurePDR, featureDist, removeItems = [], tplnr, dist;

                    for(i = 0; i < len; i++) {
                        result = response[i];

                        geometry = result.gc_geom && OpenLayers.Geometry.fromWKT(result.gc_geom);
                        if(!geometry) continue;
                        delete result.gc_geom;
                        if (!result.hasOwnProperty(clientConfig.JUSTIREN_PDRREPOSITION_PDR_ID_FIELD)) continue;
                        tplnr = result[clientConfig.JUSTIREN_PDRREPOSITION_PDR_ID_FIELD];
                        distGeometry = new OpenLayers.Geometry.LineString([highlightLayer.data.pdr_list[tplnr].geometry_pdr, geometry]);
                        dist = distGeometry.getGeodesicLength(GisClientMap.map.projection);
                        if (dist > clientConfig.JUSTIREN_PDRREPOSITION_PDR_DIST_MAX && highlightLayer.data.pdr_list[tplnr].modified == 0) {
                            if (highlightLayer.data.pdr_list[tplnr].id_pdr_new.length > 0) {
                                removeItems.push(highlightLayer.getFeatureById(highlightLayer.data.pdr_list[tplnr].id_pdr_new));
                            }
                            if (highlightLayer.data.pdr_list[tplnr].id_pdr_dist.length > 0) {
                                removeItems.push(highlightLayer.getFeatureById(highlightLayer.data.pdr_list[tplnr].id_pdr_dist));
                            }
                            result.distance = dist;
                            featurePDR = new OpenLayers.Feature.Vector(geometry, result);
                            featurePDR.type = jqXHR.featureType;
                            featureDist = new OpenLayers.Feature.Vector(distGeometry, result);
                            featureDist.type = clientConfig.JUSTIREN_PDRREPOSITION_PDR_DIST_LAYER
                            highlightLayer.destroyFeatures(removeItems);
                            highlightLayer.addFeatures([featurePDR,featureDist]);
                            highlightLayer.data.pdr_list[tplnr].id_pdr_new = featurePDR.id;
                            highlightLayer.data.pdr_list[tplnr].id_pdr_sac = featurePDR.id;
                            highlightLayer.data.pdr_list[tplnr].geometry_pdr_new = geometry.clone();
                            highlightLayer.data.pdr_list[tplnr].geometry_pdr_sac = geometry.clone();
                            highlightLayer.data.pdr_list[tplnr].id_pdr_dist = featureDist.id;
                            highlightLayer.data.pdr_list[tplnr].distance = dist;
                        }
                        highlightLayer.data.pdr_list[tplnr].distance_sac = dist;
                    }

                    highlightLayer.data.pendingRequests--;
                }

                if (highlightLayer.data.pendingRequests <=0) {
                    loadingControl.minimizeControl();
                    highlightLayer.refresh();

                    if (highlightLayer.features.length > 0) {
                        window.GCComponents.Functions.JUSTIrenPDRRepositionPanel(highlightLayer.data);
                    }
                }
            },
            error: function() {
                alert('Errore di sistema');
                highlightLayer.data.pendingRequests--;
                if (highlightLayer.features.length == 0) {
                    alert ('Nessun risultato');
                }
            }
        });
    };
};

window.GCComponents.Functions.JUSTIrenPDRRepositionSaveDialog = function() {
    var pdrLayer = GisClientMap.map.getLayersByName('layer-justiren-pdr-reposition')[0];
    var listPDR = [];
    var manPDR = 0;
    var autoPDR = 0;
    $('#DetailsWindow div.modal-body').html(txtMsg);
    $('#DetailsWindow h4.modal-title').html('Salvataggio spostamenti PDR');
    var txtMsg = 'Nessun PDR selezionato verrà spostato';

    $.each(pdrLayer.data.pdr_list, function(pdrIDX, pdrData) {
        if (pdrData.distance == 0) {
            return;
        }
        listPDR.push(pdrIDX);
        if (pdrData.modified) {
            manPDR++;
        }
        else {
            autoPDR++;
        }
    });

    if (listPDR.length > 0) {
        txtMsg = '<div class="tab-content">';
        txtMsg += '<div class="tab-pane active" id="justiren-pdr-deposition-dlg-save" style="height: auto;"><div>'
        txtMsg += 'Verranno spostati ' + listPDR.length + ' PDR:<ul>'
        txtMsg += '<li>Numero PDR con spostamento automatico: ' + autoPDR + '</li>';
        txtMsg += '<li>Numero PDR con spostamento manuale: ' + manPDR +  '</li>';
        txtMsg += '</ul>';
        txtMsg += 'I seguenti PDR verranno spostati:<ul><li>'
        txtMsg += listPDR.join('</li><li>') + '</li>';
        txtMsg += '</ul>Confermare lo spostamento?</div><br>';

        if ($.mobile) {
            txtMsg += '<button type="submit" role="btn-justiren-reposition-ok" class="btn btn-default ui-btn ui-shadow ui-corner-all">Ok</button>';
            txtMsg += '<button type="submit" role="btn-justiren-reposition-cancel" class="btn btn-default ui-btn ui-shadow ui-corner-all">Annulla</button>';
        }
        else {
            txtMsg += '<button type="submit" role="btn-justiren-reposition-ok" class="btn btn-default">Ok</button>';
            txtMsg += '<button type="submit" role="btn-justiren-reposition-cancel" class="btn btn-default">Annulla</button>';
        }

        txtMsg += '</div></div>';

        $('#DetailsWindow div.modal-body').html(txtMsg);
        $('#DetailsWindow').modal('show');

        $('#justiren-pdr-deposition-dlg-save button[role="btn-justiren-reposition-ok"]').click(function(event) {
            event.preventDefault();
            $('#DetailsWindow').modal('hide');
            window.GCComponents.Functions.JUSTIrenPDRRepositionSave();

        });

        $('#justiren-pdr-deposition-dlg-save button[role="btn-justiren-reposition-cancel"]').click(function(event) {
            event.preventDefault();
            $('#DetailsWindow').modal('hide');
        });
        return;
    }

    $('#DetailsWindow div.modal-body').html(txtMsg);
    $('#DetailsWindow').modal('show');
}

window.GCComponents.Functions.JUSTIrenPDRRepositionSave = function() {
    var loadingControl = GisClientMap.map.getControlsByClass('OpenLayers.Control.LoadingPanel')[0];
    loadingControl.maximizeControl();
    var highlightLayer = GisClientMap.map.getLayersByName('layer-justiren-pdr-reposition')[0];
    var parserWKT = new OpenLayers.Format.WKT();
    highlightLayer.data.pendingSaveRequests = 0;
    var saveErrors = 0;
    var baseRestUrl = clientConfig.GISCLIENT_URL + '/services/rest/projects/' + GisClientMap.projectName + '/mapsets/' + GisClientMap.mapsetName + '/featuretypes/';
    var restDataSAP = {'tipoOggetto': 'PDR', 'geocodifica': 'ZUSR'};
    $.each(highlightLayer.data.pdr_list, function(pdrIDX, pdrData) {
        if (pdrData.distance == 0) {
            return;
        }
        var tmpPDRFeature = highlightLayer.getFeatureById(pdrData.id_pdr_new).clone();
        highlightLayer.data.pendingSaveRequests+=4;
        var restDataPDR = {
            data: {
                type: clientConfig.JUSTIREN_PDRREPOSITION_PDR_LAYER,
                id: pdrIDX,
                attributes: {
                    geometry: parserWKT.write(tmpPDRFeature),
                    geometrysrid: GisClientMap.map.projection
                }
            }
        };
        restDataPDR.data.attributes[clientConfig.JUSTIREN_PDRREPOSITION_PDR_ID_FIELD] = pdrIDX;
        $.ajax({
            url:  baseRestUrl + clientConfig.JUSTIREN_PDRREPOSITION_PDR_LAYER + '/' + pdrIDX,
            method: 'PATCH',
            dataType: 'json',
            contentType: 'application/vnd.api+json',
            data: JSON.stringify(restDataPDR),
            beforeSend:function(jqXHR){
                jqXHR.pdrID = pdrIDX;
                jqXHR.featureType = clientConfig.JUSTIREN_PDRREPOSITION_PDR_LAYER;
            },
            success: function(response, textStatus, jqXHR) {
                if(!response || typeof(response) != 'object') {
                    alert('Risposta dal servizio non valida in invio a GEOweb, layer ' + jqXHR.featureType + ', PDR ' + jqXHR.pdrID);
                    saveErrors++;
                }
                highlightLayer.data.pendingRequests--;
                window.GCComponents.Functions.JUSTIrenPDRRepositionSaved(highlightLayer.data.pendingRequests, loadingControl, saveErrors);
            },
            error: function(response, textStatus, errorThrown) {
                alert('Errore di sistema in invio a GEOweb, layer ' + response.featureType + ', PDR ' + response.pdrID);
                highlightLayer.data.pendingRequests--;
                saveErrors++;
                window.GCComponents.Functions.JUSTIrenPDRRepositionSaved(highlightLayer.data.pendingRequests, loadingControl, saveErrors);
            }
        });
        restDataPDR.data.type = clientConfig.JUSTIREN_PDRREPOSITION_PDR_NEW_LAYER;
        restDataPDR.data.attributes.updated = 1;
        var newPDRUrl = baseRestUrl + clientConfig.JUSTIREN_PDRREPOSITION_PDR_NEW_LAYER;
        var newPDRVerb = 'POST';
        if (pdrData.id_pdr_sac.length > 0) {
            newPDRUrl += '/' + pdrIDX;
            newPDRVerb = 'PATCH';
        }
        $.ajax({
            url:  newPDRUrl,
            method: newPDRVerb,
            dataType: 'json',
            contentType: 'application/vnd.api+json',
            data: JSON.stringify(restDataPDR),
            beforeSend:function(jqXHR){
                jqXHR.pdrID = pdrIDX;
                jqXHR.featureType = clientConfig.JUSTIREN_PDRREPOSITION_PDR_NEW_LAYER;
            },
            success: function(response, textStatus, jqXHR) {
                if(!response || typeof(response) != 'object') {
                    alert('Risposta dal servizio non valida in invio a GEOweb, layer ' + jqXHR.featureType + ', PDR ' + jqXHR.pdrID);
                    saveErrors++;
                }
                highlightLayer.data.pendingRequests--;
                window.GCComponents.Functions.JUSTIrenPDRRepositionSaved(highlightLayer.data.pendingRequests, loadingControl, saveErrors);
            },
            error: function(response, textStatus, errorThrown) {
                alert('Errore di sistema in invio a GEOweb, layer ' + response.featureType + ', PDR ' + response.pdrID);
                highlightLayer.data.pendingRequests--;
                saveErrors++;
                window.GCComponents.Functions.JUSTIrenPDRRepositionSaved(highlightLayer.data.pendingRequests, loadingControl, saveErrors);
            }
        });
        var restDataDist = {
            data: {
                type: clientConfig.JUSTIREN_PDRREPOSITION_PDR_DIST_LAYER,
                id: pdrIDX,
                attributes: {
                    updated: 1
                }
            }
        };
        restDataDist.data.attributes[clientConfig.JUSTIREN_PDRREPOSITION_PDR_ID_FIELD] = pdrIDX;
        $.ajax({
            url:  baseRestUrl + clientConfig.JUSTIREN_PDRREPOSITION_PDR_DIST_LAYER + '/' + pdrIDX,
            method: 'PATCH',
            dataType: 'json',
            contentType: 'application/vnd.api+json',
            data: JSON.stringify(restDataDist),
            beforeSend:function(jqXHR){
                jqXHR.pdrID = pdrIDX;
                jqXHR.featureType = clientConfig.JUSTIREN_PDRREPOSITION_PDR_DIST_LAYER;
            },
            success: function(response, textStatus, jqXHR) {
                if(!response || typeof(response) != 'object') {
                    alert('Risposta dal servizio non valida in invio a GEOweb, layer ' + jqXHR.featureType + ', PDR ' + jqXHR.pdrID );
                }
                else {
                    alert("Esclusione dell'oggetto distanza non riuscita, PDR " + jqXHR.pdrID)
                }
                highlightLayer.data.pendingRequests--;
                saveErrors++;
                window.GCComponents.Functions.JUSTIrenPDRRepositionSaved(highlightLayer.data.pendingRequests, loadingControl, saveErrors);
            },
            error: function(response, textStatus, errorThrown) {
                highlightLayer.data.pendingRequests--;
                if (response.responseJSON.hasOwnProperty('errors')) {
                    if (response.responseJSON.errors[0].code = 'err_not_found') {
                        window.GCComponents.Functions.JUSTIrenPDRRepositionSaved(highlightLayer.data.pendingRequests, loadingControl, saveErrors);
                    }
                    return;
                }
                alert('Errore di sistema in invio a GEOweb, layer ' + response.featureType + ', PDR ' + response.pdrID);
                saveErrors++;
                window.GCComponents.Functions.JUSTIrenPDRRepositionSaved(highlightLayer.data.pendingRequests, loadingControl, saveErrors);
            }
        });
        $.each(pdrData.sap_data, function(key, val) {
            restDataSAP[key] = val;
        });
        if (GisClientMap.map.projection != clientConfig.JUSTIREN_PDRREPOSITION_PDR_SAP_SRID) {
             tmpPDRFeature.geometry.transform(GisClientMap.map.projection, clientConfig.JUSTIREN_PDRREPOSITION_PDR_SAP_SRID);
        }
        restDataSAP.geometriaWKT = parserWKT.write(tmpPDRFeature);
        $.ajax({
            url: clientConfig.JUSTIREN_PDRREPOSITION_PDR_GIS04_SERVICEURL,
            method: 'POST',
            dataType: 'json',
            contentType: "application/json",
            data: JSON.stringify(restDataSAP),
            beforeSend:function(jqXHR){
                jqXHR.pdrID = pdrIDX;
            },
            success: function(response, status, jqXHR) {
                if(!response || typeof(response) != 'object') {
                    alert('Risposta dal servizio non valida in invio a SAP, PDR ' + jqXHR.pdrID);
                    saveErrors++;
                }
                highlightLayer.data.pendingRequests--;
                window.GCComponents.Functions.JUSTIrenPDRRepositionSaved(highlightLayer.data.pendingRequests, loadingControl, saveErrors);
            },
            error: function(xhr, status, error) {
                var strError = "Invio modifiche geometriche a SAP fallito, PDR " + xhr.pdrID + "\nTipo errore: ";
                if (status == 'error') {
                    strError += error;
                }
                if (xhr.responseJSON.hasOwnProperty('error')) {
                    strError += '\nDettagli: ' + xhr.responseJSON.error;
                }
                alert(strError);
                highlightLayer.data.pendingRequests--;
                saveErrors++;
                window.GCComponents.Functions.JUSTIrenPDRRepositionSaved(highlightLayer.data.pendingRequests, loadingControl, saveErrors);
            }
        });
    });
    if (highlightLayer.data.pendingSaveRequests <= 0) {
        loadingControl.minimizeControl();
    }
}

window.GCComponents.Functions.JUSTIrenPDRRepositionSaved = function(pendingRequests, loadingControl, numErrors) {
    if (pendingRequests <=0) {
        loadingControl.minimizeControl();
        var selectControls = GisClientMap.map.getControlsBy('gc_id', 'control-querytoolbar');
        if (selectControls.length > 0) {
            var layerPDR = selectControls[0].getLayerFromFeature(clientConfig.JUSTIREN_PDRREPOSITION_PDR_LAYER);
            layerPDR.redraw();
            var layerDist = selectControls[0].getLayerFromFeature(clientConfig.JUSTIREN_PDRREPOSITION_PDR_DIST_LAYER);
            layerDist.redraw();
        }
        window.GCComponents.Functions.JUSTIrenPDRRepositionClear();
        if (numErrors) {
            alert('Salvataggio spostamenti PDR terminato con errori');
        }
        else {
            alert('Salvataggio spostamenti PDR terminato con successo');
        }
    }
}

window.GCComponents.Functions.JUSTIrenPDRRepositionClear = function() {
    window.GCComponents.Functions.JUSTIrenPDRRepositionPanel();
    var movePDRCtrl = GisClientMap.map.getControlsBy('gc_id', 'control-justiren-pdr-reposition-modify');
    movePDRCtrl[0].deactivate();
    var highlightLayer = GisClientMap.map.getLayersByName('layer-justiren-pdr-reposition')[0];
    highlightLayer.data = {pdr_list: {}};
    highlightLayer.removeAllFeatures();
    highlightLayer.redraw();
}

window.GCComponents.InitFunctions.JUSTIrenPDRRepositionInit = function() {
    if (!window.GCComponents.hasOwnProperty('Data')) {
        window.GCComponents.Data = {JUSTIrenPDRReposition:{}};
    }
    else {
        window.GCComponents.Data.JUSTIrenPDRReposition = {};
    }
    var highlightLayer = GisClientMap.map.getLayersByName('layer-justiren-pdr-reposition')[0];
    highlightLayer.data = {pdr_list: {}};
    //window.GCComponents.Data.JUSTIrenPDRReposition.bboxGeom = null;
    //window.GCComponents.Data.JUSTIrenPDRReposition.filterLayers = [];
    //window.GCComponents.Data.JUSTIrenPDRReposition.filterFreq = {};

    // **** Configure highlight layer
    var ruleDisplayPoint = new OpenLayers.Rule({
        //maxScaleDenominator: "${maxscale}",
        //minScaleDenominator: "${minscale}",
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.EQUAL_TO,
            property: "visible",
            value: 1,
        }),
        symbolizer: {display: ''}
    });
    var ruleHidePoint = new OpenLayers.Rule({
        elseFilter: true,
        symbolizer: {display: 'none'}
    });

    highlightLayer.styleMap.styles.default.addRules([ruleDisplayPoint, ruleHidePoint]);
}
