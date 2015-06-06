'use strict';
var asyncEach = require('async-each');
var EventEmitter = require('events').EventEmitter;
var extend = require('xtend');
var glob = require('glob');
var globParent = require('glob-parent');
var inherits = require('util').inherits;
var isIgnored = require('glob/common').isIgnored;
var once = require('once');
var path = require('path');
var Vinyl = require('vinyl');

module.exports = VinylGlobby;

inherits(VinylGlobby, EventEmitter);

function VinylGlobby(patterns, options, cb) {
  var self = this;

  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  if (!(this instanceof VinylGlobby)) {
    return new VinylGlobby(patterns, options, cb);
  }

  if (typeof cb === 'function') {
    setupCb(this, cb);
  }

  var sortedPatterns = sortPatterns(patterns);
  if (!sortedPatterns.positives.length) {
    return self.emit('end', []);
  }

  globPatterns(sortedPatterns, options, matchHandler, cbHandler);

  function matchHandler(match) {
    self.emit('match', match);
  }

  function cbHandler(err, matches) {
    if (err) {
      return self.emit('error', err);
    }
    self.emit('end', matches);
  }
}

function setupCb(self, cb) {
  cb = once(cb);
  self.on('error', cb);
  self.on('end', function callbackWithMatches(matches) {
    cb(null, matches);
  });
}

function globPatterns(patterns, options, matchHandler, cb) {
  var positives = patterns.positives;
  var negatives = patterns.negatives;
  var globbers = [];
  var matches = [];

  asyncEach(positives, function startGlob(positive, _cb) {
    var patternOptions = extend(options);
    var ignoreOpt = patternOptions.ignore || [];
    var negativePatterns = negativesAfterIndex(negatives, positive.index);
    patternOptions.ignore = ignoreOpt.concat(negativePatterns);

    var globber = globPattern(positive.pattern, patternOptions, onMatch, _cb);
    globbers.push(globber);
  }, onComplete);

  function onMatch(match) {
    if (exists(match, matches)) {
      return;
    }
    matches.push(match);
    matchHandler(match);
  }

  function onComplete(err) {
    if (err) {
      abortGlobbers(globbers);
      return cb(err);
    }
    cb(null, matches);
  }
}

function globPattern(pattern, options, matchHandler, cb) {
  var globber = new glob.Glob(pattern, options);
  globber.on('match', handleMatch);
  globber.on('error', cb);
  globber.on('end', handleEnd);
  return globber;

  function handleMatch(filepath) {
    if (isIgnored(globber, filepath)) {
      return;
    }
    var match = createVinyl(filepath, pattern, options);
    matchHandler(match);
  }

  function handleEnd() {
    cb(null);
  }
}

function abortGlobbers(globbers) {
  globbers.forEach(function abortGlobber(globber) {
    globber.abort();
  });
}

function createVinyl(filepath, pattern, options) {
  var base = globParent(pattern);
  if (base === filepath) {
    base = path.dirname(base);
  }

  return new Vinyl({
    cwd: options && options.cwd,
    path: filepath,
    base: base
  });
}

function exists(match, matches) {
  return matches.some(function checkIfExists(existingMatch) {
    return match.path === existingMatch.path;
  });
}

function sortPatterns(patterns) {
  patterns = Array.isArray(patterns) ? patterns : [patterns];

  var positives = [];
  var negatives = [];

  patterns.forEach(function sortPatterns(pattern, index) {
    var isNegative = pattern[0] === '!';
    var patternArray = isNegative ? negatives : positives;
    pattern = isNegative ? pattern.slice(1) : pattern;

    patternArray.push({
      index: index,
      pattern: pattern
    });
  });

  return {
    positives: positives,
    negatives: negatives
  };
}

function negativesAfterIndex(negatives, index) {
  return negatives.filter(function keepNegativesAfterIndex(negative) {
    return negative.index > index;
  }).map(function getPattern(negative) {
    return negative.pattern;
  });
}
