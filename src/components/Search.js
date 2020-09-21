/**
 * Searches NexusHub for item details
 * 
 * @summary Searches NexusHub for item details
 * @author Tyler Sedlar <tyler@sedlar.me>
 * 
 * @since 9/20/2020
 */

import React, { useEffect, useState, useContext, createRef } from 'react'
import Autosuggest from 'react-autosuggest'

import NexusHub from '../helper/NexusHub'

import { CacheContext } from '../App'

const throttle = require('p-throttle')
const searchThrottle = throttle(async (nexus, cache, query, setResults) => {
    console.log(`${cache.prices.size} prices are cached`)

    let items = await NexusHub.searchSuggestedItems(NexusHub.cleanItemSuffix(query), 10, 0.4)
    items = items.map(i => {
        i.price = '?'
        return i
    })

    setResults(items)

    console.log(`found [${items.length}] results`)

    for (let item of items) {
        console.log(`queueing item ${item.uniqueName}`)
        priceThrottle(nexus, cache, items, item).catch(_ => {}) // catch abort
    }
}, NexusHub.SEARCH_RATE_LIMIT_PER_SEC, 1000)

const priceThrottle = throttle(async (nexus, cache, item) => {
    if (!cache.prices.has(item.uniqueName)) {
        const itemData = await nexus.fetchData(item.uniqueName)
        const price = resolvePrice(item, itemData)

        if (price == -1) {
            price = '?'
        }

        item.price = price

        cache.prices.set(item.uniqueName, price)
    } else {
        item.price = cache.prices.get(item.uniqueName)
    }
    
    console.log(`${item.name} = ${item.price}`)
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

    return (
        <Autosuggest
            suggestions={results}
            onSuggestionsFetchRequested={() => { console.log('no') }}
            onSuggestionsClearRequested={() => { console.log('yes') }}
            getSuggestionValue={() => { console.log('suggest') }}
            renderSuggestion={(r) => {
                return (
                    <div className="search-item">
                        <img src={r.imgUrl}></img>
                        <span>{r.name}</span>
                        <span>{r.price}</span>
                    </div>
                )
            }}
            inputProps={{
                placeholder: 'Search items...',
                value: query || '',
                onChange: setItemQuery
            }}
        />
    )

    function setItemQuery(event) {
        setQuery(event.target.value)
    }
}

export default Search