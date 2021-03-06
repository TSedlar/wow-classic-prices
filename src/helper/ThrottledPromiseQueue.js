/**
 * A throttled queue that can be stopped at any time
 * 
 * @summary A throttled and cancelable queue
 * @author Tyler Sedlar <tyler@sedlar.me>
 * 
 * @since 9/21/2020
 */

const { cancelable, CancelablePromise } = require('cancelable-promise');

export default class ThrottledPromiseQueue {

  constructor(ratePerSecond) {
    this.ratePerSecond = ratePerSecond
    this.wait = 1000 / ratePerSecond
    this.promise = this._createNewPromise()
  }

  _createNewPromise() {
    return new CancelablePromise((res) => res())
  }

  push(promise) {
    const self = this

    self.promise = self.promise.then(_ => cancelable(new Promise((res) => {
      setTimeout(() => {
        res(promise)
      }, self.wait)
    })))

    return self.promise
  }

  stop() {
    this.promise.cancel()
    this.promise = this._createNewPromise()
  }
}