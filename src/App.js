import React, { createContext, useEffect, useState, Reducer, useReducer } from 'react'
import Search from './components/Search'
import NexusHub from './helper/NexusHub'

import './App.css'

const initialCacheState = {
  prices: new Map()
}

export const CacheContext = createContext(initialCacheState)

const CacheStore = ({children}) => {
  const [state, dispatch] = useState(initialCacheState)
  return (
      <CacheContext.Provider value={[state, dispatch]}>
          {children}
      </CacheContext.Provider>
  )
}

function SearchContainer() {
  const [serverList, setServerList] = useState([])
  const [server, setServer] = useState(null)
  const [faction, setFaction] = useState(NexusHub.FACTIONS[0])

  // TODO: check cache setServer/setFaction

  useEffect(() => {
    NexusHub.getServers().then(servers => setServerList(servers))
  }, [])

  useEffect(() => {
    setServer(serverList[0])
  }, [serverList])

  return (
    <div>
      <select onChange={(e) => setServer(e.target.value)}>
        {serverList.map(server => <option key={server.slug}>{server.name}</option>)}
      </select>
      
      <select onChange={(e) => setFaction(e.target.value)}>
        {NexusHub.FACTIONS.map(faction => <option key={faction}>{faction}</option>)}
      </select>

        <Search server={server} faction={faction} />
    </div>
  )
}

function App() {
  return (
      <CacheStore>
        <div className="App">
          <SearchContainer />
        </div>
      </CacheStore>
  )
}

export default App
