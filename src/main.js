const NexusHub = require('./helper/NexusHub')

async function main() {
  const nexus = new NexusHub('myzrael', 'alliance')
  // const peacebloom = await nexus.fetchData('peacebloom')

  // const servers = await NexusHub.getServers()

  // console.log(servers)

  // console.log(peacebloom)

  // console.log(NexusHub.cleanItemSuffix('Cadet Shield of the Gorilla'))

  const pasta = await NexusHub.searchItems('linen Cloth', 1) // some random they click on
  
  console.log(pasta)

  const data = await nexus.fetchData(pasta[0].uniqueName)

  console.log(data)
}

(async () => {
  main()
})()