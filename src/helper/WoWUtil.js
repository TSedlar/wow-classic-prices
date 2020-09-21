module.exports.moneyToGSC = (m) => {
  if (m < 0) {
    return 'N/A'
  }
  const gold = parseInt(Math.floor(m / 1000))
  const silver = parseInt(Math.floor((m % 1000) / 100))
  const copper = parseInt(Math.floor((m % 1000) % 100))
  return { gold, silver, copper, toString: () => `${gold}g ${silver}s ${copper}c` }
}