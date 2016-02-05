var vows = require('vows');
var assert = require('assert');
var config = require('../lib/config');
var path = require('path');
var sinon = require('sinon');

var _configLoad = config.load;
var _configLoadUrl = config.loadUrl;

vows.describe('config').addBatch({
  'loading from a file': {
    topic: function() {
      var configPath = path.join(__dirname, 'database.json');
      return config.load(configPath, 'dev');
    },

    'should export all environment settings': function (config) {
      assert.isDefined(config.dev);
      assert.isDefined(config.test);
      assert.isDefined(config.prod);
    },

    'should export a getCurrent function with all current environment settings': function (config) {
      assert.isDefined(config.getCurrent);
      var current = config.getCurrent();
      assert.equal(current.env, 'dev');
      assert.equal(current.settings.driver, 'sqlite3');
      assert.equal(current.settings.filename, ':memory:');
    }
  },
}).addBatch({
  'loading from a broken config file': {
    topic: function() {
      var configPath = path.join(__dirname, 'database_with_syntax_error.json');
      try {
        config.load(configPath, 'dev');
      } catch (e) {
        return e;
      }
      return;
    },

    'should throw a syntax error': function (error) {
      assert.isDefined(error);
      assert.ok(error instanceof SyntaxError, "Expected broken file to produce syntax error");
    }
  }
}).addBatch({
  'loading from a file with default env option': {
    topic: function() {
      var configPath = path.join(__dirname, 'database_with_default_env.json');
      return config.load(configPath);
    },

    'should load a value from the default env': function (config) {
      var current = config.getCurrent();
      assert.equal(current.env, 'local');
      assert.equal(current.settings.driver, 'sqlite3');
      assert.equal(current.settings.filename, ':memory:');
    },
  }
}).addBatch({
  'loading from a file with default env option in ENV variable': {
    topic: function() {
      process.env['NODE_ENV'] = 'local';
      var configPath = path.join(__dirname, 'database_with_default_env_from_env.json');
      return config.load(configPath);
    },

    'should load a value from the env set in NODE_ENV': function (config) {
      var current = config.getCurrent();
      assert.equal(current.settings.driver, 'sqlite3');
      assert.equal(current.settings.filename, ':memory:');
    },
  }
}).addBatch({
  'loading from a file with ENV vars': {
    topic: function() {
      process.env['DB_MIGRATE_TEST_VAR'] = 'username_from_env';
      var configPath = path.join(__dirname, 'database_with_env.json');
      return config.load(configPath, 'prod');
    },

    'should load a value from the environments': function (config) {
      assert.equal(config.prod.username, 'username_from_env');
    },
}

}).addBatch({
  'loading from a file with ENV URL': {
    topic: function() {
      process.env['DB_MIGRATE_TEST_VAR'] = 'postgres://uname:pw@server.com/dbname';
      var configPath = path.join(__dirname, 'database_with_env_url.json');
      return config.load(configPath, 'prod');
    },

    'should load a value from the environments': function (config) {
      var current = config.getCurrent();
      assert.equal(current.settings.driver, 'postgres');
      assert.equal(current.settings.user, 'uname');
      assert.equal(current.settings.password, 'pw');
      assert.equal(current.settings.host, 'server.com');
      assert.equal(current.settings.database, 'dbname');
    },
}

}).addBatch({
  'loading from an URL': {
    topic: function() {
      var databaseUrl = 'postgres://uname:pw@server.com/dbname';
      return config.loadUrl(databaseUrl, 'dev');
    },

    'should export the settings as the current environment': function (config) {
      assert.isDefined(config.dev);
    },

    'should export a getCurrent function with all current environment settings': function (config) {
      assert.isDefined(config.getCurrent);
      var current = config.getCurrent();
      assert.equal(current.env, 'dev');
      assert.equal(current.settings.driver, 'postgres');
      assert.equal(current.settings.user, 'uname');
      assert.equal(current.settings.password, 'pw');
      assert.equal(current.settings.host, 'server.com');
      assert.equal(current.settings.database, 'dbname');
    }
  }
}).addBatch({
  'loading from an URL and extending it': {
    topic: function() {
      var databaseUrl = {
          'dev': {
            'url': 'postgres://uname:pw@server.com/dbname',
            'overwrite': {
              'ssl': true
            }
          }
      };
      return config.loadObject(databaseUrl, 'dev');
    },

    'should export the settings as the current environment': function (config) {
      assert.isDefined(config.dev);
    },

    'should export a getCurrent function with all current environment settings': function (config) {
      assert.isDefined(config.getCurrent);
      var current = config.getCurrent();
      assert.equal(current.env, 'dev');
      assert.equal(current.settings.driver, 'postgres');
      assert.equal(current.settings.user, 'uname');
      assert.equal(current.settings.password, 'pw');
      assert.equal(current.settings.host, 'server.com');
      assert.equal(current.settings.database, 'dbname');
      assert.equal(current.settings.ssl, true);
    }
  }
}).addBatch({
  'loading from an ENV URL and extending it': {
    topic: function() {
      process.env.DATABASE_URL = 'postgres://uname:pw@server.com/dbname';
      var databaseUrl = {
          'dev': {
            'ENV': 'DATABASE_URL',
            'overwrite': {
              'ssl': true
            }
          }
      };
      return config.loadObject(databaseUrl, 'dev');
    },

    'should export the settings as the current environment': function (config) {
      assert.isDefined(config.dev);
    },

    'should export a getCurrent function with all current environment settings': function (config) {
      assert.isDefined(config.getCurrent);
      var current = config.getCurrent();
      assert.equal(current.env, 'dev');
      assert.equal(current.settings.driver, 'postgres');
      assert.equal(current.settings.user, 'uname');
      assert.equal(current.settings.password, 'pw');
      assert.equal(current.settings.host, 'server.com');
      assert.equal(current.settings.database, 'dbname');
      assert.equal(current.settings.ssl, true);
    }
  }
}).addBatch({
  'loading from an ENV URL within the object and extending it': {
    topic: function() {
      process.env.DATABASE_URL = 'postgres://uname:pw@server.com/dbname';
      var databaseUrl = {
          'dev': {
            'url': { 'ENV': 'DATABASE_URL' },
            'overwrite': {
              'ssl': true
            }
          }
      };
      return config.loadObject(databaseUrl, 'dev');
    },

    'should export the settings as the current environment': function (config) {
      assert.isDefined(config.dev);
    },

    'should export a getCurrent function with all current environment settings': function (config) {
      assert.isDefined(config.getCurrent);
      var current = config.getCurrent();
      assert.equal(current.env, 'dev');
      assert.equal(current.settings.driver, 'postgres');
      assert.equal(current.settings.user, 'uname');
      assert.equal(current.settings.password, 'pw');
      assert.equal(current.settings.host, 'server.com');
      assert.equal(current.settings.database, 'dbname');
      assert.equal(current.settings.ssl, true);
    }
  }
}).addBatch({
  'loading from an ENV URL within the object and extending it from the ENV': {
    topic: function() {
      process.env.DATABASE_URL = 'postgres://uname:pw@server.com/dbname';
      var databaseUrl = {
          'dev': {
            'url': {
              'ENV': 'DATABASE_URL',
              'overwrite': {
                'ssl': true
              }
            }
          }
      };
      return config.loadObject(databaseUrl, 'dev');
    },

    'should export the settings as the current environment': function (config) {
      assert.isDefined(config.dev);
    },

    'should export a getCurrent function with all current environment settings': function (config) {
      assert.isDefined(config.getCurrent);
      var current = config.getCurrent();
      assert.equal(current.env, 'dev');
      assert.equal(current.settings.driver, 'postgres');
      assert.equal(current.settings.user, 'uname');
      assert.equal(current.settings.password, 'pw');
      assert.equal(current.settings.host, 'server.com');
      assert.equal(current.settings.database, 'dbname');
      assert.equal(current.settings.ssl, true);
    }
  }
}).addBatch({
  'loading from an ENV URL within the object and extending it from the ENV': {
    topic: function() {
      process.env.DATABASE_URL = 'postgres://uname:pw@server.com/dbname?ssl=false&testing=false';
      var databaseUrl = {
          'dev': {
            'url': {
              'ENV': 'DATABASE_URL',
              'overwrite': {
                'ssl': true,
                'cache': false
              },
              'addIfNotExist': {
                'native': true,
                'testing': true
              }
            }
          }
      };
      return config.loadObject(databaseUrl, 'dev');
    },

    'should export the settings as the current environment': function (config) {
      assert.isDefined(config.dev);
    },

    'should export a getCurrent function with all current environment settings and correctly overwrite and add': function (config) {
      assert.isDefined(config.getCurrent);
      var current = config.getCurrent();
      assert.equal(current.env, 'dev');
      assert.equal(current.settings.driver, 'postgres');
      assert.equal(current.settings.user, 'uname');
      assert.equal(current.settings.password, 'pw');
      assert.equal(current.settings.host, 'server.com');
      assert.equal(current.settings.database, 'dbname');
      assert.equal(current.settings.native, true);
      assert.equal(current.settings.testing, false);
      assert.equal(current.settings.cache, false);
      assert.equal(current.settings.ssl, true);
    }
  }
}).addBatch({
  'should throw on duplicate entries on two levels': {
    topic: function() {
      process.env.DATABASE_URL = 'postgres://uname:pw@server.com/dbname';
      var databaseUrl = {
          'dev': {
            'url': {
              'ENV': 'DATABASE_URL',
              'overwrite': {
                'ssl': true
              }
            },
            'overwrite': {
              'ssl': true
            }
          }
      };

      var configSpy = sinon.spy(config, 'loadObject');
      this.callback(config.loadObject(databaseUrl, 'dev'), configSpy);
    },

    'should throw and deliver no config': function (config, spy) {
      assert(spy.threw());
      assert.isNotDefined(config.dev);
    }
  }
}).addBatch({
  'loading a config with null values': {
    topic: function() {
        var configPath = path.join(__dirname, 'database_with_null_values.json');
        config.load = _configLoad;
        config.loadUrl = _configLoadUrl;
        try {
            config.load(configPath, 'dev');
        }catch(e) {
            return e;
        }
        return null;
    },

    'should something': function(err) {
        assert.isNull(err);
    },

    teardown: function() {
      delete require.cache[require.resolve('../lib/config')];
    }
  }
}).export(module);
