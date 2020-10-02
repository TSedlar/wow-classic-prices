/**
 * A utility class for world of warcraft related methods
 * 
 * @summary A world of warcraft utility class
 * @author Tyler Sedlar <tyler@sedlar.me>
 * 
 * @since 9/20/2020
 */

module.exports.moneyToGSC = (m) => {
  if (m < 0) {
    return 'N/A'
  }
  const gold = parseInt(Math.floor(m / 10000))
  const silver = parseInt(Math.floor((m % 10000) / 100))
  const copper = parseInt(Math.floor((m % 10000) % 100))
  return { gold, silver, copper, toString: () => `${gold}g ${silver}s ${copper}c` }
}