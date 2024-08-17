
// modulo for negative numbers
Number.prototype.mod = function (n) {
  "use strict";
  return ((this.valueOf() % n) + n) % n;
};