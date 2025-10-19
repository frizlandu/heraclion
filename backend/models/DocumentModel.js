// backend/models/Document.js
const BaseModel = require('./base/BaseModel');

class DocumentModel extends BaseModel {
  constructor() {
    super('documents');
  }
}

module.exports = new DocumentModel();
