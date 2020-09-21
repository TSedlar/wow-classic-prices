/**
 * Searches NexusHub for item details
 * 
 * @summary Searches NexusHub for item details
 * @author Tyler Sedlar <tyler@sedlar.me>
 * 
 * @since 9/20/2020
 */

import React, { useEffect, useState, useContext } from 'react'

import NexusHub from '../helper/NexusHub'

import { CacheContext } from '../App'

const throttle = require('p-throttle')
const searchThrottle = throttle(async (nexus, cache, query, setResults) => {
    console.log(`${cache.prices.size} prices are cached`)

    const items = await NexusHub.searchSuggestedItems(NexusHub.cleanItemSuffix(query), 10, 0.4)

    console.log(`found [${items.length}] results`)

    setResults(items)

    for (let item of items) {
        console.log(`queueing item ${item.uniqueName}`)
        priceThrottle(nexus, cache, item).catch(_ => {}) // catch abort
    }
}, NexusHub.SEARCH_RATE_LIMIT_PER_SEC, 1000)

const priceThrottle = throttle(async (nexus, cache, item) => {
    if (!cache.prices.has(item.uniqueName)) {
        const itemData = await nexus.fetchData(item.uniqueName)
        const price = resolvePrice(item, itemData)
        cache.prices.set(item.uniqueName, price)
    }
    
    console.log(`${item.name} = ${cache.prices.get(item.uniqueName)}`)
}, NexusHub.PRICE_RATE_LIMIT_PER_SEC, 1000)

function resolvePrice(item, itemData) {
    let price = -1

    try {
        if (itemData.stats && itemData.stats.current) {
            if (itemData.stats.current.historicalValue) {
                price = itemData.stats.current.historicalValue
            } else if (itemData.stats.current.marketValue) {
                price = itemData.stats.current.marketValue
            } else {
                console.log(`No historical/market data for ${item.name}`)
            }
        }
    } catch (dataErr) {
        console.log(`No statistical data for ${item.name}`)
    }

    return price
}

function Search(props) {
    const [query, setQuery] = useState(null)
    const [results, setResults] = useState([])
    const [nexus, setNexus] = useState(null)

    const [cache] = useContext(CacheContext)

    useEffect(() => {
        if (nexus && props.server && props.faction && query && query.length >= 2) {
            searchThrottle.abort()
            priceThrottle.abort()
            searchThrottle(nexus, cache, query, setResults).catch(_ => {}) // catch abort
        } else if (!nexus && props.server && props.faction) {
            setNexus(new NexusHub(props.server.slug, props.faction))
        } 
    }, [query])

    // useEffect(() => {
    //     for (let key of Object.keys(prices)) { // key = item.uniqueName
    //         // find element with key item.uniqueName, set some price element text to prices[key]
    //     }
    // }, [cache.prices])

    return (
        <input type="text" onChange={setItemQuery}></input>
    )

    function setItemQuery(event) {
        setQuery(event.target.value)
    }
}

export default Search