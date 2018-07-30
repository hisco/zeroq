export declare module ZeroQ{
	export class QueueTask<T>{
		public value : T;
		public next? : QueueTask<T>;
	}
	export class TasksQueue<T>{
		private counter:number;
		private maxConcurrency:number;
		constructor(maxConcurrency : number , isSyncMode? : boolean);
		public push(cb : ()=>void);
		public release():void;
		public first?:QueueTask<T>;
		public last?:QueueTask<T>;
	}
	export class DataQueue<T> extends TasksQueue<T>{
		constructor(maxConcurrency : number , onData : (data:T)=>void);
		public push(data:T):void
	}
}
