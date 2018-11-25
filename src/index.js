const acorn = require('acorn')
const acornJsx = require('acorn-jsx')
const stream = require('stream')
const toStream = require('string-to-stream')

module.exports = code => {
  if (typeof code === 'string') {
    code = toStream(code)
  }
  let processed

  return new stream.Readable({
    objectMode: true,
    read () {
      if (processed) return
      let codeStr = ''
      code
        .on('data', d => {
          d = d + ''

          const attemptParse = () => {
            try {
              const parsed = acorn.Parser.extend(acornJsx({
                allowNamespacedObjects: true
              })).parse(codeStr)

              codeStr = ''

              if (parsed.body.length) this.push(parsed.body)
            } catch (e) { }
          }

          while (/\n(?!\s*\()/.test(d)) {
            codeStr += d.slice(0, d.indexOf('\n') + 1)
            attemptParse()

            d = d.slice(d.indexOf('\n') + 1)
          }

          codeStr += d
          attemptParse()
        })
      code
        .on('end', () => {
          if (codeStr) {
            this.emit('error', new Error('extra code found at the end: ' + codeStr))
            return
          }
          this.emit('end')
        })
    }
  })
}
