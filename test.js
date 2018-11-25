const test = require('tape')
const sjp = require('.')

function cleanSourceMap (node) {
  if (node == null) return
  delete node.start
  delete node.end
  delete node.raw
  Object.keys(node).forEach(k => typeof node[k] === 'object' ? cleanSourceMap(node[k]) : null)
  return node
}
test('streaming-js-parser', t => {
  t.plan(4)
  const code = `var i = 0

function App({foo}) { return <div>{foo}</div> }`
  let called = 0

  sjp(code).on('data', d => {
    cleanSourceMap(d)
    called++

    t.ok(called < 4)
    if (d[0].type === 'VariableDeclaration') {
      t.deepEqual(d, [{
        type: 'VariableDeclaration',
        kind: 'var',
        declarations: [{
          type: 'VariableDeclarator',
          id: { type: 'Identifier', name: 'i' },
          init: { type: 'Literal', value: 0 }
        }]
      }])
    } else {
      t.deepEqual(JSON.parse(JSON.stringify(d)), [ {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'App' },
        expression: false,
        generator: false,
        async: false,
        params:
     [ {
       type: 'ObjectPattern',
       properties:
          [ {
            type: 'Property',
            method: false,
            shorthand: true,
            computed: false,
            key: { type: 'Identifier', name: 'foo' },
            kind: 'init',
            value: { type: 'Identifier', name: 'foo' } } ] } ],
        body:
      {
        type: 'BlockStatement',
        body:
        [ {
          type: 'ReturnStatement',
          argument:
              {
                type: 'JSXElement',
                openingElement:
                 {
                   type: 'JSXOpeningElement',
                   attributes: [],
                   name: { type: 'JSXIdentifier', name: 'div' },
                   selfClosing: false },
                closingElement:
                 {
                   type: 'JSXClosingElement',
                   name: { type: 'JSXIdentifier', name: 'div' } },
                children:
                [ {
                  type: 'JSXExpressionContainer',
                  expression: { type: 'Identifier', name: 'foo' } } ] } } ] } } ]
      )
    }
  })
})
