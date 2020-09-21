/**
 * A class used to interact with NexusHub.co's API.
 * Primarily used for grabbing price data in accordance to
 * the server and faction your character is aligned with.
 * 
 * @summary A class used to interact with NexusHub.co's API
 * @author Tyler Sedlar <tyler@sedlar.me>
 * 
 * @since 9/20/2020
 */

const util = require('util')
const fetch = require('node-fetch')

const BASE_API = 'https://api.nexushub.co/wow-classic/v1'
const ITEM_API = `${BASE_API}/items/%s-%s/%s` // {server}-{alliance or horde}/{item}
const SERVER_API = `${BASE_API}/servers/full`

const SEARCH_API = `${BASE_API}/search?limit=%s&threshold=%s&query=%s`// limit, threshold, query
const SEARCH_SUGGEST_API = `${BASE_API}/search/suggestions?limit=%s&query=%s`// limit, query

const SUFFIXES = [
  'of Spirit',
  'of Intellect',
  'of Strength',
  'of Stamina',
  'of Agility',
  'of Frozen Wrath',
  'of Arcane Wrath',
  'of Fiery Wrath',
  'of Nature\'s Wrath',
  'of Healing',
  'of Shadow Wrath',
  'of Fire Resistance',
  'of Nature Resistance',
  'of Arcane Resistance',
  'of Frost Resistance',
  'of Shadow Resistance',
  'of Fire Protection',
  'of Nature Protection',
  'of Arcane Protection',
  'of Frost Protection',
  'of Shadow Protection',
  'Of the Tiger',
  'Of the Bear',
  'Of the Gorilla',
  'Of the Boar',
  'Of the Monkey',
  'Of the Falcon',
  'Of the Wolf',
  'Of the Eagle',
  'Of the Whale',
  'Of the Owl',
  'of Striking',
  'of Sorcery',
  'of Regeneration',
  'of Concentration',
  'of Blocking',
  'of Battle',
  'of the Ancestor',
  'of the Bandit',
  'of the Beast',
  'of the Champion',
  'of the Crusade',
  'of the Elder',
  'of the Grove',
  'of the Hunt',
  'of the Hierophant',
  'of the Invoker',
  'of the Knight',
  'of the Mind',
  'of the Nightmare',
  'of the Physician',
  'of the Prophet',
  'of the Shadow',
  'of the Soldier',
  'of the Sorcerer',
  'of the Sun',
  'of the Vision',
  'of the Wild',
  'of the Foreseer',
  'of the Marksman',
  'of the Necromancer',
  'of the Squire',
  'of the Thief',
  'Of Defense',
  'Of Power',
  'Of Marksmanship',
  'Of Eluding'
]

class NexusHub {

  constructor(server, faction) {
    this.server = server
    this.faction = faction
  }

  async fetchData(itemName) {
    const apiURL = util.format(ITEM_API, this.server, this.faction, itemName)
    const request = await fetch(apiURL)
    return await request.json()
  }
}

module.exports = NexusHub

module.exports.getServers = async function () {
  const request = await fetch(SERVER_API)
  let result = await request.json()

  if (!result.length) {
    result = []
  }

  return result
}

module.exports.searchItems = async function(query, limit = 10, threshold = 0.4) {
  const apiURL = util.format(SEARCH_API, limit, threshold, query)
  const request = await fetch(apiURL)
  let result = await request.json()

  if (!result.length) {
    result = []
  }

  return result
}

module.exports.searchSuggestedItems = async function(query, limit = 10) {
  const apiURL = util.format(SEARCH_SUGGEST_API, limit, query)
  const request = await fetch(apiURL)
  let result = await request.json()

  if (!result.length) {
    result = []
  }

  return result
}

module.exports.cleanItemSuffix = function(itemName) {
  for (let suffix of SUFFIXES) {
    if (itemName.toLowerCase().endsWith(suffix.toLowerCase())) {
      itemName = itemName.substring(0, itemName.length - suffix.length)
      itemName = itemName.replace(/\s\s+/g, ' ')
    }
  }
  return itemName
}

module.exports.FACTIONS = ['Alliance', 'Horde']
module.exports.SEARCH_RATE_LIMIT_PER_SEC = 15
module.exports.PRICE_RATE_LIMIT_PER_SEC = 10