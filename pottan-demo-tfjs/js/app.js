/*
 * js/app.js
 * Created: Thu Jan 25 2018 01:17:09 GMT+0530 (IST)
 * Copyright 2018 Harish.K<harish2704@gmail.com>
 */
var jquery = require('jquery');
var glyphsList = require('../data/glyphs.json');
// var tf = require('@tensorflow/tfjs');
// window.tf = tf;
glyphsList.unshift('');
var $=jquery;
window.$ = $;
var IMG_HEIGHT = 32;

require('cropper');

// tf.setBackend( 'cpu' );
// tf.enableDebugMode ()
tf.enableProdMode ()

$(function() {
  var img = $('#for-cropper');
  var output = $('#output');
  var imgCropper = img.cropper();
  window.dev = $('#dev')[0];

  function initUi() {

    $(".input-file").before(
      function() {
        if ( !$(this).prev().hasClass('input-ghost') ) {
          var element = $("<input type='file' class='input-ghost' accept=\"image/*\" style='visibility:hidden; height:0'>");
          element.attr("name",$(this).attr("name"));
          element.change(function( e ){
            var imgUrl = URL.createObjectURL(e.target.files[0]);
            imgCropper.data('cropper').replace( imgUrl );
            element.next(element).find('input').val((element.val()).split('\\').pop());
          });
          $(this).find("button.btn-choose").click(function(){
            element.click();
          });
          $(this).find('input').css("cursor","pointer");
          $(this).find('input').mousedown(function() {
            $(this).parents('.input-file').prev().click();
            return false;
          });
          return element;
        }
      }
    );

    $('#rotate-buttons > button').click(function(){
      imgCropper.data('cropper').rotate( $(this).data().degree )
    });
  }


  function decodeStr( strEnc, raw=false ){
     return strEnc.map((v,i) => {
      return ( raw || ( strEnc[i-1] !== v )) ? glyphsList[ v ] : '';
    }).join('');
  }

  tf.loadLayersModel( './tfjs_kcrnn/model.json').then( model =>{
    window.model = model;
  })

  initUi();
  $('#run-btn').click(function(){
    if( !imgCropper ){
      return ;
    }
    var croppedCanvas = imgCropper.data('cropper').getCroppedCanvas();
    var scaleFactor = IMG_HEIGHT/croppedCanvas.height;
    var origWidth = croppedCanvas.width,
      newWidth = parseInt( scaleFactor * origWidth );
    var data = tf.browser.fromPixels( croppedCanvas );

    // pick any one of the color channel. ( Here it is Green )
    data = data.gather([0], [2])
    data = tf.image.resizeBilinear( data, [ IMG_HEIGHT, newWidth ] );

    // Normalize the values . Fit between -1 & 1
    data = data.sub( 127.5 );
    data = data.div( 127.5 );

    var outputData = model.predict( data.expandDims() );
    var predictions = outputData.argMax(2).squeeze();
    var out = decodeStr( Array.from( predictions.dataSync()) );
    output.text( out );
  });
});

