// *******************************************************************************************
//********************************************************************************************
//**** Plugin for GEOweb - JUSTIren - Change PDR Position (geometry) using field GPS data (SAC) or manual placement
//********************************************************************************************

window.GCComponents["Layers"].addLayer('layer-justiren-pdr-reposition', {
    displayInLayerSwitcher:false,
    styleMap: new OpenLayers.StyleMap({
        'default': {
            fill: true,
            fillColor: '${color}',
            fillOpacity: 0.7,
            hoverFillColor: '${color}',
            hoverFillOpacity: 0.9,
            fillColor: '${color}',
            strokeColor: '${color}',
            strokeOpacity: 0.7,
            strokeWidth: '${width}',
            strokeLinecap: "round",
            strokeDashstyle: "solid",
            hoverStrokeColor: '${color}',
            hoverStrokeOpacity: 1,
            hoverStrokeWidth: 10,
            pointRadius: '${width}',
            hoverPointRadius: 10,
            hoverPointUnit: "%",
            pointerEvents: "visiblePainted",
            cursor: "inherit"
        },
        'select': {
            fill: true,
            fillColor: '${color}',
            fillOpacity: 0.9,
            hoverFillColor: '${color}',
            hoverFillOpacity: 0.9,
            strokeColor: '${color}',
            strokeOpacity: 1,
            strokeWidth: '${width}',
            strokeLinecap: "round",
            strokeDashstyle: "solid",
            hoverStrokeColor: '${color}',
            hoverStrokeOpacity: 1,
            hoverStrokeWidth: '${width}',
            pointRadius: 8,
            hoverPointRadius: 1,
            hoverPointUnit: "%",
            pointerEvents: "visiblePainted",
            cursor: "pointer"
        },
        'temporary': {
            fill: true,
            fillColor: "EEA652",
            fillOpacity: 0.2,
            hoverFillColor: "white",
            hoverFillOpacity: 0.8,
            strokeColor: "#EEA652",
            strokeOpacity: 1,
            strokeLinecap: "round",
            strokeWidth: 4,
            strokeDashstyle: "solid",
            hoverStrokeColor: "red",
            hoverStrokeOpacity: 1,
            hoverStrokeWidth: 0.2,
            pointRadius: 6,
            hoverPointRadius: 1,
            hoverPointUnit: "%",
            pointerEvents: "visiblePainted",
            cursor: "pointer"
        }
    })
}, {
    "sketchcomplete": function(obj) {
        if (obj.feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon" ) {
            var movePDRCtrl = this.map.getControlsBy('gc_id', 'control-justiren-pdr-reposition-modify');
            movePDRCtrl[0].deactivate();
            switch (this.selectOp) {
                case 1:
                // **** Get main selection control
                var selectControls = this.map.getControlsBy('gc_id', 'control-querytoolbar');
                if (selectControls.length != 1)
                    return;
                if (!selectControls[0].controls)
                    return;
                var selectControl = selectControls[0];

                // **** insert configured WFS layers
                if (typeof(clientConfig.JUSTIREN_PDRREPOSITION_PDR_LAYER) === 'undefined') {
                    return;
                }

                var featureTypesAuto = clientConfig.JUSTIREN_PDRREPOSITION_PDR_LAYER;
                var tmpLayer = selectControl.getLayerFromFeature(clientConfig.JUSTIREN_PDRREPOSITION_PDR_LAYER);
                var selectLayersAuto = [tmpLayer];
                var selectControlAuto = this.map.getControlsBy('gc_id', 'control-justiren-pdr-reposition-manualselect')[0];

                selectControlAuto.layers = selectLayersAuto;
                selectControlAuto.queryFeatureType = featureTypesAuto;
                selectControlAuto.wfsCache = selectControl.wfsCache;
                selectControlAuto.resultLayer = this;
                selectControlAuto.maxVectorFeatures = clientConfig.JUSTIREN_PDRREPOSITION_PDR_MAX_NUM;
                selectControlAuto.maxFeatures = clientConfig.JUSTIREN_PDRREPOSITION_PDR_MAX_NUM;
                selectControlAuto.activate();
                selectControlAuto.select(obj.feature.geometry.getBounds());
                selectControlAuto.deactivate();
                break;
                case 2:
                var removeItems = [];
                for (var i=0; i<this.features.length; i++) {
                    if (obj.feature.geometry.intersects(this.features[i].geometry)) {
                        var tmp_id = this.features[i].attributes[clientConfig.JUSTIREN_PDRREPOSITION_PDR_ID_FIELD];
                        if (this.data.pdr_list.hasOwnProperty(tmp_id)) {
                            if (this.data.pdr_list[tmp_id].id_pdr.length > 0) {
                                removeItems.push(this.getFeatureById(this.data.pdr_list[tmp_id].id_pdr));
                            }
                            if (this.data.pdr_list[tmp_id].id_pdr_new.length > 0) {
                                removeItems.push(this.getFeatureById(this.data.pdr_list[tmp_id].id_pdr_new));
                            }
                            if (this.data.pdr_list[tmp_id].id_pdr_dist.length > 0) {
                                removeItems.push(this.getFeatureById(this.data.pdr_list[tmp_id].id_pdr_dist));
                            }
                            delete this.data.pdr_list[tmp_id];
                        }
                    }
                }
                if (removeItems.length > 0) {
                    this.destroyFeatures(removeItems);
                }
                window.GCComponents.Functions.JUSTIrenPDRRepositionPanel(this.data);
                this.refresh();
                break;
                default:
            }
            return false;
        }
        return true;
    },
    "refresh": function() {
        this.redraw();
        var layerExtent = null;
        if (this.features.length > 0) {
            var layerExtent = this.getDataExtent();
            if (!layerExtent.intersectsBounds(this.map.getMaxExtent())) {
                layerExtent = null;
            }
        }
        if (layerExtent) {
            this.map.zoomToExtent(layerExtent);
        }
    },
    "beforefeatureadded": function(obj) {
        if (obj.feature.type == clientConfig.JUSTIREN_PDRREPOSITION_PDR_LAYER) {
            if (obj.feature.attributes.hasOwnProperty(clientConfig.JUSTIREN_PDRREPOSITION_PDR_ID_FIELD)) {
                if (this.data.pdr_list.hasOwnProperty(obj.feature.attributes[clientConfig.JUSTIREN_PDRREPOSITION_PDR_ID_FIELD])) {
                    return false;
                }
            }
        }
        if (!obj.feature.attributes.hasOwnProperty('color')) {
            switch (obj.feature.type) {
                case clientConfig.JUSTIREN_PDRREPOSITION_PDR_LAYER:
                obj.feature.attributes.color = clientConfig.JUSTIREN_PDRREPOSITION_PDR_LAYER_COLOR;
                obj.feature.attributes.width = clientConfig.JUSTIREN_PDRREPOSITION_PDR_LAYER_WIDTH;
                obj.feature.attributes.visible = 0;
                break;
                case clientConfig.JUSTIREN_PDRREPOSITION_PDR_NEW_LAYER:
                obj.feature.attributes.color = clientConfig.JUSTIREN_PDRREPOSITION_PDR_NEW_LAYER_COLOR;
                obj.feature.attributes.width = clientConfig.JUSTIREN_PDRREPOSITION_PDR_NEW_LAYER_WIDTH;
                obj.feature.attributes.visible = 1;
                break;
                default:
                obj.feature.attributes.color = clientConfig.JUSTIREN_PDRREPOSITION_PDR_DIST_LAYER_COLOR;
                obj.feature.attributes.width = clientConfig.JUSTIREN_PDRREPOSITION_PDR_DIST_LAYER_WIDTH;
                obj.feature.attributes.visible = 1;
            }
        }
    },
    "featureadded": function(obj) {
        if (obj.feature.type == clientConfig.JUSTIREN_PDRREPOSITION_PDR_LAYER) {
            if (obj.feature.attributes.hasOwnProperty(clientConfig.JUSTIREN_PDRREPOSITION_PDR_ID_FIELD)) {
                var tmp_id = obj.feature.attributes[clientConfig.JUSTIREN_PDRREPOSITION_PDR_ID_FIELD];
                this.data.pdr_list[tmp_id] = {
                    geometry_pdr: obj.feature.geometry.clone(),
                    geometry_pdr_new: obj.feature.geometry.clone(),
                    geometry_pdr_sac: obj.feature.geometry.clone(),
                    id_pdr: obj.feature.id,
                    id_pdr_new: '',
                    id_pdr_sac: '',
                    id_pdr_dist: '',
                    modified: 0,
                    distance: 0,
                    distance_sac: 0
                };
                var sapData = {}
                $.each(clientConfig.JUSTIREN_PDRREPOSITION_PDR_SAP_FIELDS, function(key, val) {
                    sapData[key] = obj.feature.attributes[val];
                });
                this.data.pdr_list[tmp_id].sap_data = sapData;
            }
            var tmp_attr = {};
            tmp_attr[clientConfig.JUSTIREN_PDRREPOSITION_PDR_ID_FIELD] = tmp_id;
            var featurePDRNew = new OpenLayers.Feature.Vector(obj.feature.geometry.clone(), tmp_attr);
            featurePDRNew.type = clientConfig.JUSTIREN_PDRREPOSITION_PDR_NEW_LAYER;
            this.addFeatures([featurePDRNew]);
            this.data.pdr_list[tmp_id].id_pdr_new = featurePDRNew.id;
        }
    },
    "beforefeatureselected": function(obj) {
        if (obj.feature.type != clientConfig.JUSTIREN_PDRREPOSITION_PDR_NEW_LAYER) {
            return false;
        }
    },
    "featuremodified": function(obj) {
        if (obj.feature.type == clientConfig.JUSTIREN_PDRREPOSITION_PDR_NEW_LAYER) {
            var tmp_id = obj.feature.attributes[clientConfig.JUSTIREN_PDRREPOSITION_PDR_ID_FIELD];
            if (this.data.pdr_list.hasOwnProperty(tmp_id)) {
                this.data.pdr_list[tmp_id].geometry_pdr_new = obj.feature.geometry.clone();
                if (this.data.pdr_list[tmp_id].id_pdr_dist.length > 0) {
                    var featDel = this.getFeatureById(this.data.pdr_list[tmp_id].id_pdr_dist);
                    this.destroyFeatures([featDel]);
                }
                var distGeometry = new OpenLayers.Geometry.LineString([this.data.pdr_list[tmp_id].geometry_pdr, obj.feature.geometry]);
                var dist = distGeometry.getGeodesicLength(GisClientMap.map.projection);
                obj.feature.attributes.distance = dist;
                if (dist > 0) {
                    var featureDist = new OpenLayers.Feature.Vector(distGeometry, obj.feature.attributes);
                    featureDist.type = clientConfig.JUSTIREN_PDRREPOSITION_PDR_DIST_LAYER;
                    featureDist.attributes.color = clientConfig.JUSTIREN_PDRREPOSITION_PDR_DIST_LAYER_COLOR;
                    featureDist.attributes.width = clientConfig.JUSTIREN_PDRREPOSITION_PDR_DIST_LAYER_WIDTH;
                    featureDist.attributes.visible = 1;
                    this.addFeatures([featureDist]);
                    this.data.pdr_list[tmp_id].id_pdr_dist = featureDist.id;
                }
                this.data.pdr_list[tmp_id].distance = dist;
                this.data.pdr_list[tmp_id].modified = 1;
            }
            window.GCComponents.Functions.JUSTIrenPDRRepositionPanel(this.data);
        }
    }
});

window.GCComponents["Controls"].addControl('control-justiren-pdr-reposition-toolbar', function(map){
    return new  OpenLayers.Control.Panel({
        gc_id: 'control-justiren-pdr-reposition-toolbar',
        createControlMarkup:customCreateControlMarkup,
        div:document.getElementById("map-toolbar-justiren-pdr-reposition"),
        autoActivate:false,
        saveState:true,
        draw: function() {
            var controls = [
                new OpenLayers.Control.DrawFeature(
                    map.getLayersByName('layer-justiren-pdr-reposition')[0],
                    OpenLayers.Handler.RegularPolygon,
                    {
                        handlerOptions: {irregular: true},
                        gc_id: 'control-justiren-pdr-reposition-select',
                        iconclass:"glyphicon-white glyphicon-plus",
                        text:'Seleziona PDR',
                        title:'Seleziona PDR',
                        eventListeners: {
                            'activate': function(e){
                                this.layer.selectOp = 1;
                                if (map.currentControl != this) {
                                    map.currentControl.deactivate();
                                    var touchControl = map.getControlsByClass("OpenLayers.Control.TouchNavigation");
                                    if (touchControl.length > 0) {
                                        touchControl[0].dragPan.deactivate();
                                    }
                                }
                                // **** flag on layer: select
                                map.currentControl=this;
                            },
                            'deactivate': function(e){
                                this.layer.selectOp = 0;
                                var touchControl = map.getControlsByClass("OpenLayers.Control.TouchNavigation");
                                if (touchControl.length > 0) {
                                    touchControl[0].dragPan.activate();
                                }
                                // **** remove flag from layer
                                //var btnControl = map.getControlsBy('id', 'button-mod-istat-ca')[0];
                                //if (btnControl.active)
                                //    btnControl.deactivate();
                            }
                        }
                    }
                ),
                new OpenLayers.Control.DrawFeature(
                    map.getLayersByName('layer-justiren-pdr-reposition')[0],
                    OpenLayers.Handler.RegularPolygon,
                    {
                        handlerOptions: {irregular: true},
                        gc_id: 'control-justiren-pdr-reposition-unselect',
                        iconclass:"glyphicon-white glyphicon-minus",
                        text:'Deseleziona PDR',
                        title:'Deseleziona PDR',
                        eventListeners: {
                            'activate': function(e){
                                this.layer.selectOp = 2;
                                if (map.currentControl != this) {
                                    map.currentControl.deactivate();
                                    var touchControl = map.getControlsByClass("OpenLayers.Control.TouchNavigation");
                                    if (touchControl.length > 0) {
                                        touchControl[0].dragPan.deactivate();
                                    }
                                }
                                // **** flag on layer: unselect
                                map.currentControl=this;
                            },
                            'deactivate': function(e){
                                this.layer.selectOp = 0;
                                var touchControl = map.getControlsByClass("OpenLayers.Control.TouchNavigation");
                                if (touchControl.length > 0) {
                                    touchControl[0].dragPan.activate();
                                }
                                // **** remove flag from layer
                                //var btnControl = map.getControlsBy('id', 'button-mod-istat-ca')[0];
                                //if (btnControl.active)
                                //    btnControl.deactivate();
                            }
                        }
                    }
                ),
                new OpenLayers.Control.ModifyFeature(
                    map.getLayersByName('layer-justiren-pdr-reposition')[0],
                    {
                        mode: OpenLayers.Control.ModifyFeature.DRAG,
                        gc_id: 'control-justiren-pdr-reposition-modify',
                        vertexRenderIntent: 'temporary',
                        iconclass:"glyphicon-white glyphicon-move",
                        text:"Sposta PDR",
                        title:"Sposta PDR",
                        eventListeners: {
                            'activate': function(){
                                if (this.layer.features.length == 0) {
                                    alert('Nessun PDR selezionato');
                                    return false;
                                }
                                this.map.currentControl.deactivate();

                                var origLayerIndex = this.map.getLayerIndex(this.layer);
                                var maxIndex = this.map.getLayerIndex(this.map.layers[this.map.layers.length -1]);
                                if(origLayerIndex < maxIndex) this.map.raiseLayer(this.layer, (maxIndex - origLayerIndex));
                                this.map.resetLayersZIndex();

                                this.map.currentControl=this
                            },
                            'deactivate': function() {
                            }
                        }
                    }
                ),
                new OpenLayers.Control(
                    {
                        ctrl: this,
                        type: OpenLayers.Control.TYPE_BUTTON ,
                        iconclass:"glyphicon-white glyphicon-save",
                        title:"Salva Spostamenti",
                        text:"Salva Spostamenti",
                        trigger: function () {
                            window.GCComponents.Functions.JUSTIrenPDRRepositionSaveDialog.call(this);
                        }
                    }
                )
            ];
            this.addControls(controls);
            OpenLayers.Control.Panel.prototype.draw.apply(this)
        },
        redraw: function () {
            OpenLayers.Control.Panel.prototype.redraw.apply(this);
            var sectPanel = document.createElement("div");
            sectPanel.setAttribute('id', 'justiren-pdr-reposition_panel');
            this.div.appendChild(sectPanel);
            var sectPanelHeader = document.createElement("div");
            sectPanelHeader.setAttribute('id', 'justiren-pdr-reposition_panel_header');
            sectPanelHeader.innerHTML = '<a href="#" id="justiren-pdr-reposition_panel_toggle"><span id="justiren-pdr-reposition_panel_toggle_span" class="icon-hide-panel"></span></a><span id="justiren-pdr-reposition_panel_title">Circuito Selezionato</span>'
            sectPanel.appendChild(sectPanelHeader);
            var sectPanelParentContent = document.createElement("div");
            sectPanelParentContent.setAttribute('id', 'justiren-pdr-reposition_panel_parent_content');
            sectPanel.appendChild(sectPanelParentContent);
            var sectPanelContent = document.createElement("div");
            sectPanelContent.setAttribute('id', 'justiren-pdr-reposition_panel_content');
            sectPanel.appendChild(sectPanelContent);
            $("#justiren-pdr-reposition_panel_header a").click(function() {
                event.stopPropagation();
                if ($("#justiren-pdr-reposition_panel_toggle_span").hasClass('icon-hide-panel')) {
                    $("#justiren-pdr-reposition_panel_toggle_span").removeClass('icon-hide-panel');
                    $("#justiren-pdr-reposition_panel_toggle_span").addClass('icon-show-panel');
                    $('#justiren-pdr-reposition_panel').css('height', 'auto');
                    $('#justiren-pdr-reposition_panel_parent_content').css('display', 'none');
                    $('#justiren-pdr-reposition_panel_content').css('display', 'none');
                }
                else {
                    $("#justiren-pdr-reposition_panel_toggle_span").removeClass('icon-show-panel');
                    $("#justiren-pdr-reposition_panel_toggle_span").addClass('icon-hide-panel');
                    var panelSize = $('#justiren-pdr-reposition_panel').height();
                    var maxPanelSize = $('#map').height() - 50;
                    if (panelSize > maxPanelSize) {
                        $('#justiren-pdr-reposition_panel').css('height', maxPanelSize);
                        $('#justiren-pdr-reposition_panel').css('overflow', 'auto');
                    }
                    $('#justiren-pdr-reposition_panel_parent_content').css('display', 'block');
                    $('#justiren-pdr-reposition_panel_content').css('display', 'block');
                }
            });
        }
    })
});

window.GCComponents["Controls"].addControl('control-justiren-pdr-reposition-manualselect', function(map){
    return new OpenLayers.Control.QueryMap(
        OpenLayers.Handler.RegularPolygon,
        {
            gc_id: 'control-justiren-pdr-reposition-manualselect',
            baseUrl: GisClientMap.baseUrl,
            maxFeatures:1,
            deactivateAfterSelect: true,
            vectorFeaturesOverLimit: new Array(),
            eventListeners: {
                'activate': function(){
                    var selectControls = this.map.getControlsBy('gc_id', 'control-querytoolbar');
                    if (selectControls.length != 1)
                        return false;

                },
                'startQueryMap': function(event) {
                    event.object.resultLayer.hasPreviousResults = false;
                },
                'endQueryMap': function(event) {
                    var valArr = Object.keys(event.layer.data.pdr_list);
                    var fldArr = Array(valArr.length).fill(clientConfig.JUSTIREN_PDRREPOSITION_PDR_ID_FIELD);
                    window.GCComponents.Functions.JUSTIrenPDRRepositionGetNewFeatures.call(this, [clientConfig.JUSTIREN_PDRREPOSITION_PDR_NEW_LAYER], fldArr, valArr, '=', 'OR');
                },
                'featuresLoaded': function(featureType) {
                }
            }
        }
    )
});

// **** Toolbar button
window.GCComponents["SideToolbar.Buttons"].addButton (
    'button-justiren-pdr-reposition-toolbar',
    'Toolbar Riposizionamento PDR',
    'icon-justiren-pdr-reposition',
    function() {
        if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined')
        {
            if (this.active) {
                this.deactivate();
                var JUSTIrenPDRRepositionToolbarControl = this.map.getControlsBy('gc_id', 'control-justiren-pdr-reposition-toolbar');
                if (JUSTIrenPDRRepositionToolbarControl.length == 1) {
                    JUSTIrenPDRRepositionToolbarControl[0].deactivate();
                    this.map.currentControl = this.map.defaultControl;
                }
                window.GCComponents.Functions.JUSTIrenPDRRepositionClear();
            }
            else
            {
                this.activate();
                var JUSTIrenPDRRepositionToolbarControl = this.map.getControlsBy('gc_id', 'control-justiren-pdr-reposition-toolbar');
                if (JUSTIrenPDRRepositionToolbarControl.length == 1) {
                    JUSTIrenPDRRepositionToolbarControl[0].activate();
                    if (JUSTIrenPDRRepositionToolbarControl[0].controls.length > 2) {
                    //    JUSTIrenPDRRepositionToolbarControl[0].controls[4].deactivate();
                    }
                }
            }
            if (typeof(sidebarPanel.handleEvent) !== 'undefined')
                sidebarPanel.handleEvent = false;
        }
    },
    {button_group: 'tools'}
);
