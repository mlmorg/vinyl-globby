'use strict';
var extend = require('xtend');
var glob = require('glob');
var globParent = require('glob-parent');
var path = require('path');
var uniqueBy = require('unique-by');
var Vinyl = require('vinyl');
var waterfall = require('run-parallel');

module.exports = vinylGlobby;

function vinylGlobby(patterns, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  var sortedPatterns = sortPatterns(patterns);
  var positives = sortedPatterns.positives;
  var negatives = sortedPatterns.negatives;

  if (!positives.length) {
    return cb(null, []);
  }

  var fns = createVinylsFromPatternFns(positives, negatives, options);

  waterfall(fns, function onComplete(err, matches) {
    if (err) {
      return cb(err);
    }

    matches = Array.prototype.concat.apply([], matches);
    var uniques = uniqueBy(matches, 'path');
    return cb(null, uniques);
  });
}

function createVinylsFromPatternFns(positives, negatives, options) {
  return positives.map(function createVinylsFromPatternFn(positive) {
    var patternOptions = extend(options);
    var ignoreOpt = patternOptions.ignore || [];

    var negativePatterns = negativesAfterIndex(negatives, positive.index);
    patternOptions.ignore = ignoreOpt.concat(negativePatterns);

    return function getVinyls(cb) {
      vinylsFromPattern(positive.pattern, patternOptions, cb);
    };
  });
}

function negativesAfterIndex(negatives, index) {
  return negatives.filter(function keepNegativesAfterIndex(negative) {
    return negative.index > index;
  }).map(function getPattern(negative) {
    return negative.pattern;
  });
}

function vinylsFromPattern(pattern, options, cb) {
  glob(pattern, options, function handleGlob(err, filepaths) {
    if (err) {
      return cb(err);
    }

    cb(null, mapToVinyl(filepaths, pattern, options));
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

function mapToVinyl(filepaths, pattern, options) {
  return filepaths.map(function vinylMapper(filepath) {
    return createVinyl(filepath, pattern, options);
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
