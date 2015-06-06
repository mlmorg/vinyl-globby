'use strict';
var fs = require('fs');
var path = require('path');
var process = require('process');
var Vinyl = require('vinyl');
var test = require('tape');

var vinylGlobby = require('../');

test('single glob', function t(assert) {
  var pattern = 'test/fixtures/**/*.js';
  var bases = ['test/fixtures/', 'test/fixtures/'];
  runVinylGlobby(assert, pattern, 2, bases);
});

test('specific file', function t(assert) {
  var pattern = 'test/fixtures/bar.js';
  var bases = ['test/fixtures/'];
  runVinylGlobby(assert, pattern, 1, bases);
});

test('multiple globs', function t(assert) {
  var pattern = ['test/fixtures/*.js', 'test/fixtures/lib/*.js'];
  var bases = ['test/fixtures/', 'test/fixtures/lib/'];
  runVinylGlobby(assert, pattern, 2, bases);
});

test('multiple globs that match the same files', function t(assert) {
  var pattern = ['test/fixtures/*.js', 'test/fixtures/bar.js'];
  var bases = ['test/fixtures/'];
  runVinylGlobby(assert, pattern, 1, bases);
});

test('negative globs behind positive globs', function t(assert) {
  var pattern = ['test/fixtures/**/*.js', '!test/fixtures/bar.js'];
  var bases = ['test/fixtures/'];
  runVinylGlobby(assert, pattern, 1, bases);
});

test('negative globs before positive globs', function t(assert) {
  var pattern = ['!test/fixtures/bar.js', 'test/fixtures/**/*.js'];
  var bases = ['test/fixtures/', 'test/fixtures/'];
  runVinylGlobby(assert, pattern, 2, bases);
});

test('only negative globs', function t(assert) {
  var pattern = ['!test/fixtures/**/*.js'];
  runVinylGlobby(assert, pattern, 0);
});

test('with cwd option', function t(assert) {
  var pattern = '**/*.js';
  var bases = ['./', './'];
  var cwd = path.join(__dirname, 'fixtures');
  vinylGlobby(pattern, {cwd: cwd}, function onGlob(err, files) {
    assert.ifError(err,
      'should not error');

    assertFiles(assert, files, 2, bases);

    assert.ok((files[0].cwd === cwd) && (files[1].cwd === cwd),
      'should set cwd on vinyl objects');

    assert.end();
  });
});

test('error globbing', function t(assert) {
  var pattern = 'test/fixtures/*.js';

  var readdir = fs.readdir;
  fs.readdir = function mockReaddir(filepath, cb) {
    var err = new Error('some error');
    process.nextTick(cb.bind(null, err));
  };

  vinylGlobby(pattern, function onGlob(err) {
    assert.ok(err,
      'should callback with error');

    fs.readdir = readdir;
    assert.end();
  });
});

test('emitter, with success', function t(assert) {
  var pattern = 'test/fixtures/**/*.js';
  var matches = [];

  var globber = vinylGlobby(pattern);
  globber.on('match', function calledMatch(match) {
    if (match) {
      matches.push(match);
    }
  });
  globber.on('end', function calledEnd(endMatches) {
    assert.ok(matches.length === 2,
      'calls the match event with match');

    assert.ok(endMatches.length,
      'calls the end event with matches');

    assert.end();
  });
});

test('emitter, with error', function t(assert) {
  var pattern = 'test/fixtures/*.js';

  var readdir = fs.readdir;
  fs.readdir = function mockReaddir(filepath, cb) {
    var err = new Error('some error');
    process.nextTick(cb.bind(null, err));
  };

  var globber = vinylGlobby(pattern);
  globber.on('error', function onError(err) {
    assert.ok(err,
      'should call error event with error');

    fs.readdir = readdir;
    assert.end();
  });
});

function runVinylGlobby(assert, pattern, foundAmount, bases) {
  vinylGlobby(pattern, function onGlob(err, files) {
    assert.ifError(err,
      'should not error');

    assertFiles(assert, files, foundAmount, bases);

    assert.end();
  });
}

function assertFiles(assert, files, foundAmount, bases) {
  assert.equal(files.length, foundAmount,
    'globs files correctly');

  if (files.length) {
    files.forEach(function eachFile(file, i) {
      assert.ok(file instanceof Vinyl,
        'creates vinyl objects');

      assert.equal(file.base, bases[i],
        'sets the vinyl base correctly');
    });
  }
}
