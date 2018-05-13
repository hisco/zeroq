
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-spies'));

const {QueueTask ,ZeroDataQueue, ZeroTasksQueue} = require('../../src/zeroq');
describe('QueueTask', ()=> {
    let queueTask;
    beforeEach(()=>{
        queueTask = new QueueTask(2 , true);
    });
    describe('#contructor', ()=> {
        it('Should assign first argument to the value property' , ()=>{
            expect(queueTask.value).to.equal(2); 
        })
    });
    describe('#next', ()=> {
        it('Should behave like a regular property' , ()=>{
            queueTask.next = "something";  
            expect(queueTask.next).to.equal("something"); 
        })
    });
});
describe('ZeroTasksQueue', ()=> {
    
    describe('#contructor', ()=> {
        let queue;
        beforeEach(()=>{
            queue = new ZeroTasksQueue(2 , true);
        });
        it('Should accept only maxConcurrency as a number' , ()=>{
            function badConstruction(){
                new ZeroTasksQueue("sdfds" , true);
            } 

            expect(badConstruction).to.throw();
        });
        it('Should set the maxConcurrency property' , ()=>{
            expect(queue.maxConcurrency).to.equal(2); 
        });
        it('Should set counter to zero' , ()=>{
            expect(queue.counter).to.equal(0); 
        });
        it('Should set push function on the instance' , ()=>{
            expect(queue.push).to.be.a('function'); 
        });
        it('Should set release function on the instance' , ()=>{
            expect(queue.release).to.be.a('function'); 
        });
        it('Should set callTask function as a sync function when second argument is true' , ()=>{
            expect(queue.callTask).to.be.a('function'); 
            expect(queue.callTask.name).to.equal('syncCall'); 
        });
        it('Should set callTask function as an async function by default' , ()=>{
            queue = new ZeroTasksQueue(2);

            expect(queue.callTask).to.be.a('function'); 
            expect(queue.callTask.name).to.not.equal('syncCall'); 
        });
        it('Should set callTask function as an async when second argument is false' , ()=>{
            queue = new ZeroTasksQueue(2 , false);

            expect(queue.callTask).to.be.a('function'); 
            expect(queue.callTask.name).to.not.equal('syncCall'); 
        });
       
    });
    describe('#push', ()=> {
        let firsTask;
        let queue;
        beforeEach(()=>{
            queue = new ZeroTasksQueue(2 , true);
            firsTask = chai.spy(function task(){});
            queue.push(firsTask);
        });
        it('Should call first task when counter is smaller then maxConcurrency' , ()=>{
            expect(firsTask).to.have.been.called(); 
        });
        it('Should increase counter when counter is smaller then maxConcurrency ' , ()=>{
            expect(queue.counter).to.be.equal(1);
        });

        it('Should call any task when counter is lower then maxConcurrency' , ()=>{
            const lastTask = chai.spy(function task2(){});
            queue.push(lastTask);

            expect(lastTask).to.have.been.called(); 
        });
        it('Should queue task when counter is greater than maxConcurrency ' , ()=>{
            const scondTask = chai.spy(function task2(){});
            queue.push(scondTask);
            const lastTask = chai.spy(function task3(){});
            queue.push(lastTask);

            expect(lastTask).to.have.not.been.called(); 
        });
    });
    describe('#release' , ()=>{
        let firsTask;
        let secondTask;
        let thirdTask;
        let queue;
        beforeEach(()=>{
            queue = new ZeroTasksQueue(2 , true );

            firsTask = chai.spy(function task1(){});
            secondTask = chai.spy(function task2(){});
            thirdTask = chai.spy(function taskLast(){});
            queue.push(firsTask);
            queue.push(secondTask);
            queue.push(thirdTask);
        });

        it('Should not call queued tasks when counter is greater than maxConcurrency' , ()=>{
            
            expect(firsTask).to.have.been.called(); 
            expect(secondTask).to.have.been.called(); 
            //Queued tasks:
            expect(thirdTask).to.have.not.been.called(); 
        })
        it('Should call queued task when counter becomes lower than maxConcurrency' , ()=>{
            
            expect(firsTask).to.have.been.called(); 
            expect(secondTask).to.have.been.called();
            //Queued tasks: 
            expect(thirdTask).to.have.not.been.called();
            //Release
            queue.release();

            expect(thirdTask).to.have.been.called();
        })
        it('Should not call queued task if counter still have not become lower than maxConcurrency' , ()=>{
            
            expect(firsTask).to.have.been.called(); 
            expect(secondTask).to.have.been.called();
            expect(thirdTask).to.have.not.been.called();
            //Queued tasks:
            const firthTask = chai.spy(function task4(){});
            const lastTask = chai.spy(function task5(){});
            expect(thirdTask).to.have.not.been.called(); 
            expect(firthTask).to.have.not.been.called(); 
            expect(lastTask).to.have.not.been.called();
            //Release
            queue.release();

            expect(thirdTask ).to.have.been.called();
            expect(firthTask).to.have.been.not.called();
            expect(lastTask).to.have.been.not.called();
        })
       
    })
});


describe('ZeroDataQueue', ()=> {
    
    describe('#contructor', ()=> {
        let queue;
        beforeEach(()=>{
            queue = new ZeroDataQueue(2 , function onData(){});
        })
        it('Should accept only maxConcurrency as a number' , ()=>{
            function badConstruction(){
                new ZeroDataQueue("sdfds" , true);
            } 

            expect(badConstruction).to.throw();
        });
        it('Should accept only onData callback as a function' , ()=>{
            function goodConstruction(){
                const queue = new ZeroDataQueue(2 , ()=>{});
            }
            function badConstruction(){
                new ZeroDataQueue(2 , true);
            } 

            expect(badConstruction).to.throw();
            expect(goodConstruction).to.not.throw(); 
        });
        it('Should call onData callback with the user data' , ()=>{
            const onData = chai.spy(function (){});
            const queue = new ZeroDataQueue(2 , onData);

            queue.push(1);
            expect(onData).to.have.been.called.with(1);
        });
        it('Should set the maxConcurrency property' , ()=>{
            expect(queue.maxConcurrency).to.equal(2); 
        });
        it('Should set counter to zero' , ()=>{
            expect(queue.counter).to.equal(0); 
        });
        it('Should set push function on the instance' , ()=>{
            expect(queue.push).to.be.a('function'); 
        });
        it('Should set release function on the instance' , ()=>{
            expect(queue.release).to.be.a('function'); 
        });
        it('Should set callTask function exactly as recived by the user' , ()=>{
            expect(queue.callTask).to.be.a('function'); 
            expect(queue.callTask.name).to.equal('onData'); 
        });
    
    });
});