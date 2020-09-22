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

import NexusHub, { cleanItemSuffix, PRICE_RATE_LIMIT_PER_SEC } from '../helper/NexusHub'
import ThrottledPromiseQueue from '../helper/ThrottledPromiseQueue'
import { levenshtein } from '../helper/StringUtil'

import { AppContext, PriceContext } from '../App'

const CLASSIC_ITEMS = require('wow-classic-items/data/json/data.json')

const itemDataQueue = new ThrottledPromiseQueue(PRICE_RATE_LIMIT_PER_SEC)

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

    if (historical === -1 && market === -1 && vendor === -1) {
        historical = 'N/A'
        market = 'N/A'
        vendor = 'N/A'
    }

    return {
        historical, market, vendor
    }
}

function getKey(nexus, item) {
    return nexus.server.toLowerCase() + '-' + nexus.faction.toLowerCase() + '-' + item.uniqueName
}

function Search(props) {
    const [query, setQuery] = useState(null)
    const [nexus, setNexus] = useState(null)
    const [enterDate, setEnterDate] = useState(Date.now())

    const [appState, setAppState] = useContext(AppContext)
    const [priceState, setPriceState] = useContext(PriceContext)

    function fetchData(fuzzyItems) {
        for (let item of fuzzyItems) {
            const itemKey = getKey(nexus, item)
            if (!priceState.prices.has(itemKey)) {
                itemDataQueue.push(
                    nexus.fetchData(item.uniqueName)
                ).then(itemData => {
                    const itemPrice = resolvePrice(itemData)
                    if (itemPrice) {
                        priceState.prices.set(itemKey, itemPrice)
                        console.log(`${item.name} (${itemKey}) = ${itemPrice}`)
                        setPriceState({ prices: priceState.prices })
                    }
                })
            } else {
                console.log(`price cached for ${item.name} (${priceState.prices.get(itemKey)})`)
            }
        }
    }

    useEffect(() => {
        if (!nexus && props.server && props.faction) {
            console.log('Server: ' + props.server)
            console.log('Faction: ' + props.faction)
            setNexus(new NexusHub(props.server, props.faction))
        }

        if (nexus && props.server && props.faction && query && query.length >= 3) {
            itemDataQueue.stop()

            // remove items with an invalid price due to aborting
            for (let key of priceState.prices.keys()) {
                if (priceState.prices.get(key) === null) {
                    priceState.prices.delete(key)
                }
            }

            // get only most similar matches
            let fuzzyItems = CLASSIC_ITEMS.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))

            // sort by similarity
            fuzzyItems.sort((a, b) => {
                const aSimilarity = levenshtein(a.name.toLowerCase(), query.toLowerCase())
                const bSimilarity = levenshtein(b.name.toLowerCase(), query.toLowerCase())
                return aSimilarity - bSimilarity
            })

            // top 10 ranked matches
            fuzzyItems = fuzzyItems.slice(0, Math.min(fuzzyItems.length, 10))

            setAppState({ items: fuzzyItems })

            fetchData(fuzzyItems)
        } else {
            itemDataQueue.stop()

            setAppState({ items: [] })
            setPriceState({ prices: priceState.prices }) // keep prices cached
        }
    }, [query, enterDate])

    return (
        <TextField
            label="Query"
            variant="outlined"
            onChange={setItemQuery}
            onKeyPress={handleKeyPress} />
    )

    function setItemQuery(event) {
        setQuery(cleanItemSuffix(event.target.value))
    }

    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            setEnterDate(Date.now())
        }
    }
}

export default Search