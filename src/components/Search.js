/**
 * Searches NexusHub for item details
 * 
 * @summary Searches NexusHub for item details
 * @author Tyler Sedlar <tyler@sedlar.me>
 * 
 * @since 9/20/2020
 */

import React, { useEffect, useState, useContext } from 'react'
import Autosuggest from 'react-autosuggest'

import NexusHub from '../helper/NexusHub'

import { CacheContext } from '../App'

const throttle = require('p-throttle')

const searchThrottle = throttle(async (query) => {
    return await NexusHub.searchSuggestedItems(NexusHub.cleanItemSuffix(query), 10, 0.4)
}, NexusHub.SEARCH_RATE_LIMIT_PER_SEC, 1000)

const priceThrottle = throttle(async (nexus, item) => {
    const itemData = await nexus.fetchData(item.uniqueName)
    return resolvePrice(item, itemData)
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
                price = 'N/A'
                console.log(`No historical/market data for ${item.name}`)
            }
        } else {
            price = 'N/A'
        }
    } catch (dataErr) {
        console.log(`No statistical data for ${item.name}`)
        price = 'N/A'
    }

    return price
}

async function fetchSearchData(cache, options) {
    let items = []
    try {
        items.push(...(await searchThrottle(options.query) || []))
    } catch (_) {} // catch early abort

    options.setResults(items)

    console.log(`found [${items.length}] results`)

    for (let item of items) {
        if (!cache.prices.has(item.uniqueName)) {
            let itemPrice = -1
            try {
                itemPrice = await priceThrottle(options.nexus, item)
            } catch (_) {} // catch early abort

            cache.prices.set(item.uniqueName, itemPrice)
            options.setCache({ prices: cache.prices })
            console.log(`${item.name} = ${itemPrice}`)
        } else {
            console.log(`price cached for ${item.name} (${cache.prices.get(item.uniqueName)})`)
        }
    }

    options.setCache({ prices: cache.prices })
}

function Search(props) {
    const [query, setQuery] = useState(null)
    const [results, setResults] = useState([])
    const [nexus, setNexus] = useState(null)

    const [cache, setCache] = useContext(CacheContext)

    useEffect(() => {
        if (nexus && props.server && props.faction && query && query.length >= 2) {
            searchThrottle.abort()
            priceThrottle.abort()

            setResults([])

            fetchSearchData(cache, { nexus, query, setResults, setCache })
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
                let itemPrice = '?'
                if (cache.prices.has(r.uniqueName)) {
                    let cachePrice = cache.prices.get(r.uniqueName)
                    if (cachePrice !== -1) {
                        itemPrice = cachePrice
                    }
                }

                return (
                    <div className="search-item">
                        <img src={r.imgUrl}></img>
                        <span>{r.name}</span>
                        <span>{itemPrice}</span>
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