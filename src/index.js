import Query from './query';

export default class JobWatch {
  constructor(executer) {
    this.executer = executer;
  }

  query() {
    return new Query(this);
  }

  execute(command) {
    return this.executer.execute(command);
  }
}