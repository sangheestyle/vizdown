var marked = require('marked'),
    parseContext = require('code-context'),
    _ = require('lodash'),
    addWith = require('with')

var _viz = require('./viz')

module.exports = render

function _generate_script(blocks) {
    var script = ''

    blocks.forEach(function(block) {

        if (block.type === 'text') {

            script = script + '\n' + '__render__(' + JSON.stringify(block.content) + ', __scope__())'

        } else if (block.type === 'code') {

            script = script + '\n' + '__code__(' + JSON.stringify(block.content) + ')'  
            script = script + '\n' + block.content
        }
    })

    return script
}

function render(blocks) {

    var script = _generate_script(blocks)
    // console.log(script)

    var context = parseContext(script)
    var declarations = _.filter(context, {
        type: 'declaration'
    })

    var html = ''
    function __render__(text, scope) {
        _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
        var compiled = _.template(text)        
        html = html + '\n' + marked(compiled(scope))
    }

    function __code__(code){
        html = html + '\n' + '<pre>' + code + '</pre>'
    }

    function __scope__() {
        var o = {}
        // for each declaration, extract the var to the scope        
        declarations.forEach(function(d) {
            o[d.name] = eval(d.name)
        })
        return o
    }

    // import viz methods to scope
    var viz = {}    
    for (var p in _viz){
        eval('viz.' + p + ' = function(data, options){ html = html + \'\\n\' + _viz.' + p + '(data,options)}')
    }    
    eval(script)
    return html
}