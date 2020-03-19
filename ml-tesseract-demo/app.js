/*
 * ഓം ബ്രഹ്മാർപ്പണം 
 * app.js
 * Created: Mon Mar 09 2020 02:16:15 GMT+0530 (GMT+05:30)
 * Copyright 2020 Harish.K<harish2704@gmail.com>
 */


function writeFileToHeap( url, dir, fname ){
  var task;
  if( url instanceof Blob ){
    task = url.arrayBuffer();
  } else {
    task = fetch(url)
      .then( v => v.arrayBuffer() );
  }
  return task.then(function( data ){
    return Module['FS_createDataFile']( dir, fname, new Uint8Array( data ), true, true);
  })
}

var Module = {
  'noInitialRun' : true,
  onRuntimeInitialized: function (){
    Promise.all([
      writeFileToHeap('./mal.traineddata', '/', 'mal.traineddata'),
      writeFileToHeap('./eng.traineddata', '/', 'eng.traineddata'),
    ]).then(function(){
      console.log( 'Traindata loaded');
      window.isTraindataLoaded = true;
      if( window.onTraindataLoaded ){
        window.onTraindataLoaded()
      }
    })
  },
};


function ocrByClient( image, padding_top, padding_bottom ){
  try {
    Module['FS_unlink']('/sample.png');
  } catch (e) {
    console.log('File is not yet loaded', e );
  }
  return writeFileToHeap( image, '/', 'sample.png')
    .then(function(){
      var boxes = Module.getBoxes();
      var linesWH = [];
      var text = [];
      var item;
      for (var i = 0, l = boxes.size(); i < l; i ++) {
        item = boxes.get(i)
        linesWH.push( item[0] );
        text.push( item[1] );
      }
      return {
        lines: linesWH,
        text: text
      }
    })
}

function ocrByServer( image, padding_top, padding_bottom ){
  var data = new FormData();
  data.append('image',  image );
  return fetch("/ocr?padding_top=" + padding_top + '&padding_bottom=' + padding_bottom,{
    method: "POST",
    body: data,
  }).then(res => res.json())
}

function formatLine(line){
  return {
    x: line[0],
    y: line[1],
    w: line[2],
    h: line[3],
  };
}

VueDragResize = VueDragResize.default;
Vue.component('vue-drag-resize', VueDragResize);


new Vue({
  el: '#main',
  components: {
    VueDragResize
  },
  data: {
    isBulkEditing: false,
    selectedFileName: '',
    currentFileBlob: null,
    padding_bottom: 0,
    padding_top: 0,
    scalingFactor: 1,
    isLoading: true,
    lines: []
  },
  methods: {
    saveAsTrainData: function(){
      var zip = new JSZip();
      var outputFileName = this.selectedZipFileName || 'pottan-ocr_training-data_' + Date.now() + '_.zip'
      var linesData =  this.lines.map( v=>{
        return { line: v.box, text: v.text };
      });
      zip.file('image.png', this.currentFileBlob );
      zip.file('lines.json', JSON.stringify( linesData, null, 1 ));
      zip.generateAsync({type:"blob"})
      .then(function(content) {

        saveAs(content, outputFileName );
      });
    },
    doneBulkEditing: function(){
      this.bulkEditingLines.split('\n').forEach((v,i) => {
        this.lines[i].text = v;
      });
      this.isBulkEditing = false;
    },
    onResizeDrag: function( rect, box ){
      box.x = rect.left;
      box.y =rect.top;
      box.w =rect.width;
      box.h = rect.height;
    },
    startBulkEditing: function(){
      this.bulkEditingLines = this.lines.map(v=>v.text).join('\n');
      this.isBulkEditing = true;
    },
    doOcr:function(){
      this.isLoading = true;
        ocrByClient(this.currentFileBlob, this.padding_top, this.padding_bottom )
        .then(data => {
          console.log( 'success', data );
          this.lines = data.lines.map(function(line, i){
            return {
              id: i,
              box: formatLine(line),
              text: data.text[i],
              highlight: false,
              isEditing: false,
            };
          });
          this.isLoading = false;
        })
        .catch(error => {
          console.log( 'error', error );
          alert('Some error occurred while Calling OCR API')
          this.isLoading = false;
        })
    },

    setImage: function( file ){
      var self = this;
      var canvas = this.$refs.canvas;
      var ctx = canvas.getContext('2d');
      var img = new Image;
      this.currentFileBlob = file;
      img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        self.scalingFactor = canvas.clientWidth / canvas.width;
      }
      img.src = URL.createObjectURL( file );
    },

    onChangeFile: function File( e ){
      this.setImage(e.target.files[0]);
      this.selectedFileName = e.target.files[0].name;
    },

    onChangeZipFile: function(e){
      var selectedFile = e.target.files[0];
      this.selectedZipFileName = selectedFile.name;
      var self = this;
      JSZip.loadAsync( selectedFile )                                   // 1) read the Blob
        .then(function(zip) {
          return Promise.all([
            zip.file('lines.json').async('text'),
            zip.file('image.png').async('blob'),
          ]);
        })
        .then(function([ lines, img ]){
          lines = JSON.parse( lines );
          self.lines = lines.map(function(line, i){
            return {
              id: i,
              box: line.line,
              text: line.text,
              highlight: false,
              isEditing: false,
            };
          });
          self.setImage( img );
        })
    },
  },
  mounted: function(){
    var self = this;
    fetch('./sample.png')
      .then( v => v.blob() )
      .then(blob => this.setImage(blob));
    document.onpaste = function(event){
      var items = (event.clipboardData || event.originalEvent.clipboardData).items;
      for (var index in items) {
        var item = items[index];
        if (item.kind === 'file') {
          var blob = item.getAsFile();
          self.setImage( blob )
          self.lines = [];
        }
      }
    };
    window.addEventListener("resize", function(){
      var canvas = self.$refs.canvas;
      self.scalingFactor = canvas.clientWidth / canvas.width;
    });
    window.onTraindataLoaded = function(){
      self.isLoading = false;
    }
  },
});

