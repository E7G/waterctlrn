
  var bufferView;
  var base64ReverseLookup = new Uint8Array(123/*'z'+1*/);
  for (var i = 25; i >= 0; --i) {
    base64ReverseLookup[48+i] = 52+i; // '0-9'
    base64ReverseLookup[65+i] = i; // 'A-Z'
    base64ReverseLookup[97+i] = 26+i; // 'a-z'
  }
  base64ReverseLookup[43] = 62; // '+'
  base64ReverseLookup[47] = 63; // '/'
  /** @noinline Inlining this function would mean expanding the base64 string 4x times in the source code, which Closure seems to be happy to do. */
  function base64DecodeToExistingUint8Array(uint8Array, offset, b64) {
    var b1, b2, i = 0, j = offset, bLength = b64.length, end = offset + (bLength*3>>2) - (b64[bLength-2] == '=') - (b64[bLength-1] == '=');
    for (; i < bLength; i += 4) {
      b1 = base64ReverseLookup[b64.charCodeAt(i+1)];
      b2 = base64ReverseLookup[b64.charCodeAt(i+2)];
      uint8Array[j++] = base64ReverseLookup[b64.charCodeAt(i)] << 2 | b1 >> 4;
      if (j < end) uint8Array[j++] = b1 << 4 | b2 >> 2;
      if (j < end) uint8Array[j++] = b2 << 6 | base64ReverseLookup[b64.charCodeAt(i+3)];
    }
  }
function initActiveSegments(imports) {
  base64DecodeToExistingUint8Array(bufferView, 0, "AAQFAAEFBAABBQQBAAQFAAEFBAEABAUBAAQFAAEFBAABBQQBAAQFAQAEBQABBQQBAAQFAAEFBAABBQQBAAQFAAEFBAEABAUBAAQFAAEFBAEABAUAAQUEAAEFBAEABAUBAAQFAAEFBAABBQQBAAQFAAEFBAEABAUBAAQFAAEFBAABBQQBAAQFAQAEBQABBQQBAAQFAAEFBAABBQQBAAQFAQAEBQABBQQAAQUEAQAEBQABBQQBAAQFAQAEBQABBQQBAAQFAAEFBAABBQQBAAQFAAEFBAEABAUBAAQFAAEFBAABBQQBAAQFAQAEBQABBQQBAAQFAAEFBAABBQQBAAQFAABAgcABQYDAAUGAwQBAgcABQYDBAECBwQBAgcABQYDAAUGAwQBAgcEAQIHAAUGAwQBAgcABQYDAAUGAwQBAgcABQYDBAECBwQBAgcABQYDBAECBwAFBgMABQYDBAECBwQBAgcABQYDAAUGAwQBAgcABQYDBAECBwQBAgcABQYDAAUGAwQBAgcEAQIHAAUGAwQBAgcABQYDAAUGAwQBAgcEAQIHAAUGAwAFBgMEAQIHAAUGAwQBAgcEAQIHAAUGAwQBAgcABQYDAAUGAwQBAgcABQYDBAECBwQBAgcABQYDAAUGAwQBAgcEAQIHAAUGAwQBAgcABQYDAAUGAwQBAgcAAAQEAAgMDAgcGBgcFBAQFDQwMDQ8ODg8KCwsKCAkJCBkYGBkbGhobHh8fHhwdHRwUFRUUFhcXFhMSEhMREBARMTAwMTMyMjM2Nzc2NDU1NDw9PTw+Pz8+Ozo6Ozk4ODkoKSkoKisrKi8uLi8tLCwtJSQkJScmJiciIyMiICEhIGFgYGFjYmJjZmdnZmRlZWRsbW1sbm9vbmtqamtpaGhpeHl5eHp7e3p/fn5/fXx8fXV0dHV3dnZ3cnNzcnBxcXBQUVFQUlNTUldWVldVVFRVXVxcXV9eXl9aW1taWFlZWElISElLSkpLTk9PTkxNTUxERUVERkdHRkNCQkNBQEBBAAEBAwMCAgYGBwcFBQQEAAABwQPDwgIGxscHxQUExAzMzQ3PDw7OygoLywnJyAgY2NkZ2xsa2t4eH98d3dwc1BQV1RfX1hYS0tMT0REQ0DDw8THzMzLy9jY39zX19DT8PD39P//+Pjr6+zv5OTj46Cgp6Svr6iou7u8v7S0s7CTk5SXnJybm4iIj4yHh4CBgoKFho2NioqZmZ6dlpaRkrGxtrW+vrm5qqqtrqWloqLh4ebl7u7p6fr6/f719fLx0tLV1t3d2trJyc7NxsbBwkFBRkVOTklJWlpdXlVVUlFycnV2fX16emlpbm1mZmFhIiIlJi0tKio5OT49NjYxMhERFhUeHhkZCgoNDgUFAgFAAkGDwwFCgMMBQoDAAkGDwwFCgMACQYPAAkGDwwFCgMMBQoDAAkGDwAJBg8MBQoDAAkGDwwFCgMMBQoDAAkGDwwFCgMACQYPAAkGDwwFCgMACQYPDAUKAwwFCgMACQYPAAkGDwwFCgMMBQoDAAkGDwwFCgMACQYPAAkGDwwFCgMMBQoDAAkGDwAJBg8MBQoDAAkGDwwFCgMMBQoDAAkGDwAJBg8MBQoDDAUKAwAJBg8MBQoDAAkGDwAJBg8MBQoDAAkGDwwFCgMMBQoDAAkGDwwFCgMACQYPAAkGDwwFCgMMBQoDAAkGDwAJBg8MBQoDAAkGDwwFCgMMBQoDAAkGDwAAECAwQFBgcICQoLDA0ODxAREhMRFBEVFhcYGRobHB0THh8gISIPIxghJBAjJSYfIicoKSorLC0lIA8MEy4vKjAXMTIzNDU2NzgDOToNJDknIiUGOzw9Pj8FD0BBQkM6REVGLx4FK0cTSElKSx8bPkxNIA5MTk9QUVIxHklTIlQYVVYQV1hZWkIkDVszXF0UIF5DXx1WVQs6YGFBYjk3Y2QEBmUIZmdoESBpF2EbHmoxFms2bAc4bW48Um8mQXAncVo0RHJzAUwKahYcdBkWK1FOdRJcPRVdAiJTTxFpdikJWXcbeER5ensFD3wrAX0sVQYFfgx/gA8AGoEDMR48eAABAgMABAUGBwgJCgsMDQ4DDxAREhMUFRYXGBkaGxwdFh4fICEiIyQlJhQnKCkqKywcLSInDC4vMDEyMzQ1NjMTNAI3ODk6OzwaFD0EPj9AQUIeQ0RFDUZHSElIJEpISx9MG01LAU5FTRMcTjUfJyRPKFAkNxM1G1FSJk9TVB0cJkZEVUJGVjkzP1dYKwlZWlNbXEgxLRw+XUcXXkpfMi9SYD8mYRMUYmNkK2UeZmc6ZRgnDARoQ0ATaWo3axQabEldXgptAgEQWWdub0twbEVxBgByEXN0AzhscEF1D3Y1Vicecw1cNUh3eHk7eho9ex18EUx9Lhh+fwU8gAeBRgx1N1Ih9tVI2KC5vMySOVTz+T7iV6NbxlXRlzJmxWTANGXJUb1h1xJFcmqsWSDKXzDBY2fNWDUjXFrU8l2nFPVgOEbEpmhAJ6IcqdNBMZH40AQMx4kkVtJCGEPwCqQZGza3zyJt2fcWSRU9oWJTOhOo9Mi66x5EbxDDD6VQ1mkA8Xfpz/Ki1bdGwFkgQ0VMRVPUYTnyIVpcIzVYzWdjVcGmxEY489Vg9RSnXUjXUUVmNEHTqRxXolnAMCdAaCSJxwwE0PgxVGWRksy8uaDY9lI3dWTFMpfRxls+o+L5Er3JrF/KIGpyHqHruvDIbz0ZpERp1lClD8MQQ+l38QBWChhC0m0iz7c2GxVJFvfZ9KgTOlNiMevz17o3ZZJXVUZGPDM=");
}
function asmFunc(imports) {
 var buffer = new ArrayBuffer(65536);
 var HEAP8 = new Int8Array(buffer);
 var HEAP16 = new Int16Array(buffer);
 var HEAP32 = new Int32Array(buffer);
 var HEAPU8 = new Uint8Array(buffer);
 var HEAPU16 = new Uint16Array(buffer);
 var HEAPU32 = new Uint32Array(buffer);
 var HEAPF32 = new Float32Array(buffer);
 var HEAPF64 = new Float64Array(buffer);
 var Math_imul = Math.imul;
 var Math_fround = Math.fround;
 var Math_abs = Math.abs;
 var Math_clz32 = Math.clz32;
 var Math_min = Math.min;
 var Math_max = Math.max;
 var Math_floor = Math.floor;
 var Math_ceil = Math.ceil;
 var Math_trunc = Math.trunc;
 var Math_sqrt = Math.sqrt;
 function $0($0_1, $1, $2, $3) {
  $0_1 = $0_1 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  var $4 = 0, $6 = 0, $8 = 0, $5 = 0, $7 = 0;
  if (($1 | 0) == (255 | 0) & ($0_1 & 1 | 0 | 0) == (1 | 0) | 0) {
   $0_1 = $0_1 + 2 | 0
  }
  if (($0_1 | 0) == (257 | 0)) {
   $0_1 = 0
  }
  $4 = $3 & 7 | 0;
  $8 = $3 & (-1 ^ 7 | 0) | 0;
  if ($8 & (1 << 3 | 0) | 0) {
   $4 = $4 ^ 4 | 0
  }
  if ($8 & (1 << 4 | 0) | 0) {
   $4 = $4 ^ 4 | 0
  }
  if ($8 & (1 << 5 | 0) | 0) {
   $4 = $4 ^ 4 | 0
  }
  if ($8 & (1 << 6 | 0) | 0) {
   $4 = $4 ^ 4 | 0
  }
  if ($8 & (1 << 7 | 0) | 0) {
   $4 = $4 ^ 4 | 0
  }
  $4 = $4 ^ (HEAPU8[(0 + $1 | 0) >> 0] | 0) | 0;
  if ($0_1 & (1 << 0 | 0) | 0) {
   $4 = $4 ^ 1 | 0
  }
  if ($0_1 & (1 << 1 | 0) | 0) {
   $4 = $4 ^ 1 | 0
  }
  if ($0_1 & (1 << 2 | 0) | 0) {
   $4 = $4 ^ 2 | 0
  }
  if ($0_1 & (1 << 3 | 0) | 0) {
   $4 = $4 ^ 7 | 0
  }
  if ($0_1 & (1 << 4 | 0) | 0) {
   $4 = $4 ^ 1 | 0
  }
  if ($0_1 & (1 << 5 | 0) | 0) {
   $4 = $4 ^ 1 | 0
  }
  if ($0_1 & (1 << 6 | 0) | 0) {
   $4 = $4 ^ 1 | 0
  }
  if ($0_1 & (1 << 7 | 0) | 0) {
   $4 = $4 ^ 1 | 0
  }
  $6 = $2 & 7 | 0;
  $8 = $2 & (-1 ^ 7 | 0) | 0;
  if ($8 & (1 << 3 | 0) | 0) {
   $6 = $6 ^ 4 | 0
  }
  if ($8 & (1 << 4 | 0) | 0) {
   $6 = $6 ^ 4 | 0
  }
  if ($8 & (1 << 5 | 0) | 0) {
   $6 = $6 ^ 4 | 0
  }
  if ($8 & (1 << 6 | 0) | 0) {
   $6 = $6 ^ 4 | 0
  }
  if ($8 & (1 << 7 | 0) | 0) {
   $6 = $6 ^ 4 | 0
  }
  $6 = $6 ^ (HEAPU8[(768 + ($1 & 15 | 0) | 0) >> 0] | 0) | 0;
  $3 = (HEAPU8[(256 + $1 | 0) >> 0] | 0) ^ $3 | 0;
  $3 = (HEAPU8[(512 + $0_1 | 0) >> 0] | 0) ^ $3 | 0;
  $5 = HEAPU8[(1296 + $3 | 0) >> 0] | 0;
  $2 = (HEAPU8[(784 + $1 | 0) >> 0] | 0) ^ $2 | 0;
  $2 = (HEAPU8[(1040 + $0_1 | 0) >> 0] | 0) ^ $2 | 0;
  $7 = HEAPU8[(1552 + $2 | 0) >> 0] | 0;
  HEAP8[2099 >> 0] = HEAPU8[(1938 + $4 | 0) >> 0] | 0;
  HEAP8[2098 >> 0] = HEAPU8[(1808 + $5 | 0) >> 0] | 0;
  HEAP8[2097 >> 0] = HEAPU8[(2082 + $6 | 0) >> 0] | 0;
  HEAP8[2096 >> 0] = HEAPU8[(1952 + $7 | 0) >> 0] | 0;
 }
 
 bufferView = HEAPU8;
 initActiveSegments(imports);
 function __wasm_memory_size() {
  return buffer.byteLength / 65536 | 0;
 }
 
 function __wasm_memory_grow(pagesToAdd) {
  pagesToAdd = pagesToAdd | 0;
  var oldPages = __wasm_memory_size() | 0;
  var newPages = oldPages + pagesToAdd | 0;
  if ((oldPages < newPages) && (newPages < 65536)) {
   var newBuffer = new ArrayBuffer(Math_imul(newPages, 65536));
   var newHEAP8 = new Int8Array(newBuffer);
   newHEAP8.set(HEAP8);
   HEAP8 = new Int8Array(newBuffer);
   HEAP16 = new Int16Array(newBuffer);
   HEAP32 = new Int32Array(newBuffer);
   HEAPU8 = new Uint8Array(newBuffer);
   HEAPU16 = new Uint16Array(newBuffer);
   HEAPU32 = new Uint32Array(newBuffer);
   HEAPF32 = new Float32Array(newBuffer);
   HEAPF64 = new Float64Array(newBuffer);
   buffer = newBuffer;
   bufferView = HEAPU8;
  }
  return oldPages;
 }
 
 return {
  "memory": Object.create(Object.prototype, {
   "grow": {
    "value": __wasm_memory_grow
   }, 
   "buffer": {
    "get": function () {
     return buffer;
    }
    
   }
  }), 
  "makeKey": $0
 };
}

var retasmFunc = asmFunc({
});
export var memory = retasmFunc.memory;
export var makeKey = retasmFunc.makeKey;
