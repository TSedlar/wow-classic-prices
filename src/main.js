const NexusHub = require('./NexusHub')

async function main() {
  const nexus = new NexusHub('myzrael', 'alliance')
  const peacebloom = await nexus.fetchData('peacebloom')

  const servers = await NexusHub.getServers()

  console.log(servers)

  console.log(peacebloom)

  console.log(NexusHub.cleanItemSuffix('Cadet Shield of the Gorilla'))
}

(async () => {
  main()
})()