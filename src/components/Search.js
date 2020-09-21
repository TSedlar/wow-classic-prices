/**
 * Searches NexusHub for item details
 * 
 * @summary Searches NexusHub for item details
 * @author Tyler Sedlar <tyler@sedlar.me>
 * 
 * @since 9/20/2020
 */

import React, { useEffect, useState, useContext } from 'react'
import { TextField } from '@material-ui/core';

import NexusHub, {
    PRICE_RATE_LIMIT_PER_SEC,
    cleanItemSuffix
} from '../helper/NexusHub'

import { AppContext, PriceContext } from '../App'

const CLASSIC_ITEMS = require('wow-classic-items/data/json/data.json')
const throttle = require('p-throttle')
const stringComp = require('string-similarity')

const priceThrottle = throttle(async (nexus, item) => {
    const itemData = await nexus.fetchData(item.uniqueName)
    return resolvePrice(itemData)
}, PRICE_RATE_LIMIT_PER_SEC, 1000)

function resolvePrice(itemData) {
    let historical = -1
    let market = -1
    let vendor = -1

    try {
        if (itemData.stats && itemData.stats.current) {
            if (itemData.stats.current.historicalValue) {
                historical = itemData.stats.current.historicalValue
            }

            if (itemData.stats.current.marketValue) {
                market = itemData.stats.current.marketValue
            }
        }
        if (itemData.vendorPrice) {
            vendor = itemData.vendorPrice
        }
    } catch (dataErr) {
    }

    if (historical !== -1 && historical !== '-1') {
        return historical
    } else if (market !== -1 && market !== '-1') {
        return market
    } else if (vendor !== -1 && vendor !== '-1') {
        return vendor
    }

    return 'N/A'
}

function getKey(nexus, item) {
    return nexus.server.toLowerCase() + '-' + nexus.faction.toLowerCase() + '-' + item.uniqueName
}

function Search(props) {
    const [query, setQuery] = useState(null)
    const [nexus, setNexus] = useState(null)

    const [appState, setAppState] = useContext(AppContext)
    const [priceState, setPriceState] = useContext(PriceContext)

    useEffect(() => {
        if (!nexus && props.server && props.faction) {
            console.log('Server: ' + props.server)
            console.log('Faction: ' + props.faction)
            setNexus(new NexusHub(props.server, props.faction))
        }

        if (nexus && props.server && props.faction && query && query.length >= 3) {
            priceThrottle.abort()

            // remove items with an invalid price due to aborting
            for (let key of priceState.prices.keys()) {
                if (priceState.prices.get(key) === -1) {
                    priceState.prices.delete(key)
                }
            }

            setPriceState({ prices: priceState.prices })

            // get only most similar matches
            let fuzzyItems = CLASSIC_ITEMS.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))

            // sort by similarity
            // fuzzyItems.sort((a, b) => {
            //     const aSimilarity = stringComp.compareTwoStrings(a.name.toLowerCase(), query.toLowerCase())
            //     const bSimilarity = stringComp.compareTwoStrings(b.name.toLowerCase(), query.toLowerCase())
            //     return bSimilarity - aSimilarity
            // })

            // top 10 ranked matches
            fuzzyItems = fuzzyItems.slice(0, Math.min(fuzzyItems.length, 10))

            setAppState({ items: fuzzyItems })

            async function fetchData() {
                for (let item of fuzzyItems) {
                    const itemKey = getKey(nexus, item)
                    if (!priceState.prices.has(itemKey)) {
                        let itemPrice = -1
                        try {
                            itemPrice = await priceThrottle(nexus, item)
                        } catch (_) {
                            console.log('Aborted priceThrottle')
                        } // catch early abort

                        if (itemPrice !== -1) {
                            priceState.prices.set(itemKey, itemPrice)
                            console.log(`${item.name} (${itemKey}) = ${itemPrice}`)
                        }
                    } else {
                        console.log(`price cached for ${item.name} (${priceState.prices.get(itemKey)})`)
                    }

                    setPriceState({ prices: priceState.prices })
                }

                setPriceState({ prices: priceState.prices })
            }

            // fetchData()
        } else {
            setAppState({ items: [] })
            setPriceState({ prices: priceState.prices })
        }
    }, [query])

    return (
        <TextField label="Query" variant="outlined" onChange={setItemQuery}></TextField>
    )

    function setItemQuery(event) {
        setQuery(cleanItemSuffix(event.target.value))
    }
}

export default Search