var callTask = function callTaskFallback(cb){
    setTimeout(cb,0)
};
try{
    if (setImmediate){
        callTask = setImmediate;
    } 
}
catch(err){

}
class QueueTask{
    constructor(value){
        this.value = value;
    }
}  
class TasksQueue{
    constructor(maxConcurrency , isSyncMode){
        this.counter = 0;
        if (typeof maxConcurrency != "number")
            throw new Error('maxConcurrency must be of type number');

        if (isSyncMode)
            this.callTask = function syncCall(cb){cb()};
        else
            this.callTask = callTask;

        this.maxConcurrency = maxConcurrency;
        this.push = this._push.bind(this);
        this.release = this._release.bind(this);
    }
    _callTask(cb){
        callTask(cb);
    }
    _push(cb){
        if (this.counter<this.maxConcurrency){
            this.counter++;
            this.callTask(cb)
        }
        else{
            var node = new QueueTask(cb);
            if (this.last)
                this.last = this.last.next = node;
            else 
                this.last = this.first = node;
        }
    }
    _release(){
        if (this.counter<this.maxConcurrency){
            var node = this.first;
            this.first = node.next;
            this.callTask(node.value);
        }
        else {
            this.counter--;
            //I know.. DRY... but it's much faster..
            if (this.counter<this.maxConcurrency){
                var node = this.first;
                if (node){
                    this.first = node.next;
                    this.callTask(node.value);
                }
                else{
                    this.first = this.last = this.next = null;
                }
            }
        }
    }
}
class DataQueue extends TasksQueue{
    constructor(maxConcurrency , onData ){
        if (typeof onData != 'function'){
            throw new Error('onData must be of type function');
        }
        super(maxConcurrency,true);
        this.callTask = onData;
    }
}

module.exports = {
    TasksQueue,
    DataQueue,
    QueueTask
};
