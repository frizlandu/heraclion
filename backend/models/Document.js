const BaseDocument = require('./base/BaseDocument');

class Document extends BaseDocument {
  constructor() {
    // Table name is 'documents', documentType can be used for filtering if needed
    super('documents', null);
  }
}

module.exports = new Document();
