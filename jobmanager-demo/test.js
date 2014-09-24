/*global $, document */

var target = {
    initialize : function(el){
        this.el = el;
        this.box = el.offset();
    },
    add: function(el){
        this.el.append( el );
    }
};
var source= {
    initialize : function(el){
        this.el = el;
        this.box = el.offset();
    },
    take: function(){
        var el = this.el[0].childNodes[ this.el[0].childNodes.length -1 ];
        this.el[0].removeChild( el );
        return el;
    },
    add: function(el){
        this.el.append( el );
    }
};
var restHouse, workers;

var createTask = function( name ){
    var el = $( '<div class="task" id="task-'+name+'"> T: '+name+' </div>' );
    return el;
};

function Worker(parentEl, name){
    var el = $( '<div class="worker" id="worker-'+name+'"> W: '+name+' </div>' ); 
    this.el = el;
    parentEl.append(el);
    this.name = name;
    this.speed = name +1;
}
Worker.prototype.putTask = function(){
    this.el[0].removeChild( this.task[0] );
    target.add(this.task );
    return;
};
Worker.prototype.getTask = function(t){
    // var t = source.take();
    source.el[0].removeChild(t[0]);
    this.task = t;
    this.el.append(t);
    return;
};
Worker.prototype.gotoSource = function( cb ){
    this.el.css( this.el.offset() );
    this.el.css( { position: 'fixed' } );
    this.el.animate( source.box, 1000, cb );
};
var speed = 1;
Worker.prototype.move = function( cb ){
    var self = this;
    this.el.animate( { left: '130px' }, this.speed*speed*1000, function(){
        self.putTask();
        var p = self.el.parent();
        p[0].removeChild( self.el[0]);
        p.append( self.el );
        self.el.removeAttr('style');
        if( cb ) cb();
    });
};
Worker.prototype.doTask = function( t, cb) {
    var self = this;
    this.gotoSource(function(){
        self.getTask( t );
        self.move( cb );
    });
};

var jm, JobManager, messageDiv;

function flashMessage(message){
    messageDiv.html( message);
    messageDiv.slideDown(function() {
        setTimeout(function() {
            messageDiv.slideUp();
        }, 5000);
    });
}

$(document).ready( function(){
    target.initialize ( $('#target') );
    source.initialize ( $('#source') );
    workers = [];
    var j = 0;
    function loadTask( cb ){
        var tasks = [];
        var i = 0;
        while( i < 11 ) {
            var t =  createTask(( j*11 ) + i);
            source.add( t );
            tasks.push( t );
            i++;
        }
        j++;
        if(cb)cb( null, tasks );
    }
    // loadTask();
    restHouse = $('#restHouse');
    [1,2,3,4,5,6,7].forEach( function(v){
        workers.push( new Worker ( restHouse, v) );
    });

    messageDiv = $('#messages');
    



    JobManager = require('./job-manager').JobManager;
    jm = new JobManager( { concurrency: 4});

    jm.onLoadMore = function(cb){
        flashMessage( 'onLoadMore()');
        var self = this;
        loadTask( function(err, tasks){
            self.tasks = self.tasks.concat( tasks );
            cb();
        });
    };
    jm.onStopped = function(){
        flashMessage('onStopped()');
    };
    jm.workers = workers;
    jm.work = function( task, worker, cb ){
        worker.doTask(task, cb);
    };
});

var startd = false;
var buttonLabel = {
    true: 'stop',
    false: 'start'
};
function startStop(e){
    startd = !startd;
    $('#start').html( buttonLabel[startd]);
    var concurrency = Number ( document.forms[0].concurrency.value ) || 4;
    speed = Number ( document.forms[0].speed.value )  || 1;
    if(startd){
        jm.setConcurrency(concurrency);
        jm.start();
    } else {
        jm.stop();
    }
    return false;
}

function updateConcurrency(){
    var concurrency = Number ( document.forms[0].concurrency.value ) || 4;
    jm.setConcurrency(concurrency);
}
