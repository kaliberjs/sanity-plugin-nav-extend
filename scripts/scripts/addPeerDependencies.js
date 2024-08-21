const config = require('../package.json')
const childProcess = require('child_process')

if (process.env.PREVENT_LOOP) process.exit(0)

console.log('Installing peer dependencies')

const packages = Object.keys(config.peerDependencies)

const yarn = childProcess.spawn(
  'yarn',
  `add --peer --pure-lockfile`.split(' ').concat(packages),
  { env: { ...process.env, PREVENT_LOOP: 'true' } }
)
yarn.stdout.on('data', data => process.stdout.write(data))
yarn.stderr.on('data', data => process.stderr.write(data))
yarn.on('error', e => { throw e })
yarn.on('close', code => process.exit(code))
