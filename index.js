var path = require('path');
var dir = require('node-dir');
var vow = require('vow');

function TransferWebpackPlugin(patterns, basePath) {
    this.patterns = patterns || [];
    this.basePath = basePath;
}

TransferWebpackPlugin.prototype.apply = function(compiler) {
    var _this = this;
    var basePath = this.basePath || compiler.options.context || null;

    compiler.plugin('emit', function(compilation, cb) {
        if (!basePath) {
            compilation.errors.push(new Error('TransferWebpackPlugin: no basePath provided'));
            cb();
        }

        var promises = [];

        _this.patterns.forEach(function(pattern) {
            promises.push(_this.processDir(path.resolve(basePath, pattern.from), pattern.to, compilation));
        });

        vow.all(promises).then(function() {
            cb();
        }).fail(function(text) {
            compilation.errors.push(new Error(text));
            cb();
        });
    });
};

TransferWebpackPlugin.prototype.processDir = function(from, to, compilation) {
    var defer = vow.defer();

    dir.readFiles(from, function(err, content, filename, next) {
        if (err) {
            defer.reject('TransferWebpackPlugin: Unable to transfer file: ' + filename);
            return;
        }

        var fileName = path.basename(filename);
        var distName = to ? path.join(to, fileName) : fileName;

        console.log(distName)

        compilation.assets[distName] = {
            source: function() {
                return content;
            },
            size: function() {
                return content.length;
            }
        };

        next();
    }, function(err) {
        if (err) {
            defer.reject('TransferWebpackPlugin: ' + err);
        }

        defer.resolve();
    });

    return defer.promise();
};

module.exports = TransferWebpackPlugin;
