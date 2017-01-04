import concat from 'concat-stream';

export default class SshExecuter {
  constructor(connection) {
    this.connection = connection;
  }

  execute(command) {
    return new Promise((resolve, reject) => {

      this.connection.exec(command, (err, stream) => {
        if (err) {
          reject(err);
        } else {
          const concatStream = concat(buffer => {
            resolve(buffer.toString());
          });

          stream.pipe(concatStream);

          stream
            .stderr
            .on('data', buffer => {
              reject(buffer.toString());
            })
        }
      });
    });
  }
}
