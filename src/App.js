import React, { createContext, useEffect, useState, useContext } from 'react'
import { FormControl, InputLabel, NativeSelect } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import Search from './components/Search'
import NexusHub from './helper/NexusHub'
import { moneyToGSC } from './helper/WoWUtil'

import './App.css'

const util = require('util')

const ICON_URL_FORMAT = `https://render-classic-us.worldofwarcraft.com/icons/56/%s.jpg`

const initialAppState = {
  items: []
}

const initialPriceState = {
  prices: new Map()
}

export const AppContext = createContext(initialAppState)
export const PriceContext = createContext(initialPriceState)

const AppStore = ({ children }) => {
  const [appState, setAppState] = useState(initialAppState)
  const [priceState, setPriceState] = useState(initialPriceState)
  return (
    <AppContext.Provider value={[appState, setAppState]}>
      <PriceContext.Provider value={[priceState, setPriceState]}>
        {children}
      </PriceContext.Provider>
    </AppContext.Provider>
  )
}

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  margin: {
    margin: theme.spacing(1),
  }
}))

function SearchContainer() {
  const [serverList, setServerList] = useState([])
  const [server, setServer] = useState(null)
  const [faction, setFaction] = useState(NexusHub.FACTIONS[0])

  const [appState] = useContext(AppContext)
  const [priceState] = useContext(PriceContext)

  // TODO: check cache setServer/setFaction

  useEffect(() => {
    NexusHub.getServers().then(servers => {
      setServerList(servers)
      setServer(servers[0].slug)
    })
  }, [])

  function getItemKey(item) {
    if (!server || !faction) {
      return null
    } 
    return server.toLowerCase() + '-' + faction.toLowerCase() + '-' + item.uniqueName
  }

  function getItemPrice(item) {
    let itemPrice = '?'

    const itemKey = getItemKey(item)
    if (priceState.prices.has(itemKey)) {
      let cachePrice = priceState.prices.get(itemKey)
      if (cachePrice !== -1) {
        itemPrice = cachePrice
      }
    }

    if (itemPrice !== -1 && itemPrice !== '?' && itemPrice !== 'N/A') {
      itemPrice = moneyToGSC(parseInt(itemPrice)).toString()
    }
    return itemPrice
  }

  const classes = useStyles()

  return (
    <div>
      <div className={classes.root}>
        {server && <FormControl fullWidth className={classes.margin}>
          <InputLabel>Server</InputLabel>
          <NativeSelect
            value={server.slug}
            onChange={(e) => setServer(e.target.value)}>
            {serverList.map(server => (
              <option key={server.slug} value={server.slug}>{server.name}</option>
            ))}
          </NativeSelect>
        </FormControl>}

        <FormControl fullWidth className={classes.margin}>
          <InputLabel>Faction</InputLabel>
          <NativeSelect onChange={(e) => setFaction(e.target.value)}>
            {NexusHub.FACTIONS.map(faction => <option key={faction} value={faction}>{faction}</option>)}
          </NativeSelect>
        </FormControl>

        <FormControl fullWidth className={classes.margin}>
          <Search server={server} faction={faction} />
        </FormControl>
      </div>

      <div className="item-table">
        {appState.items.map(item => (
          <div className="search-item row">
            <div className="column left">
              <img src={util.format(ICON_URL_FORMAT, item.icon)}></img>
            </div>

            <div className="column middle">
              <span>{item.name}</span>
            </div>

            <div className="column right">
              <span>{getItemPrice(item)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function App() {
  return (
    <AppStore>
      <div className="App">
        <SearchContainer />
      </div>
    </AppStore>
  )
}

export default App
