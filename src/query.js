import moment from 'moment';
import { Parser as XmlParser } from 'xml2js';

export default class Query {
  restrictedExecutionTime = null;
  restrictedResources = []
  restrictedName = null;
  restrictedDestination = null;
  restrictedStates = [];
  restrictedUser = '$USER';

  constructor(jobWatch) {
    this.jobWatch = jobWatch;
  }

  resource(attribute, operator, value = null) {
    this.restrictedResources.push({
      attribute,
      operator,
      value
    });

    return this;
  }

  executionTime(operator, time) {
    let value = time;
    if (!moment.isMoment(time)) {
      value = moment(value);
    }

    this.restrictedExecutionTime = {
      operator,
      value
    };

    return this;
  }

  name(value) {
    this.restrictedName = name;
    return this;
  }

  destination(value) {
    this.restrictedDestination = value;
    return this;
  }

  states(...values) {
    this.restrictedStates = values;
    return this;
  }

  user(username = '$USER') {
    this.restrictedUser = username;
    return this;
  }

  getCommand() {
    let command = 'qselect';

    if (this.restrictedUser) {
      command += ' -u ' + this.restrictedUser;
    }

    if (this.restrictedName) {
      command += ' -N ' + this.restrictedName;
    }

    if (this.restrictedStates.length > 0) {
      command += ' -s ' + this.restrictedStates.join('');
    }

    if (this.restrictedExecutionTime) {
      const value = this.restrictedExecutionTime.value.format('YYYYMMDDHHmm.ss');
      command += ' -a ' + formatCondition(this.restrictedExecutionTime.operator, value.trim());
    }

    if (this.restrictedResources.length > 0) {
      command += ' -l ' + this.restrictedResources
        .map(resource => {
          return resource.attribute.trim() + formatCondition(resource.operator, resource.value.trim());
        })
        .join(',');
    }

    return command;
  }

  getIds() {
    const command = this.getCommand();

    return this
      .jobWatch
      .execute(command)
      .then(output => output
        .split('\n')
        .map(id => id.trim())
        .filter(id => id !== '')
      );
  }

  getDetails() {
    const xmlParser = new XmlParser();

    return this
      .getIds()
      .then(ids => {
        if (ids.length > 0) {
          return this.jobWatch.execute('qstat -x ' + ids.join(' '));
        } else {
          return '';
        }
      })
      .then(data => {
        const promises = data
          .split('\n')
          .filter(xml => xml !== '')
          .map(result => {
            return new Promise((resolve, reject) => {
              xmlParser.parseString(data, (err, result) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(result.Data.Job);
                }
              });
            });
          });

        return Promise.all(promises);
      });
  }
}

const conditions = {
  '=': '.eq.',
  '!=': '.ne.',
  '<>': '.ne.',
  '>=': '.ge.',
  '<=': '.le.',
  '>': '.gt.',
  '<': '.lt.'
}

function formatCondition(operator, value) {
  return conditions[operator] + value;
}
