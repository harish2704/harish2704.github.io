require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"onOuVc":[function(require,module,exports){
// ഓം  നമോ നാരായണായ 

var utils = require('./utils');

var STATE = utils.createEnum([ 'RUNNING' , 'NOT_RUNNING']);

function JobManager(opts){

    //opts
    this.notifyAt = opts.notifyAt|| 3;
    this.concurrency = opts.concurrency || 20;
    this.minConcurrency = opts.minConcurrency != null ? opts.minConcurrency : 2;

    // state
    this.state = STATE.NOT_RUNNING;

    this.workers = [];
    this.tasks = [];
    this.work = null;
    this.onLoadMore = null;
    this.onError = null;
    this.isLoadingTakingPlace = false;
    this.endReached = false;
    this.runningTasks = 0;
    this.tmpPoolLen=0;
    this.tmpPool = [];
}
/*
 * JobManager.prototype.__defineSetter__( 'workers', function(workers){
 *     this.$workers = workers;
 *     this.updateState();
 * });
 */

JobManager.prototype.updateState = function(){
    this.updateTmpPool( this.concurrency );
};

JobManager.prototype.updateTmpPool = function(newVal){
    if( newVal > this.tmpPoolLen ){
        var tmpPool = this.tmpPool;
        var additionalPoolBlocks = Math.ceil( ( newVal - this.tmpPoolLen )/this.workers.length ), i;
        for( i=0; i < additionalPoolBlocks; i++){
            tmpPool = tmpPool.concat( this.workers );
        }
        this.tmpPoolLen += additionalPoolBlocks * this.workers.length ;
        this.tmpPool = tmpPool;
    }
};

JobManager.prototype.setConcurrency = function( newVal ){
    if( newVal > this.minConcurrency ){
        this.updateTmpPool(newVal);
        this.concurrency = newVal;
    }
};

/*
 * JobManager.prototype.__defineGetter__( 'workers', function(){
 *     return this.$workers;
 * });
 */

JobManager.prototype.returnToPool = function (w){
    this.runningTasks--;
    this.tmpPool.push( w );
};

JobManager.prototype.getFromPool = function(){
    if( this.runningTasks < this.concurrency ){
        this.runningTasks++;
        return this.tmpPool.splice(0,1)[0];
    }
};

JobManager.prototype.$doWork_ = function( cb ){
    var self = this;
    var task = self.tasks.splice(0, 1)[0];
    if( task == undefined ){
        this.stop();
        return;
    }
    var worker = self.getFromPool();
    this.work( task, worker, function(err){
        if(err && self.onError ){
            self.onError(err, task, worker );
        }
        if(self.tasks.length/self.concurrency < self.notifyAt && (!self.isLoadingTakingPlace) ){
            if( self.onLoadMore && !self.endReached ) {
                self.$onLoadMore();
            }
        }
        if( self.state == STATE.NOT_RUNNING  ){
            if( ( self.runningTasks == 1 ) &&  self.onStopped ) { self.onStopped(); }
        }
        self.returnToPool( worker );
        cb();
    });
};


JobManager.prototype.$trigger = function (){
    var self = this;
    while( this.runningTasks < this.concurrency && this.state == STATE.RUNNING ){
        this.$doWork_( function(){
            self.$trigger();
        });
    }
};

JobManager.prototype.start = function( ) {
    this.state = STATE.RUNNING;
    this.updateState();
    var self = this;
    if( this.tasks.length ) {
        return this.$trigger();
    }
    return this.$onLoadMore( function(){
        self.$trigger();
    });
};

JobManager.prototype.$onLoadMore = function( cb ){
    cb = cb || function(){};
    var self = this;
    self.isLoadingTakingPlace = true;
    self.onLoadMore(function(){
        self.isLoadingTakingPlace = false;
        return cb();
    });
};

JobManager.prototype.pause = function(){
    this.state = STATE.NOT_RUNNING;
};

JobManager.prototype.stop = function(){
    this.state = STATE.NOT_RUNNING;
};


JobManager.prototype.resume = function(){
    this.start();
};

exports.JobManager = JobManager;

},{"./utils":3}],"./job-manager":[function(require,module,exports){
module.exports=require('onOuVc');
},{}],3:[function(require,module,exports){
function clone(obj){
    var newObj = {};
    Object.keys(obj).forEach(function(k){ newObj[k] = obj[k]; });
    return newObj;
}

function defaults( def, newValue ){
    var out = clone( def );
    if(newValue)
    Object.keys(newValue).forEach(function(k){ out[k] = newValue[k]; });
    return out;
}
function range(n){
    var x=Array(n);
    var i=0;
    while(i<n){ x[i] = i;i++; }
    return x;
}

function createEnum(a){
    var out = {};
    a.forEach(function(v, k){
        out[v.toUpperCase()] = {index: k, name: v.toLowerCase() };
    });
    return out;
}

exports.clone = clone;
exports.defaults = defaults;
exports.range = range;
exports.createEnum = createEnum;


},{}]},{},[])
;