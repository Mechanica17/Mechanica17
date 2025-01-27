/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/events              ->  index
 * POST    /api/events              ->  create
 * GET     /api/events/:id          ->  show
 * PUT     /api/events/:id          ->  upsert
 * PATCH   /api/events/:id          ->  patch
 * DELETE  /api/events/:id          ->  destroy
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.index = index;
exports.show = show;
exports.isRegistered = isRegistered;
exports.create = create;
exports.getRegisteredUsers = getRegisteredUsers;
exports.convertToExcel = convertToExcel;
exports.upsert = upsert;
exports.update = update;
exports.register = register;
exports.patch = patch;
exports.destroy = destroy;

var _fastJsonPatch = require('fast-json-patch');

var _fastJsonPatch2 = _interopRequireDefault(_fastJsonPatch);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _mongoXlsx = require('mongo-xlsx');

var _mongoXlsx2 = _interopRequireDefault(_mongoXlsx);

var _event = require('./event.model');

var _event2 = _interopRequireDefault(_event);

var _user = require('../user/user.model');

var _user2 = _interopRequireDefault(_user);

var _eventCategory = require('../eventCategory/eventCategory.model');

var _eventCategory2 = _interopRequireDefault(_eventCategory);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function patchUpdates(patches) {
  return function (entity) {
    try {
      _fastJsonPatch2.default.apply(entity, patches, /*validate*/true);
    } catch (err) {
      return _promise2.default.reject(err);
    }

    return entity.save();
  };
}

function removeEntity(res) {
  return function (entity) {
    if (entity) {
      return entity.remove().then(function () {
        res.status(204).end();
      });
    }
  };
}

function handleEntityNotFound(res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    console.log(err);
    res.status(statusCode).send(err);
  };
}

// Gets a list of Events
function index(req, res) {
  return _event2.default.find().exec().then(respondWithResult(res)).catch(handleError(res));
}

// Gets a single Event from the DB
function show(req, res) {
  console.log(req.params.id);

  if (!_validator2.default.isMongoId(req.params.id + '')) return res.status(400).send("Invalid Id");

  return _event2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(respondWithResult(res)).catch(handleError(res));
}

// Gets a single Event from the DB
function isRegistered(req, res) {

  if (!_validator2.default.isMongoId(req.params.id + '')) return res.status(400).send("Invalid Id");

  return _event2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(function (event) {
    var isRegistered = false;
    isRegistered = event.registered.find(function (user) {
      if (user.user.equals(req.user._id)) return true;
      return false;
    });
    return res.json(isRegistered);
  }).catch(handleError(res));
}

// Creates a new Event in the DB
function create(req, res) {
  console.log(req.body);
  return _event2.default.create(req.body).then(function (event) {
    _eventCategory2.default.findById(event.eventCategory).exec().then(handleEntityNotFound(res)).then(function (eventCategory) {
      console.log(eventCategory);
      eventCategory.events.push({ event: event._id });
      eventCategory.save().then(respondWithResult(res, 201)).catch(handleError(res));
    }).catch(handleError(res));
  }).catch(handleError(res));
}

// Gets all registered users for an Event in the DB
function getRegisteredUsers(req, res) {
  return _event2.default.findById(req.params.id).then(function (event) {
    var registered = [];

    for (var i = 0; i < event.registered.length; ++i) {
      registered.push(event.registered[i].user + '');
    }_user2.default.find({ _id: { $in: registered } }, 'name email college phoneNumber').exec().then(handleEntityNotFound(res)).then(function (users) {
      console.log(users.length, 55555555);
      return res.status(201).send(users);
    }).catch(handleError(res));
  }).catch(handleError(res));
}
// Exports list of registered users of an event
function convertToExcel(req, res) {
  if (!_validator2.default.isMongoId(req.params.id + '')) return res.status(400).send("Invalid Id");
  var model = [{
    "displayName": "Name",
    "access": "name",
    "type": "string"
  }, {
    "displayName": "Email address",
    "access": "email",
    "type": "string"
  }, {
    "displayName": "College name",
    "access": "college",
    "type": "string"
  }];

  return _event2.default.findById(req.params.id).exec().then(function (event) {
    var data = req.body;

    // Generate Excel 
    _mongoXlsx2.default.mongoData2Xlsx(data, model, function (err, data) {
      console.log('File saved at:', data.fullPath);

      // return res.status(201).send(data)
      return res.json(data.fullPath);
    });
  }).catch(handleError(res));
}
// Upserts the given Event in the DB at the specified ID
function upsert(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  console.log(req.body);
  return _event2.default.findOneAndUpdate(req.params.id, req.body, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }).exec().then(respondWithResult(res)).catch(handleError(res));
}

function update(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  if (!_validator2.default.isMongoId(req.params.id + '')) return res.status(400).send("Invalid Id");

  return _event2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(function (event) {
    event.name = req.body.name;
    event.info = req.body.info;
    event.faq = req.body.faq;
    event.rules = req.body.rules;
    event.awards = req.body.awards;
    event.date = new Date(req.body.date);
    event.startTime = new Date(req.body.startTime);
    event.endTime = new Date(req.body.endTime);
    event.venue = req.body.venue;
    event.poster = req.body.poster;
    event.contact = req.body.contact;
    event.problemStatement = req.body.problemStatement;
    event.paylink = req.body.paylink;
    event.save().then(respondWithResult(res)).catch(handleError(res));
  }).catch(handleError(res));
}

function register(req, res) {
  if (!_validator2.default.isMongoId(req.params.id + '')) return res.status(400).send("Invalid Id");

  return _event2.default.findById(req.params.id).exec().then(function (event) {
    var isRegistered = false;
    for (var i = 0; i < event.registered.length; ++i) {
      if (event.registered[i].user.equals(req.user._id)) {
        isRegistered = true;
        console.log('already registered');
        break;
      }
    }if (!isRegistered) event.registered.push({ user: req.user._id });

    event.save().then(respondWithResult(res)).catch(handleError(res));
  }).catch(handleError(res));
}
// Updates an existing Event in the DB
function patch(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  return _event2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(patchUpdates(req.body)).then(respondWithResult(res)).catch(handleError(res));
}

// Deletes a Event from the DB
function destroy(req, res) {
  return _event2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(removeEntity(res)).catch(handleError(res));
}
//# sourceMappingURL=event.controller.js.map
