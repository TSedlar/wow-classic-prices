import React, { createContext, useEffect, useState, useContext } from 'react'
import { FormControl, InputLabel, NativeSelect } from '@material-ui/core'
import { makeStyles, ThemeProvider, createMuiTheme } from '@material-ui/core/styles'

import Search from './components/Search'
import { FACTIONS, getServers } from './helper/NexusHub'
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
    flexWrap: 'wrap'
  },
  margin: {
    margin: theme.spacing(1)
  }
}))

const theme = createMuiTheme({
  palette: {
    type: 'dark',
    text: {
      primary: '#ad9c68'
    },
    primary: {
      main: '#ad9c68',
    }
  },
})

function SearchContainer() {
  const [serverList, setServerList] = useState([])
  const [server, setServer] = useState(null)
  const [faction, setFaction] = useState(FACTIONS[0])

  const [appState] = useContext(AppContext)
  const [priceState] = useContext(PriceContext)

  // TODO: check cache setServer/setFaction

  useEffect(() => {
    getServers().then(servers => {
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

  function getItemPrice(item, key) {
    let itemPrice = '?'

    const itemKey = getItemKey(item)
    if (priceState.prices.has(itemKey)) {
      let cachePrice = priceState.prices.get(itemKey)
      if (cachePrice !== null && cachePrice[key]) {
        try {
          const directPrice = cachePrice[key]
          if (directPrice === 'N/A') {
            itemPrice = directPrice
          } else {
            itemPrice = moneyToGSC(parseInt(directPrice)).toString()
          }
        } catch (_) { // parse error
          itemPrice = 'N/A'
        }
      } else {
        itemPrice = 'N/A'
      }
    }

    return itemPrice
  }

  const classes = useStyles()

  function getItemPriceElements(item) {
    const itemPrices = []
    const historicalPrice = getItemPrice(item, 'historical')
    const marketPrice = getItemPrice(item, 'market')
    const vendorPrice = getItemPrice(item, 'vendor')

    if (historicalPrice !== 'N/A') {
      itemPrices.push(
        <div key={"historical-" + getItemKey(item)} >
          <img src="/static/images/historical.png" />
          <span>{historicalPrice}</span>
        </div>
      )
    }

    if (marketPrice !== 'N/A') {
      itemPrices.push(
        <div key={"market-" + getItemKey(item)} >
          <img src="/static/images/market.png" />
          <span>{marketPrice}</span>
        </div>
      )
    }

    if (vendorPrice !== 'N/A') {
      itemPrices.push(
        <div key={"vendor-" + getItemKey(item)} >
          <img className="vendor" src="/static/images/vendor.png" />
          <span>{vendorPrice}</span>
        </div>
      )
    }

    if (itemPrices.length === 0) {
      itemPrices.push(
        <div key={"na-price-" + getItemKey(item)} >
          <span>Prices N/A</span>
        </div>
      )
    }

    return itemPrices
  }

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
            {FACTIONS.map(faction => <option key={faction} value={faction}>{faction}</option>)}
          </NativeSelect>
        </FormControl>

        <FormControl fullWidth className={classes.margin}>
          <Search server={server} faction={faction} />
        </FormControl>
      </div>

      <div className="item-table">
        {appState.items.map(item => (
          <div key={"item-" + getItemKey(item)} className="search-item item">
            <div key={"icon-" + getItemKey(item)} className="item-icon">
              <img src={util.format(ICON_URL_FORMAT, item.icon)}></img>
            </div>

            <div key={"name-" + getItemKey(item)} className="item-name">
              <span>{item.name}</span>
            </div>

            <div key={"prices-" + getItemKey(item)} className="item-prices">
              {getItemPriceElements(item)}
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
      <ThemeProvider theme={theme}>
        <div className="App">
          <SearchContainer />
        </div>
      </ThemeProvider>
    </AppStore>
  )
}

export default App
