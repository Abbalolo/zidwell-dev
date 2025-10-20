const SmeeClient = require('smee-client');

const smee = new SmeeClient({
  source: 'https://smee.io/FYwtgZlzpd4MJT9s',
  target: 'http://localhost:3000/api/webhook',
  logger: console
});

const events = smee.start();

console.log(events)

// To stop forwarding
// events.close()
