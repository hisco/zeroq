# ZeroQ

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]

  High performace in-memory tasks queue for Node.js

## High perormance
ZeroQ was built to endure great tasks load, while preserving the order of the tasks.
It surpassing other implementations by:

    * It's in-memory data structure - Linked list instead of Array (I measured 200X latency with `[].shift` comparing to changing a single pointer of linked list)
    * Super-high test coverage
    * Out of the box support for TypeScript.
    * No dependencies.

I currently don't provide other important queue features such as priority queue as I found current popular implementation fast enough with the features these provide.

Speed was our greatest concern and not a full featured queue.
## Simple to use

### Using Javascript
```js
    //Require all ZeroQ module
    const ZeroQ = require('zeroq');
    //now you can use both `ZeroQ.DataQueue` and `ZeroQ.TasksQueue`

    //Directly load the desired class
    const {DataQueue ,TasksQueue} = require('zeroq');

```

### Using TypeScript
```ts
    import {ZeroQ} from 'zeroq';
    //now you can use both `ZeroQ.DataQueue` and `ZeroQ.TasksQueue`


```

## API

Both Queues supports `maxConcurrency` number as first argument.
This enables locking/releasing multiple resources with a single queue.

### Tasks queue - TasksQueue<T>(maxConcurrency : number , isSyncMode : boolean )
This class was created to distribute tasks in the order these were pushed.
Tasks will be excuted once locked resource will be released.

```js
const {TasksQueue} = require('zeroq');
//Create a sync queue with no task executing in parallel
const queue = new TasksQueue(1 , true);
//Push some task to queue
queue.push(()=>{
    console.log('task 1');
});
//=> task 1
queue.push(()=>{
    console.log('task 2');
});
queue.releae();
//=> task 2
```

### Data queue - DataQueue<T>(maxConcurrency : number , onData : (data:T)=>void )
This class was created to distribute data in the order these were pushed.
Data will be pushed once locked resource will be released.

```js
const {DataQueue} = require('zeroq');
//Create a sync queue with no task executing in parallel
const queue = new DataQueue(1 , function onData(data){
    console.log('just recived ' , data);
});
//Any data can be pushed to the queue it will be release into your callback as is
queue.push({ eventName : 'click'});
//=>just recived { eventName : 'click'}
queue.push("https://www.example.com");
queue.push(200);

setTimeout(()=>{
    queue.release();
//=>just recived https://www.example.com
    queue.release();
//=>just recived 200
} , 2000);
```

##Examples

### Making multiple parallel request
Usually when making requests with Noed.JS the best approch is to request I/O operation to execute in parallel and wait for the last one to return.

```js
    const rp = require('request-promise');
    Promise.all([
        rp('https://www.example.com/resource/1'),
        rp('https://www.example.com/resource/2'),
        rp('https://www.example.com/resource/3')
    ])
    .then(function (results) {
        //All requests have finished
    })
    .catch(function (err) {
        //One of the requests have filed
    });
```
While it is in *most* cases the best approch when the amount of requests required is much higher, requesting from the OS to preform so many requests at once will probably result in random recurring timeouts.

The best approach is to lock a big number of requests.
As long as the number of requests is lower than the maximum concurrency - *all* requests will execute together.
Else it will be executed in bulcks.
```js
    const rp = require('request-promise');
    const requestQueue = new TasksQueue(30);
    
    const thousendsOfResources = [];
    for (let i =0; i<10;i++){
        thousendsOfResources.push(`https://www.example.com/resource/${i}`);
    }

    Promise.all(
        thousendsOfResources.map((requestOptions) =>{
            return new Promise(function (reoslve , reject){
                requestQueue.push(function makeRequestTask(){
                    return rp(requestOptions)
                        .then((result)=>{
                            //This single request has finished excuting successfully
                            //Do something with this single result
                            //You must not forget to release the request resource
                            requestQueue.release(); 
                            return result
                        })
                        .catch((error)=>{
                            //This single request has failed excuting
                            //Do something with this error 
                            //You must not forget to release the request resource
                            requestQueue.release(); 
                            return error
                        })
                })
            })
        }
    ))
    .then((results)=>{
        //All request have finshed successfully
    })

```
### Synchronous writing to an IPC socket
While Node.js doesn't preform any task in parallel, the OS do.
Some of the following messages will be lost because the OS can't write two messages in parallel.
```js
const net = require('net');
const writeQueue = new TasksQueue(1);
const client = net.createConnection({ path: '/tmp/app.sock' }, () => {
    for (let i=0;i<10000;i++){
        writeQueue.push(()=>{
            client.write(`check out ${i}` , writeQueue.release)
        })
    }
});

```
With tasks queue it's super safe and simple to make sure all your messages would arrive
```js
const net = require('net');
const client = net.createConnection({ path: '/tmp/app.sock' }, () => {
    for (let i=0;i<10000;i++){
        client.write(`check out ${i}`)
    }
});
```

### Asynchronous proccesing thousands of files
```js
    const queue = new TasksQueue(1000);
    const glob = require('glob');
    const {readFile} = require('fs')
    
    const getFileNames = new Promise(()=>{
        glob('**/*.js', function (er, files) {
            // files is an array of filenames.
            if (err)
                reject(err);
            else //Assume that you have millions of file names in this array
                resolve(files);
        })
    });
    function readAndProcessSingleFile(filename){
        return new Promise((resolve , reject)=>{
            readFile(fileName , (err , data)=>{
                if (err)
                    reject(err);
                else{
                    resolve(data);
                    //doSomething(data);
                }
                queue.release();
            })
        })
    }

    getFileNames
        .then((fileNames)=> 
            Promise.all(
                fileNames.map((fileName)=>
                    new Promise((resolve , reject)=>{
                        queue.push(()=>{
                            
                        });
                    })
                )
            )
        )
```

## License

  [MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/zeroq.svg
[npm-url]: https://npmjs.org/package/zeroq
[travis-image]: https://img.shields.io/travis/hisco/zeroq/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/hisco/zeroq
[coveralls-image]: https://coveralls.io/repos/github/hisco/zeroq/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/hisco/zeroq?branch=master