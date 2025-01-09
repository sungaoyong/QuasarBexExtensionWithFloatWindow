// 获取当前页面地址上是否存在XMID，若不存在，跳转到项目列表
var id = getUrlParam("id");
var dataparam = getUrlParam("dataparam");
var sysParam = sessionStorage.getItem("sysParam");

if (isEmpty(id)) {
  window.location.href = getRootPath() + "/index/index";
}
var zxlx = "ndbg";
var jzztSelect;
var geoJson;


layui.config({
  base: getRootPath() + '/static/lib/layui_ext', //配置 layui 第三方扩展组件存放的基础目录
}).extend({
  xmSelect: '/xm-select/xm-select'
}).use(['table', 'layer', 'form', 'upload', 'jquery', 'laytpl', 'xmSelect', 'element'], function () {

  var $ = layui.$,
    table = layui.table,
    layer = layui.layer,
    form = layui.form,
    laytpl = layui.laytpl,
    xmSelect = layui.xmSelect,
    upload = layui.upload,
    element = layui.element;

  if (sysParam != "ndbg") {
    layer.msg("请退出重新进入");
    return
  }

  var img;
  var map, jd, wd, marker, drawPolygon, PopupArr = [],
    geoAddjson = {},
    dcyPopupArr = [];
  var markerLayers = [];
  var rows = JSON.parse(sessionStorage.getItem('rows'));
  var dlmcList = [],
    zzsxList = [];

  // 监听播放时间变化
  // $('#myVideo').on('timeupdate', function() {
  //     // 获取当前播放时间
  //     var currentTime = this.currentTime;
  //     // 更新显示当前时间的元素内容
  //     $('#currentTime').text(currentTime);
  // });

  //
  // $('#myVideo').on('play', function() {
  //     timeHandler();
  // });
  //
  // $('#myVideo').on('pause', function() {
  //     endedHandler();
  // });

  // // var intergeTime = 0;
  //     var intergeTimeArr = [];
  //     function endedHandler() {
  //         intergeTimeArr = [];
  //     }
  // //监听播放改变角度
  //     function timeHandler(time) {
  //         var index = Math.ceil(parseInt(time));
  //
  //         if (!intergeTimeArr.includes(index)) {
  //             intergeTimeArr.push(index);
  //             if (index % 2 == 0) {
  //                 var number = index / 2;
  //                 if (!isEmpty(currentVideoList[number]) && !isEmpty(currentVideoList[number]['JD']) && !isEmpty(currentVideoList[number]['WD']) && !isEmpty(currentVideoList[number]['PSJD'])) {
  //                     mapRemoveOverlay();
  //                     //                console.log(number);
  //                     mapSetViewport(geojsonPolygon);
  //                     mapSetOverLay(currentVideoList[number]['JD'], currentVideoList[number]['WD']);
  //                     //            console.log(index+":"+currentVideoList[index]['PSJD']);
  //                     $('.rotateArrow').css('transform', 'rotate(' + currentVideoList[number]['PSJD'] + 'deg)');
  //                 }
  //             }
  //
  //
  //
  //         }
  //
  //     }



  //初始化地图对象
  function onLoad() {

    const tileOptions = {
      minZoom: 14,
      maxZoom: 18, //天地图经纬度投影的最大缩放级别为17,继续放大则没有瓦片可以拉取
      unlimited: true //不限制缩放,重写GridLayer的_removeAllTiles方法,实现在最大缩放级别下,能够继续放大图片
    }
    // 定义天地图影像地图,c是经纬度，w是墨卡托
    var normalm = L.tileLayer.chinaProvider('TianDiTu.Satellite.Map', tileOptions);
    // 定义天地图影像注记
    // var normala = L.tileLayer.chinaProvider('TianDiTu.Satellite.Annotion', tileOptions);
    // var normal = L.layerGroup([normalm, normala]);
    var normal = L.layerGroup([normalm]);
    //初始化地图
    map = L.map('mapDiv', {
      crs: L.CRS.EPSG3857, //默认,天地图web墨卡托投影使用(此时天地图最大缩放级别为18)
      center: [39.89945, 116.40969],
      maxZoom: 25, //设置unlimited后，天地图可以实现缩放到20也有地图
      minZoom: 14,
      zoom: 18,
      layers: [normal], //加载天地图经纬度投影作为底图
      zoomControl: false,
      attributionControl: false
    });

  }

  //清理所有的覆盖物
  function mapRemoveOverlay() {
    if (map && markerLayers && markerLayers.length > 1) {
      $.each(markerLayers, function (index, value) {
        map.removeLayer(value);
      });
      markerLayers = [];
    }
  }

  //清理当前方位角覆盖物
  function mapRemoveOverlayOne() {
    if (map && marker) {
      map.removeLayer(marker);
    }
  }


  //当前的方位角
  function mapSetOverLayOne(photoJd, photoWd, photoPsjd) {
    if (map && marker && markerLayers && photoJd && photoWd) {
      var myIcon = L.divIcon({
        html: "<img style='transform:rotate(" + photoPsjd + "deg); width: 65px;height: 65px;' src='../../static/images/37.png'></img>",
        bgPos: [photoWd, photoJd],
        iconAnchor: [30, 30],
        className: ''
      });
      marker = new L.marker([photoWd, photoJd], {
        icon: myIcon
      });
      markerLayers.push(marker);
      map.addLayer(marker);
    }
  }

  //设置地图视野
  function mapSetViewport(geojsonPolygon, lx) {
    var color
    switch (lx) {
      case 'bgtb':
        color = 'red'
        break;
      case 'ttq':
        color = 'rgb(196,60,196)'
        break;
      case 'gfbq':
        color = 'rgb(0,204,255)'
        break;
      case 'ccwjq':
        color = 'rgb(145,43,213)'
        break;
      case 'gchzz':
        color = 'rgb(255,0,255)'
        break;
      case 'czcdyd':
        color = 'rgb(62,115,248)'
        break;
      default:
        color = 'red'
    }
    if (map && !isEmpty(geojsonPolygon)) {
      if (geojsonPolygon.type == "FeatureCollection") {
        for (var i = 0; i < geojsonPolygon.features.length; i++) {
          serFeature(color, geojsonPolygon.features[i], lx, i)
        }
      } else {
        serFeature(color, geojsonPolygon, lx, "")
      }
      if (lx == 'bgtb') {
        var jso = []
        jso.push(geoAddjson['bgtb'])
        var featureGroup = L.featureGroup(jso);
        map.fitBounds(featureGroup.getBounds(), {
          maxZoom: 18
        });
      }
    }
  }

  function serFeature(color, geojsonPolygon, lx, index) {
    var type = geojsonPolygon.type;
    var properties = geojsonPolygon.properties;
    if (geojsonPolygon.geometry instanceof Array) {
      for (var i = 0; i < geojsonPolygon.geometry.length; i++) {
        var coordinates = geojsonPolygon.geometry[i].coordinates;
        var geometryType = geojsonPolygon.geometry[i].type;
        if (lx == "czcdyd") {
          geoJson2TdtPolygon(type, coordinates, geometryType, color, properties.CZCLX, lx + index);
        } else if (typeof properties.BHLX_ZX == "undefined") {
          geoJson2TdtPolygon(type, coordinates, geometryType, color, "", lx + index);
        } else {
          geoJson2TdtPolygon(type, coordinates, geometryType, color, properties.BHLX_ZX, lx + index);
        }
      }
    } else {
      var coordinates = geojsonPolygon.geometry.coordinates;
      var geometryType = geojsonPolygon.geometry.type;
      if (lx == "czcdyd") {
        geoJson2TdtPolygon(type, coordinates, geometryType, color, properties.CZCLX, lx + index);
      } else if (typeof properties.BHLX_ZX == "undefined") {
        geoJson2TdtPolygon(type, coordinates, geometryType, color, "", lx + index);
      } else {
        geoJson2TdtPolygon(type, coordinates, geometryType, color, properties.BHLX_ZX, lx + index);
      }
    }
  }

  function setBtn(geojsonPolygon) {
    if (typeof geojsonPolygon.ttq == "undefined") {
      app.showttqbtn = 0
    } else {
      app.showttqbtn = 1
    }

    if (typeof geojsonPolygon.gchzz == "undefined") {
      app.showgchzzqbtn = 0
    } else {
      app.showgchzzqbtn = 1
    }

    if (typeof geojsonPolygon.gfbq == "undefined") {
      app.showgfbqbtn = 0
    } else {
      app.showgfbqbtn = 1
    }

    if (typeof geojsonPolygon.ccwjq == "undefined") {
      app.showccwjqbtn = 0
    } else {
      app.showccwjqbtn = 1
    }
    if (typeof geojsonPolygon.czcdyd == "undefined") {
      app.showczcdydbtn = 0
    } else {
      app.showczcdydbtn = 1
    }
  }

  //geojson 绘制多边形
  function geoJson2TdtPolygon(type, coordinates, geometryType, color, bhlx, lx, msg) {
    if ('Polygon' == geometryType) {
      coordinates.forEach(function (i) {
        i.forEach(function (j) {
          if (j[0] >= 90) {
            j.reverse();
          }
        })
      });
    } else if ('MultiPolygon' == geometryType) {
      //复合图形
      coordinates.forEach(function (i) {
        i[0].forEach(function (j) {
          if (j[0] >= 90) {
            j.reverse();
          }
        })
      });
    }

    var msgs = "";
    if (lx.indexOf("czcdyd") > -1) {
      msgs = bhlx;

    } else {
      if (bhlx == "3") {
        msgs = "新 增"
        color = "blue"
      } else if (bhlx == "4") {
        msgs = "未 变"
        color = "yellow"
      } else if (bhlx == '0') {
        msgs = '灭 失'
        color = "#20201B"
      } else if (bhlx == 'dcy') {
        msgs = msg
        color = "#F052F7"
      }
    }



    drawPolygon = L.polygon(coordinates, {
      color: color,
      weight: 3,
      opacity: 0.7,
      fillColor: '',
      fillOpacity: 0
    }).addTo(map);

    if (geoAddjson[lx]) {
      delete geoAddjson[lx]
    }
    geoAddjson[lx] = drawPolygon;
    if (!isEmpty(bhlx) && lx != 'bgtb') {
      var markerIcon = L.divIcon({
        html: "<div style='background-color: #ffffff;width: fit-content;min-width:45px;height: 25px;line-height: 25px;font-size: 14px;text-align: center;'>" + msgs + "</div>",
        iconAnchor: [17, 10],
        className: ''
      });

      var marker = L.marker(drawPolygon.getCenter(), {
        icon: markerIcon
      }).addTo(map);

      if (bhlx !== 'dcy') {
        PopupArr.push(marker);
      } else {
        dcyPopupArr.push(marker)
      }

    }

  }

  var cshyjSelect, cjlyjSelect, pshyjSelect, pjlyjSelect, xjlyjSelect, selectData, selectArr = {};


  var app = new Vue({
    el: '.polyon-detail',
    data: function () {
      return {
        user: {},
        currentYx: '',
        currentImg: '',
        currentVideo: '',
        currentsml: '',
        ssyy: '',
        cssyy: '',
        yswz: true,
        yswzJWDList: [],
        yswzMarker: '',
        currentsmlfjName: '',
        currentsmlfj: '',
        bmheight: 0,
        xzqList: [],
        allImgList: [],
        allYxList: [],
        allVideoList: [],
        smList: [],
        tbid: id,
        bm: '',
        tbxx: {},
        showBhlx: false,
        bhlx: "",
        showXmxxCom: false,
        showIndex: 0,
        showLeftIndex: 0,
        bgtbTab: 0,
        ttqTab: 0,
        gchzzTab: 0,
        dcctTab: 0,
        gfbqTab: 0,
        showttqbtn: 0,
        showgchzzqbtn: 0,
        showdcctbtn: 0,
        showgfbqbtn: 0,
        showccwjqbtn: 0,
        ccwjqTab: 0,
        czcdydTab: 0,
        showczcdydbtn: 0,
        numPhoto: 0,
        numYx: 0,
        numSml: 0,
        numVideo: 0,
        base64Strs: [],
        fileName: [],
        fjUrl: "",
        tabList: [
          "图斑信息",
          "视频",
          "扫描件"
        ],
        showShxx: false,
        currentYxdeg: 0,
        currentPhotodeg: 0,
        currentSmjdeg: 0,
        forwardShow: false,
        saveShow: false,
        backShow: false,
        pendShow: false,
        ssShow: false,
        ssclShow: false,
        zdtbShow: false,
        revokeShow: false,
        lczfDto: {},
        jztbybh: '',
        lczt: '',
        jzzt: '',
        xzqdm: '',
        showXjljg: false,
        showCshjg: false,
        showCjljg: false,
        showCthjg: false,
        showPshjg: false,
        showPjljg: false,
        showPthjg: false,
        showPdcjg: false,
        showCcyjq: false,
        pdfShow: false,
        //监控右侧数据渲染完成
        watchPthjg: '',
        showFxdl: false,
        smBtnShow: false,
        jscodeList: [],
        hasXjlyjSelect: false,
        hasCshyjSelect: false,
        hasCjlyjSelect: false,
        hasPshyjSelect: false,
        hasPjlyjSelect: false,
        dkinfo: {},
        dkinfoList: [],
        bbxxShow: false
      }
    },
    mounted: function () {
      this.init();
      onLoad();
      this.hack();
    },
    methods: {

      // hacked by sgy
      hack: function () {
        // hacked by sgy 放到全局访问 20241223，使用window.postMessage通信
        let self = this;
        window.pshyjSelect = pshyjSelect;
        window.tbxx = self.tbxx;
        window.addEventListener('message', function (event) {
          if (event.data.type === 'ApproveMessage') {
            var value = event.data.SHYJ;
            debugger
            pshyjSelect.setValue(value);
            self.tbxx.pshjg = 1;
            self.tbxx.pshyj = value.map(item => item.mc).join(',');
            self.hackSave();
          }

          if (event.data.type === 'RejectMessage') {
            var value = event.data.SHYJ;
            pshyjSelect.setValue(value);
            self.tbxx.pshjg = 2;
            self.tbxx.pshyj = value.map(item => item.mc).join(',');
            self.hackSave();
          }
        });
      },
      hackSave: function () {
        let self = this;
        var param = {};
        param.id = self.tbxx.id;
        param.sfshxx = self.lczfDto.sfshxx;
        param.lczt = self.tbxx.lczt;
        param.zxlx = zxlx;
        debugger
        if (self.hasPshyjSelect) {
          param.pshjg = self.tbxx.pshjg;
          param.pshyj = self.tbxx.pshyj;
        }
        if (self.hasCshyjSelect) {
          param.cshjg = self.tbxx.cshjg;
          param.cshyj = self.tbxx.cshyj;
        }
        if (self.hasPjlyjSelect) {
          param.pjljg = self.tbxx.pjljg;
          param.pjlyj = self.tbxx.pjlyj;
        }
        if (self.hasCjlyjSelect) {
          param.cjljg = self.tbxx.cjljg;
          param.cjlyj = self.tbxx.cjlyj;
        }
        if (self.hasXjlyjSelect) {
          param.xjljg = self.tbxx.xjljg;
          param.xjlyj = self.tbxx.xjlyj;
        }


        postDataToServer("/tbxxModel/updateTbxx", param, function (res) {
          if (res.head && res.head.code == "0000") {
            layer.msg('提交成功', {
              icon: 1,
              time: 2000
            });
          } else {
            var msg = "";
            if ($.isArray(res.data.msg)) {
              $.each(res.data.msg, function (index, value) {
                if (value.bm) {
                  msg += "图斑" + value.bm + "：" + value.msg.toString() + ";";
                } else {
                  msg += value.msg.toString() + ";";
                }
              })
            } else {
              msg = res.data.msg;
            }
            layer.msg(msg, {
              icon: 2
            });
          }
        })
      },
      initBtnFalse: function () {
        //按钮重置，避免受上次结果的影响
        var self = this;
        /*important 清空页面信息 避免切换上下导致数据互串*/
        self.bm = '';
        self.tbxx = {};
        $(".jdzt").css("display", "none");
        if (jzztSelect) {
          jzztSelect.setValue([])
        }
        $("#dlmcList").val("");
        $("#zzsxList").val("");
        form.render();
        if (map) {
          mapRemoveOverlay();
          for (var key in geoAddjson) {
            if (typeof geoAddjson[key] != "undefined") {
              map.removeLayer(geoAddjson[key]);
            }
          }
          if (PopupArr.length != 0) {
            for (var row in PopupArr) {
              map.removeLayer(PopupArr[row])
            }
          }
          if (dcyPopupArr.length != 0) {
            for (var row in dcyPopupArr) {
              map.removeLayer(dcyPopupArr[row])
            }
          }
        }
        self.showXmxxCom = false;
        self.showSbdlHtml = false;
        self.showIndex = 0;
        self.showLeftIndex = 0;
        self.numPhoto = 0;
        self.numYx = 0;
        self.numSml = 0;
        self.numVideo = 0;
        self.allVideoList = [];
        self.allImgList = [];
        self.allYxList = [];
        self.smList = [];
        self.lczfDto = {};
        self.jscodeList = [];
        self.lczt = '';
        self.jzzt = '';
        self.xzqdm = '';
        self.dkinfo = {};
        self.dkinfoList = [];

        self.forwardShow = false;
        self.saveShow = false;
        self.backShow = false;
        self.pendShow = false;
        self.revokeShow = false;
        self.ssShow = false;
        self.ssclShow = false;
        self.zdtbShow = false;
        self.showXjljg = false;
        self.showCshjg = false;
        self.showCjljg = false;
        self.showCthjg = false;
        self.showPshjg = false;
        self.showPjljg = false;
        self.showPthjg = false;
        self.showPdcjg = false;
        self.showFxdl = false;
        self.smBtnShow = false;
        self.pdfShow = false;
        self.hasXjlyjSelect = false;
        self.hasCshyjSelect = false;
        self.hasCjlyjSelect = false;
        self.hasPshyjSelect = false;
        self.hasPjlyjSelect = false;
        self.ttqTab = 0;
        self.gchzzTab = 0;
        self.gfbqTab = 0;
        self.showttqbtn = 0;
        self.showgchzzqbtn = 0;
        self.showgfbqbtn = 0;
        self.showccwjqbtn = 0;

        self.showdcctbtn = 0;
        self.dcctTab = 0;

        self.czcdydTab = 0;
        self.showczcdydbtn = 0;

        self.bbxxShow = false;
        self.showShxx = false;
      },

      init: function () {
        var self = this;
        self.showBhlx = false;
        self.initBtnFalse();
        self.initBtnShow();
        self.setMapHeight();
        self.queryTx();
        self.initFileUpload();
        form.render();
        self.tabelGridDown();
      },
      switchInit: function () {
        var self = this;
        self.initBtnFalse();
        self.initBtnShow();
        self.queryTx();
        //self.initFileUpload();
        form.render();
      },

      getArrayIndex: function (arr, obj) {
        var self = this;
        var i = arr.length;
        while (i--) {
          if (arr[i].id === obj) {
            return i;
          }
        }
        return -1;
      },
      lastPage: function () {
        var self = this;
        var thisNum = self.getArrayIndex(rows, self.tbid);
        if (thisNum > 0) {
          self.tbid = rows[thisNum - 1].id;
          self.switchInit();
        } else {
          layer.msg("已经是第一个了");
        }
      },
      nextPage: function () {
        var self = this;
        var thisNum = self.getArrayIndex(rows, self.tbid);
        if (thisNum + 1 < rows.length) {
          self.tbid = rows[thisNum + 1].id;
          self.switchInit();
        } else {
          layer.msg("已经是最后一个了");
        }
      },

      //一次性加载所有的
      mapSetOverLay: function (photoJd, photoWd, photoPsjd, index) {
        var self = this;
        if (map && markerLayers && photoJd && photoWd) {
          var myIcon = L.divIcon({
            html: "<img style='transform:rotate(" + photoPsjd + "deg); width: 65px;height: 65px;' src='../../static/images/36.png'></img>",
            bgPos: [photoWd, photoJd],
            iconAnchor: [30, 30],
            popupAnchor: [10, 10],
            index: index,
            className: ''
          });
          marker = new L.marker([photoWd, photoJd], {
            icon: myIcon
          });
          //标记点击事件
          marker.on("click", e => {
            mapRemoveOverlayOne();
            var key = e.target.options.icon.options.index;
            if (self.allImgList.length > 0) {
              self.numPhoto = key;
              self.currentImg = self.allImgList[key].src;
              mapSetOverLayOne(self.allImgList[key].jd, self.allImgList[key].wd, self.allImgList[key].psjd);
            }

          })
          markerLayers.push(marker);
          map.addLayer(marker);
        }
      },

      initBtnShow: function () {
        var self = this;
        //判定当前用户是否具有流程转发权限
        postDataToServer("/lcxxModel/getLczfDto", {
          "tbid": self.tbid,
          "zxlx": zxlx,
          "sysParam": sysParam
        }, function (res) {
          /*这里只对初始化 不可见的按钮，所有可见的按钮需要等图斑信息加载完毕才能显示，避免网速加载慢导致的快速点击*/
          if (res.head && res.head.code == "0000" && !isEmpty(res.data) && res.data.containTbxx == 'true') {
            self.lczfDto = res.data;
          } else {
            self.lczfDto = isEmpty(res.data) ? {} : res.data;
          }

          self.getUserInfo();
        }, function () {
          self.showXmxxCom = true;
        })
      },
      getUserInfo: function () {
        var self = this;
        getDataToServer('/userModel/getUserInfo?sysParam=' + sysParam, function (res) {
          self.user = res.data;
          //主要是 审核意见 权限的控制，先隐藏审核信息，避免误显；此处不涉及 操作转发按钮的权限
          if (self.user.dcjzRoleList) {
            $.each(self.user.dcjzRoleList, function (index, value) {
              if ((value.code == '0' || value.code)) {
                self.jscodeList.push(value.code);
              }

              if (res.data.jb == '0' && value.code == 'sszy') {
                self.jscodeList.push('6');
              }
              if (value.code == 'dataAdmin') {
                self.jscodeList.push('6');
              }
            });
            $("#xjljg input").addClass("pointer-none");
            $("#xjljg div").addClass("pointer-none");
            $("#xjljg").addClass("cursor");

            $("#cshjg input").addClass("pointer-none");
            $("#cshjg div").addClass("pointer-none");
            $("#cshjg").addClass("cursor");

            $("#cjljg input").addClass("pointer-none");
            $("#cjljg div").addClass("pointer-none");
            $("#cjljg").addClass("cursor");

            $("#cthjg input").addClass("pointer-none");
            $("#cthjg div").addClass("pointer-none");
            $("#cthjg").addClass("cursor");

            $("#pshjg input").addClass("pointer-none");
            $("#pshjg div").addClass("pointer-none");
            $("#pshjg").addClass("cursor");

            $("#pjljg input").addClass("pointer-none");
            $("#pjljg div").addClass("pointer-none");
            $("#pjljg").addClass("cursor");

            $("#pthjg input").addClass("pointer-none");
            $("#pthjg div").addClass("pointer-none");
            $("#pthjg").addClass("cursor");

            //查看权限根据用户所拥有的角色来权限；但是编辑权限由图斑当前流程状态对应的流程角色权限控制
            if (self.jscodeList.indexOf('0') > -1 || self.jscodeList.indexOf('0A') > -1) {
              self.showCshjg = true;
              if (self.user.tpl == '3' || self.user.tpl == '4') {
                self.showXjljg = true;
              }

              self.watchPthjg = '0';
              // self.showPshjg = true;
            } else if (self.jscodeList.indexOf('1') > -1 || self.jscodeList.indexOf('2') > -1 || self.jscodeList.indexOf('3') > -1 || self.jscodeList.indexOf('4') > -1 || self.jscodeList.indexOf('5') > -1) {
              self.showCshjg = true;
              if (self.user.tpl == '2') {
                self.showCjljg = true;
              }
              // self.showPshjg = true;
              self.watchPthjg = '1';
            } else if (self.jscodeList.indexOf('6') > -1 || self.jscodeList.indexOf('7') > -1 || self.jscodeList.indexOf('8') > -1 || self.jscodeList.indexOf('9') > -1 || self.jscodeList.indexOf('10') > -1) {
              self.showCshjg = true;
              self.showCjljg = false;
              self.showPshjg = true;
              self.showPjljg = true;
              self.showPthjg = true;

              if (dataparam == 'dcth') {
                self.showPdcjg = true;
              }

              self.watchPthjg = '2';
              if (self.tabList.indexOf("审核信息") === -1) {
                self.tabList.push("审核信息");
              }
              self.showShxx = true;
            }

            if (self.lczfDto.jsid == "7" && self.lczfDto.nextjsid == '9') { //省作业组长可編輯省审核结果
              $("#pshjg input").removeClass("pointer-none");
              $("#pshjg div").removeClass("pointer-none");
              $("#pshjg").removeClass("cursor");
              self.hasPshyjSelect = true;
            }


            if (self.lczfDto.sfshxx == '1' && self.lczfDto.containTbxx == 'true') {
              if (self.lczfDto.jsid == '0A') {
                $("#xjljg input").removeClass("pointer-none");
                $("#xjljg div").removeClass("pointer-none");
                $("#xjljg").removeClass("cursor");
                self.hasXjlyjSelect = true;
              } else if (self.lczfDto.jsid == '1' || self.lczfDto.jsid == '2') {
                $("#cshjg input").removeClass("pointer-none");
                $("#cshjg div").removeClass("pointer-none");
                $("#cshjg").removeClass("cursor");
                self.hasCshyjSelect = true;
              } else if (self.lczfDto.jsid == '4') {
                $("#cjljg input").removeClass("pointer-none");
                $("#cjljg div").removeClass("pointer-none");
                $("#cjljg").removeClass("cursor");
                self.hasCjlyjSelect = true;
              } else if (self.lczfDto.jsid == '6' || self.lczfDto.jsid == '8') {
                $("#pshjg input").removeClass("pointer-none");
                $("#pshjg div").removeClass("pointer-none");
                $("#pshjg").removeClass("cursor");
                self.hasPshyjSelect = true;
              } else if (self.lczfDto.jsid == '10') {
                $("#pjljg input").removeClass("pointer-none");
                $("#pjljg div").removeClass("pointer-none");
                $("#pjljg").removeClass("cursor");
                self.hasPjlyjSelect = true;
              }
            }

          }

          self.getTbxx();

          //先获取用户信息再获取审核信息
          if (self.showShxx) {
            self.getLsShxx();
          }

        })

      },

      //获取
      getTbxx: function () {
        var self = this;
        // 根据传参xmid获取一整条信息
        var qxParam = {
          "id": self.tbid,
          "zxlx": zxlx,
          "dataparam": dataparam
        };
        postDataToServer("/tbxxModel/queryTbxx", qxParam, function (res) {
          if (res && !isEmpty(res.data)) {
            jd = res.data[0].jd;
            wd = res.data[0].wd;
            self.ssyy = res.data[0].ssyy;
            self.cssyy = res.data[0].cssyy;
            self.tbxx = res.data[0];
            self.tbxx.bbshjg = '';
            self.tbxx.bbshyj = '';
            if (self.tbxx.tbdlmj) {
              self.tbxx.tbdlmjzh = self.tbxx.tbdlmj + '(' + (0.0015 * self.tbxx.tbdlmj).toFixed(2) + "亩）"
            }
            self.tbxx.bgqdl_bgqzzsx = self.tbxx.bgqdl + "/" + self.tbxx.bgqzzsx;

            // if (self.tbxx.ljbzdm) {
            //     if (self.tbxx.ljbzdm == '0') {
            //         self.tbxx.ljbzms = '承诺耕地举证'
            //     } else if (self.tbxx.ljbzdm == '1') {
            //         self.tbxx.ljbzms = '无法到达'
            //     } else if (self.tbxx.ljbzdm == '2') {
            //         self.tbxx.ljbzms = '按规程无需举证'
            //     } else {
            //         self.tbxx.ljbzms = ''
            //     }
            // } else {
            //     self.tbxx.ljbzms = ''
            // }

            self.bm = res.data[0].bm;
            self.jztbybh = res.data[0].jztbybh;
            self.xzqdm = res.data[0].xzqdm;
            self.lczt = res.data[0].lczt;
            self.jzzt = res.data[0].jzzt;

            //查询附件
            self.getTBXXFj();

            //报部图斑列表查询 报部结果
            if (dataparam == 'bbtb') {
              self.getBbtbxx();
            }

            //渲染字典表
            if (isEmpty(dlmcList)) {
              postDataToServer('/zdModel/getZdByName', {
                dictName: "s_zd_dldm",
                yjlyc: "yc"
              }, function (res) {
                dlmcList = res.data;
                self.initDlmc();
              });
            } else {
              self.initDlmc();
            }

            if (isEmpty(zzsxList)) {
              postDataToServer('/zdModel/getZdByName', {
                dictName: "s_zd_zzsxdm"
              }, function (res) {
                zzsxList = res.data;
                self.initZzsx();
              });
            } else {
              self.initZzsx();
            }


            if (!isEmpty(self.tbxx.dlyt)) {
              $("#dlyt").attr("title", self.tbxx.dlyt)
            }

            //
            // if (self.tbxx.bhlx == "0") {
            //     self.bhlx = "灭失";
            // } else {
            //     self.bhlx = "变化";
            // }


            if (self.lczt != '0' || isEmpty(self.lczfDto) || self.lczfDto.jsid != '0') {
              $('.bz').addClass('layui-disabled');
              $('.bz').prop('disabled', true);
            } else {
              $('.bz').removeClass('layui-disabled');
              $('.bz').prop('disabled', false);
            }

            /*此处也是审核意见的权限细控制*/
            if (self.jscodeList.indexOf('9') > -1 && self.lczt == '15') {
              $("#pjljg input").removeClass("pointer-none");
              $("#pjljg div").removeClass("pointer-none");
              $("#pjljg").removeClass("cursor");
              self.hasPjlyjSelect = true;
            }

            //县、市级只有 项目办结或被省退回到市/县级后才能查看省审核意见
            if (self.jscodeList.indexOf('0') > -1 || self.jscodeList.indexOf('1') > -1 || self.jscodeList.indexOf('2') > -1 || self.jscodeList.indexOf('3') > -1 || self.jscodeList.indexOf('4') > -1 || self.jscodeList.indexOf('5') > -1) {
              if (self.tbxx.jzzt === '3' || self.tbxx.jzzt === '4' || self.tbxx.jzzt === '5' || ((self.tbxx.jzzt === '1' || self.tbxx.jzzt === '0') && self.tbxx.thdw.indexOf('6') > -1)) {
                self.showPshjg = true;
              } else {
                self.showPshjg = false;
              }
              if (self.jscodeList.indexOf('0') > -1) {
                self.watchPthjg = '0';
              } else {
                self.watchPthjg = '1';
              }
            }


            if (self.user.tpl == "1" || self.user.tpl == "2") {
              if (self.tbxx.cthjg == '' || self.tbxx.cthjg == null || self.tbxx.cthjg == '0') {
                self.showCthjg = false;
                self.watchPthjg = '1';
              } else if (self.jscodeList.indexOf('0') == -1) {
                self.showCthjg = true;
                self.watchPthjg = '3';
              }
            } else {
              self.showCthjg = false;
              self.watchPthjg = '1';
            }


            if (self.tbxx.pthjg == '' || self.tbxx.pthjg == null || self.tbxx.pthjg == '0') {
              self.showPthjg = false;
              self.watchPthjg = '4';
            } else {
              if (self.jscodeList.indexOf('6') > -1 || self.jscodeList.indexOf('7') > -1 || self.jscodeList.indexOf('8') > -1 || self.jscodeList.indexOf('9') > -1 || self.jscodeList.indexOf('10') > -1) {
                self.showPthjg = true;
                self.watchPthjg = '2';
              }
            }


            //非回头看退回图斑，隐藏 回头看意见
            if (self.tbxx.sfhtkth != '1') {
              self.showPdcjg = false;
            }

            debugger
            var boo = false;
            if (self.lczfDto.sfshxx == '1' && self.lczfDto.containTbxx == 'true') {
              if (self.lczfDto.jsid == '0A' && (self.tbxx.xjljg == '0' || self.tbxx.xjljg == '' || self.tbxx.xjljg == null)) {
                self.tbxx.xjljg = '1';
                self.tbxx.xjlyj = '审核通过';
                boo = true;
              } else if ((self.lczfDto.jsid == '1' || self.lczfDto.jsid == '2') && (self.tbxx.cshjg == '0' || self.tbxx.cshjg == '' || self.tbxx.cshjg == null)) {
                self.tbxx.cshjg = '1';
                self.tbxx.cshyj = '审核通过';
                boo = true;
              } else if (self.lczfDto.jsid == '4' && (self.tbxx.cjljg == '0' || self.tbxx.cjljg == '' || self.tbxx.cjljg == null)) {
                self.tbxx.cjljg = '1';
                self.tbxx.cjlyj = '审核通过';
                boo = true;
              } else if (self.lczfDto.jsid == '6' || self.lczfDto.jsid == '8' && (self.tbxx.pshjg == '0' || self.tbxx.pshjg == '' || self.tbxx.pshjg == null)) {
                self.tbxx.pshjg = '1';
                self.tbxx.pshyj = '审核通过';
                boo = true;
              } else if (self.lczfDto.jsid == '10' && (self.tbxx.pjljg == '0' || self.tbxx.pjljg == '' || self.tbxx.pjljg == null)) {
                self.tbxx.pjljg = '1';
                self.tbxx.pjlyj = '审核通过';
                boo = true;
              }
            }
            if (boo) {
              var param = {};
              param.id = self.tbxx.id;
              param.sfshxx = self.lczfDto.sfshxx;
              param.lczt = self.tbxx.lczt;
              param.zxlx = zxlx;
              debugger
              if (self.hasPshyjSelect) {
                param.pshjg = self.tbxx.pshjg;
                param.pshyj = self.tbxx.pshyj;
              }
              if (self.hasCshyjSelect) {
                param.cshjg = self.tbxx.cshjg;
                param.cshyj = self.tbxx.cshyj;
              }
              if (self.hasPjlyjSelect) {
                param.pjljg = self.tbxx.pjljg;
                param.pjlyj = self.tbxx.pjlyj;
              }
              if (self.hasCjlyjSelect) {
                param.cjljg = self.tbxx.cjljg;
                param.cjlyj = self.tbxx.cjlyj;
              }
              if (self.hasXjlyjSelect) {
                param.xjljg = self.tbxx.xjljg;
                param.xjlyj = self.tbxx.xjlyj;
              }


              postDataToServer("/tbxxModel/updateTbxx", param, function (res) {
                if (res.head && res.head.code == "0000") {
                  layer.msg('提交成功', {
                    icon: 1,
                    time: 2000
                  });
                } else {
                  var msg = "";
                  if ($.isArray(res.data.msg)) {
                    $.each(res.data.msg, function (index, value) {
                      if (value.bm) {
                        msg += "图斑" + value.bm + "：" + value.msg.toString() + ";";
                      } else {
                        msg += value.msg.toString() + ";";
                      }
                    })
                  } else {
                    msg = res.data.msg;
                  }
                  layer.msg(msg, {
                    icon: 2
                  });
                }
              })
            }
            //渲染意见信息
            self.refreshYjxx();

            //最后再显示 操作按钮
            self.controlBtn();
            //最后控制图斑已阅

            if (self.user.jb == '2' || self.user.jb == '1') {
              postDataToServer('/tbxxModel/queryKzfXzq', {
                "zxlx": zxlx,
                "xzqdm": self.user.xzqdm
              }, function (xzqData) {
                self.xzqList = xzqData.data;
                var xzq = self.xzqList.filter(o => o.xzqdm == self.user.xzqdm);
                if (xzq.length !== 0) {
                  self.forwardShow = self.forwardShow ? true : false;
                  // self.backShow = self.backShow ? true : false;
                  self.revokeShow = self.revokeShow ? true : false;
                  self.ssShow = self.ssShow ? true : false;
                  self.ssclShow = self.ssclShow ? true : false;
                } else {
                  self.forwardShow = false;
                  // self.backShow = false;
                  self.revokeShow = false;
                  self.ssShow = false;
                  self.ssclShow = false;
                }
              })
            }

            self.looked();
          } else {
            self.showXmxxCom = true;
          }

        })
      },

      //转发等操作按钮集体控制
      controlBtn: function () {
        var self = this;
        if (!isEmpty(self.lczfDto) && self.lczfDto.containTbxx == 'true') {
          /*原 getLczfDto 下按钮控制部分*/
          if (!isEmpty(self.lczfDto.nextlczt) && $.inArray(self.lczfDto.jsid, ["0", "0A", "1", "2", "4", "6", "7", "8", "9", "10"]) > -1) {
            self.forwardShow = true;
            if (dataparam != 'all' && dataparam != 'sslb') {
              self.pendShow = true;
            }
            if (dataparam == 'th' && self.lczfDto.jsid == '1' && !isEmpty(self.lczfDto.sfss) && self.lczfDto.sfss != '0') {
              self.pendShow = false;
            }
            if (dataparam == 'th' && self.lczfDto.jsid == '0' && !isEmpty(self.lczfDto.csfss) && self.lczfDto.csfss != '0') {
              self.pendShow = false;
            }
          } else {
            self.forwardShow = false;
            self.saveShow = false;
            self.pendShow = false;
            self.ssclShow = false;
            self.ssShow = false;
            self.revokeShow = false;
          }

          if (self.tbxx.showzdtb) {
            self.zdtbShow = true;
          } else {
            self.zdtbShow = false;
          }

          if (!isEmpty(self.lczfDto.backlczt)) {
            self.backShow = true;
          } else {
            self.backShow = false;
          }

          if (self.lczfDto.lczt == '0' || self.lczfDto.lczt == '15' || self.lczfDto.sfshxx == '1' || self.lczfDto.lczt == '12') {
            self.saveShow = true;
          }

          /*原tbxx 下按钮控制部分*/
          if (self.lczt == '0' && self.lczfDto.jsid == '0') {
            self.smBtnShow = true;
          }


          //市级管理员申诉按钮显示控制
          if (dataparam == 'th' && self.lczfDto.jsid == '1' && self.tbxx.bcthdw == '6' && (isEmpty(self.tbxx.sfss) || self.tbxx.sfss == '0')) {
            self.ssShow = true
          } else if (dataparam == 'th' && self.lczfDto.jsid == '0' && self.tbxx.bcthdw == '1' && (isEmpty(self.tbxx.csfss) || self.tbxx.csfss == '0')) {
            self.ssShow = true
          } else {
            self.ssShow = false
          }

        } else {
          self.forwardShow = false;
          self.backShow = false;
          self.saveShow = false;
          self.pendShow = false;
          self.ssclShow = false;
          self.ssShow = false;
          self.revokeShow = false;
          self.zdtbShow = false;
        }


        /*撤回、申诉处理 功能按钮权限不在当前用户下，需要单独处理*/
        //撤回按钮显示
        //tpl0  0-8 8-9
        //tpl1 0-1 8-9
        //tpl2 0-1 8-9
        //tpl3/tpl4 县级不允许撤回
        if (dataparam == 'all' && self.tbxx && self.tbxx.looked != '1') {
          if (self.jscodeList.indexOf('0') > -1) {
            if (self.user.tpl == "0" && self.lczt == '8') {
              self.revokeShow = true;
            } else if ((self.user.tpl == "1" || self.user.tpl == "2") && self.lczt == '1') {
              self.revokeShow = true;
            } else {
              self.revokeShow = false;
            }
          } else if (self.jscodeList.indexOf('1') > -1) {
            if (self.lczt == '9') {
              self.revokeShow = true;
            } else {
              self.revokeShow = false;
            }
          }

        }


        if (dataparam == 'ss' && self.jscodeList.indexOf('6') > -1) {
          self.pdfShow = true;
        }


        //省级管理员申诉处理列表 申诉处理按钮显示控制
        if (dataparam == 'ss' && self.tbxx.sfss == '1' && (isEmpty(self.tbxx.ssjg) || self.tbxx.ssjg == '0')) {
          self.ssclShow = true
        } else if (dataparam == 'ss' && self.tbxx.csfss == '1' && (isEmpty(self.tbxx.cssjg) || self.tbxx.cssjg == '0')) {
          self.ssclShow = true
        } else {
          self.ssclShow = false
        }


        //申诉处理待不通过的案件 无待定按钮
        if (dataparam == 'ss' && ((self.tbxx.lczt == '8' && (self.tbxx.ssjg == null || self.tbxx.ssjg == '' || self.tbxx.ssjg == '0')) ||
            (self.tbxx.lczt == '0' && (self.tbxx.cssjg == null || self.tbxx.cssjg == '' || self.tbxx.cssjg == '0')))) {
          self.pendShow = true;
        }


        if (dataparam == 'xqxx' || dataparam == 'sth' || dataparam == 'bbtb') { //详情信息隐藏所有按钮
          self.forwardShow = false;
          self.backShow = false;
          self.saveShow = false;
          self.pendShow = false;
          self.ssclShow = false;
          self.ssShow = false;
          self.smBtnShow = false;
          self.revokeShow = false;
          self.zdtbShow = false;

          if (dataparam == 'sth') {
            if (self.tbxx.showzdtb) {
              self.zdtbShow = true;
            } else {
              self.zdtbShow = false;
            }
          }

        }
      },
      initDlmc: function () {
        var self = this;
        var html = "";
        html += "<option value=''></option>";
        for (var i = 0; i < dlmcList.length; i++) {
          if (dlmcList[i].dm == self.tbxx.dlbm) {
            html += "<option value='" + dlmcList[i].dm + "' selected>" + dlmcList[i].mc + "</option>"
          } else {
            html += "<option value='" + dlmcList[i].dm + "'>" + dlmcList[i].mc + "</option>"
          }
          $("#dlmcList").html(html);
        }
        form.render('select', 'dlmcList')
      },
      initZzsx: function () {
        var self = this;
        var html = "";
        html += "<option value=''></option>";
        for (var i = 0; i < zzsxList.length; i++) {
          if (zzsxList[i].dm == self.tbxx.zzsxdm) {
            html += "<option value='" + zzsxList[i].dm + "' selected>" + zzsxList[i].mc + "</option>"
          } else {
            html += "<option value='" + zzsxList[i].dm + "'>" + zzsxList[i].mc + "</option>"
          }
          $("#zzsxList").html(html);
        }
        form.render('select', 'zzsxList')
      },
      initShyjInput: function (id, data) {
        var self = this;
        var selectModel = xmSelect.render({
          el: '#' + id,
          name: id,
          language: 'zn',
          toolbar: {
            show: true
          },
          filterable: true,
          autoRow: true,
          direction: 'auto',
          theme: {
            color: '#1E9FFF'
          },
          prop: {
            name: 'mc',
            value: 'dm'
          },
          model: {
            label: {
              type: 'block',
              block: {
                //最大显示数量, 0:不限制
                showCount: 0,
                //是否显示删除图标
                showIcon: true,
              }
            }
          },
          create: function (val, arr) {
            //返回一个创建成功的对象, val是搜索的数据, arr是搜索后的当前页面数据
            return {
              mc: val,
              dm: val
            }
          },
          data: data
        });
        return selectModel;
      },


      getBbtbxx: function () {
        var self = this;
        var param = {
          "tbid": self.tbid,
          "zxlx": zxlx,
          "dataparam": dataparam
        };
        postDataToServer("/tbxxModel/getBbtbxx", param, function (res) {
          if (res.head && res.head.code == "0000") {
            if (res.data) {
              var bbshjg = '';
              if (res.data[0].shjg == '1') {
                bbshjg = '已通过'
              } else if (res.data[0].shjg == '2') {
                bbshjg = '未通过'
              } else {
                bbshjg = '未审核'
              }
              self.bbxxShow = true;
              self.tbxx.bbshjg = bbshjg;
              self.tbxx.bbshyj = res.data[0].shyj;
            }

          } else {
            layer.msg('提交失败', {
              icon: 2
            });
          }
        })
      },
      looked: function () {
        var self = this;
        if (self.lczfDto && self.tbxx && self.tbxx.looked != '1') {
          //市级管理员和省级管理 员查看的时候才更新
          if ((self.jscodeList.indexOf('1') > -1 && ((self.user.tpl == "0" && self.lczt == '8') || (self.user.tpl != "0" && self.lczt == '1'))) ||
            (self.jscodeList.indexOf('6') > -1 && self.lczt == '9')) {

            var tbxxSub = self.tbxx;
            tbxxSub.looked = "1";
            tbxxSub.zxlx = zxlx;
            postDataToServer("/tbxxModel/updateTbxxLooked", tbxxSub, function (res) {
              if (res.head && res.head.code == "0000") {
                // layer.msg('提交成功', {icon: 1, time: 2000});
              } else {
                layer.msg('提交失败', {
                  icon: 2
                });
              }
            })
          }
        }
      },
      queryTx: function () {
        var self = this;
        PopupArr = [];
        dcyPopupArr = [];
        geoAddjson = {};
        self.showttqbtn = 0;
        self.showgchzzqbtn = 0;
        self.showccwjqbtn = 0;
        self.showgfbqbtn = 0;
        self.showczcdydbtn = 0;

        postDataToServer("/tbxxModel/queryJztbTxNdbg", {
          tbid: self.tbid
        }, function (res) {
          if (res.data && !isEmpty(res.data)) {
            var geojsonPolygon = JSON.parse(res.data);
            geoJson = geojsonPolygon;
            if (!isEmpty(geojsonPolygon) && geojsonPolygon.bgtb && geojsonPolygon.bgtb[0].tx) {
              setBtn(geojsonPolygon);
              mapSetViewport(JSON.parse(geojsonPolygon.bgtb[0].tx), "bgtb");
            }
          }
        })
      },
      getLsShxx: function () {
        var self = this;
        table.render({
          id: 'shInfoTable',
          elem: '#shInfoTable',
          url: getIp() + '/tbxxModel/getLsShxxByPage',
          where: {
            "tbid": self.tbid,
            "zxlx": zxlx
          },
          cols: [
            [{
                type: 'numbers'
              },
              {
                field: 'id',
                title: 'id',
                hide: true
              },
              {
                field: 'shrymc',
                title: '审核人',
                align: 'center',
                width: "18%"
                // , templet: function (d) {
                //     if (dataparam == 'xqxx') {//详情信息审核人全部显示
                //         return d.shrymc;
                //     }
                //     var shlx = "";
                //     if (typeof d.shlx != "undefined") {
                //         shlx = d.shlx;
                //     }
                //     var res;
                //     if (self.jscodeList.indexOf('0') > -1) {//县级人员
                //         if (parseInt(d.dqlczt) == 0) {
                //             res = d.shrymc
                //         } else {
                //             res = "*****";
                //         }
                //         if (shlx.indexOf("市级") != -1) {//申诉
                //             res = "*****";
                //         }
                //
                //     }
                //     //市级人员
                //     if (self.jscodeList.indexOf('1') > -1 || self.jscodeList.indexOf('2') > -1 || self.jscodeList.indexOf('4') > -1) {
                //         if (parseInt(d.dqlczt) < 9 && parseInt(d.dqlczt) > 0) {
                //             res = d.shrymc;
                //         } else {
                //             res = "*****";
                //         }
                //         if (shlx.indexOf("市级") != -1) {
                //             res = d.shrymc;
                //         }
                //         if (shlx.indexOf("省级") != -1) {
                //             res = "*****";
                //         }
                //     }
                //     //省级人员
                //     if (self.jscodeList.indexOf('6') > -1 || self.jscodeList.indexOf('7') > -1 || self.jscodeList.indexOf('8') > -1 || self.jscodeList.indexOf('9') > -1 || self.jscodeList.indexOf('10') > -1) {
                //         if (parseInt(d.dqlczt) >= 9) {
                //             res = d.shrymc
                //         } else {
                //             res = "*****";
                //         }
                //         if (shlx.indexOf("省级") != -1) {
                //             res = d.shrymc;
                //         }
                //     }
                //     return res;
                //
                // }
              },
              {
                field: 'shlx',
                title: '流程状态',
                align: 'center',
                width: "14%"
              },
              {
                field: 'shjg',
                title: '审核结果',
                align: 'center',
                width: "12%"
              },
              {
                field: 'shsj',
                title: '审核时间',
                align: 'center',
                width: "18%"
              },
              {
                field: 'shyj',
                title: '审核意见',
                align: 'center',
                minWidth: 200
              }
            ]
          ],
          page: {
            theme: '#1E9FFF'
          },
          limit: 10,
          limits: [10, 20, 40],
          request: {
            limitName: 'size',
            pageName: 'page'
          },
          response: {
            dataName: 'rows' //规定数据列表的字段名称，默认：data
              ,
            countName: "records"
          }
        });
      },
      //右侧切换信息
      tabContent: function (index) {
        this.showIndex = index;
        // this.leftTabContent(0);
        // if(index == 0){
        //     this.setPmheight();
        // }
      },
      //左侧切换信息
      leftTabContent: function (index) {
        this.showLeftIndex = index;
      },
      txClick: function (type) {
        var self = this;
        for (var key in geoAddjson) {
          if (!key.startsWith('bgtb') && !key.startsWith('dcy')) {
            if (typeof geoAddjson[key] != "undefined") {
              map.removeLayer(geoAddjson[key]);
              delete geoAddjson[key];
            }
          }
        }
        if (PopupArr.length != 0) {
          for (var row in PopupArr) {
            map.removeLayer(PopupArr[row])
            delete PopupArr[row]
          }
        }
        if (type == "ttq") {
          if (self.ttqTab == 0) {
            self.ttqTab = 1;
            self.gfbqTab = 0;
            self.ccwjqTab = 0;
            self.gchzzTab = 0;
            self.czcdydTab = 0;
            mapSetViewport(JSON.parse(geoJson[type][0].tx), type);
          } else {
            self.ttqTab = 0;
          }
        }
        if (type == "gchzz") {
          if (self.gchzzTab == 0) {
            self.gchzzTab = 1;
            self.ttqTab = 0;
            self.gfbqTab = 0;
            self.ccwjqTab = 0;
            self.czcdydTab = 0;
            mapSetViewport(JSON.parse(geoJson[type][0].tx), type);
          } else {
            self.gchzzTab = 0;
          }
        }
        if (type == "gfbq") {
          if (self.gfbqTab == 0) {
            self.gfbqTab = 1;
            self.ttqTab = 0;
            self.ccwjqTab = 0;
            self.gchzzTab = 0;
            self.czcdydTab = 0;
            mapSetViewport(JSON.parse(geoJson[type][0].tx), type);
          } else {
            self.gfbqTab = 0;
          }
        }
        if (type == "ccwjq") {
          if (self.ccwjqTab == 0) {
            self.ccwjqTab = 1;
            self.ttqTab = 0;
            self.gfbqTab = 0;
            self.gchzzTab = 0;
            self.czcdydTab = 0;
            mapSetViewport(JSON.parse(geoJson[type][0].tx), type);

          } else {
            self.ccwjqTab = 0;
          }
        }
        if (type == "czcdyd") {
          if (self.czcdydTab == 0) {
            self.ccwjqTab = 0;
            self.ttqTab = 0;
            self.gfbqTab = 0;
            self.gchzzTab = 0;
            self.czcdydTab = 1;
            mapSetViewport(JSON.parse(geoJson[type][0].tx), type);

          } else {
            self.czcdydTab = 0;
          }
        }
      },

      //获取图斑附件信息
      getTBXXFj: function () {
        var self = this;
        this.currentPhotodeg = 0;
        var numsml = self.numSml;
        var numPhoto = self.numPhoto;
        self.allVideoList = [];
        self.allImgList = [];
        self.allYxList = [];
        self.smList = [];
        //华为云获取附件接口
        postDataToServer("/tbxxModel/queryTbxxFj", {
          "tbid": self.tbid,
          "sysParam": sysParam,
          "zxlx": zxlx,
          "xmbh": self.jztbybh,
          "xzqdm": self.xzqdm
        }, function (res) {
          if (res.data) {
            if (res.data.code !== '0000') {
              layer.msg(res.data.msg, {
                icon: 2,
                time: 2000
              });
            }
            var data = res.data;
            if (data && !isEmpty(data['S'])) {
              self.smList = data['S'];
            }
            if (data && !isEmpty(data['J'])) {
              self.allImgList = data['J'];
            }
            if (data && !isEmpty(data['Y'])) {
              self.allYxList = data['Y'];
            }
            if (data && !isEmpty(data['V'])) {
              self.allVideoList = data['V'];
            }


            //涉耕或者新增建设用地图斑 才需要 挂接多选项、调查信息、草图范围图形
            if (self.tbxx.sfsg === '1' || self.tbxx.sfxzjsyd === '1') {
              if (data && !isEmpty(data['dkinfo'])) {
                self.dkinfoList = data.dkinfo;
                var dataSelect = []
                var selectId = []
                for (var i = 0; i < self.dkinfoList.length; i++) {
                  if (self.dkinfoList[i].dkmj) {
                    self.dkinfoList[i].dkmj = self.dkinfoList[i].dkmj + "亩"
                  }
                  if (self.dkinfoList[i].sfgjtb == "true") {
                    selectId.push(self.dkinfoList[i].dkid)
                  }

                  dataSelect.push({
                    dm: self.dkinfoList[i].dkid,
                    mc: self.dkinfoList[i].jcbh + "-" + self.dkinfoList[i].dkmc,
                    dkbh: self.dkinfoList[i].dkbh,
                    dkid: self.dkinfoList[i].dkid,
                    dkmc: self.dkinfoList[i].dkmc,
                    jcbh: self.dkinfoList[i].jcbh
                  })
                }

                if (self.lczfDto.jsid == '0' && self.lczt == '0') {
                  $(".jdzt").css("display", "");
                  jzztSelect = xmSelectRender("gjxx", dataSelect);
                  jzztSelect.setValue(selectId);
                } else {
                  $(".jdzt").css("display", "none");
                }
                $("#cdxx").find("li").eq(0).click()
                self.dkinfo = self.dkinfoList[0];
                if (self.dkinfo.tbfw) {
                  if (self.tbxx.sfsg === '1' || self.tbxx.sfxzjsyd === '1') {
                    addDcy(self.dkinfo.tbfw);
                  }
                }
                self.dcctTab = 1
                self.showdcctbtn = 1;

              }

            }


            self.setMapHeight();
            var url = data['httpUrl'];
            self.fjUrl = url;
            self.yswz = true;
            self.yswzJWDList = [];
            self.yswzMarker = '';

            if (self.allImgList.length > 0) {
              mapRemoveOverlay();
              self.allImgList.forEach(function (v, i) {
                v['src'] = v.fjlj; //华为云图片地址
                self.mapSetOverLay(v.jd, v.wd, v.psjd, i);
                self.yswzJWDList.push({
                  jd: v.ys_jd,
                  wd: v.ys_wd,
                  psjd: v.ys_psjd
                })
              });
              self.currentImg = self.allImgList[numPhoto].src;
              self.addMarker();
              // mapSetOverLayOne(self.allImgList[0].jd, self.allImgList[0].wd, self.allImgList[0].psjd);
            }
            if (self.allYxList.length > 0) {
              self.allYxList.forEach(function (v, i) {
                v['src'] = encodeURI(v.fjlj); //华为云图片地址
              });
              self.currentYx = self.allYxList[numPhoto].src;
            }
            if (self.smList.length > 0) {

              self.smList.forEach(function (v, i) {

                if (v.fjlj.indexOf("doc") != -1) {
                  v["isImgtype"] = true;
                  v['src'] = '../../static/images/showDoc.png';
                  v['srcFj'] = encodeURI(v.fjlj);
                  self.currentsmlfjName = self.smList[numsml].fjmc;
                  self.currentsmlfj = self.smList[numsml].srcFj;
                } else if (v.fjlj.indexOf("pdf") != -1) {
                  v["isImgtype"] = true;
                  v['src'] = '../../static/images/showPdf.png';
                  v['srcFj'] = encodeURI(v.fjlj);
                  self.currentsmlfjName = self.smList[numsml].fjmc;
                  self.currentsmlfj = self.smList[numsml].srcFj;
                } else {
                  v["isImgtype"] = false;
                  v['src'] = encodeURI(v.fjlj); //华为云图片地址
                }
              });
              self.currentsml = self.smList[numsml].src;
            }
            if (self.allVideoList.length > 0) {
              // mapRemoveOverlay();
              self.allVideoList.forEach(function (v, i) {
                v['src'] = encodeURI(v.fjlj); //华为云图片地址
                // self.mapSetOverLay(v.jd, v.wd, v.psjd, i);
              });
              self.currentVideo = self.allVideoList[numPhoto].src;
              // mapSetOverLayOne(self.allVideoList[0].jd, self.allVideoList[0].wd, self.allVideoList[0].psjd);
            }

          }

        })
      },

      ctClick: function () {
        var self = this;
        if (self.dcctTab == 0) {
          self.dcctTab = 1
          if (self.dkinfo.tbfw) {
            addDcy(self.dkinfo.tbfw);
          }
        } else {
          removeDcy();
          self.dcctTab = 0
        }
      },

      tabCt: function (index) {
        var self = this;
        if (self.dcctTab == 1) {
          self.dkinfo = self.dkinfoList[index]
          if (self.dkinfoList[index].tbfw) {
            addDcy(self.dkinfoList[index].tbfw);
          }
        }

      },

      //初始化照片上传
      initPhotoUpload: function () {
        var self = this;
        var uploadcom = upload.render({
          elem: '#phothPost' //绑定元素
            ,
          multiple: true,
          auto: false,
          size: 10240,
          accept: 'file',
          exts: 'jpg|png|jpeg',
          acceptMime: 'image/*',
          choose: function (obj) {
            var files = obj.pushFile();
            var _length = 0;
            for (var attr in files) {
              _length++;
            }
            obj.preview(function (index, file, result) {
              //这里还可以做一些 append 文件列表 DOM 的操作
              self.fileName.push(file.name);
              self.base64Strs.push(result);
              if (_length == self.base64Strs.length) {
                //华为云上传扫描件接口
                postDataToServer('/tbxxModel/uploadFj', {
                  "sysParam": sysParam,
                  "psry": self.user.username,
                  "tbid": self.tbid,
                  "base64Strs": self.base64Strs,
                  "fileName": self.fileName,
                  "fjlx": "J",
                  "zxlx": zxlx
                }, function (data) {
                  if (data.head && data.head.code == "0000") {
                    layer.msg("上传照片成功！");
                  } else {
                    layer.msg(data.head.msg, {
                      icon: 2
                    });
                  }
                  for (var attr in files) {
                    delete files[attr];
                  }
                  self.getTBXXFj();
                  uploadcom.config.elem.next()[0].value = '';
                })
                self.base64Strs = [];
                self.fileName = [];
              }
            });
          }
        });
      },
      //初始化附件上传
      initFileUpload: function () {
        var self = this;
        var uploadcom = upload.render({
          elem: '#scanPost' //绑定元素
            ,
          multiple: true,
          auto: false,
          size: 10240,
          accept: 'file',
          exts: 'jpg|png|jpeg|doc|docx|pdf',
          // acceptMime: 'image/*,pnf,doc,docx',
          choose: function (obj) {
            var files = obj.pushFile();
            var _length = 0;
            for (var attr in files) {
              _length++;
            }
            obj.preview(function (index, file, result) {
              //这里还可以做一些 append 文件列表 DOM 的操作
              self.fileName.push(file.name);
              self.base64Strs.push(result);
              if (_length == self.base64Strs.length) {
                //华为云上传扫描件接口
                postDataToServer('/tbxxModel/uploadFj', {
                  "sysParam": sysParam,
                  "psry": self.user.username,
                  "tbid": self.tbid,
                  "base64Strs": self.base64Strs,
                  "fileName": self.fileName,
                  "fjlx": "S",
                  "zxlx": zxlx
                }, function (data) {
                  if (data.head && data.head.code == "0000") {
                    layer.msg("上传扫描件成功！");
                  } else {
                    layer.msg(data.head.msg, {
                      icon: 2
                    });
                  }
                  for (var attr in files) {
                    delete files[attr];
                  }
                  self.getTBXXFj();
                  uploadcom.config.elem.next()[0].value = '';
                })
                self.base64Strs = [];
                self.fileName = [];

              }
            });
          }
        });
      },

      //下载照片
      downloadPhoto: function () {
        var self = this;
        window.open(getIp() + '/tbManageModel/downloadJzPhoto?jztbid=' + self.jztbid);
      },
      //删除照片
      deletePhoto: function () {
        var self = this;
        var id = '';

        if (!isEmpty(self.allImgList)) {
          // alert(0);
          id = self.allImgList[self.numPhoto].id;
        } else {
          layer.msg("暂无照片删除！"), {
            time: 1500
          }
          return;
        }
        layer.open({
          type: 1,
          id: 'scandelete',
          area: ['300px', '200px'],
          btnAlign: 'c',
          btn: ['确定删除', '取消']

            ,
          content: '<div class="scanDeleteSure"> 确定删除该照片?</div>',
          btn1: function (index) {
            layer.close(index);
            postDataToServer('/tbxxModel/deleteFj', {
              "sysParam": sysParam,
              'id': id,
              "zxlx": zxlx
            }, function (serverData) {
              layer.msg("删除成功", {
                time: 1500
              });
              if (self.numPhoto <= 0) {
                self.numPhoto = 0;
              } else {
                self.numPhoto--;
              }

              self.getTBXXFj();
            })
          },
          btn2: function (index) {
            layer.close(index);
          }
        });
      },
      //删除扫描件
      scanDelete: function () {
        var self = this;
        var id = '';
        if (!isEmpty(self.smList)) {
          // alert(0);
          id = self.smList[self.numSml].id;
        } else {
          layer.msg("暂无扫描件删除！"), {
            time: 1500

          }
          return
        }
        layer.open({
          type: 1,
          id: 'scandelete',
          area: ['300px', '200px'],
          btnAlign: 'c',
          btn: ['确定删除', '取消']

            ,
          content: '<div class="scanDeleteSure"> 确定删除扫描件?</div>',
          btn1: function (index) {
            layer.close(index);
            //华为云删除扫描件接口
            postDataToServer('/tbxxModel/deleteFj', {
              "sysParam": sysParam,
              'id': id,
              "zxlx": zxlx
            }, function (serverData) {
              layer.msg("删除成功", {
                time: 1500
              });
              if (self.numSml <= 0) {
                self.numSml = 0;
              } else {
                self.numSml--;
              }

              self.getTBXXFj();
            });
          },
          btn2: function (index) {
            layer.close(index);
          }
        });
      },
      checkYswz: function () {
        var self = this
        mapRemoveOverlayOne();
        self.addMarker();
      },
      addMarker: function () {
        var self = this
        // mapRemoveOverlayOne();
        if (self.yswz) {
          var jwd = self.yswzJWDList[this.numPhoto]
          map.panTo(new L.LatLng(jwd.wd, jwd.jd));
          mapSetOverLayOne(jwd.jd, jwd.wd, jwd.psjd);
        } else {
          map.panTo(new L.LatLng(this.allImgList[this.numPhoto].wd, this.allImgList[this.numPhoto].jd));
          mapSetOverLayOne(this.allImgList[this.numPhoto].jd, this.allImgList[this.numPhoto].wd, this.allImgList[this.numPhoto].psjd);
        }
      },

      //照片prev
      prevPhoto: function () {
        if (this.numPhoto > 0) {
          this.currentPhotodeg = 0;
          this.numPhoto--;
          this.currentImg = this.allImgList[this.numPhoto].src;
          mapRemoveOverlayOne();
          this.addMarker();
          // mapSetOverLayOne(this.allImgList[this.numPhoto].jd, this.allImgList[this.numPhoto].wd, this.allImgList[this.numPhoto].psjd);
        } else {
          this.numPhoto = this.allImgList.length - 1;
          this.currentImg = this.allImgList[this.numPhoto].src;
          mapRemoveOverlayOne();
          this.addMarker();
          // mapSetOverLayOne(this.allImgList[this.numPhoto].jd, this.allImgList[this.numPhoto].wd, this.allImgList[this.numPhoto].psjd);
        }
      },
      //照片next
      nextPhoto: function () {
        if (this.numPhoto < this.allImgList.length - 1) {
          this.currentPhotodeg = 0;
          this.numPhoto++;
          this.currentImg = this.allImgList[this.numPhoto].src;
          mapRemoveOverlayOne();
          this.addMarker();
          // mapSetOverLayOne(this.allImgList[this.numPhoto].jd, this.allImgList[this.numPhoto].wd, this.allImgList[this.numPhoto].psjd);

        } else {
          this.numPhoto = 0;
          this.currentImg = this.allImgList[this.numPhoto].src;
          mapRemoveOverlayOne();
          this.addMarker();
          // mapSetOverLayOne(this.allImgList[this.numPhoto].jd, this.allImgList[this.numPhoto].wd, this.allImgList[this.numPhoto].psjd);
        }
      },
      //照片双击
      expandImg: function () {
        var self = this
        layer.open({
          type: 1,
          title: ['照片', 'background-color: #177dee;font-size: 14px; color: #fff'],
          content: $("#imgCk").html(),
          offset: 'r',
          area: ['1200px', '850px'],
          resize: false,
          success: function (layers, index) {
            var appImg = new Vue({
              el: '.imgck',
              data: function () {
                return {
                  currentImg: self.currentImg,
                  allImgList: self.allImgList,
                  numPhoto: self.numPhoto,
                  currentPhotodeg: self.currentPhotodeg,
                  getPhotoTime: self.getPhotoTime,
                  getPhotopsjd: self.getPhotopsjd,
                  getPhotopjd: self.getPhotopjd,
                  getPhotopwd: self.getPhotopwd,
                  yswz: self.yswz,
                }
              },
              mounted: function () {},
              methods: {
                transformPhotoRight_img: function () {
                  this.currentPhotodeg += 90;
                  if (this.currentPhotodeg >= 360) {
                    this.currentPhotodeg = 0
                  }
                  self.currentPhotodeg = this.currentPhotodeg
                },
                transformPhotoLeft_img: function () {
                  this.currentPhotodeg -= 90;
                  if (this.currentPhotodeg <= -360) {
                    this.currentPhotodeg = 0
                  }
                  self.currentPhotodeg = this.currentPhotodeg
                },
                prevPhoto_img: function () {
                  if (this.numPhoto > 0) {
                    this.currentPhotodeg = 0;
                    this.numPhoto--;
                    this.currentImg = this.allImgList[this.numPhoto].src;
                    self.addMarker();
                    // mapRemoveOverlayOne();
                    // mapSetOverLayOne(this.allImgList[this.numPhoto].jd, this.allImgList[this.numPhoto].wd, this.allImgList[this.numPhoto].psjd);
                  } else {
                    this.numPhoto = this.allImgList.length - 1;
                    this.currentImg = this.allImgList[this.numPhoto].src;
                    self.addMarker();
                    // mapRemoveOverlayOne();
                    // mapSetOverLayOne(this.allImgList[this.numPhoto].jd, this.allImgList[this.numPhoto].wd, this.allImgList[this.numPhoto].psjd);
                  }
                  this.imgInfo();
                  self.currentPhotodeg = this.currentPhotodeg
                  self.numPhoto = this.numPhoto
                  self.currentImg = this.currentImg
                },
                nextPhoto_img: function () {
                  if (this.numPhoto < this.allImgList.length - 1) {
                    this.currentPhotodeg = 0;
                    this.numPhoto++;
                    this.currentImg = this.allImgList[this.numPhoto].src;
                    self.addMarker();
                    // mapRemoveOverlayOne();
                    // mapSetOverLayOne(this.allImgList[this.numPhoto].jd, this.allImgList[this.numPhoto].wd, this.allImgList[this.numPhoto].psjd);

                  } else {
                    this.numPhoto = 0;
                    this.currentImg = this.allImgList[this.numPhoto].src;
                    self.addMarker();
                    // mapRemoveOverlayOne();
                    // mapSetOverLayOne(this.allImgList[this.numPhoto].jd, this.allImgList[this.numPhoto].wd, this.allImgList[this.numPhoto].psjd);
                  }
                  this.imgInfo();
                  self.currentPhotodeg = this.currentPhotodeg
                  self.numPhoto = this.numPhoto
                  self.currentImg = this.currentImg
                },
                imgInfo: function () {
                  if (!isEmpty(this.allImgList[this.numPhoto]['pssj'])) {
                    this.getPhotoTime = this.allImgList[this.numPhoto]['pssj'];
                  } else {
                    this.getPhotoTime = "";
                  }
                  if (!isEmpty(this.allImgList[this.numPhoto]['psjd'])) {
                    this.getPhotopsjd = this.allImgList[this.numPhoto]['psjd'];
                  } else {
                    this.getPhotopsjd = "";
                  }
                  if (!isEmpty(this.allImgList[this.numPhoto]['jd'])) {
                    this.getPhotopjd = this.allImgList[this.numPhoto]['jd'];
                  } else {
                    this.getPhotopjd = "";
                  }
                  if (!isEmpty(this.allImgList[this.numPhoto]['wd'])) {
                    this.getPhotopwd = this.allImgList[this.numPhoto]['wd'];
                  } else {
                    this.getPhotopwd = "";
                  }
                },
                checkYswztc: function () {
                  mapRemoveOverlayOne();
                  self.yswz = this.yswz
                  self.addMarker();
                }
              },
              computed: {},
              watch: {},
              updated: function () {}
            });
          }
        })
      },
      //扫描件
      prevSmj: function () {
        if (this.numSml > 0) {
          this.currentSmjdeg = 0;
          this.numSml--;
          this.currentsml = this.smList[this.numSml].src;
          if (this.smList[this.numSml].hasOwnProperty("srcFj")) {
            this.currentsmlfj = this.smList[this.numSml].srcFj;
            this.currentsmlfjName = this.smList[this.numSml].fjmc;
          }
          $('.rotateArrow').css('transform', 'rotate(' + this.smList[this.numSml].psjd + 'deg)');
        } else {
          this.numSml = this.smList.length - 1;
          this.currentsml = this.smList[this.numSml].src;
          if (this.smList[this.numSml].hasOwnProperty("srcFj")) {
            this.currentsmlfj = this.smList[this.numSml].srcFj;
            this.currentsmlfjName = this.smList[this.numSml].fjmc;
          }
          $('.rotateArrow').css('transform', 'rotate(' + this.smList[this.numSml].psjd + 'deg)');
        }
      },
      nextSmj: function () {
        if (this.numSml < this.smList.length - 1) {
          this.currentSmjdeg = 0;
          this.numSml++;
          this.currentsml = this.smList[this.numSml].src;
          if (this.smList[this.numSml].hasOwnProperty("srcFj")) {
            this.currentsmlfj = this.smList[this.numSml].srcFj;
            this.currentsmlfjName = this.smList[this.numSml].fjmc;
          }
          $('.rotateArrow').css('transform', 'rotate(' + this.smList[this.numSml].psjd + 'deg)');
        } else {
          this.numSml = 0;
          this.currentsml = this.smList[this.numSml].src;
          if (this.smList[this.numSml].hasOwnProperty("srcFj")) {
            this.currentsmlfj = this.smList[this.numSml].srcFj;
            this.currentsmlfjName = this.smList[this.numSml].fjmc;
          }
          $('.rotateArrow').css('transform', 'rotate(' + this.smList[this.numSml].psjd + 'deg)');
        }
      },
      //影像prev
      prevYx: function () {
        if (this.numYx > 0) {
          this.currentYxdeg = 0;
          this.numYx--;
          this.currentYx = this.allYxList[this.numYx].src;
          $('.rotateArrow').css('transform', 'rotate(' + this.allYxList[this.numYx].psjd + 'deg)');
        } else {
          this.numYx = this.allYxList.length - 1;
          this.currentYx = this.allYxList[this.numYx].src;
          $('.rotateArrow').css('transform', 'rotate(' + this.allYxList[this.numYx].psjd + 'deg)');
        }
      },
      //影像next
      nextYx: function () {
        if (this.numYx < this.allYxList.length - 1) {
          this.currentYxdeg = 0;
          this.numYx++;
          this.currentYx = this.allYxList[this.numYx].src;
          $('.rotateArrow').css('transform', 'rotate(' + this.allYxList[this.numYx].psjd + 'deg)');

        } else {
          this.numYx = 0;
          this.currentYx = this.allYxList[this.numYx].src;
          $('.rotateArrow').css('transform', 'rotate(' + this.allYxList[this.numYx].psjd + 'deg)');
        }
      },
      //视频prev
      prevVideo: function () {
        if (this.numVideo > 0) {
          this.numVideo--;
          this.currentVideo = this.allVideoList[this.numVideo].src;
          // mapRemoveOverlayOne();
          // mapSetOverLayOne(this.allVideoList[this.numVideo].jd, this.allVideoList[this.numVideo].wd, this.allVideoList[this.numVideo].psjd);
        } else {
          this.numVideo = this.allVideoList.length - 1;
          this.currentVideo = this.allVideoList[this.numVideo].src;
          // mapRemoveOverlayOne();
          // mapSetOverLayOne(this.allVideoList[this.numVideo].jd, this.allVideoList[this.numVideo].wd, this.allVideoList[this.numVideo].psjd);
        }
      },
      //视频next
      nextVideo: function () {
        if (this.numVideo < this.allVideoList.length - 1) {
          this.numVideo++;
          this.currentVideo = this.allVideoList[this.numVideo].src;
          // mapRemoveOverlayOne();
          // mapSetOverLayOne(this.allVideoList[this.numVideo].jd, this.allVideoList[this.numVideo].wd, this.allVideoList[this.numVideo].psjd);

        } else {
          this.numVideo = 0;
          this.currentVideo = this.allVideoList[this.numVideo].src;
          // mapRemoveOverlayOne();
          // mapSetOverLayOne(this.allVideoList[this.numVideo].jd, this.allVideoList[this.numVideo].wd, this.allVideoList[this.numVideo].psjd);
        }
      },
      setMapHeight: function () {
        var self = this;
        this.bmheight = document.documentElement.clientHeight;
        var realHeight = parseInt(this.bmheight) - 60 + 'px';
        var itemInforHeight
        $('#ajustHeight').css("height", realHeight);
        if (self.dkinfoList.length > 0 && (self.tbxx.sfsg === '1' || self.tbxx.sfxzjsyd === '1')) {
          if ('3' != self.dkinfo.sdxz) {
            itemInforHeight = parseInt(this.bmheight) - 280 + 'px';
          } else {
            itemInforHeight = parseInt(this.bmheight) - 320 + 'px';
          }

        } else {
          itemInforHeight = parseInt(this.bmheight) - 108 + 'px';
        }
        $('.showHeight').css("height", itemInforHeight);
      },
      setPmheight: function () {
        this.bmheight = document.documentElement.clientHeight;

        var showHeightNext = parseInt(this.bmheight) - 143 + 'px';
        var filedWrapperScrollHeight = parseInt(this.bmheight) - 228 + 'px';

        var itemInforBox = parseInt($('.infobox').height());

        var itemInforHeightHalf = (parseInt(this.bmheight) - itemInforBox - 145) + 'px';
        var showHeightNextHalf = (parseInt(this.bmheight) - itemInforBox - 153) + 'px';

        // $('.itemInforBox').css("height", itemInforBox + 'px');
        $('.filedWrapperScroll').css("height", filedWrapperScrollHeight);
        $('.showHeightNext').css('height', showHeightNext);
        $('.noneImgWrapper').css('height', showHeightNext);
        $('.showHeightHalf').css("height", itemInforHeightHalf);
        $('.showHeightNextHalf').css('height', showHeightNextHalf);
        $('.noneImgWrapperHalf').css('height', showHeightNextHalf);

      },
      tabelGridDown: function () {
        // $('.filedWrapperScroll').on('mouseenter', 'td', function () {
        //     $(this).find('.layui-table-grid-down').remove();//隐藏
        // });
      },
      transformPhotoRight: function () {
        this.currentPhotodeg += 90;
        if (this.currentPhotodeg >= 360) {
          this.currentPhotodeg = 0
        }
      },
      transformPhotoLeft: function () {
        this.currentPhotodeg -= 90;
        if (this.currentPhotodeg <= -360) {
          this.currentPhotodeg = 0
        }
      },
      transformPostRight: function () {
        this.currentSmjdeg += 90;
        if (this.currentSmjdeg >= 360) {
          this.currentSmjdeg = 0
        }

      },
      transformPostLeft: function () {
        this.currentSmjdeg -= 90;
        if (this.currentSmjdeg <= -360) {
          this.currentSmjdeg = 0
        }

      },
      saveForward: function (booforward, booback) {
        var self = this;
        var param = {};
        param.id = self.tbxx.id;
        param.lczt = self.tbxx.lczt;
        param.sfshxx = self.lczfDto.sfshxx;
        param.zxlx = zxlx;
        //县级只保存 图斑信息，非县级只保存 审核信息
        if (self.lczt == '0' && self.lczfDto.jsid == '0') {
          // param.dlmc = $("#dlmcList option:selected").text();
          // param.dlbm = $("select[name='dlmcList']").val();
          // param.zzsxmc = $("#zzsxList option:selected").text();
          // param.zzsxdm = $("select[name='zzsxList']").val();
          // param.czcsxm = self.tbxx.czcsxm;
          // param.qsxz = self.tbxx.qsxz;
          // param.jztbybh = self.tbxx.jztbybh;
          param.bz = self.tbxx.bz;

          if (jzztSelect) {
            var dcxx = {
              tbid: self.tbxx.id,
              dcjzTbidDkidRelList: jzztSelect.getValue(),
              zxlx: zxlx
            }
            postDataToServer("/tbxxModel/saveDcxx", dcxx, function (res) {
              if (res.head && res.head.code == "0000") {} else {
                layer.msg('挂接失败', {
                  icon: 2,
                  time: 3000
                });
              }
            })
          }

        } else {

          if (self.hasPshyjSelect) {
            param.pshjg = self.tbxx.pshjg;
            param.pshyj = pshyjSelect.getValue("name").join(";");
          }
          if (self.hasCshyjSelect) {
            param.cshjg = self.tbxx.cshjg;
            param.cshyj = cshyjSelect.getValue("name").join(";");
          }
          if (self.hasPjlyjSelect) {
            param.pjljg = self.tbxx.pjljg;
            param.pjlyj = pjlyjSelect.getValue("name").join(";");
          }
          if (self.hasCjlyjSelect) {
            param.cjljg = self.tbxx.cjljg;
            param.cjlyj = cjlyjSelect.getValue("name").join(";");
          }
          if (self.hasXjlyjSelect) {
            param.xjljg = self.tbxx.xjljg;
            param.xjlyj = xjlyjSelect.getValue("name").join(";");
          }

        }


        postDataToServer("/tbxxModel/updateTbxx", param, function (res) {
          if (res.head && res.head.code == "0000") {
            if (booforward) {
              self.afterSaveForward();
            } else if (booback) {
              self.afterSaveBack();
            } else {
              layer.closeAll();
              self.getTbxx();
              layer.msg('提交成功', {
                icon: 1,
                time: 2000
              });
            }
          } else {
            var msg = "";
            if ($.isArray(res.data.msg)) {
              $.each(res.data.msg, function (index, value) {
                if (value.bm) {
                  msg += "图斑" + value.bm + "：" + value.msg.toString() + ";";
                } else {
                  msg += value.msg.toString() + ";";
                }
              })
            } else {
              msg = res.data.msg;
            }
            layer.msg(msg, {
              icon: 2
            });
          }
        })
      },
      btnForward: function () {
        if (isClicked) {
          layer.msg("请勿连续点击操作", {
            icon: 2
          });
          return false;
        } else {
          isClicked = true; // 设置已点击标志
          setTimeout(function () {
            isClicked = false; // 延时后重置标志，允许下一次点击
          }, delay);
        }
        var self = this;
        //如果需要填写审核信息，则先执行保存，再转发
        if (self.lczfDto.lczt == '0' || self.lczfDto.lczt == '15' || self.lczfDto.sfshxx == '1' || self.lczfDto.lczt == '12') {
          self.saveForward(true, false);
        } else {
          self.afterSaveForward();
        }
      },

      afterSaveForward: function () {
        var self = this;
        if ((self.tbxx.lczt == '0' && self.lczfDto.nextjsid == '1') || self.lczfDto.sfzdry == '0' || (self.lczfDto.jsid == '6' && self.lczfDto.nextjsid == '7')) {
          self.excuteForward({
            "lczfDto": self.lczfDto
          });
        } else {
          laytpl(forward.innerHTML).render({
            "sfzdry": self.lczfDto.sfzdry,
            "sfshxx": self.lczfDto.sfshxx,
            "hiddenshbtg": self.lczfDto.hiddenshbtg
          }, function (html) {
            var xmselect, radioData;
            layer.open({
              type: 1,
              title: ['转发', 'background-color: #177dee;font-size: 14px; color: #fff'],
              // content: $("#forward").html(),
              content: html,
              area: ['820px', '400px'],
              btnAlign: 'c',
              resize: true,
              btn: ["确定", "取消"],
              success: function (layers, index) {
                //需要手动指定转发人员的
                if (self.lczfDto.sfzdry == 1) {
                  table.render({
                    elem: '#forwardTable',
                    height: '230',
                    cols: [
                      [{
                          type: "radio"
                        },
                        {
                          field: 'nextjsmc',
                          title: '参与角色',
                          align: 'center'
                        },
                        {
                          field: "sss",
                          title: '参与人',
                          align: 'center',
                          templet: '#userList'
                        }
                      ]
                    ],
                    data: [self.lczfDto],
                    done: function (res, curr, count) {
                      //默认第一个选上

                      var param = {
                        "zxlx": zxlx,
                        "userid": self.user.id,
                        "tbids": [self.tbid]
                      }
                      postDataToServer("/lcxxModel/getLcxxByTbidAndYhid", param, function (lcxx) {
                        if (lcxx.head && lcxx.head.code == "0000") {
                          var preUserId = [];
                          for (var i in lcxx.data) {
                            if (preUserId.indexOf(lcxx.data[i].preuserid) == -1) {
                              preUserId.push(lcxx.data[i].preuserid);
                            }
                            if (preUserId.length > 1) {
                              break;
                            }
                          }
                          $("tr[data-index=0]").find('i[class="layui-anim layui-icon"]').trigger("click");
                          radioData = res.data[0];
                          $.each(res.data, function (i, value) {
                            if (!isEmpty(value.dcjzUserList)) {
                              xmselect = xmSelect.render({
                                el: '#user-' + value.LAY_TABLE_INDEX,
                                name: 'zyryid-' + value.id,
                                language: 'zn',
                                toolbar: {
                                  show: true
                                },
                                layVerify: 'required',
                                radio: true,
                                filterable: true,
                                autoRow: true,
                                direction: 'auto',
                                theme: {
                                  color: '#1E9FFF'
                                },
                                prop: {
                                  name: 'username',
                                  value: 'id'
                                },
                                data: value.dcjzUserList,
                                on: function (obj) {
                                  //isAdd, 此次操作是新增还是删除
                                  if (obj.isAdd) {
                                    $("tr[data-index=" + value.LAY_TABLE_INDEX + "]").find('i[class="layui-anim layui-icon"]').trigger("click");
                                  }

                                }
                              });
                              //只有一个用户时，默认赋值
                              if (value.dcjzUserList && value.dcjzUserList.length == 1) {
                                xmselect.setValue([value.dcjzUserList[0].id]);
                              }
                              const idArr = value.dcjzUserList.map(m => m.id);
                              if (preUserId.length == 1 && idArr.indexOf(preUserId[0]) > -1) { //可默认选择
                                xmselect.setValue([preUserId[0]]);
                              }
                            } else {
                              layer.msg('请先添加用户', {
                                icon: 2
                              });
                            }

                          })
                          form.render();

                        }
                      })


                    },
                    page: false
                  });

                  table.on('radio(forwardTableFilter)', function (obj) { //test 是 table 标签对应的 lay-filter 属性
                    radioData = obj.data;
                  });

                  //监听table 行点击事件
                  table.on('row(forwardTableFilter)', function (obj) {
                    obj.tr.addClass('layui-table-click').siblings().removeClass('layui-table-click');
                    obj.tr.find('i[class="layui-anim layui-icon"]').trigger("click");
                  })
                }

                layers.addClass('layui-form');
                // 将保存按钮改变成提交按钮
                layers.find('.layui-layer-btn0').attr({
                  'lay-filter': 'forwardBtn',
                  'lay-submit': ''
                });
                form.render();
              },
              yes: function (index, layery) {
                form.on('submit(forwardBtn)', function (data) {

                  var param = data.field;
                  //判断是否有选人员
                  if ((self.lczfDto.sfzdry == '1' && isEmpty(radioData)) || (!isEmpty(radioData) && radioData.sfzdry === '1' && isEmpty(param['zyryid-' + radioData.id]))) {
                    layer.msg("请选择参与人", {
                      icon: 5
                    });
                    return
                  }

                  if (isEmpty(radioData)) {
                    radioData = self.lczfDto;
                  }
                  param.lczfDto = radioData;
                  param.zyryid = param['zyryid-' + radioData.id];
                  self.excuteForward(param);
                })
              }
            })

          })
        }
      },

      excuteForward: function (param) {
        var self = this;
        if (param) {
          param.tbid = [self.tbid];
        } else {
          param = {};
          param.tbid = [self.tbid];
        }
        var msg = "";

        if (param.lczfDto.jzzt == '0' && param.lczfDto.nextjzzt == '1') {
          msg = "当前转发为县级转到市级，是否转发？"
        } else if (param.lczfDto.jzzt == '1' && param.lczfDto.nextjzzt == '2') {
          msg = "当前转发为市级转到省级，是否转发？"
        }
        if (msg != "") {
          layer.confirm(msg, function () {
            self.postDataForward(param);
          });
        } else {
          self.postDataForward(param);
        }
      },
      postDataForward: function (param) {
        var self = this;
        param.zxlx = zxlx;
        param.sysParam = sysParam;
        postDataToServer("/lcxxModel/forward", param, function (res) {
          if (res.head && res.head.code == "0000") {
            if (res.data.noZyzzTbids.length != 0) {
              layer.msg("图斑无对应作业组长负责，请联系管理员", {
                icon: 2
              });
            } else {
              layer.closeAll();
              self.init();
              layer.msg('转发成功', {
                icon: 1,
                time: 2000
              });
            }
          } else {
            var msg = "";
            if ($.isArray(res.data.msg)) {
              $.each(res.data.msg, function (index, value) {
                msg += value.msg.toString() + ";";
                // if (value.bm) {
                //     msg += "图斑" + value.bm + "：" + value.msg.toString() + ";";
                // } else {
                //     msg += value.msg.toString() + ";";
                // }
              })
            } else {
              msg = res.data.msg;
            }
            layer.msg(msg, {
              icon: 2
            });
          }

        })
      },

      btnBack: function () {
        if (isClicked) {
          layer.msg("请勿连续点击操作", {
            icon: 2
          });
          return false;
        } else {
          isClicked = true; // 设置已点击标志
          setTimeout(function () {
            isClicked = false; // 延时后重置标志，允许下一次点击
          }, delay);
        }
        var self = this;
        var backIds = self.lczfDto.backjsid.split(",");

        //多个退回目标
        if (backIds.length > 1) {
          layer.open({
            type: 1,
            title: ['退回', 'background-color: #177dee;font-size: 14px; color: #fff'],
            content: $("#backP").html(),
            area: ['640px', '300px'],
            btnAlign: 'c',
            resize: true,
            btn: ["确定", "取消"],
            success: function (layers, index) {
              postDataToServer('/zdModel/getRoleList', {}, function (res) {
                var roleList = res.data;


                layers.addClass('layui-form');
                // 将保存按钮改变成提交按钮
                layers.find('.layui-layer-btn0').attr({
                  'lay-filter': 'backBtn',
                  'lay-submit': ''
                });
                layers.find('#thry').attr({
                  'lay-filter': 'mbryFilter'
                });
                var optionHtml = "";

                for (var i = 0; i < backIds.length; i++) {
                  var js = backIds[i];
                  var thisRole = roleList.filter(function (d) {
                    return d.dm === js;
                  })
                  optionHtml = optionHtml + '<option value="' + js + '">' + thisRole[0].mc + '</option>'
                }
                $("#thry").html(optionHtml);

                form.render();
                form.on('select(mbryFilter)', function (data) {
                  if (data.value == backIds[1]) {
                    layers.find('#shyj').attr({
                      'lay-verify': 'required'
                    })
                    layers.find('#thsm_p').css("display", "");

                  } else {
                    layers.find('#shyj').attr({
                      'lay-verify': ''
                    })
                    layers.find('#thsm_p').css("display", "none");
                    $("#shyj").val("");
                  }
                });


              })


            },
            yes: function (index, layery) {
              form.on('submit(backBtn)', function (data) {
                var thjsid = $("#thry").val();
                var shyj_p = data.field.pthsm;

                layer.confirm('确认退回？', function (index) {
                  let param = {
                    "tbid": [self.tbid],
                    "thjsid": thjsid,
                    "lczfDto": self.lczfDto,
                    "shyj": shyj_p,
                    "zxlx": zxlx
                  };
                  postDataToServer("/lcxxModel/back", param, function (res) {
                    if (res.head && res.head.code == "0000") {
                      layer.closeAll();
                      self.init();
                      layer.msg('退回成功', {
                        icon: 1,
                        time: 2000
                      });
                    } else {
                      var msg = "";
                      if ($.isArray(res.data.msg)) {
                        $.each(res.data.msg, function (index, value) {
                          msg += value.msg.toString() + ";";
                          // if (value.bm) {
                          //     msg += "图斑" + value.bm + "：" + value.msg.toString() + ";";
                          // } else {
                          //     msg += value.msg.toString() + ";";
                          // }
                        })
                      } else {
                        msg = res.data.msg;
                      }
                      layer.msg(msg, {
                        icon: 2
                      });
                    }
                  })
                });
              })
            }
          })
        } else {
          layer.confirm('确认退回？', function (index) {
            self.saveForward(false, true);
          });
        }
      },

      afterSaveBack: function () {
        var self = this;
        let param = {
          "tbid": [self.tbid],
          "lczfDto": self.lczfDto,
          "zxlx": zxlx
        };
        postDataToServer("/lcxxModel/back", param, function (res) {
          if (res.head && res.head.code == "0000") {
            layer.closeAll();
            self.init();
            layer.msg('退回成功', {
              icon: 1,
              time: 2000
            });
          } else {
            var msg = "";
            if ($.isArray(res.data.msg)) {
              $.each(res.data.msg, function (index, value) {
                msg += value.msg.toString() + ";";
                // if (value.bm) {
                //     msg += "图斑" + value.bm + "：" + value.msg.toString() + ";";
                // } else {
                //     msg += value.msg.toString() + ";";
                // }
              })
            } else {
              msg = res.data.msg;
            }
            layer.msg(msg, {
              icon: 2
            });
          }
        })
      },
      refreshYjxx() {
        //初始化部门输入提示框
        var self = this;
        postDataToServer("/lcxxModel/queryYjxx?zxlx=dltb", {}, function (res) {
          var selectModelData = [];
          for (var i = 0; i < res.data.length; i++) {
            var json = {};
            json["dm"] = res.data[i].value;
            json["mc"] = res.data[i].name;
            selectModelData.push(json);
          }
          selectData = selectModelData;
          pshyjSelect = self.initShyjInput("pshyj", selectModelData);

          cshyjSelect = self.initShyjInput("cshyj", selectModelData);
          pjlyjSelect = self.initShyjInput("pjlyj", selectModelData);
          cjlyjSelect = self.initShyjInput("cjlyj", selectModelData);
          xjlyjSelect = self.initShyjInput("xjlyj", selectModelData);
          selectArr["pshyj"] = pshyjSelect;
          selectArr["cshyj"] = cshyjSelect;
          selectArr["pjlyj"] = pjlyjSelect;
          selectArr["cjlyj"] = cjlyjSelect;
          selectArr["xjlyj"] = xjlyjSelect;
          self.handleSelect("pshyj");
          self.handleSelect("cshyj");
          self.handleSelect("pjlyj");
          self.handleSelect("cjlyj");
          self.handleSelect("xjlyj");


        })
      },
      handleSelect: function (type) {
        var self = this;
        if (!isEmpty(self.tbxx[type])) {
          var yjArr = self.tbxx[type].split(";");
          var selectModelData = [...selectData];
          var selected = [];
          for (var i = 0; i < yjArr.length; i++) {
            var hasData = selectModelData.filter(o => {
              return o.dm == yjArr[i];
            })
            if (hasData.length == 0) {
              selectModelData.push({
                dm: yjArr[i],
                mc: yjArr[i]
              })
              selectArr[type].update({
                data: selectModelData
              })
            }
            selected.push({
              dm: yjArr[i],
              mc: yjArr[i]
            });
          }
          selectArr[type].setValue(selected);
        }

      },
      btnPend: function () {
        var self = this;
        layer.confirm('确认将图斑做待定处理？', function (index) {
          postDataToServer("/tbxxModel/updatePending", {
            "tbid": [self.tbid],
            "zxlx": zxlx
          }, function (res) {
            if (res.head && res.head.code == "0000") {
              layer.closeAll();
              self.init();
              layer.msg('处理成功', {
                icon: 1,
                time: 2000
              });
            } else {
              layer.msg(res.data.msg, {
                icon: 2
              });
            }
          })
        });
      },
      btnSs: function () {
        var self = this;
        laytpl(edit_form.innerHTML).render({}, function (html) {
          layer.open({
            type: 1,
            title: ['申诉', 'background-color: #177dee;font-size: 14px; color: #fff'],
            content: html,
            area: ['750px', '450px'],
            btnAlign: 'c',
            resize: true,
            btn: ["确定", "取消"],
            yes: () => {
              //获取表单内的所有值
              const formData = layui.form.val("edit_form");
              if (formData.ssyy != "") {
                //发送数据到接口
                let param = {
                  "tbid": [self.tbid],
                  "ssyy": formData.ssyy,
                  "zxlx": zxlx
                };
                postDataToServer("/lcxxModel/forwardSs", param, function (res) {
                  if (res.head && res.head.code == "0000") {
                    layer.msg('申诉成功', {
                      icon: 1,
                      time: 2000
                    });
                    layer.closeAll();
                    self.init();
                  } else {
                    layer.msg('申诉失败，请重新申诉', {
                      icon: 2
                    });
                  }
                })
              } else {
                layer.msg("请填写申诉原因");
              }
            },
          });
        });
      },
      btnSscl: function () {
        var self = this;
        laytpl(verifys.innerHTML).render({}, function (html) {
          layer.open({
            type: 1,
            title: ['申诉', 'background-color: #177dee;font-size: 14px; color: #fff'],
            content: html,
            area: ['750px', '450px'],
            btnAlign: 'c',
            resize: true,
            btn: ["确定", "取消"],
            success: () => {
              form.render();
              if (self.jscodeList.indexOf('1') > -1) {
                $("#ssyySh").text(self.cssyy);
              }
              if (self.jscodeList.indexOf('6') > -1) {
                $("#ssyySh").text(self.ssyy);
              }
            },
            yes: () => {
              //获取表单内的所有值
              const formData = layui.form.val("lay-verify-form");
              if (formData.shyj != '') {
                //发送数据到接口
                let param = {
                  "tbid": [self.tbid],
                  "shyj": formData.shyj,
                  "shjg": formData.shjg,
                  "zxlx": zxlx
                };

                postDataToServer("/lcxxModel/handleSs", param, function (res) {
                  if (res.head && res.head.code == "0000") {
                    layer.msg('操作成功', {
                      icon: 1,
                      time: 2000
                    });
                    self.init();
                    setTimeout(function () {
                      layer.closeAll()
                    }, 1000)
                  } else {
                    var msg = "";
                    if ($.isArray(res.data.msg)) {
                      $.each(res.data.msg, function (index, value) {
                        msg += value.msg.toString() + ";";
                      })
                    } else {
                      msg = res.data.msg;
                    }
                    layer.msg(msg, {
                      icon: 2
                    });
                  }
                })


              } else {
                layer.msg("请填写审核意见");
              }

            },
          });
        });
      },
      btnZdtb: function () {
        var self = this
        layer.open({
          type: 1,
          title: ['类型', 'background-color: #177dee;font-size: 14px; color: #fff'],
          content: $("#zdtb").html(),
          area: ['550px', '150px'],
          btnAlign: 'c',
          resize: false,
          btn: ["确定", "取消"],
          success: function (layers, index) {
            form.render()
          },
          yes: function (index, layery) {
            var formData = form.val("form-zdxm")
            var yyms
            if (formData.yydm == "0") {
              yyms = "技术性整改"
            } else if (formData.yydm == "1") {
              yyms = "模棱两可"
            } else {
              yyms = "地类认定明显错误"
            }
            let param = {
              "tbly": "ndbg",
              "tbid": self.tbxx.id,
              "yydm": formData.yydm,
              "yyms": yyms
            };
            postDataToServer("/zdtbModel/saveZdtb", param, function (res) {
              if (res.head && res.head.code == "0000") {
                layer.closeAll()
                layer.msg('操作成功', {
                  icon: 1,
                  time: 2000
                });
                self.init();
              } else {
                var msg = "";
                if ($.isArray(res.data.msg)) {
                  $.each(res.data.msg, function (index, value) {
                    msg += value.msg.toString() + ";";
                  })
                } else {
                  msg = res.data.msg;
                }
                layer.msg(msg, {
                  icon: 2
                });
              }
            })
          }
        })
      },
      btnRevoke: function () {
        var self = this;
        layer.confirm('确认是否撤回？', function () {
          postDataToServer("/lcxxModel/revoke", {
            "tbid": [self.tbid],
            "lczt": self.lczt,
            "sysParam": sysParam,
            "zxlx": zxlx
          }, function (res) {
            if (res.head && res.head.code == "0000") {
              layer.closeAll();
              self.init();
              layer.msg('操作成功', {
                icon: 1,
                time: 2000
              });
            } else {
              var msg = "";
              if ($.isArray(res.data.msg)) {
                $.each(res.data.msg, function (index, value) {
                  msg += value.msg.toString() + ";";
                })
              } else {
                msg = res.data.msg;
              }
              layer.msg(msg, {
                icon: 2
              });
            }
          });
        });
      },
      btnDownPdf: function () {
        var self = this;
        var index = layer.load(1);
        self.showIndex = 0;
        self.showLeftIndex = 0;
        domtoimage.toPng(document.getElementById('mapDiv'))
          .then(function (mapUrl) {
            domtoimage.toPng(document.getElementById('tbbox'))
              .then(function (tburl) {
                postDataToServerNoLoading("/tbxxModel/uploadTbPdf", {
                  map: mapUrl,
                  tbxx: tburl,
                  id: self.tbid,
                  sysParam: sysParam,
                  bm: self.tbxx.bm,
                  zxlx: zxlx
                }, function (res) {
                  layer.close(index);
                  if (res.head && res.head.code == "0000") {
                    window.open(getIp() + "/tbxxModel/downloadPdf?url=" + res.data);
                  } else {
                    layer.msg("下载失败", {
                      icon: 2
                    });
                  }
                });
              })
          });
      }
    },
    computed: {
      getPhotoText: function () {
        if (this.allImgList.length != 0) {
          if (!isEmpty(this.allImgList[this.numPhoto]['psry'])) {
            return this.allImgList[this.numPhoto]['psry'];
          } else {
            return "";
          }
        }
      },
      getPhotoTime: function () {
        if (this.allImgList.length != 0) {
          if (!isEmpty(this.allImgList[this.numPhoto]['pssj'])) {
            return this.allImgList[this.numPhoto]['pssj'];
          } else {
            return "";
          }
        }
      },
      getPhotopsjd: function () {
        if (this.allImgList.length != 0) {
          if (this.yswz) {
            return this.yswzJWDList[this.numPhoto].psjd;
          } else {
            if (!isEmpty(this.allImgList[this.numPhoto]['psjd'])) {
              return this.allImgList[this.numPhoto]['psjd'];
            } else {
              return "";
            }
          }
        }
      },
      getPhotopjd: function () {
        if (this.allImgList.length != 0) {
          if (this.yswz) {
            return this.yswzJWDList[this.numPhoto].jd;
          } else {
            if (!isEmpty(this.allImgList[this.numPhoto]['jd'])) {
              return this.allImgList[this.numPhoto]['jd'];
            } else {
              return "";
            }
          }


        }
      },
      getPhotopwd: function () {
        if (this.allImgList.length != 0) {
          if (this.yswz) {
            return this.yswzJWDList[this.numPhoto].wd;
          } else {
            if (!isEmpty(this.allImgList[this.numPhoto]['wd'])) {
              return this.allImgList[this.numPhoto]['wd'];
            } else {
              return "";
            }
          }


        }
      },
      getsmjType: function () {
        if (this.smList.length != 0) {
          return this.smList[this.numSml]['isImgtype']
        }
      },
      //地类分析
      // getDl: function () {
      //     if (this.allImgList.length != 0) {
      //         if (!isEmpty(this.allImgList[this.numPhoto]['fxdl'])) {
      //             this.showFxdl = true;
      //             return this.allImgList[this.numPhoto]['fxdl']
      //         } else {
      //             this.showFxdl = false;
      //         }
      //     }
      // },
      //当前扫描件属性
      getSmjText: function () {
        if (this.smList.length != 0) {

          return this.smList[this.numSml]['psry']
        }
      },
      getSmjTime: function () {
        if (this.smList.length != 0) {
          return this.smList[this.numSml]['pssj']
        }
      },
      getSmjpsjd: function () {
        if (this.smList.length != 0) {
          return this.smList[this.numSml]['psjd']
        }
      },
      getSmjpjd: function () {
        if (this.smList.length != 0) {
          return this.smList[this.numSml]['jd']
        }
      },
      getSmjpwd: function () {
        if (this.smList.length != 0) {
          return this.smList[this.numSml]['wd']
        }
      },
      getVideoText: function () {
        if (this.allVideoList.length != 0) {
          if (!isEmpty(this.allVideoList[this.numVideo]['psry'])) {
            return this.allVideoList[this.numVideo]['psry'];
          } else {
            return "";
          }
        }
      },
      getVideoTime: function () {
        if (this.allVideoList.length != 0) {
          if (!isEmpty(this.allVideoList[this.numVideo]['pssj'])) {
            return this.allVideoList[this.numVideo]['pssj'];
          } else {
            return "";
          }
        }
      },
      getVideopsjd: function () {
        if (this.allVideoList.length != 0) {
          if (!isEmpty(this.allVideoList[this.numVideo]['psjd'])) {
            return this.allVideoList[this.numVideo]['psjd'];
          } else {
            return "";
          }
        }
      },
      getVideopjd: function () {
        if (this.allVideoList.length != 0) {
          if (this.allVideoList.length != 0) {
            if (!isEmpty(this.allVideoList[this.numVideo]['jd'])) {
              return this.allVideoList[this.numVideo]['jd'];
            } else {
              return "";
            }
          }
        }
      },
      getVideopwd: function () {
        if (this.allVideoList.length != 0) {
          if (this.allVideoList.length != 0) {
            if (!isEmpty(this.allVideoList[this.numVideo]['wd'])) {
              return this.allVideoList[this.numVideo]['wd'];
            } else {
              return "";
            }
          }
        }
      }

    },
    watch: {

      showIndex: function () {
        var _this = this;
        if (_this.showIndex == 0 && !_this.showXmxxCom) {
          _this.$nextTick(function () {
            this.setPmheight();
          })
        }
      },

      watchPthjg: function () {
        var _this = this;
        _this.$nextTick(function () {
          this.setPmheight();
        })
      },
      currentImg: function () {
        var _this = this;
        _this.$nextTick(function () {
          img = new Image();
          img.src = _this.currentImg;
          img.onload = function () {
            $('.photoImgHalf').css("width", img.width < 1300 ? 'unset' : '100%');
          }
        })
      }
    },
    updated: function () {
      form.render();
    }
  });

  form.on('select(xjljgFilter)', function (data) {
    app.tbxx.xjljg = data.value;
  });

  form.on('select(cshjgFilter)', function (data) {
    app.tbxx.cshjg = data.value;
  });
  form.on('select(cjljgFilter)', function (data) {
    app.tbxx.cjljg = data.value;
  });
  form.on('select(pshjgFilter)', function (data) {
    app.tbxx.pshjg = data.value;
  });
  form.on('select(pjljgFilter)', function (data) {
    app.tbxx.pjljg = data.value;
  });
  element.on('tab(dcxxFilter)', function () {
    app.dkinfo = app.dkinfoList[this.getAttribute('lay-id')];

  });

  function removeDcy() {
    if (dcyPopupArr.length != 0) {
      for (var row in dcyPopupArr) {
        map.removeLayer(dcyPopupArr[row])
      }
    }
    if (geoAddjson["dcy"]) {
      map.removeLayer(geoAddjson["dcy"]);
    }
  }

  function addDcy(tbfw) {
    if (dcyPopupArr.length != 0) {
      for (var row in dcyPopupArr) {
        map.removeLayer(dcyPopupArr[row])
      }
    }
    var geojsonPolygon = JSON.parse(tbfw);
    var coordinates = geojsonPolygon.coordinates;
    var geometryType = geojsonPolygon.type;
    if (geoAddjson["dcy"]) {
      map.removeLayer(geoAddjson["dcy"]);
    }
    geoJson2TdtPolygon("Features", coordinates, geometryType, "#9EB34D", "dcy", "dcy", app.dkinfo.dkbh);
  }

  function xmSelectRender(id, data) {
    return xmSelect.render({
      el: '#' + id,
      name: id,
      language: 'zn',
      toolbar: {
        show: true
      },
      filterable: true,
      autoRow: true,
      direction: 'auto',
      theme: {
        color: '#1E9FFF'
      },
      prop: {
        name: 'mc',
        value: 'dm'
      },
      model: {
        label: {
          type: 'block',
          block: {
            //最大显示数量, 0:不限制
            showCount: 1,
            //是否显示删除图标
            showIcon: true,
          }
        }
      },
      data: data
    });
  }

});
