/**
 * The entry point for this web application
 * 
 * @summary The entry point for this web application
 * @author Tyler Sedlar <tyler@sedlar.me>
 * 
 * @since 9/20/2020
 */

import React, { createContext, useState, useContext, useEffect } from 'react'
import { FormControl, InputLabel, NativeSelect } from '@material-ui/core'
import { makeStyles, ThemeProvider, createMuiTheme } from '@material-ui/core/styles'

import Search from './components/Search'
import { FACTIONS, getServers } from './helper/NexusHub'
import { moneyToGSC } from './helper/WoWUtil'

import './App.css'

const util = require('util')
const Cookies = require('js-cookie')

const ICON_URL_FORMAT = `https://render-classic-us.worldofwarcraft.com/icons/56/%s.jpg`
const WOWHEAD_URL_FORMAT = `https://tbc.wowhead.com/item=%s`

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

function SearchContainer(props) {
  const [server, setServer] = useState(props.defaultServer)
  const [faction, setFaction] = useState(props.defaultFaction)

  const [appState] = useContext(AppContext)
  const [priceState] = useContext(PriceContext)

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
          <img src="/static/images/historical.png" alt="historical price icon"/>
          <span>{historicalPrice}</span>
        </div>
      )
    }

    if (marketPrice !== 'N/A') {
      itemPrices.push(
        <div key={"market-" + getItemKey(item)} >
          <img src="/static/images/market.png" alt="market price icon"/>
          <span>{marketPrice}</span>
        </div>
      )
    }

    if (vendorPrice !== 'N/A') {
      itemPrices.push(
        <div key={"vendor-" + getItemKey(item)} >
          <img className="vendor" src="/static/images/vendor.png" alt="vendor price icon"/>
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

  function openWowHeadLink(item) {
    window.open(util.format(WOWHEAD_URL_FORMAT, item.itemId))
  }

  return (
    <div>
      <div className={classes.root}>
        <FormControl fullWidth className={classes.margin}>
          <InputLabel>Server</InputLabel>
          <NativeSelect
            defaultValue={props.defaultServer}
            onChange={(e) => {
              Cookies.set('server', e.target.value, { expires: 365 })
              setServer(e.target.value)
            }}>
            {props.servers.map(server => (
              <option
                key={server.slug}
                value={server.slug}>
                {server.name}
              </option>
            ))}
          </NativeSelect>
        </FormControl>

        <FormControl fullWidth className={classes.margin}>
          <InputLabel>Faction</InputLabel>
          <NativeSelect
            onChange={(e) => {
              Cookies.set('faction', e.target.value, { expires: 365 })
              setFaction(e.target.value)
            }}
            defaultValue={props.defaultFaction}>
            {FACTIONS.map(faction => <option key={faction} value={faction}>{faction}</option>)}
          </NativeSelect>
        </FormControl>

        <FormControl fullWidth className={classes.margin}>
          <Search server={server} faction={faction} />
        </FormControl>
      </div>

      <div className="item-table">
        {appState.items.map(item => (
          <div key={"item-" + getItemKey(item)}
            className="search-item item"
            onClick={() => openWowHeadLink(item)}>
            <div key={"icon-" + getItemKey(item)} className="item-icon">
              <img src={util.format(ICON_URL_FORMAT, item.icon)} alt={item.name}></img>
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
  let defaultServer = Cookies.get('server') || null
  let defaultFaction = Cookies.get('faction') || FACTIONS[0]

  const [servers, setServers] = useState(null)

  if (!servers) {
    getServers().then(servers => {
      if (!defaultServer) {
        defaultServer = servers[0].slug
      }
      setServers(servers)
    })
  }

  // only debug on initial render
  useEffect(() => {
    console.log('cookie server: ' + defaultServer)
    console.log('cookie faction: ' + defaultFaction)
  }, [])

  return servers && (
    <AppStore>
      <ThemeProvider theme={theme}>
        <div className="App">
          <SearchContainer servers={servers} defaultServer={defaultServer} defaultFaction={defaultFaction} />
        </div>
      </ThemeProvider>
    </AppStore>
  )
}

export default App
