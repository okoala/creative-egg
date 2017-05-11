import util from './util';

module.exports = {
  getTypeStucture(index, typeOptions) {
    const result = {};
    for (let key in typeOptions) {
      const callback = typeOptions[key];
      result[util.toCamelCase(key)] = callback(index, key);
    }
    return result;
  },

  getTypePayloadItem(index, type) {
    const messages = index[type];
    if (messages) {
      return messages[0].payload;
    }
  },

  getTypePayloadList(index, type) {
    const messages = index[type];
    if (messages) {
      return messages.map(function(message) {
        return message.payload;
      });
    }
  },

  getTypeMessageItem(index, type) {
    const messages = index[type];
    if (messages) {
      return messages[0];
    }
  },

  getTypeMessageList(index, type) {
    const messages = index[type];
    if (messages) {
      return messages;
    }
  },
};
