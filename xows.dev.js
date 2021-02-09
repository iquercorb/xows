/*
 * @licstart
 *                    X.O.W.S - XMPP Over WebSocket
 *                        v0.9.0 - (Jan. 2021)
 *                          ____       ____
 *                          \   \     /   /
 *                           \    \_/    /
 *                      .   .-           -.   .
 *                     /|  /   -.     .-   \  |\
 *                    | \_/  |___\   /___|  \_/ |
 *                    .                         .
 *                     \.__       ___       __./
 *                         /     /   \     \ 
 *                        /_____/     \_____\
 *         
 *                 Copyright (c) 2020 - 2021 Eric M.
 * 
 *     This file is part of X.O.W.S (XMPP Over WebSocket Library).
 * 
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 * 
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source
 * 
 * @licend
 */
 
"use strict";

/* ------------------------------------------------------------------
 * 
 *                            Base API
 * 
 * ------------------------------------------------------------------ */

/* --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  
 *       Applications constants and common utilities fonctions 
 * --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  -- */
 
/**
 * Global application (client) constants
 */
const XOWS_APP_NAME = "Xows";
const XOWS_APP_VERS = "0.9.0";
const XOWS_APP_NODE = "https://github.com/sedenion/xows";

/**
 * Xows Logo SVG path
 */
const XOWS_LOGO_SVG = new Path2D("M8.282 6.527l2.514 3.942c-2.33 1.463-3.431 3.529-4.134 5.785-2.326.221-1.5-4.322-1.659-5.373 0 0-2.945 5.92-.822 7.584 1.518 1.19 4.09 1.651 4.09 1.651l-3.268 4.146c2.224.748 7.17.825 7.17.825l2.837-4.416h2.054l2.837 4.417s4.946-.078 7.17-.826l-3.268-4.146s2.558-.477 4.09-1.651c1.964-1.506-.822-7.584-.822-7.584-.159 1.051.667 5.594-1.66 5.373-.701-2.257-1.803-4.322-4.134-5.785l2.514-3.942c-.98-1.003-2.247-1.753-3.34-1.576l-3.786 4.692h-1.257L11.622 4.95c-1.091-.177-2.358.573-3.34 1.576zm4.104 6.495c.63 1.175 1.797 3.073 1.797 3.073s-1.005.029-1.95.029c-.944 0-1.598-.05-1.598-.754s.322-2.348 1.75-2.348zm7.264 0c1.449 0 1.75 1.644 1.75 2.348 0 .705-.596.754-1.598.754a74.34 74.34 0 01-1.95-.029S19 14.197 19.65 13.022z");

/**
 * Check whether the the given value matches the specified bitmask.
 *  
 * @param   {number}  value   Value to check bits.
 * @param   {number}  mask    Mask to test bits in value.
 * 
 * @return  {boolean} true if mask matches value, false otherwise
 */
function xows_has_bits(value, mask)
{
  return ((value & mask) === mask);
}
 
/**
 * Check whether an object is a valid JavaScript function.
 *  
 * @param   {object}  obj     Object or variable to check.
 * 
 * @return  {boolean} True if object is a function, false otherwise.
 */
function xows_is_func(obj) {
  return (obj && obj.constructor && obj.call && obj.apply);
}

/**
 * Pseudo-random, seed based, number generation using the
 * Mulberry32 PRNG algorithm.
 * 
 * @param   {number}  seed   Seed to generate number.
 * 
 * @return  {number}  Pseudo-random number between 0.0 and 1.0
 */
function xows_random(seed) 
{
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

/**
 * Global signal or log level
 */
const XOWS_SIG_ERR = 0;
const XOWS_SIG_WRN = 1;
const XOWS_SIG_LOG = 2;

/**
 * Output formated log string to javascript console.
 *  
 * @param   {number}  level       Verbose level.
 * @param   {string}  scope       Message origin, scope or context.
 * @param   {string}  message     Main content or title.
 * @param   {string}  [details]   Additional details.
 * @param   {string}  [color]     Color to apply to content.
 */
function xows_log(level, scope, message, details, color)
{
  if(level <= xows_options.verbose) {
    
    let style, body = "";
    
    if(level > 1 && color) { 
      body += "%c";
      style = "color:"+color;
    }
    
    body += message;
    if(details) body += ": " + details;
    
    const output = scope + ": " + body;
    
    // Output log to console
    switch(level)  {
    case 0: 
      console.warn(output); 
      break;
    case 1: 
      console.warn(output); 
      break;
    default: 
      if(style) {
        console.log(output, style); 
      } else {
        console.log(output); 
      }
      break;
    }
  }
}

/* --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  
 *          low-level strings and bytes conversion functions
 * --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  -- */

/**
 * Character map for bytes to hexadecimal string conversions.
 */
const XOWS_CMAP_HEX = "0123456789abcdef";

/**
 * Character map for bytes to Base-64 conversions.
 */
const XOWS_CMAP_B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Get numerical UTF-8 equivalent of the given UTF-16 DOMString. 
 * 
 * The resulting DOMstring is not printable as unicode (since DOMString 
 * is anyway parsed as UTF-16) but is numerically valid and can be 
 * safely transposed char by char into an Uint8Array.
 * 
 * @param   {string}  str     DOMString (UTF-16) to encode.
 * 
 * @return  {string}  New DOMString with UTF-8 values as characters.
 */
function xows_str_to_utf8(str)
{
  let c, u, utf8 = "";
  for(let i = 0, n = str.length; i < n; ++i) {
    c = str.charCodeAt(i);
    if(c < 0x80) {
      utf8 += str.charAt(i);
    } else if(c < 0x800) {
      utf8 += String.fromCharCode(0xC0|(c>> 6), 
                                  0x80|(c&0x3F));                  
    } else if(c < 0xD800 || c >= 0xE000) {
      utf8 += String.fromCharCode(0xE0|(c>>12), 
                                  0x80|((c>>6)&0x3F), 
                                  0x80|(c&0x3F));                  
    } else { // surrogate pair
      ++i; u = str.charCodeAt(i); //< step and get the next char
      c = 0x10000 + (((c & 0x3FF) << 10) | (u & 0x3FF));
      utf8 += String.fromCharCode(0xF0|(c>>18), 
                                  0x80|((c>>12)&0x3F), 
                                  0x80|((c>>6)&0x3F), 
                                  0x80|(c&0x3F));
    }
  }
  return utf8;
}

/**
 * Get the length in bytes of the given UTF-16 DOMstring as encoded 
 * to its UTF-8 equivalent.
 * 
 * @param   {string}  str     DOMString (UTF-16) to compute length.
 * 
 * @return  {string}  Encoded UTF-8 equivalent length in bytes.
 */
function xows_str_bytes_len(str)
{
  let c, len = 0;
  for(let i = 0, n = str.length; i < n; ++i) {
    c = str.charCodeAt(i);
    if(c < 0x80) { len++; } 
    else if(c < 0x800) { len += 2; } 
    else if(c < 0xD800 || c >= 0xE000) { len += 3; } 
    else { ++i; len += 4; }
  }
  return len;
}

/**
 * Get the UTF-8 encoded equivalent of UTF-16 DOMString as Uint8Array.
 * 
 * If len parameter is defined, the function returns an Uint8Array of 
 * the specified length instead of the required to store data.
 * 
 * @param   {string}  str     Input string to encode.
 * @param   {number}  len     Optional length of the returned Uint8Array.
 * 
 * @return  {Uint8Array} UTF-8 encoded string as Uint8Array
 */
function xows_str_to_bytes(str, len)
{ 
  let c, u;
  const uint8 = new Uint8Array(len ? len : xows_str_bytes_len(str));
  for(let i = 0, p = 0, n = str.length; i < n; ++i) {
    c = str.charCodeAt(i); 
    if(c < 0x80) {
      uint8[p++] = c;
    } else if(c < 0x800) {
      uint8[p++] = 0xC0|(c>>6); 
      uint8[p++] = 0x80|(c&0x3F);
    } else if(c < 0xD800 || c >= 0xE000) {
      uint8[p++] = 0xE0|(c>>12); 
      uint8[p++] = 0x80|((c>>6)&0x3F);
      uint8[p++] = 0x80|(c&0x3F);
    } else { // surrogate pair
      ++i; u = str.charCodeAt(i); //< step and get the next char
      c = 0x10000+(((c&0x3FF)<<10)|(u&0x3FF));
      uint8[p++] = 0xF0|(c>>18); 
      uint8[p++] = 0x80|((c>>12)&0x3F);
      uint8[p++] = 0x80|((c>> 6)&0x3F); 
      uint8[p++] = 0x80|(c&0x3F);
    }
  }
  return uint8;
}

/**
 * Convert bytes values to a string of the same length
 * with same values but as ASCII characters.
 * 
 * @param   {Uint8Array}  uint8   Input bytes data.
 * 
 * @return  {string} Resulting DOMString object.
 */
function xows_bytes_to_str(uint8) 
{
  // This is way faster, but does'nt work with large buffers due to
  // max argument count implementation limit. If needed use the 
  // alternate implementation commented below
  return String.fromCharCode.apply(null, uint8);
  /*
  let str = "";
  for(let i = 0, n = uint8.length; i < n; ++i) 
    str += String.fromCharCode(uint8[i]);
  return str;
  */
}

/**
 * Encodes bytes data to base64.
 * 
 * @param   {Uint8Array}  uint8   Input bytes data.
 * 
 * @return  {string} Resulting base64 string.
 */
function xows_bytes_to_b64(uint8) 
{
  // This is way faster, but does'nt work with large buffers due to
  // max argument count implementation limit. If needed use the 
  // alternate implementation commented below
  const len = uint8.length, rem = len % 3;  //< remaining bytes after per-triplet division
  let p, n, t, b64 = "";
  // main block, per triplets
  for(p = 0, n = len - rem; p < n; ) {  
    t = (uint8[p++] << 16) | (uint8[p++] << 8) | uint8[p++];
    b64 += XOWS_CMAP_B64[0x3F & (t >> 18)];
    b64 += XOWS_CMAP_B64[0x3F & (t >> 12)];
    b64 += XOWS_CMAP_B64[0x3F & (t >>  6)];
    b64 += XOWS_CMAP_B64[0x3F & (t)];
  }
  // remaining bytes + padding
  if(rem !== 0) {
    t = (uint8[p++] << 16);
    if(rem > 1) t |= (uint8[p] << 8);
    b64 += XOWS_CMAP_B64[0x3F & (t >> 18)];
    b64 += XOWS_CMAP_B64[0x3F & (t >> 12)];
    b64 += (rem > 1) ? XOWS_CMAP_B64[0x3F & (t >>  6)] : "=";
    b64 += "=";
  }
  return b64;
}

/**
 * Get the hexadecimal representation of the given bytes data.
 * 
 * @param   {Uint8Array}  uint8  Input bytes data.
 * 
 * @return  {string} Hexadecimal representation string.
 */
function xows_bytes_to_hex(uint8) 
{
  let c, hex = "";
  for(let i = 0, n = uint8.length; i < n; ++i) {
    c = uint8[i];
    hex += XOWS_CMAP_HEX.charAt((c >>> 4) & 0x0F) +
           XOWS_CMAP_HEX.charAt((c)       & 0x0F);
  }
  return hex;
}

/* --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  
 *                hash and crypto utilities functions
 * --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  -- */
 
 /**
 * Generate a Version 4 UUID string
 * 
 * @return  {string} Randomly generated version 4 UUID
 */
function xows_gen_uuid() 
{
  const r = new Uint8Array(16);
  window.crypto.getRandomValues(r);
  // UUID : xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  r[6] = r[6] & 0x0F | 0x40;
  r[8] = r[8] & 0x3F | 0x80;
  let uuid = "";
  for(let c = 0, b = 0; b < 16; ++b) {
    if(c === 8 || c === 13 || c === 18 || c === 23) {
      uuid += "-"; c++;
    }
    uuid += XOWS_CMAP_HEX.charAt((r[b] >>> 4) & 0x0F) +
            XOWS_CMAP_HEX.charAt((r[b])       & 0x0F);
    c += 2;
  }
  return uuid;
}

/**
 * Get hexadecimal representation of a randomly 
 * generated number bytes sequence.
 *  
 * @param   {number}  len   Bytes sequence length in bytes.
 * 
 * @return  {string} Hexadecimal representation string.
 */
function xows_gen_nonce_hex(len) 
{
  // get random value using modern crypto object
  const r = new Uint8Array(len);
  window.crypto.getRandomValues(r);

  let nonce = "";
  for(let i = 0; i < len; ++i) {
    nonce += XOWS_CMAP_HEX.charAt((r[i] >>> 4) & 0x0F) +
             XOWS_CMAP_HEX.charAt((r[i])       & 0x0F);
  }

  return nonce;
}

/**
 * Generates random alphanumerical ASCII string of the 
 * specified length.
 *  
 * @param   {number}  len   Length of the string to generate.
 * 
 * @return  {string}  Randomly generated alphanumeric string.
 */
function xows_gen_nonce_asc(len) 
{
  // get random value using modern crypto object
  const r = new Uint8Array(len);
  window.crypto.getRandomValues(r);

  let nonce = "";
  for(let i = 0; i < len; ++i) nonce += XOWS_CMAP_B64[r[i] % 62];
  return nonce;
}

/**
 * Generate MD5 Hash of a given string or bytes array.
 * 
 * @param   {(string|Uint8Array)}   input  Input data to compute hash.
 *               
 * @return  {Uint8Array}  16 bytes MD5 hash
 */
function xows_hash_md5(input)
{
  // unique temporary variable
  let tmp;
  
  // Declare internal MD5 sub-routines
  function P1(a,b,c,d,x,s,t) {
    tmp = a + ((d ^ (b & (c ^ d))) + x + t);
    return (((tmp << s) | (tmp >>> (32 - s))) + b); 
  }
  function P2(a,b,c,d,x,s,t) {
    tmp = a + ((c ^ (d & (b ^ c))) + x + t);
    return (((tmp << s) | (tmp >>> (32 - s))) + b); 
  }
  function P3(a,b,c,d,x,s,t) {
    tmp = a + ((b ^ c ^ d) + x + t);
    return (((tmp << s) | (tmp >>> (32 - s))) + b); 
  }
  function P4(a,b,c,d,x,s,t) {
    tmp = a + ((c ^ (b | ~d)) + x + t);
    return (((tmp << s) | (tmp >>> (32 - s))) + b); 
  }
  
  // Hash takes data as 64 bytes blocks, we create a new buffer of 
  // the proper size which can contains input data, the additional 0x80  
  // padding and the final 8-bytes "data-length" value
  let ilen, blen, data, i = 0;
  if(typeof input === "string") {
    ilen = xows_str_bytes_len(input); blen = ilen * 8;
    data = xows_str_to_bytes(input, ((blen+64) >> 9 << 6) + 64);
  } else {
    ilen = input.length; blen = ilen * 8;
    data = new Uint8Array(((blen+64) >> 9 << 6) + 64);
    for( ; i < ilen; ++i) data[i] = input[i];
  }
  
  // Append the 0x80 final padding to input data
  data[ilen] |= 0x80;

  // Adds the input data total size (in bits) at the very end of the 
  // last block. The value is a 8-bytes integer stored in little-endian 
  // meaning the lo-word is before the hi-word. 
  // Here we store only the lo-word into the before-last 4-bytes of data
  let p = data.length - 8; //< Position of the before-last 4-bytes of data
  data[p  ] = (blen      ) & 0xff;
  data[p+1] = (blen >>  8) & 0xff;
  data[p+2] = (blen >> 16) & 0xff;
  data[p+3] = (blen >> 24) & 0xff;
  
  // We work with 32 bits unsigned integers
  const X = new Uint32Array(16);
  const state = new Uint32Array(4);
  state[0] = 0x67452301; state[1] = 0xEFCDAB89; state[2] = 0x98BADCFE;
  state[3] = 0x10325476; 
  
  let A, B, C, D;
  
  p = 0;
  while(p < data.length) {

    // Put 64 bytes from data to 16 Uint32 block in little-endian
    for(i = 0; i < 16; ++i) {
      X[i] =  (data[p++])
            | (data[p++] <<  8)
            | (data[p++] << 16)
            | (data[p++] << 24);
    }
    
    A = state[0]; B = state[1]; C = state[2]; D = state[3];

    A=P1(A,B,C,D,X[ 0], 7,0xD76AA478); D=P1(D,A,B,C,X[ 1],12,0xE8C7B756);
    C=P1(C,D,A,B,X[ 2],17,0x242070DB); B=P1(B,C,D,A,X[ 3],22,0xC1BDCEEE);
    A=P1(A,B,C,D,X[ 4], 7,0xF57C0FAF); D=P1(D,A,B,C,X[ 5],12,0x4787C62A);
    C=P1(C,D,A,B,X[ 6],17,0xA8304613); B=P1(B,C,D,A,X[ 7],22,0xFD469501);
    A=P1(A,B,C,D,X[ 8], 7,0x698098D8); D=P1(D,A,B,C,X[ 9],12,0x8B44F7AF);
    C=P1(C,D,A,B,X[10],17,0xFFFF5BB1); B=P1(B,C,D,A,X[11],22,0x895CD7BE); 
    A=P1(A,B,C,D,X[12], 7,0x6B901122); D=P1(D,A,B,C,X[13],12,0xFD987193);
    C=P1(C,D,A,B,X[14],17,0xA679438E); B=P1(B,C,D,A,X[15],22,0x49B40821);

    A=P2(A,B,C,D,X[ 1], 5,0xF61E2562); D=P2(D,A,B,C,X[ 6], 9,0xC040B340);
    C=P2(C,D,A,B,X[11],14,0x265E5A51); B=P2(B,C,D,A,X[ 0],20,0xE9B6C7AA);
    A=P2(A,B,C,D,X[ 5], 5,0xD62F105D); D=P2(D,A,B,C,X[10], 9,0x02441453);
    C=P2(C,D,A,B,X[15],14,0xD8A1E681); B=P2(B,C,D,A,X[ 4],20,0xE7D3FBC8);
    A=P2(A,B,C,D,X[ 9], 5,0x21E1CDE6); D=P2(D,A,B,C,X[14], 9,0xC33707D6);
    C=P2(C,D,A,B,X[ 3],14,0xF4D50D87); B=P2(B,C,D,A,X[ 8],20,0x455A14ED);
    A=P2(A,B,C,D,X[13], 5,0xA9E3E905); D=P2(D,A,B,C,X[ 2], 9,0xFCEFA3F8);
    C=P2(C,D,A,B,X[ 7],14,0x676F02D9); B=P2(B,C,D,A,X[12],20,0x8D2A4C8A);
    
    A=P3(A,B,C,D,X[ 5], 4,0xFFFA3942); D=P3(D,A,B,C,X[ 8],11,0x8771F681);
    C=P3(C,D,A,B,X[11],16,0x6D9D6122); B=P3(B,C,D,A,X[14],23,0xFDE5380C);
    A=P3(A,B,C,D,X[ 1], 4,0xA4BEEA44); D=P3(D,A,B,C,X[ 4],11,0x4BDECFA9);
    C=P3(C,D,A,B,X[ 7],16,0xF6BB4B60); B=P3(B,C,D,A,X[10],23,0xBEBFBC70);
    A=P3(A,B,C,D,X[13], 4,0x289B7EC6); D=P3(D,A,B,C,X[ 0],11,0xEAA127FA);
    C=P3(C,D,A,B,X[ 3],16,0xD4EF3085); B=P3(B,C,D,A,X[ 6],23,0x04881D05);
    A=P3(A,B,C,D,X[ 9], 4,0xD9D4D039); D=P3(D,A,B,C,X[12],11,0xE6DB99E5);
    C=P3(C,D,A,B,X[15],16,0x1FA27CF8); B=P3(B,C,D,A,X[ 2],23,0xC4AC5665);

    A=P4(A,B,C,D,X[ 0], 6,0xF4292244); D=P4(D,A,B,C,X[ 7],10,0x432AFF97);
    C=P4(C,D,A,B,X[14],15,0xAB9423A7); B=P4(B,C,D,A,X[ 5],21,0xFC93A039);
    A=P4(A,B,C,D,X[12], 6,0x655B59C3); D=P4(D,A,B,C,X[ 3],10,0x8F0CCC92);
    C=P4(C,D,A,B,X[10],15,0xFFEFF47D); B=P4(B,C,D,A,X[ 1],21,0x85845DD1);
    A=P4(A,B,C,D,X[ 8], 6,0x6FA87E4F); D=P4(D,A,B,C,X[15],10,0xFE2CE6E0);
    C=P4(C,D,A,B,X[ 6],15,0xA3014314); B=P4(B,C,D,A,X[13],21,0x4E0811A1);
    A=P4(A,B,C,D,X[ 4], 6,0xF7537E82); D=P4(D,A,B,C,X[11],10,0xBD3AF235);
    C=P4(C,D,A,B,X[ 2],15,0x2AD7D2BB); B=P4(B,C,D,A,X[ 9],21,0xEB86D391);
    
    // Add state for this block
    state[0] += A; state[1] += B; state[2] += C; state[3] += D;
  }
  
  // Convert the five little-endian Uint32 result into 20 bytes array 
  const hash = new Uint8Array(16);
  for(i = 0, p = 0; i < 4; ++i) {
    hash[p++] = (state[i]      ) & 0xff;
    hash[p++] = (state[i] >>  8) & 0xff;
    hash[p++] = (state[i] >> 16) & 0xff;
    hash[p++] = (state[i] >> 24) & 0xff;
  }

  return hash;
}

/**
 * Generate SHA-1 Hash of a given string or bytes array.
 * 
 * @param   {(string|Uint8Array)}   input  Input data to compute hash.
 *               
 * @return  {Uint8Array}  20 bytes SHA-1 hash
 */
function xows_hash_sha1(input) 
{
  // Hash takes data as 64 bytes blocks, we create a new buffer of 
  // the proper size which can contains input data, the additional 0x80  
  // padding and the final 8-bytes "data-length" value
  let ilen, blen, data, i = 0;
  if(typeof input === "string") {
    ilen = xows_str_bytes_len(input); blen = ilen * 8;
    data = xows_str_to_bytes(input, ((blen+64) >> 9 << 6) + 64);
  } else {
    ilen = input.length; blen = ilen * 8;
    data = new Uint8Array(((blen+64) >> 9 << 6) + 64);
    for( ; i < ilen; ++i) data[i] = input[i];
  }
  
  // Append the 0x80 final padding to input data
  data[ilen] |= 0x80; 
  // Adds the input data total size (in bits) at the very end of the 
  // last block. The value is a 8-bytes integer stored in big-endian 
  // meaning the hi-word is before the lo-word. 
  // Here we store only the lo-word into the very last 4-bytes of data
  let p = data.length - 4; //< Position of the last 4-bytes of data
  data[p  ] = (blen >> 24) & 0xff;
  data[p+1] = (blen >> 16) & 0xff;
  data[p+2] = (blen >>  8) & 0xff;
  data[p+3] = (blen      ) & 0xff;
  
  // We work with 32 bits unsigned integers 
  const W = new Uint32Array(16);
  const state = new Uint32Array(5);
  state[0] = 0x67452301; state[1] = 0xEFCDAB89; state[2] = 0x98BADCFE;
  state[3] = 0x10325476; state[4] = 0xC3D2E1F0;

  let A, B, C, D, E, K, F, tmp;
  
  p = 0;
  while(p < data.length) {
    
    // Put 64 bytes from data to 16 Uint32 block in big-endian 
    for(i = 0; i < 16; ++i) {
      W[i] =  (data[p++] << 24) 
            | (data[p++] << 16) 
            | (data[p++] <<  8)
            | (data[p++]);
    }

    A = state[0]; B = state[1]; C = state[2]; 
    D = state[3]; E = state[4];
    
    // Process SHA-1 hash for this 64 bytes block
    for(i = 0; i < 80; ++i) {

      if(i > 15) {
        tmp =  W[(i-3)&0x0F] ^ W[(i-8)&0x0F] ^ W[(i-14)&0x0F] ^ W[i&0x0F];
        W[i&0x0F] = (tmp<<1|tmp>>>31);
      }
      
      if(i < 20) { 
        K = 0x5A827999; F = D ^ (B & (C ^ D)); 
      } else if(i < 40) { 
        K = 0x6ED9EBA1; F = B ^ C ^ D;  
      } else if(i < 60) { 
        K = 0x8F1BBCDC; F = B & C | B & D | C & D;  
      } else { 
        K = 0xCA62C1D6; F = B ^ C ^ D; 
      }
      
      tmp = (((A<<5|A>>>27) + F) + ((E + W[i&0x0F]) + K));
      E = D; D = C; C = (B<<30|B>>>2); B = A; A = tmp;
    }
    
    // Add state for this block
    state[0] += A; state[1] += B; state[2] += C; 
    state[3] += D; state[4] += E;
  }

  // Convert the five big-endian Uint32 result into 20 bytes array 
  const hash = new Uint8Array(20);
  for(i = 0, p = 0; i < 5; ++i) {
    hash[p++] = (state[i] >> 24) & 0xff;
    hash[p++] = (state[i] >> 16) & 0xff;
    hash[p++] = (state[i] >>  8) & 0xff;
    hash[p++] =  state[i]        & 0xff;
  }

  return hash;
}

/**
 * Calculate the HMAC-SHA1 using the given key and data.
 * 
 * @param   {(string|Uint8Array)}   key  Key to calculate HMAC.
 * @param   {(string|Uint8Array)}   data Data to calculate HMAC.
 *               
 * @return  {Uint8Array}  20 bytes of the HMAC-SHA1 result.
 */
function xows_hmac_sha1(key, data) 
{
  if(typeof key === "string")
    key = xows_str_to_bytes(key);
  
  if(key.length > 64) 
    key = xows_hash_sha1(key);
  
  const ipad = new Uint8Array(64 + data.length);
  const opad = new Uint8Array(84); // 64 + 20

  let i, p, n;
  
  for(p = 0, n = key.length; p < n; ++p) {
    ipad[p] = key[p] ^ 0x36; 
    opad[p] = key[p] ^ 0x5C;
  }
  for( ; p < 64; ++p) {
    ipad[p] = 0x36; 
    opad[p] = 0x5C; 
  }
  
  if(typeof data === "string") 
    data = xows_str_to_bytes(data);
  
  for(i = 0, n = data.length; i < n; ++i) ipad[p++] = data[i];
  const hash = xows_hash_sha1(ipad);
  for(i = 0, p = 64; i < 20; ++i) opad[p++] = hash[i];
  return xows_hash_sha1(opad);
}

/**
 * Generate SHA-256 Hash of a given string or bytes array.
 * 
 * @param   {(string|Uint8Array)}   input  Input data to compute hash.
 *               
 * @return  {Uint8Array}  32 bytes SHA-256 hash
 */
function xows_hash_sha256(input) 
{
  const K = new Uint32Array([
      0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
      0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
      0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
      0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
      0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
      0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
      0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
      0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
      0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
      0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
      0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
      0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
      0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
      0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
      0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
      0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2]);

  // Hash takes data as 64 bytes blocks, we create a new buffer of 
  // the proper size which can contains input data, the additional 0x80  
  // padding and the final 8-bytes "data-length" value
  let ilen, blen, data, i = 0;
  if(typeof input === "string") {
    ilen = xows_str_bytes_len(input); blen = ilen * 8;
    data = xows_str_to_bytes(input, ((blen+64) >> 9 << 6) + 64);
  } else {
    ilen = input.length; blen = ilen * 8;
    data = new Uint8Array(((blen+64) >> 9 << 6) + 64);
    for( ; i < ilen; ++i) data[i] = input[i];
  }

  // Append the 0x80 final padding to input data
  data[ilen] |= 0x80; 
  // Adds the input data total size (in bits) at the very end of the 
  // last block. The value is a 8-bytes integer stored in big-endian 
  // meaning the hi-word is before the lo-word. 
  // Here we store only the lo-word into the very last 4-bytes of data
  let p = data.length - 4; //< Position of the last 4-bytes of data
  data[p  ] = (blen >> 24) & 0xff;
  data[p+1] = (blen >> 16) & 0xff;
  data[p+2] = (blen >>  8) & 0xff;
  data[p+3] = (blen      ) & 0xff;
  
  // We work with 32 bits unsigned integers 
  const W = new Uint32Array(64);
  const state = new Uint32Array(8);
  state[0] = 0x6A09E667; state[1] = 0xBB67AE85; state[2] = 0x3C6EF372;
  state[3] = 0xA54FF53A; state[4] = 0x510E527F; state[5] = 0x9B05688C;
  state[6] = 0x1F83D9AB; state[7] = 0x5BE0CD19;

  let A, B, C, D, E, F, G, H, S, T;
  
  p = 0;
  while(p < data.length) {
    
    // Put 64 bytes from data to 16 Uint32 block in big-endian 
    for(i = 0; i < 16; ++i) {
      W[i] =  (data[p++] << 24) 
            | (data[p++] << 16) 
            | (data[p++] <<  8)
            | (data[p++]);
    }
    
    A = state[0]; B = state[1]; C = state[2]; D = state[3]; 
    E = state[4]; F = state[5]; G = state[6]; H = state[7]; 
    
    for(i = 0; i < 64; i++) {
      
      if(i > 15) {
        T = W[i -  2];  
        S = ((T>>>17)|(T<<15))^((T>>>19)|(T<<13))^(T>>>10);   
        W[i] = S + W[i -  7];
        T = W[i - 15];
        S = ((T>>> 7)|(T<<25))^((T>>>18)|(T<<14))^(T>>> 3);
        W[i] += S + W[i - 16];
      }

      S = ((E>>> 6)|(E<<26))^((E>>>11)|(E<<21))^((E>>>25)|(E<< 7)); 
      T = H + S + (G ^ (E & (F ^ G))) + K[i] + W[i];
      D += T;
      S = ((A>>> 2)|(A<<30))^((A>>>13)|(A<<19))^((A>>>22)|(A<<10)); 
      T += (S + ((A & B) | (C & (A | B))));
      H = G; G = F; F = E; E = D; D = C; C = B; B = A; A = T;
    }

    // Add state for this block
    state[0] += A; state[1] += B; state[2] += C; state[3] += D; 
    state[4] += E; state[5] += F; state[6] += G; state[7] += H;
  }

  // Convert the five big-endian Uint32 result into 32 bytes array 
  const hash = new Uint8Array(32);
  for(i = 0, p = 0; i < 8; ++i) {
    hash[p++] = (state[i] >> 24) & 0xff;
    hash[p++] = (state[i] >> 16) & 0xff;
    hash[p++] = (state[i] >>  8) & 0xff;
    hash[p++] =  state[i]        & 0xff;
  }

  return hash;
}

/* --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  
 *          common string validation and parsing functions
 * --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  -- */

/**
 * Regex object to test and validate JID format
 */
const XOWS_REG_TEST_JID = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

/**
 * Check whether given string is a valid JID
 * 
 * @param   {string}  str  String to check.
 * 
 * @return  {boolean}  True if supplied string is a valid 
 *                     JID, false otherwise
 */
function xows_is_jid(str)
{
  return XOWS_REG_TEST_JID.test(str);
}

/**
 * Get bare JID from full JID
 * 
 * @param   {string}  jid  JID to get the bare part.
 * 
 * @return  {string}  Extracted bare JID
 */
function xows_jid_to_bare(jid)
{
  const p = jid.indexOf("/");
  return (p !== -1) ? jid.substring(0, p) : jid;
}

/**
 * Get nickname or ressource from full JID
 * 
 * @param   {string}  jid  JID to get the nick or resource part.
 * 
 * @return  {string}  Extracted nick, resource or null if unavailable.
 */
function xows_jid_to_nick(jid)
{
  const p = jid.indexOf("/");
  return (p !== -1) ? jid.substring(p+1) : null;
}

/**
 * Get the data part of the given Data-URL string.
 * 
 * @param   {string}  url    Data-URL to parse.
 * 
 * @return  {string}  Parsed data or null.
 */
function xows_url_to_data(url)
{
  if(url.indexOf("data:") === 0) {
    return url.substring(url.indexOf(",")+1);
  }
  return null;
}

/**
 * Get the decoded data from the given Data-URL string, 
 * assuming data is base64 encoded.
 * 
 * @param   {string}  url    Data-URL to parse.
 * 
 * @return  {string}  Decoded data as bytes sting or null.
 */
function xows_url_to_bytes(url)
{
  if(url.indexOf("data:") === 0) {
    return atob(url.substring(url.indexOf(",")+1));
  }
  return null;
}

/**
 * Get the MIME type part of the given Data-URL string.
 * 
 * @param   {string}  url    Data-URL to parse.
 * 
 * @return  {string}  Parsed MIME type or null.
 */
function xows_url_to_type(url)
{
  if(url.indexOf("data:") === 0) {
    return url.substring(5,url.indexOf(";"));
  }
  return null;
}

/* --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  
 *            DOM elements and tree manipulation functions
 * --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  -- */
 
/**
 * Remove empty or useless text nodes such as CR/LF 
 * from DOM tree.
 * 
 * @param   {object}  node    Root node of DOM tree to clean.
 * 
 * @return  {object}  DOM node passed as parameter.
 */
function xows_clean_dom(node)
{
  let child, i = node.childNodes.length;
  while(i--) {
    child = node.childNodes[i];
    if(child.nodeType === 8 || (child.nodeType === 3 && !/\S/.test(child.nodeValue))) {
      node.removeChild(child);
    } else if(child.nodeType === 1) {
      xows_clean_dom(child);
    }
  }
  
  return node;
}

/* --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  
 *             graphics and picture manipulation functions
 * --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  -- */
 
/**
 *  Draw an icon with the specified paramers
 * 
 * @param   {number}  size     Icon size in pixels
 * @param   {Image}   image    Optional background image
 * @param   {string}  name     Optional name to generate background and Letter
 * @param   {string}  font     Optional font for center letter
 *  
 * @return  {string}  Resulting icon as Data-URL string.
 */
function xows_gen_avatar(size, image, name, font)
{
  // Create offscreen canvas
  const cv = document.createElement("canvas");
  const ct = cv.getContext("2d");

  const half = (size * 0.5);
  
  if(image) {
    
    // Resized image data
    let dst;
    
    // Source image width and height
    const sw = image.naturalWidth; 
    const sh = image.naturalHeight;

    // Downsample the image if required
    if(sw > size || sh > size) {

      // Set square frame dimensions in source image
      let max, sx, sy;
      if(sw > sh) {
        max = sh; sx = (sw - max) * 0.5; sy = 0;
      } else {
        max = sw; sx = 0; sy = (sh - max) * 0.5;
      }
      
      // Resize canvas to get full image
      cv.width = sw; cv.height = sh;
      // Draw source image on temp canvas
      ct.drawImage(image, 0, 0);
      
      // Get source image required portion
      const src = ct.getImageData(sx, sy, max, max);
      const src_data = new Int32Array(src.data.buffer);
      // Create new image data for resized image
      dst = new ImageData(size, size);
      const dst_data = new Int32Array(dst.data.buffer);
      
      // Downsample image algorithm inspired from :
      // https://github.com/ytiurin/downscale/blob/master/src/downsample.js
      const u = 1.0 / (size / max); //< dst to src scale factor
      const box = Math.round(u); // src box size (to get pixels in)
      const v = 1.0 / (box * box); // factor to average dst pixel

      let i, j, x, y, c, r, g, b, a, p;

      for(i = 0; i < size; ++i) { // Destination col
        for(j = 0; j < size; ++j) { // Destination row
          c = (Math.round(j*u)*max) + Math.round(i*u);
          r = 0; g = 0; b = 0; a = 0;
          for(y = 0; y < box; ++y) { // Box row
            for(x = 0; x < box; ++x) { // Box col 
              p = src_data[c+((y*max)+x)];
              a += (p >> 24) & 0xff; b += (p >> 16) & 0xff;
              g += (p >>  8) & 0xff; r +=  p        & 0xff;
            }
          }
          r = Math.round(r*v); g = Math.round(g*v);
          b = Math.round(b*v); a = Math.round(a*v);
          dst_data[(j*size)+i] = (a << 24)|(b << 16)|(g << 8)|r;
        }
      }
      // Define final canvas size
      cv.width = cv.height = size;
      ct.putImageData(dst, 0, 0);
    } else {
      // Define final canvas size
      cv.width = cv.height = size;
      ct.drawImage(image, 0, 0, size, size);
    }
    
  } else {
    
    // Define final canvas size
    cv.width = cv.height = size;
    
    if(name) {
      // Generate pseudo-random hue from name
      let s = 0, i = name.length;
      while(i--) s += name.charCodeAt(i);
      const h = Math.ceil(xows_random(s)*1000)%360;
      // Fill background with color
      ct.fillStyle = "hsl("+h+",85%,45%)";
      ct.arc(half, half, half, 0, 2*Math.PI);
      //ct.rect(0, 0, size, size);
      ct.fill();
      
      // Set foreground Color
      ct.fillStyle = "#FFF";
    
      // Draw the logo from SVG path
      const scale = size/32;
      ct.scale(scale, scale);
      ct.fill(XOWS_LOGO_SVG);
    }
  }
  
  return cv.toDataURL("image/png");
}

/* ------------------------------------------------------------------
 * 
 *                         l10n API Module
 * 
 * ------------------------------------------------------------------ */
 
/**
 * Default empty database, to be loaded.
 */
let xows_l10n_db = {};

/**
 * Current selected locale, this is used for javascript built-in 
 * l18n functions.
 */
let xows_l10n_current = "en";

/**
 * Callback function to call whene locale data is successfulluy 
 * loaded and initialized.
 */
let xows_l10n_fw_onready = function() {};

/**
 * Load the specified locale data to be used for translations. If
 * the specified locale is unavailable, the default one is used.
 * 
 * @param   {string}  locale    Local to select.
 * @param   {string}  onready   Callback to call once operateion succeed.
 */
function xows_l10n_select(locale, onready) 
{
  // Set callback function
  if(xows_is_func(onready)) 
    xows_l10n_fw_onready = onready;
  
  // We first load the available locale/lang list
  let path = xows_options.root+"/locale/LC_list.json";
  
  // Forces browser to reload (uncache) templates files by adding a 
  // random string to URL. This option is mainly for dev and debug
  if(xows_options.uncache) {
    path += "?" + xows_gen_nonce_asc(4);
  }
  
  // Launch request to download locale/lang list file
  const xhr = new XMLHttpRequest();
  xhr.open("GET", path, true);
  xhr.onreadystatechange= function() {
    if(this.readyState === 4) 
      if(this.status === 200) {
        xows_log(2,"l10n_select","parsing locale list", this.responseURL);
        let list = JSON.parse(this.responseText);
        if(!list) {
          xows_log(0,"l10n_select","locale list \""+this.responseURL+"\" parse error");
          return;
        }
        // Try full locale, then generic language
        if(list[locale]) {
          xows_log(2,"l10n_select","found available locale",locale);
          xows_l10n_db_load(list[locale]); return; //< use previously defined callback
        } else if(locale.indexOf("-") !== -1) {
          // we got a full locale code, we extract generic language
          let lang = locale.split("-")[0].toLowerCase();
          if(list[lang]) {
            xows_log(2,"l10n_select","found available language",lang);
            xows_l10n_db_load(list[lang]); return; //< use previously defined callback
          }
        }
        xows_log(1,"l10n_select","invalid or unavailable locale \""+locale+"\"","using default");
        xows_l10n_fw_onready();
      } else {
        xows_log(0,"l10n_select","locale list \""+this.responseURL+"\" loading error","HTTP status:\""+this.status+"\"");
      }
  };
  
  // Increase count of template remaining to load
  xows_log(2,"l10n_select","loading locale list",path);
  xhr.send();
}

/**
 * Launch the download of the specified language DB json file.
 * 
 * @param   {string}  locale    Language DB subfolder to load.
 * @param   {string}  onready   Callback to call once operateion succeed.
 */
function xows_l10n_db_load(locale, onready) 
{
  // Set callback function
  if(xows_is_func(onready)) 
    xows_l10n_fw_onready = onready;
  
  // build download path URL
  let path = xows_options.root+"/locale/"+locale+"/LC_db.json";
  
  // Forces browser to reload (uncache) templates files by adding a 
  // random string to URL. This option is mainly for dev and debug
  if(xows_options.uncache) {
    path += "?" + xows_gen_nonce_asc(4);
  }
  // Launch request to download template file
  const xhr = new XMLHttpRequest();
  xhr.open("GET", path, true);
  xhr.onreadystatechange= function() {
    if(this.readyState === 4) 
      if(this.status === 200) {
        xows_log(2,"l10n_db_load","parsing JSON data", this.responseURL);
        let db = JSON.parse(this.responseText);
        if(!db) {
          xows_log(0,"l10n_db_load","data \""+this.responseURL+"\" parse error");
          return;
        }
        xows_l10n_db = db;
        xows_l10n_current = locale;
        xows_l10n_fw_onready();
      } else {
        xows_log(0,"l10n_db_load","file \""+this.responseURL+"\" loading error","HTTP status:\""+this.status+"\"");
        xows_l10n_fw_onready();
      }
  };
  
  // Increase count of template remaining to load
  xows_log(2,"l10n_db_load","loading locale db",path);
  xhr.send();
}

/**
 * Get the specified translated text corresponding to the current 
 * selected locale. 
 * 
 * @param   {string}  msgid  Template text to get translation.
 * 
 * @return  {string}  The translated text or the value of msgid 
 *                    if translation is not available.
 */
function xows_l10n_get(msgid)
{
  const str = xows_l10n_db[msgid];
  if(str) return (str.length !== 0) ? str : msgid;
  return msgid;
}

/**
 *  Static remplacement function for translation process
 */
function xows_l10n_parseFunc(c, match) 
{
  const str = xows_l10n_db[match];
  if(str) return (str.length !== 0) ? str : match;
  return match;
}

/**
 * Parse and translate the given text according the current loaded
 * locale. 
 * 
 * The function search for specific pattern to identify template texts 
 * to substitute by corresponding translated text.
 * 
 * @param   {string}  text    Text to be translated.
 */
function xows_l10n_parse(text)
{
  return text.replace(/\${['"](.*)['"]}/g, xows_l10n_parseFunc);
}

/**
 * Check whether the specified locale is available.
 * 
 * @param   {string}  locale    Locale ID string.
 * 
 * @return  {boolean} True if locale is available, false otherwise.
 */
function xows_l10n_hasLocale(locale) 
{
  return (xows_l10n_db[locale] !== null && xows_l10n_db[locale] !== undefined);
}

/**
 * Create the properly formated date string from the supplied timestamp.
 * 
 * @param   {string}  stamp   Standard formated timestamp.
 * 
 * @return  {string} Human readable and localized date and time string.
 */
function xows_l10n_date(stamp)
{
  const date = new Date(stamp);
  
  const nowday = new Date();
  const othday = new Date(stamp);
  nowday.setHours(0,0,0,0);
  othday.setHours(0,0,0,0);

  // Check whether the supplied time date is today
  if(nowday === othday) {
    return xows_l10n_get("at")+" "+date.toLocaleTimeString(xows_l10n_current); //< Return hours only
  } else {
    return date.toLocaleDateString(xows_l10n_current,{"day":"numeric","month":"long",
            "year":"numeric","hour":"2-digit","minute":"2-digit"}); //< Return full date
  }
}

/**
 * Create the properly formated houre string from the supplied timestamp.
 * 
 * @param   {string}  stamp   Standard formated timestamp.
 * 
 * @return  {string} Simple houre string extrated from fulle timestamp.
 */
function xows_l10n_houre(stamp)
{
  const date = new Date(stamp);

  // Check whether the supplied time date is today
  return date.toLocaleTimeString(xows_l10n_current,{hour:'2-digit',minute:'2-digit'});
}

/* ------------------------------------------------------------------
 * 
 *                         XML API Module
 * 
 * ------------------------------------------------------------------ */
 
/**
 * DOM Parser object to parse XML data.
 */
const xows_xml_parser = new DOMParser();

/**
 * XML DOM object to create XML nodes.
 */
const xows_xml_doc = document.implementation.createDocument("jabber:client","Xows");

/**
 * Correspondence map to escape XML reserved characters.
 */
const XOWS_XML_ESCAP_MAP = {"&":"&amp;","<":"&lt;",">":"&gt;","'":"&apos;","\"":"&quot;"};

/**
 *  Correspondence map to unescape and XML string.
 */
const XOWS_XML_UNESC_MAP = {"&amp;":"&","&lt;":"<","&gt;":">","&apos;":"'","&quot;":"\""};

/**
 * Remplacement function for XML string escape.
 */
function xows_xml_escap_fnc(m) {return XOWS_XML_ESCAP_MAP[m];}

/**
 * Rewrites the given string with XML escapes for reserved characters.
 * 
 * @param   {string}  str   String to be escaped.
 * 
 * @return  {string}  Escaped string.
 */
function xows_xml_escape(str) 
{
  return str.replace(/[\&<>'"]/g, xows_xml_escap_fnc);
}

/**
 *  Remplacement function for XML string unescape.
 */
function xows_xml_unesc_fnc(m) {return XOWS_XML_UNESC_MAP[m];}

/**
 * Rewrites the given XML escaped string with proper ASCII charaters.
 * 
 * @param   {string} str    String to be unescaped.
 * 
 * @return  {string} Unescaped string.
 */
function xows_xml_unesc(str) 
{
  return str.replace(/\&\w*;/g, xows_xml_unesc_fnc);
}

/**
 * Add the given children data to the specified node. 
 * The children data can be a single XML Element object, a DOMString, 
 * or an Array of the previous types.
 * 
 * @param   {object}              parent  Parent XML element object.
 * @param   {(object|string|[])}  child   Data to append as child.
 */
function xows_xml_parent(parent, child)
{
  // Check child data type to create proper node type
  if(typeof(child) === "string" || typeof(child) === "number") {
    
    // Child data is a string or number, create text 
    parent.appendChild(xows_xml_doc.createTextNode(child));
  
  } else if(typeof(child) === "object") {
    
    // Child data is an object, check whether this is an Array()
    const n = child.length;
    if(n !== undefined) {
      
      // Child data is an Array(), process each element
      for(let i = 0; i < n; ++i) 
        xows_xml_parent(parent, child[i]); 
      
    } else {
      
      // Child data is a single object, append it
      parent.appendChild(child);
    }
  }
}

/**
 * Creates an XML Element object with the specified attributes and 
 * children data.
 * The children data can be a single XML Element object, a DOMString, 
 * or an Array of the previous types.
 * 
 * @param   {string}              name    Tag name.
 * @param   {object}              attr    Optional attributes as dictionary.
 * @param   {(object|string|[])}  child   Optional childrend data.
 *                    
 * @return  {object} The create XML Element object.
 */
function xows_xml_node(name, attr, child)
{
  const node = xows_xml_doc.createElement(name);
  
  // Add attributes to node
  if(typeof(attr) === "object") {
    for(const k in attr) {
      if(attr.hasOwnProperty(k) && attr[k])
        node.setAttribute(k, attr[k]);
    }
  }
  
  // Append child to node, this may be recursive
  if(child !== null && child !== undefined) 
    xows_xml_parent(node, child);

  return node;
}

/**
 * Serialize an XML Element object tree.
 *  
 * @param   {object}  node    XML Element object tree.
 *                    
 * @return  {string}  Resulting string.
 */
function xows_xml_serialize(node) 
{
  let i, n, result = "<" + node.nodeName;

  // Append attributes list
  n = node.attributes.length;
  for(i = 0; i < n; ++i)
    result += " " + node.attributes[i].nodeName + "=\"" +
                    node.attributes[i].nodeValue + "\"";
  
  // Append children
  n = node.childNodes.length;
  if(n !== 0) {
    result += ">";
    for(i = 0; i < n; ++i) {
      if(node.childNodes[i].nodeType === 1) {
        //< node, this go recursive
        result += xows_xml_serialize(node.childNodes[i]); 
      } else {
        //< text or unknow
        result += xows_xml_escape(node.childNodes[i].nodeValue); 
      }
    }
    result += "</" + node.nodeName + ">";
  } else {
    result += "/>"; //< no child, close node
  }
  
  return result;
}

/**
 * Parse the supplied XML data string to DOM object.
 *  
 * @param   {string}  str    Input string to parse as XML.
 *                    
 * @return  {object} Resuling DOM object.
 */
function xows_xml_parse(str) 
{
  return xows_clean_dom(xows_xml_parser.parseFromString(str,"text/xml"));
}

/**
 * Get inner text of an XML node.
 *  
 * @param   {object}  node    XML Element object to get inner text.
 *                    
 * @return  {string} Node text content or empty string.
 */
function xows_xml_get_text(node) {

  if(!node) return ""; //< nothing to get
  
  const n = node.childNodes.length;

  // get text of a single node
  if(n === 0 && node.nodeType === 3) {
    return xows_xml_unesc(node.nodeValue);
  }
  
  // get text for multiple nodes
  let str = "";
  for(let i = 0; i < n; ++i) {
    if(node.childNodes[i].nodeType === 3) 
      str += node.childNodes[i].nodeValue;
  }
  
  return xows_xml_unesc(str);
}

/* ------------------------------------------------------------------
 * 
 *                         SASL API Module
 * 
 * ------------------------------------------------------------------ */
 
/**
 * Variable to store contextual data for SASL challenge process.
 */
let xows_sasl_data = null;

/**
 * Standard name of the current selected and initialized SASL 
 * mechanism.
 */
let xows_sasl_select = "";

/**
 * Get the SASL initial auth request string according the current
 * initialized mechanism. This function is intended to be replaced
 * by the proper SASL mechanism.
 * 
 * @return  {string}  Initial SASL auth request string
 */
let xows_sasl_get_request = function() {return "";};

/**
 * Get the SASL challenge response string according the current
 * initialized mechanism.This function is intended to be replaced
 * by the proper SASL mechanism.
 * 
 * @param   {string}  challenge    Received SASL challenge.
 * 
 * @return  {string}  SASL challenge response string
 */
let xows_sasl_get_response = function(challenge) {return "";};

/**
 * Checks the SASL integrity according the current
 * initialized mechanism. This function is intended to be replaced
 * by the proper SASL mechanism.
 * 
 * @param   {string}  signature    Received SASL signature.
 * 
 * @return  {string}  True if integrity check succeed, false otherwise
 */
let xows_sasl_chk_integrity = function(signature) {return true;};

/**
 * Custom callback function fired if SASL process fail.
 */
let xows_sasl_failure_cb = function() {};

/**
 * Custom callback function fired if SASL process succeed.
 */
let xows_sasl_success_cb = function() {};

/**
 * Return the standard name of the currently selected and initialized 
 * SASL mechanism.
 * 
 * @return  {string}  Selected SASL mechanism string
 */
function xows_sasl_get_selected()
{
  return xows_sasl_select;
}

/**
 * SASL auth PLAIN mechanism auth request function.
 * 
 * @return  {string}  Initial authentication request string
 */
function xows_sasl_plain_req()
{
  let req = xows_sasl_data.authz + "\0"; 
  req += xows_sasl_data.authc + "\0"; 
  req += xows_sasl_data.passw;
  
  // clear auth data
  xows_sasl_data = {};

  return req;
}

/**
 * SASL auth PLAIN mechanism challenge dummy function. 
 * 
 * @param   {string}  challenge   Received SASL challenge.
 * 
 * @return  {string}  Nothing (PLAIN mechanism does not require challenge)
 */
function xows_sasl_plain_resp(challenge)
{
  return "";
}

/**
 * SASL auth PLAIN mechanism integrity check dummy function. 
 * 
 * @param   {string}  signature   Received SASL signature.
 * 
 * @return  {string}  Always true (PLAIN mechanism does not check integrity)
 */
function xows_sasl_plain_chk(signature)
{
  return true;
}

/**
 * SASL mechanism SCRAM-SHA-1 auth request function.
 * 
 * @return  {string}  Initial authentication request string
 */
function xows_sasl_sha1_req() 
{
  // Generate Nonce and base request
  xows_sasl_data.cnonce = xows_gen_nonce_asc(24);
  
  // Compose auth initial request
  let req = "n=" + xows_sasl_data.authc;
  req += ",r=" + xows_sasl_data.cnonce;
  
  // Store as "first-client-mesg-bare"
  xows_sasl_data.client_first_message_bare = req;
  
  // Finale request with GS2 header
  return "n,," + req;
}

/**
 * SASL mechanism SCRAM-SHA-1 challenge response function. 
 * 
 * @param   {string}  challenge   Received SASL challenge.
 * 
 * @return  {string}  Computed response to server challenge
 */
function xows_sasl_sha1_resp(challenge) 
{
  let i, k, n, nonce, salt, iter;
  
  // Parse attributes of challenge string (comma separated attributes)
  let parse, attrib = challenge.split(",");
  for(i = 0, n = attrib.length; i < n; ++i) {
    parse = attrib[i].match(/([a-z]+)=(.+)/); //< a=Value
    if(parse[1] === "r") nonce = parse[2];
    if(parse[1] === "s") salt  = parse[2];
    if(parse[1] === "i") iter  = parse[2];
  }

  // Verify the server nonce begins by our cnonce
  if(nonce.substr(0, 24) !== xows_sasl_data.cnonce) {
    xows_sasl_data = {}; //< clear auth data
    xows_log(0, "sasl_sha1_resp","SCRAM-SHA-1 challenge error",
                "missing cnonce in server nonce");
    if(xows_is_func(xows_sasl_failure_cb)) 
      xows_sasl_failure_cb();
    return "";
  }
  
  // Compose the auth message to compute reponse
  let response = "c=biws,r=" + nonce;
  let auth_mesg = xows_sasl_data.client_first_message_bare;
  auth_mesg += "," + challenge + "," + response;
  
  // Comptute salted password
  let slat_pass, tmp;
  slat_pass = tmp = xows_hmac_sha1(xows_sasl_data.passw, atob(salt)+"\x00\x00\x00\x01");
  for(i = 1; i < iter; ++i) {
    tmp = xows_hmac_sha1(xows_sasl_data.passw, tmp);
    for(k = 0; k < 20; ++k) slat_pass[k] ^= tmp[k];
  }
  
  // Create client and server keys
  let ckey = xows_hmac_sha1(slat_pass, "Client Key");                            
  const skey = xows_hmac_sha1(slat_pass, "Server Key");

  // Compute cproof : ckey XOR HMAC(H(ckey), Auth)
  const hkey = xows_hash_sha1(ckey);
  const csign = xows_hmac_sha1(hkey, auth_mesg);
  for(k = 0; k < 20; k++) ckey[k] ^= csign[k];

  // clear auth data
  xows_sasl_data = {};
  
  // Compute sproof : HMAC(skey, Auth)
  const ssign = xows_hmac_sha1(skey, auth_mesg);
  
  // Store sproof for further integrity check
  xows_sasl_data.sproof = xows_bytes_to_b64(ssign);

  // Finalize the response with computed cproof
  response += ",p=" + xows_bytes_to_b64(ckey);
  
  return response;
}

/**
 * SASL mechanism SCRAM-SHA-1 integrity check function. 
 * 
 * @param   {string}  signature   Received server signature string.
 * 
 * @return  {string}  True if supplied signature matches the computed  
 *                    one, false otherwise.
 */
function xows_sasl_sha1_chk(signature)
{ 
  // parse the server response
  const matches = signature.match(/(v)=(.+)/); //v=Signature
  
  // Get the stored server signature
  const sproof = xows_sasl_data.sproof;
  
  // clear auth data
  xows_sasl_data = {};
  
  // Check we got the right signature from server
  if(sproof !== matches[2]) {
    xows_log(0,"sasl_sha1_chk","SCRAM-SHA-1 integrity check failed",
                "supplied server signature mismatches the computed one");
    return false;
  }

  return true;
}

/**
 * SASL mechanism DIGEST-MD5 auth request function.
 * 
 * @return  {string} Nothing (DIGEST-MD5 auth is started by the server)
 */
function xows_sasl_md5_req() 
{
  return "";
}

/**
 * SASL mechanism DIGEST-MD5 challenge reponse function. 
 * 
 * Notice that this function was never tested live and may not work. 
 * Anyway DIGEST-MD5 seem to be deprecated almost everywhere.
 * 
 * @param   {string}  challenge   Received SASL challenge.
 * 
 * @return  {string}  Computed response to server challenge
 */
function xows_sasl_md5_resp(challenge) 
{
  let realm, nonce, qop, host, rspa;

  // Parse attributes of challenge string (comma separated attributes)
  let parse, attrib = challenge.split(",");
  for(let i = 0, n = attrib.length; i < n; ++i) {
    parse = attrib[i].match(/([a-z]+)="?([^"]+)/); //< attr=Value or attr="Value"
    if(parse[1] === "realm"  ) realm = parse[2];
    if(parse[1] === "nonce"  ) nonce = parse[2];
    if(parse[1] === "qop"    ) qop   = parse[2];
    if(parse[1] === "host"   ) host  = parse[2];
    if(parse[1] === "rspauth") rspa  = parse[2]; //< second challenge
  }

  // Check whether this is the 2nd (alias "rspauth") challenge, it is
  // sent by server in case of authenticiation success.
  if(rspa !== undefined) return ""; //< we ignore it, respond nothing
  
  // Store auth data localy
  const authc = xows_sasl_data.authc;
  const authz = xows_sasl_data.authz;
  const passw = xows_sasl_data.passw;
  xows_sasl_data = {}; //< clean auth data
  
  // Create the digest-uri using the authz (JID) domain
  let digest_uri = "xmpp/" + authz.split("@")[1]; //< service domain
  if(host !== undefined) digest_uri += "/" + host;
  
  // Generate our cnonce 
  const cnonce = xows_gen_nonce_asc(24);
  
  // This is not used, 00000001 is the recommanded value
  const nc = "00000001";

  // Compute MD5 reponse digest
  const Y = xows_bytes_to_str(xows_hash_md5(authc+":"+realm+":"+passw));
  const HA1 = xows_bytes_to_hex(xows_hash_md5(Y+":"+nonce+":"+cnonce+":"+authz)); 
  const HA2 = xows_bytes_to_hex(xows_hash_md5("AUTHENTICATE:"+digest_uri));
  const HKD = xows_bytes_to_hex(xows_hash_md5(HA1+":"+nonce+":"+nc+"1:"+cnonce+":"+qop+":"+HA2));
  
  // Compose response string
  let response = "charset=utf-8,";
  response += "username=\""   + authc       + "\",";
  response += "realm=\""      + realm       + "\",";
  response += "nonce=\""      + nonce       + "\",";
  response += "cnonce=\""     + cnonce      + "\",";
  response += "nc="           + nc          + ",";
  response += "digest-uri=\"" + digest_uri  + "\",";
  response += "response=\""   + HKD         + "\",";
  response += "qop=auth";

  return response;
}

/**
 * SASL mechanism DIGEST-MD5 integrity check dummy function. 
 * 
 * @param   {string}  signature   Received SASL signature.
 * 
 * @return  {string}  Always true (DIGEST-MD5 mechanism does not check integrity)
 */
function xows_sasl_md5_chk(signature)
{
  return true;
}

/**
 * List of implemented SASL mechanisms with corresponding
 * request and challenge function. Mechanisms are ordered by 
 * preference.
 */
const xows_sasl_mechanisms = [
  { name: "SCRAM-SHA-1",
    req: xows_sasl_sha1_req,
    res: xows_sasl_sha1_resp,
    chk: xows_sasl_sha1_chk},
  { name: "DIGEST-MD5",
    req: xows_sasl_md5_req,
    res: xows_sasl_md5_resp,
    chk: xows_sasl_md5_chk},
  { name: "PLAIN",
    req: xows_sasl_plain_req,
    res: xows_sasl_plain_resp,
    chk: xows_sasl_plain_chk}
];

/**
 * Select and initialize the proper SASL mechanism according the
 * supplied available list with the given auth data.
 * 
 * @param   {string[]}  candidates   List of candidate mechanisms.
 * @param   {string}    authz        Authorization ID.
 * @param   {string}    authc        Authentication ID.
 * @param   {string}    passw        Authentication Password.
 * @param   {function}  onsuccess    Optional callback for SASL success.
 * @param   {function}  onfailure    Optional callback for SASL failure.
 * 
 * @return  {boolean} Ture if initialization succeed, false if no 
 *                    suitable implemented mechanism was found.
 */
function xows_sasl_init(candidates, authz, authc, passw, onsuccess, onfailure)
{
  // Try to find a suitable SASL mechanism
  let mech_idx = -1;
  for(let i = 0, n = xows_sasl_mechanisms.length; i < n; ++i) {
    if(candidates.includes(xows_sasl_mechanisms[i].name)) {
      xows_sasl_select = xows_sasl_mechanisms[i].name; 
      mech_idx = i;
      break;
    }
  }
  
  if(mech_idx !== -1) {
    
    // Set custom callbacks
    xows_sasl_failure_cb = onfailure;
    xows_sasl_success_cb = onsuccess;
    
    // Set the proper functions for start and challenge
    xows_sasl_get_request = xows_sasl_mechanisms[mech_idx].req;
    xows_sasl_get_response = xows_sasl_mechanisms[mech_idx].res;
    xows_sasl_chk_integrity = xows_sasl_mechanisms[mech_idx].chk;
    
    // Set initial auth data
    xows_sasl_data = {};
    xows_sasl_data.authz = xows_str_to_utf8(authz);
    xows_sasl_data.authc = xows_str_to_utf8(authc);
    xows_sasl_data.passw = xows_str_to_utf8(passw);
    
    return true;
  }
  return false;
}

/* ------------------------------------------------------------------
 * 
 *                      WebSocket API Layer
 * 
 * ------------------------------------------------------------------ */
 
/**
 * Reference to created WebSocket connection object.
 */
let xows_sck_sock = null;

/**
 * WebSocket service connection URL.
 */
let xows_sck_url = null;

/**
 * Reference to custom event callback function for socket open.
 */
let xows_sck_fw_onopen = function() {};

/**
 * Reference to custom event callback function for data received.
 */
let xows_sck_fw_onrecv = function() {};

/**
 * Reference to callback function for received socket closed.
 */
let xows_sck_fw_onclose = function() {};

/**
 * Set custom callback function for socket event. The possible event
 * type are the following:
 * - open   : Socket successfully opened.
 * - recv   : Socket received data.
 * - close  : Socket closed.
 * 
 * @param   {string}    type      Event type to assign callback to.
 * @param   {function}  callback  Function to set as callback.
 */
function xows_sck_set_callback(type, callback)
{
  if(!xows_is_func(callback))
    return;
    
  switch(type.toLowerCase()) {
    case "open":  xows_sck_fw_onopen = callback; break;
    case "recv":  xows_sck_fw_onrecv = callback; break;
    case "close": xows_sck_fw_onclose = callback; break;
  }
}

/**
 * WebSocket object onerror callback.
 * 
 * @param   {object}  event   Error event
 */
function xows_sck_error(event)
{
  // Create generic error, this function never receive any details
  const err_msg = "Socket connection error";
  xows_log(0,"sck_error",err_msg);
  xows_sck_fw_onclose(XOWS_SIG_ERR, err_msg); //< Close with error
  xows_sck_sock = null; //< destroy socket object
}

/**
 * WebSocket object onclose callback.
 * 
 * @param   {object}  event   Close event
 */
function xows_sck_closed(event)
{
  if(event.code !== 1000) { //< normal close
    const err_msg = "Server closed the socket";
    xows_log(0,"sck_closed",err_msg,event.reason);
    xows_sck_fw_onclose(XOWS_SIG_ERR, err_msg); //< Close with error
  } else {
    xows_log(2,"sck_closed","Socket closed");
    xows_sck_fw_onclose(3); //< Close without error
  }
  // destroy socket object
  xows_sck_sock = null;
}

/**
 * WebSocket object onopen callback.
 * 
 * @param   {object}  event   Open event
 */
function xows_sck_opened(event)
{
  xows_log(2,"sck_opened","Socket connected");
  
  // Forward to custom callback
  xows_sck_fw_onopen();
}

/**
 * WebSocket object onmessage callback.
 * 
 * @param   {object}  event   Message event
 */
function xows_sck_recv(event)
{
  xows_log(3,"sck_recv",event.data,null,"#AB5655");
  
  // Forward to custom callback
  xows_sck_fw_onrecv(event.data);
}

/**
 * Create a new WebSocket object and open connection.
 * 
 * @param   {string}    url        WS service URL
 * @param   {string[]}  protocols  Sub-protocols to select on WS service.
 */
function xows_sck_create(url, protocols)
{
  xows_log(3,"sck_create","Socket connecting",url);
  
  // Store connection URL
  xows_sck_url = url;

  // Create new WebSocket object (open connection)
  xows_sck_sock = new WebSocket(xows_sck_url, protocols);
  
  // assing callback to WebSocket object
  xows_sck_sock.onerror = xows_sck_error;
  xows_sck_sock.onopen = xows_sck_opened;
  xows_sck_sock.onclose = xows_sck_closed;
  xows_sck_sock.onmessage = xows_sck_recv;
}

/**
 * Close WebSocket connection an destroy object
 */
function xows_sck_destroy()
{
  if(xows_sck_sock !== null) {
    xows_log(3,"sck_destroy","WebSocket closing");
    xows_sck_sock.close(); 
    xows_sck_sock = null;
  }
}

/**
 * Send data to WebSocket socket.
 * 
 * @param   {string}  data    Text data to send.
 */
function xows_sck_send(data)
{
  xows_log(3,"sck_send",data,null,"#55ABAB");
  xows_sck_sock.send(data);
}

/* ------------------------------------------------------------------
 * 
 *                          XMPP API Layer
 * 
 * ------------------------------------------------------------------ */

/**
 * List of XMPP specific XML name space strings.
 */ 
const XOWS_NS_CLIENT       = "jabber:client";
const XOWS_NS_VERSION      = "jabber:iq:version";
const XOWS_NS_ROSTER       = "jabber:iq:roster";
const XOWS_NS_REGISTER     = "jabber:iq:register";
const XOWS_NS_XDATA        = "jabber:x:data";
const XOWS_NS_PING         = "urn:xmpp:ping";
const XOWS_NS_TIME         = "urn:xmpp:time";
const XOWS_NS_DELAY        = "urn:xmpp:delay";
const XOWS_NS_CARBONS      = "urn:xmpp:carbons";
const XOWS_NS_RECEIPTS     = "urn:xmpp:receipts";
const XOWS_NS_MAM          = "urn:xmpp:mam";
const XOWS_NS_VCARD4       = "urn:xmpp:vcard4";
const XOWS_NS_AVATAR_DATA  = "urn:xmpp:avatar:data";
const XOWS_NS_AVATAR_META  = "urn:xmpp:avatar:metadata";
const XOWS_NS_MARKERS      = "urn:xmpp:chat-markers";
const XOWS_NS_HTTPUPLOAD   = "urn:xmpp:http:upload";
const XOWS_NS_IETF_FRAMING = "urn:ietf:params:xml:ns:xmpp-framing";
const XOWS_NS_IETF_SASL    = "urn:ietf:params:xml:ns:xmpp-sasl";
const XOWS_NS_IETF_BIND    = "urn:ietf:params:xml:ns:xmpp-bind";
const XOWS_NS_IETF_SESSION = "urn:ietf:params:xml:ns:xmpp-session";
const XOWS_NS_IETF_VCARD4  = "urn:ietf:params:xml:ns:vcard-4.0";
const XOWS_NS_VCARD        = "vcard-temp";
const XOWS_NS_VCARDXUPDATE = "vcard-temp:x:update";
const XOWS_NS_NICK         = "http://jabber.org/protocol/nick";
const XOWS_NS_CAPS         = "http://jabber.org/protocol/caps";
const XOWS_NS_DISCOINFO    = "http://jabber.org/protocol/disco#info";
const XOWS_NS_DISCOITEMS   = "http://jabber.org/protocol/disco#items";
const XOWS_NS_MUC          = "http://jabber.org/protocol/muc";
const XOWS_NS_MUCUSER      = "http://jabber.org/protocol/muc#user";
const XOWS_NS_MUCOWNER     = "http://jabber.org/protocol/muc#owner";
const XOWS_NS_CHATSTATES   = "http://jabber.org/protocol/chatstates";
const XOWS_NS_RSM          = "http://jabber.org/protocol/rsm";
const XOWS_NS_PUBSUB       = "http://jabber.org/protocol/pubsub";
const XOWS_NS_PUBSUBEVENT  = "http://jabber.org/protocol/pubsub#event";
const XOWS_NS_PUBSUBOPTS   = "http://jabber.org/protocol/pubsub#publish-options";

/**
 * List of presence show level.
 */
const XOWS_SHOW_OFF     = -1;
const XOWS_SHOW_DND     = 0;
const XOWS_SHOW_XA      = 1;
const XOWS_SHOW_AWAY    = 2;
const XOWS_SHOW_ON      = 3;
const XOWS_SHOW_CHAT    = 4;

/**
 * Correspondance map array for presence show string to level.
 */ 
const xows_xmp_show_level_map = {
  "dnd"   : 0,
  "xa"    : 1,
  "away"  : 2,
  "chat"  : 4 
};

/**
 * Correspondance map array for presence show level to string.
 */ 
const xows_xmp_show_name_map = ["dnd","xa","away","","chat"];

/**
 * List of presence subscrition values/mask bits.
 */
const XOWS_SUBS_REM     = -1;
const XOWS_SUBS_NONE    = 0;
const XOWS_SUBS_FROM    = 1;
const XOWS_SUBS_TO      = 2;
const XOWS_SUBS_BOTH    = 3;

/**
 * Correspondance map array for presence subscription string to value.
 */ 
const xows_xmp_subs_mask_map = {
  "remove": -1,
  "none"  : 0,
  "from"  : 1,
  "to"    : 2,
  "both"  : 3
};

/**
 * List of chatstate values.
 */
const XOWS_CHAT_GONE    = 0;
const XOWS_CHAT_ACTI    = 1;
const XOWS_CHAT_INAC    = 2;
const XOWS_CHAT_PAUS    = 3;
const XOWS_CHAT_COMP    = 4;

/**
 * Correspondance map array for chatstate string to value.
 */ 
const xows_xmp_chat_mask_map = {
  "gone"      : 0,
  "active"    : 1,
  "inactive"  : 2,
  "paused"    : 3,
  "composing" : 4
};

/**
 * Correspondance map array for chatstate value to string.
 */ 
const xows_xmp_chat_name_map = ["gone","active","inactive","paused","composing"];

/**
 * Map for XEP support between client and server. This is used to
 * set the best match between client and server supported XEP version.
 */
const xows_xmp_xep_ns = {
  "urn:xmpp:carbons":                     null,
  "urn:xmpp:mam":                         null,
  "urn:xmpp:http:upload":                 null
};

/**
 * Array to hold current server required or available stream features
 * such as <bind> and <session>.
 */
const xows_xmp_stream_feat = [];

/**
 * Stack used to store result callback functions bound to sent stanzas.
 */
let xows_xmp_iq_stk = [];

/**
 *  Stack array to store incomming parsed archived messages 
 *  following a MAM query.
 */
const xows_xmp_mam_stk = [];

/**
 * Variable to hold the XMPP server connexion url.
 */
let xows_xmp_url = null;

/**
 * Variable to hold the XMPP server domain.
 */
let xows_xmp_user = null;

/**
 * Variable to hold the XMPP server domain.
 */
let xows_xmp_domain = null;

/**
 * Variable to hold the XMPP client session full JID.
 */
let xows_xmp_jid = null;

/**
 * Variable to hold the XMPP client session JID.
 */
let xows_xmp_bare = null;

/**
 * Variable to hold the XMPP client session ressource.
 */
let xows_xmp_res = null;

/**
 * Variable to hold the XMPP authentication data.
 */
let xows_xmp_auth = null;

/**
 * Variable to specify that connect proceed to register.
 */
let xows_xmp_auth_register = false;

/**
 * Store the name space (xmlns) to use for the specified XEP during 
 * an XMPP session. 
 * 
 * This function is typically used to allow backward compatibility when 
 * possible. It first check if the supplied version (xmlns) by the 
 * server is available/valid, then store it to use it for all further
 * queries related to this XEP.
 * 
 * @param   {string}  xmlns   Specific xmlns to use for this XEP.
 * 
 * @return  {boolean} Ture if the supplied xmlns is supported and 
 *                    accepted for the specified XEP, false otherwise.
 */
function xows_xmp_use_xep(xmlns)
{
  const matches = xmlns.match(/([a-z\:]+)(:\d|$)/);
  
  if(matches[1]) { 
    // Keep current XMLNS as default
    let keep_curr = false;
    // Check whether we know this xmlns prefix
    if(matches[1] in xows_xmp_xep_ns) {
      // Extract version number if any
      if(matches[2].length) { // should be ":#" where # is a number
        if(xows_xmp_xep_ns[matches[1]] !== null) {
          // We need to compare the two version to keep the greater one
          let keep_curr = false;
          if(xows_xmp_xep_ns[matches[1]].length) {
            // Current client version IS a number, we compare integers
            const vcur = parseInt(xows_xmp_xep_ns[matches[1]].charAt(1));
            const vnew = parseInt(matches[2].charAt(1));
            if(vcur >= vnew) keep_curr = true;
          }
        }
      } else {
        // Check whether this prefix was already set before
        if(xows_xmp_xep_ns[matches[1]] !== null) keep_curr = true;
      }
    }
    if(keep_curr) {
      xows_log(2,"xmp_use_xep","Ignoring extension",xmlns);
      return false;
    } else {
      // set version string or empty string for "base" version
      xows_xmp_xep_ns[matches[1]] = (matches[2].length) ? matches[2] : ""; 
      xows_log(2,"xmp_use_xep","Use extension",xmlns);
      return true;
    }
  }
  xows_log(1,"xmp_use_xep","Unsuported extension",matches[1]);
  return false;
}

/**
 * Get the name space (xmlns) currently in use for the specified XEP 
 * for this XMPP session. 
 * 
 * This function allow to get the full xmlns with proper version to be 
 * used for XEP queries for the current session. What this function 
 * returns depend on what was previously set during services and 
 * features discovery (see: xows_xmp_use_xep).
 * 
 * If no xmlns version was previously set, the function returns null, 
 * indicating the XEP is not available for the current session.
 * 
 * @param   {string}  xmlns   Specific xmlns prefix
 * 
 * @return  {string} specific xmlns with proper version suffix or null
 */
function xows_xmp_get_xep(xmlns)
{
  if(xmlns in xows_xmp_xep_ns) {
    if(xows_xmp_xep_ns[xmlns]) {
      return xmlns + xows_xmp_xep_ns[xmlns];
    }
  }
  xows_log(1,"xmp_get_xep","Unknown extension",xmlns);
  return null;
}

/**
 * Get own entity capabilities. 
 * 
 * This returns an array  containing XML nodes ready to be injected 
 * into a query result stanza.
 * 
 * @return  {string}  Array of XML objects defining client identity 
 *                    and features.
 */
function xows_xmp_get_caps()
{
  let vcard4 = XOWS_NS_VCARD4;
  let avatar = XOWS_NS_AVATAR_META;
  
  // Optional features (pubsub notify subscribtion)
  if(xows_options.vcard4_notify) vcard4 += "+notify";
  if(xows_options.avatar_notify) avatar += "+notify";
    
  const caps = [
    xows_xml_node("identity",{"category":"client","name":XOWS_APP_NAME,"type":"web"}),
    xows_xml_node("feature",{"var":XOWS_NS_CAPS}),
    xows_xml_node("feature",{"var":XOWS_NS_DISCOINFO}),
    xows_xml_node("feature",{"var":XOWS_NS_DISCOITEMS}),
    xows_xml_node("feature",{"var":XOWS_NS_PING}),
    xows_xml_node("feature",{"var":XOWS_NS_TIME}),
    xows_xml_node("feature",{"var":XOWS_NS_VERSION}),
    xows_xml_node("feature",{"var":XOWS_NS_CHATSTATES}),
    xows_xml_node("feature",{"var":XOWS_NS_RECEIPTS}),
    xows_xml_node("feature",{"var":XOWS_NS_VCARD}),
    xows_xml_node("feature",{"var":XOWS_NS_IETF_VCARD4}),
    xows_xml_node("feature",{"var":vcard4}),
    xows_xml_node("feature",{"var":XOWS_NS_AVATAR_DATA}),
    xows_xml_node("feature",{"var":avatar})
  ];

  return caps;
}

/**
 * Get own entity capabilities verification hash.
 * 
 * This build the verification hash from data returned by the
 * xows_xmp_get_caps function.
 * 
 * @return  {string}  Base64 encoded verficiation hash.
 */
function xows_xmp_get_caps_ver()
{
  const caps = xows_xmp_get_caps();
  
  let i, n = caps.length, S = "";
  
  // Concatenate indentities
  for(i = 0; i < n; ++i) {
    if(caps[i].tagName === "identity") {
      S += caps[i].getAttribute("category") + "/";
      S += caps[i].getAttribute("type") + "/"; 
      S += (caps[i].hasAttribute("xml:lang")?caps[i].getAttribute("xml:lang"):"") + "/";
      S += caps[i].getAttribute("name") + "<";
    }
  }
  // Concatenate features
  for(i = 0; i < n; ++i) {
    if(caps[i].tagName === "feature") 
      S += caps[i].getAttribute("var") + "<";
  }
  
  return xows_bytes_to_b64(xows_hash_sha1(S));
}

/**
 * Function to parse a standard jabber:x:data form
 * 
 * @param   {object}    x       <x> Stanza element to parse
 * 
 * @return  {object[]}  Array of parsed field to complete.
 */
function xows_xmp_xdata_parse(x)
{
  const form = [];
  
  // Turn each <field> into object's array
  const nodes = x.getElementsByTagName("field");
  for(let i = 0, n = nodes.length; i < n; ++i) {
    form.push({
      "required"  : (nodes[i].querySelector("required") !== null),
      "type"      : nodes[i].getAttribute("type"),
      "label"     : nodes[i].getAttribute("label"),
      "var"       : nodes[i].getAttribute("var"),
      "value"     : xows_xml_get_text(nodes[i].querySelector("value"))});
  }
  
  return form;
}

/**
 * Function to create a standard jabber:x:data submit <x> node using
 * the given array.
 * 
 * Given array must contain one or more objects with properly filled
 * "var" and "value" values.
 * 
 * @param   {object[]}  field    Object's array to turn as <field> elements.
 * 
 * @return  {object}    <x> XML node with <field> to submit.
 */
function xows_xmp_xdata_make(field)
{
  // The base <x> node
  const x = xows_xml_node("x",{"type":"submit","xmlns":XOWS_NS_XDATA});

  // Add <field> elements with proper values to <x> node
  let node;
  for(let i = 0, n = field.length; i < n; ++i) {
    
    // Create base <field> node
    node = xows_xml_node("field");
    
    // Add available informations to node
    if(field[i]["var"]) node.setAttribute("var", field[i]["var"]);
    if(field[i].type) node.setAttribute("type", field[i].type);
    if(field[i].value) 
      xows_xml_parent(node,xows_xml_node("value",null,field[i].value));
      
    // Add <field> to <x>
    xows_xml_parent(x, node);
  }
  
  return x;
}

/**
 * Reference to callback function for XMPP session ready.
 */
let xows_xmp_fw_onsession = function() {};

/**
 * Reference to callback function for XMPP account registration form.
 */
let xows_xmp_fw_onregister = function() {};

/**
 * Reference to callback function for received presence.
 */
let xows_xmp_fw_onpresence = function() {};

/**
 * Reference to callback function for received subscribe presence.
 */
let xows_xmp_fw_onsubscrib = function() {};

/**
 * Reference to callback function for received presence.
 */
let xows_xmp_fw_onoccupant = function() {};

/**
 * Reference to callback function for received roster push.
 */
let xows_xmp_fw_onroster = function() {};

/**
 * Reference to callback function for received chat message content.
 */
let xows_xmp_fw_onmessage = function() {};

/**
 * Reference to callback function for received chat state notification.
 */
let xows_xmp_fw_onchatstate = function() {};

/**
 * Reference to callback function for received message receipt.
 */
let xows_xmp_fw_onreceipt = function() {};

/**
 * Reference to callback function for received room subject.
 */
let xows_xmp_fw_onsubject = function() {};

/**
 * Reference to callback function for received PubSub event.
 */
let xows_xmp_fw_onpubsub = function() {};

/**
 * Reference to callback function for XMPP stream closed.
 */
let xows_xmp_fw_onerror = function() {};

/**
 * Reference to callback function for XMPP stream closed.
 */
let xows_xmp_fw_onclose = function() {};

/**
 * Set callback functions for parse result of received common stanzas.
 * 
 * Possibles slot parameter value are the following:
 * session    : XMPP Session open.
 * register   : New account registered.
 * presence   : Contact presence.
 * subscrib   : Contact subscribe request.
 * occupant   : Room occupant presence.
 * roster     : Roster push (add or remove Contact).
 * message    : Common chat messages with body.
 * chatstate    : Chat states messages.
 * receipt    : Message receipts.
 * subject    : Room subject.
 * pubsub     : Received PubSub event.
 * error      : Received error.
 * close      : Session close.
 * 
 * @param   {string}    type      Callback slot.
 * @param   {function}  callback  Callback function to set.
 */
function xows_xmp_set_callback(type, callback)
{
  if(!xows_is_func(callback))
    return;
    
  switch(type.toLowerCase()) {
    case "session":   xows_xmp_fw_onsession = callback; break;
    case "register":  xows_xmp_fw_onregister = callback; break;
    case "presence":  xows_xmp_fw_onpresence = callback; break;
    case "subscrib":  xows_xmp_fw_onsubscrib = callback; break;
    case "occupant":  xows_xmp_fw_onoccupant = callback; break;
    case "roster":    xows_xmp_fw_onroster = callback; break;
    case "message":   xows_xmp_fw_onmessage = callback; break;
    case "chatstate": xows_xmp_fw_onchatstate = callback; break;
    case "receipt":   xows_xmp_fw_onreceipt = callback; break;
    case "subject":   xows_xmp_fw_onsubject = callback; break;
    case "pubsub":    xows_xmp_fw_onpubsub = callback; break;
    case "error":     xows_xmp_fw_onerror = callback; break;
    case "close":     xows_xmp_fw_onclose = callback; break;
  }
}

/**
 * Send an XMPP stanza with optional callbacks function to handle
 * received result or response for server. 
 * 
 * If the onresult parameter is defined, the callback is called once
 * an stanza with the same id as the initial query is received with
 * the received stanza as unique parameter.
 *  
 * @param   {object}    stanza      Stanza XML Element object.
 * @param   {function}  [onresult]  Callback for received query result.
 * @param   {function}  [onparse]  Callback for parsed result forwarding.
 */
function xows_xmp_send(stanza, onresult, onparse) 
{
  if(!xows_sck_sock) return;
  
  // Add jabber:client namespace
  if(stanza.tagName === "presence" || 
      stanza.tagName === "message" || 
      stanza.tagName === "iq") {
    if(!stanza.getAttribute("xmlns")) 
      stanza.setAttribute("xmlns",XOWS_NS_CLIENT);
  }
  
  // Add id to stanza
  let id = stanza.getAttribute("id");
  if(!id) {
    id = xows_gen_uuid();
    stanza.setAttribute("id", id);
  }
  
  // If callaback is supplied, add request to stack
  if(xows_is_func(onresult)) 
    xows_xmp_iq_stk.push({"id":id,"onresult":onresult,"onparse":onparse});

  // Send serialized data to socket
  xows_sck_send(xows_xml_serialize(stanza));
}

/**
 * Parse the given error <iq> and returns the parsed error type
 * and hint text.
 * 
 * @param   {object}  stanza   Received <iq> stanza.
 * 
 * @return  {string}  Parsed error type and text as combined string.
 */
function xows_xmp_error_str(stanza)
{
  let str;
  
  // Get inner <error> child and try to find <text>
  const error = stanza.querySelector("error");
  if(error) {
    str = "(" + error.getAttribute("type") + ") ";
    const text = error.querySelector("text");
    str += text ? xows_xml_get_text(text) : error.firstChild.tagName;
  }
  
  return str;
}

/**
 * Function to parse an iq stanza in a generial way. This parse 
 * function may be used by serveral other functions.
 * 
 * @param   {object}    stanza    Received iq stanza.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_iq_parse(stanza, onparse)
{
  let er_type, er_code, er_name, er_text;
  
  const id = stanza.getAttribute("id");
  const type = stanza.getAttribute("type");
  
  // Check for error
  if(type === "error") {
    // Get error details
    const error = stanza.querySelector("error");
    er_type = error.getAttribute("type");
    er_code = error.getAttribute("code");
    er_name = error.firstChild.tagName;
    er_text = xows_xml_get_text(stanza.querySelector("text"));
    xows_log(1,"xows_xmp_iq_parse","Query '"+id+"' error",xows_xmp_error_str(stanza));
  }
  
  // Forward parse result
  if(xows_is_func(onparse)) 
    onparse(stanza.getAttribute("from"), 
      type, er_type, er_code, er_name, er_text);
}

/**
 * Parse session query result. 
 * 
 * This function is part of session init process and is called once 
 * the session query result is recevied, if the session query result 
 * is received without error this mean the XMPP session is successfully
 * open, so, the session ready callback is called.
 * 
 * @param   {object}    stanza    Received query response stanza.
 */
function xows_xmp_session_parse(stanza)
{
  if(stanza.getAttribute("type") === "error") {
    const err_msg = "Session establishment failure";
    xows_log(0,"xmp_session_parse",err_msg,xows_xmp_error_str(stanza));
    xows_xmp_send_close(XOWS_SIG_ERR, err_msg); //< Close with error
    return;
  } 
  
  xows_log(2,"xmp_session_parse","Session established");
  
  // Session ready, call the callback
  xows_xmp_fw_onsession(xows_xmp_jid);
}

/**
 * Query stream session.
 */
function xows_xmp_session_query()
{
  xows_log(2,"xmp_session_query","Query for session");
  
  // Go to the next step by sending query for session open
  const iq =  xows_xml_node("iq",{"type":"set"},
                xows_xml_node("session",{"xmlns":XOWS_NS_IETF_SESSION}));
  
  xows_xmp_send(iq, xows_xmp_session_parse);
}

/**
 * Parse bind query result.
 * 
 * This function is part of session init process and is called once 
 * the bind query result is recevied. 
 * 
 * If resource is successfully bound, it checks whether stream session
 * feature is available (required or not) and send a session query.
 * 
 * @param   {object}    stanza    Received query response stanza.
 */
function xows_xmp_bind_parse(stanza)
{
  if(stanza.getAttribute("type") === "error") {
    const err_msg = "Resource bind failure";
    xows_log(0,"xmp_bind_parse",err_msg,xows_xmp_error_str(stanza));
    xows_xmp_send_close(XOWS_SIG_ERR, err_msg); //< Close with error
    return;
  }
  // Get the full JID and parse the received resource
  const jid = stanza.querySelector("jid"); //< <jid> node
  xows_xmp_jid = xows_xml_get_text(jid);
  xows_xmp_res = xows_jid_to_nick(xows_xmp_jid);
  xows_log(2,"xmp_bind_parse","Resource bind accepted",xows_xmp_jid);
  // Check whether stream session feature is available
  if(xows_xmp_stream_feat.includes(XOWS_NS_IETF_SESSION)) {
    // Query for stream session
    xows_xmp_session_query();
  } else {
    // Session ready, call the callback
    xows_xmp_fw_onsession(xows_xmp_jid);
  }
}

/**
 * Query stream bind ressource.
 */
function xows_xmp_bind_query()
{
  // Query for resource binding to start session open process
  const resource = "xows_" + xows_gen_nonce_asc(8); //< Generate Ressource Id
  
  xows_log(2,"xmp_bind_query","Query for resource bind",resource);
  
  const iq =  xows_xml_node("iq",{"type":"set"},
                xows_xml_node("bind",{"xmlns":XOWS_NS_IETF_BIND},
                  xows_xml_node("resource", null, resource)));
  
  xows_xmp_send(iq, xows_xmp_bind_parse);
}


/**
 * Send query to enable or disable carbons (XEP-0280).
 * 
 * @param   {boolean}   enable   Boolean to query enable or disable
 * @param   {function}  onparse  Callback to forward parse result.
 */
function xows_xmp_carbons_query(enable, onparse) 
{
  // Create enable or disable node
  const tag = (enable) ? "enable" : "disable";
  
  xows_log(2,"xmp_carbons_query","Query XEP-0280 Carbons",tag);

  const xmlns_carbons = xows_xmp_get_xep(XOWS_NS_CARBONS);
  if(!xmlns_carbons) {
    xows_log(1,"xmp_carbons_query","XEP-0280 Carbons unavailable");
    return;
  }
  
  // Send request to enable carbons
  const iq =  xows_xml_node("iq",{"type":"set"}, 
                xows_xml_node(tag,{"xmlns":xmlns_carbons}));
                
  // Use generic parsing function     
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Parse result of disco#info query.
 * 
 * @param   {object}    stanza    Received query response stanza.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_discoinfo_parse(stanza, onparse)
{
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_discoinfo_parse","Parse Disco#info",xows_xmp_error_str(stanza));
    return; 
  }
  
  // Get the <query> child element
  const query = stanza.querySelector("query");
  
  let i, n, nodes;
  
  // Turn each <identity> into object's array.
  nodes = query.getElementsByTagName("identity");
  const iden = [];
  for(i = 0, n = nodes.length; i < n; ++i) {
    iden.push({ "category": nodes[i].getAttribute("category"),
                "type"    : nodes[i].getAttribute("type"),
                "name"    : nodes[i].getAttribute("name")});
  }
  
  // Turn each <feature var=""> into string array.
  nodes = query.getElementsByTagName("feature");
  const feat = [];
  for(i = 0, n = nodes.length; i < n; ++i) {
    if(nodes[i].hasAttribute("var"))
      feat.push(nodes[i].getAttribute("var"));
  }
  
  // Parse the <x> element if exists
  const x = query.querySelector("x");
  const form = x ? xows_xmp_xdata_parse(x) : null;
  
  // Forward result to client
  if(xows_is_func(onparse)) 
    onparse( stanza.getAttribute("from"), iden, feat, form, query.getAttribute("node"));
}

/**
 * Send a disco#info query.
 * 
 * @param   {string}    to        Target JID or URL.
 * @param   {string}    node      Query node attribute or null to ignore
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_discoinfo_query(to, node, onparse)
{
  xows_log(2,"xmp_discoinfo_query","Query disco#info",to);

  const iq =  xows_xml_node("iq",{"type":"get","to":to},
                xows_xml_node("query",{"xmlns":XOWS_NS_DISCOINFO,"node":node}));
  
  xows_xmp_send(iq, xows_xmp_discoinfo_parse, onparse);
}

/**
 * Parse result of disco#items query.
 * 
 * @param   {object}    stanza    Received stanza corresponding to query.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_discoitems_parse(stanza, onparse)
{
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_discoitems_parse","Parse Disco#items",xows_xmp_error_str(stanza));
    return; 
  }
  
  // Turn <item> elements into object's array
  const nodes = stanza.getElementsByTagName("item");
  const item = [];
  for(let i = 0, n = nodes.length; i < n; ++i) {
    item.push({ "jid"   : nodes[i].getAttribute("jid"),
                "name"  : nodes[i].getAttribute("name")});
  }
  
  // Forward result to client
  if(xows_is_func(onparse)) 
    onparse( stanza.getAttribute("from"), item);
}

/**
 * Send a disco#items query.
 * 
 * @param   {string}    to        Entity JID, name or URL.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_discoitems_query(to, onparse)
{
  xows_log(2,"xmp_discoitems_query","Query disco#items",to);
  
  const iq =  xows_xml_node("iq",{"type":"get","to":to},
                xows_xml_node("query",{"xmlns":XOWS_NS_DISCOITEMS}));

  xows_xmp_send(iq, xows_xmp_discoitems_parse, onparse);
}

/**
 * Function to parse result of get roster query.
 * 
 * @param   {object}    stanza    Received query response stanza.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_roster_get_parse(stanza, onparse) 
{
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_roster_get_parse","Parse get Roster",xows_xmp_error_str(stanza));
    return;
  }

  // Turn <item> to object's array
  const nodes = stanza.getElementsByTagName("item");
  const item = [];
  for(let i = 0, n = nodes.length; i < n; ++i) {
    item.push({ "bare"  : nodes[i].getAttribute("jid"),
                "name"  : nodes[i].getAttribute("name"),
                "subs"  : xows_xmp_subs_mask_map[nodes[i].getAttribute("subscription")],
                "group" : xows_xml_get_text(nodes[i].querySelector("group"))});
  }

  // Forward result to client
  if(xows_is_func(onparse))
    onparse(item);
}

/**
 * Send query to get roster content to the server.
 * 
 * @param   {function}  onparse   Callback to receive parse result.
 */
function xows_xmp_roster_get_query(onparse)
{
  xows_log(2,"xmp_roster_get_query","Query get Roster");
  
  // Create and launch the query
  const iq = xows_xml_node("iq",{"type":"get"}, 
              xows_xml_node("query",{"xmlns":XOWS_NS_ROSTER}));
  
  xows_xmp_send(iq, xows_xmp_roster_get_parse, onparse);
}

/**
 * Send query to add new user to roster.
 * 
 * @param   {string}    jid       Contact JID to add.
 * @param   {string}    name      Contact Displayed name or null to remove item.
 * @param   {string}    group     Group name where to add contact or null to ignore.
 * @param   {function}  onparse   Callback to receive parse result.
 */
function xows_xmp_roster_set_query(jid, name, group, onparse)
{
  xows_log(2,"xmp_roster_set_query","Query set Roster",jid);
  
  // Create the item child
  const item = xows_xml_node("item",{"jid":jid});
  
  // Null name means item to be removed
  if(!name) {
    item.setAttribute("subscription","remove");
  } else {
    item.setAttribute("name",name);
    if(group !== undefined) {
      xows_xml_parent(item,xows_xml_node("group",null,group));
    }
  }

  // Create and launch the query
  const iq = xows_xml_node("iq",{"type":"set"},
              xows_xml_node("query",{"xmlns":XOWS_NS_ROSTER},item));
  
  // Use generic parse function
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Function to parse result of MUC rooom config form.
 * 
 * @param   {function}  to        Chatroom JID to get configuration from.
 * @param   {function}  onparse   Callback to receive parse result.
 */
function xows_xmp_muc_cfg_get_parse(stanza, onparse)
{
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_muc_cfg_get_parse","Parse get MUC config",xows_xmp_error_str(stanza));
    return;
  } 
  
  // Forward parse result
  if(xows_is_func(onparse)) 
    onparse(  stanza.getAttribute("from"),
              xows_xmp_xdata_parse(stanza.querySelector("x")));
}

/**
 * Send query to get MUC room config form.
 * 
 * @param   {function}  to        Chatroom JID to get configuration from.
 * @param   {function}  onparse   Callback to receive parse result.
 */
function xows_xmp_muc_cfg_get_guery(to, onparse)
{
  xows_log(2,"xmp_muc_cfg_get_guery","Query get MUC config");
  
  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"get"},
              xows_xml_node("query",{"xmlns":XOWS_NS_MUCOWNER}));
              
  xows_xmp_send(iq, xows_xmp_muc_cfg_get_parse, onparse);
}

/**
 * Send query to cancel MUC form process.
 * 
 * @param   {function}  to        Chatroom JID to get configuration from.
 * @param   {function}  onparse   Callback to receive parse result.
 */
function xows_xmp_muc_cfg_set_cancel(to, onparse)
{
  xows_log(2,"xmp_muc_cfg_set_cancel","Cancel set MUC config");
  
  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"set"},
              xows_xml_node("query",{"xmlns":XOWS_NS_MUCOWNER}),
                xows_xml_node("x",{"xmlns":XOWS_NS_XDATA,"type":"cancel"}));
              
  // We use generical iq parse function to get potential error message
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Send query to submit MUC room config form.
 * 
 * @param   {function}  to        Chatroom JID to get configuration from.
 * @param   {object[]}  form      Filled form array to submit.
 * @param   {function}  onparse   Callback to receive parse result.
 */
function xows_xmp_muc_cfg_set_query(to, form, onparse)
{
  xows_log(2,"xmp_muc_cfg_set_query","Query set MUC config");
  
  // Create the <x> form node
  const x = xows_xmp_xdata_make(form);
  
  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"set"},
              xows_xml_node("query",{"xmlns":XOWS_NS_MUCOWNER},x));
              
  // We use generical iq parse function to get potential error message
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Generic function to publish to account PEP Node.
 * 
 * @param   {string}    node      PEP node (xmlns).
 * @param   {object}    publish   <publish> child node to add.
 * @param   {string}    access    Pubsub Access model to define.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_pubsub_publish(node, publish, access, onparse)
{
  xows_log(2,"xmp_pubsub_publish","Publish PEP node",node);
  
  const children = [publish];

  // the <publish-options> child
  if(access) {
    children.push(xows_xml_node("publish-options",{"node":node},
                    xows_xmp_xdata_make([ {"var":"FORM_TYPE","type":"hidden",
                                            "value":XOWS_NS_PUBSUBOPTS},
                                          {"var":"pubsub#access_model",
                                            "value":access}])));
  }
  
  // Create the query
  const iq =  xows_xml_node("iq",{"type":"set"}, 
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUB},children));
                    
  // Send final message with generic parsing function
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Send query to publish vcard-4.
 * 
 * @param   {object}    vcard     vCard4 data to set.
 * @param   {string}    access    Pubsub Access model to define.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_vcard4_publish(vcard, access, onparse)
{
  xows_log(2,"xmp_vcard4_publish","Publish vCard-4");

  // The <publish> child
  const publish = xows_xml_node("publish",{"node":XOWS_NS_VCARD4},
                    xows_xml_node("item",null,
                      xows_xml_node("vcard",{"xmlns":XOWS_NS_IETF_VCARD4},vcard)));

  // Publish PEP node
  xows_xmp_pubsub_publish(XOWS_NS_VCARD4, publish, access, onparse);
}

/**
 * Function to parse result of get vcard-4 query.
 * 
 * @param   {object}    stanza    Received query response stanza.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_vcard4_get_parse(stanza, onparse) 
{
  let vcard = null;
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_vcard4_get_parse","Parse get vCard-4",xows_xmp_error_str(stanza));
  } else {
    vcard = stanza.querySelector("vcard");
  }

  // Forward parse result
  if(xows_is_func(onparse)) 
    onparse( stanza.getAttribute("from"), vcard);
}

/**
 * Send query to get vcard-4.
 * 
 * @param   {string}    to        Contact JID get vcard.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_vcard4_get_query(to, onparse)
{
  xows_log(2,"xmp_vcard4_get_query","Query get vCard-4",to);
  
  // Create and launch the query
  const iq = xows_xml_node("iq",{"type":"get","to":to}, 
              xows_xml_node("vcard",{"xmlns":XOWS_NS_IETF_VCARD4}));
  
  xows_xmp_send(iq, xows_xmp_vcard4_get_parse, onparse);
}

/**
 * Send query to publish vcard-temp.
 * 
 * @param   {object}    vcard     vCard data to set.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_vcardtemp_publish(vcard, onparse)
{
  xows_log(2,"xmp_vcardtemp_publish","Publish vCard-temp");

  // Create and launch the query
  const iq = xows_xml_node("iq",{"type":"set","to":xows_xmp_bare}, 
              xows_xml_node("vCard",{"xmlns":XOWS_NS_VCARD},vcard));
  
  // Use generic iq parsing function
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Function to parse result of get vcard-temp query.
 * 
 * @param   {object}    stanza    Received query response stanza.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_vcardtemp_get_parse(stanza, onparse)
{
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_vcardtemp_get_parse","Parse get vcard-Temp",xows_xmp_error_str(stanza));
    return;
  }
  // Forward parse result
  if(xows_is_func(onparse)) 
    onparse( stanza.getAttribute("from"), 
              stanza.querySelector("vCard"));
}

/**
 * Send query to retrieve vcard-temp.
 * 
 * @param   {object}    to        Contact JID or null to get own.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_vcardtemp_get_query(to, onparse)
{
  xows_log(2,"xmp_vcardtemp_get_query_","Query get vcard-Temp");
  
  // Create and launch the query
  const iq = xows_xml_node("iq",{"type":"get"}, 
              xows_xml_node("vCard",{"xmlns":XOWS_NS_VCARD}));
              
  // Set the "to" attribute if supplied
  if(to !== null) iq.setAttribute("to", to);
  
  // Use generic iq parsing function
  xows_xmp_send(iq, xows_xmp_vcardtemp_get_parse, onparse);
}

/**
 * Publish XEP-0084 User Avatar data.
 * 
 * @param   {string}    hash      Base-64 encoded SAH-1 hash of data
 * @param   {string}    data      Base-64 encoded Data to publish
 * @param   {string}    access    Pubsub Access model to define.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_avat_data_publish(hash, data, access, onparse)
{
  xows_log(2,"xmp_avat_data_publish","Publish Avatar Data",hash);
  
  // The <publish> child
  const publish = xows_xml_node("publish",{"node":XOWS_NS_AVATAR_DATA},
                    xows_xml_node("item",{"id":hash},
                      xows_xml_node("data",{"xmlns":XOWS_NS_AVATAR_DATA},data)));
  
  // Publish PEP node
  xows_xmp_pubsub_publish(XOWS_NS_AVATAR_DATA, publish, access, onparse);
}

/**
 * Publish XEP-0084 User Avatar metadata.
 * 
 * @param   {string}    hash      Base-64 encoded SAH-1 hash of data
 * @param   {number}    type      Image type (expected image/png)
 * @param   {number}    bytes     Image data size in bytes
 * @param   {number}    width     Image width in pixel
 * @param   {number}    height    Image width in pixel
 * @param   {string}    access    Pubsub Access model to define.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_avat_meta_publish(hash, type, bytes, width, height, access, onparse)
{
  xows_log(2,"xmp_avat_meta_publish","Publish Avatar Metadata",hash);
  
  // Create the <info> node
  const info = xows_xml_node("info",{"id":hash,"type":type,"bytes":bytes,"width":width,"height":height});
  
  // The <publish> child
  const publish = xows_xml_node("publish",{"node":XOWS_NS_AVATAR_META},
                    xows_xml_node("item",{"id":hash},
                      xows_xml_node("metadata",{"xmlns":XOWS_NS_AVATAR_META},info)));

  // Publish PEP node
  xows_xmp_pubsub_publish(XOWS_NS_AVATAR_META, publish, access, onparse);
}

/**
 * Function to handle result of Query XEP-0084 User Avatar data.
 * 
 * @param   {object}    stanza    Received query response stanza.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_avat_data_get_parse(stanza, onparse)
{
  let id, data = null;
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_avat_data_get_parse","Parse get Avatar Data",xows_xmp_error_str(stanza));
  }

  // Retrieve the first <item> child
  const item = stanza.querySelector("item");
  if(item) {
    // Get the data hash
    id = item.getAttribute("id");
    // Retrieve the <data> child
    data = xows_xml_get_text(item.querySelector("data"));
  }
  
  // Forward parse result
  if(xows_is_func(onparse)) 
    onparse(stanza.getAttribute("from"), id, data);
}

/**
 * Query XEP-0084 User Avatar data.
 * 
 * @param   {number}    to        Target bare JID
 * @param   {string}    hash      Data Id to get (SAH-1 data hash)
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_avat_data_get_query(to, hash, onparse)
{
  xows_log(2,"xmp_avat_data_get_query","Query get Avatar Data",to+" hash:"+hash);
  
  // Create the query
  const iq =  xows_xml_node("iq",{"type":"get","to":to}, 
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUB},
                  xows_xml_node("items",{"node":XOWS_NS_AVATAR_DATA},
                    xows_xml_node("item",{"id":hash}))));
  // Send query
  xows_xmp_send(iq, xows_xmp_avat_data_get_parse, onparse);
}

/**
 * Function to handle result of Query XEP-0084 User Avatar data.
 * 
 * @param   {object}    stanza    Received query response stanza.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_avat_meta_get_parse(stanza, onparse)
{
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_avat_meta_get_parse","Parse get Avatar Metadata",xows_xmp_error_str(stanza));
    return;
  }
  
  // Forward parse result
  if(xows_is_func(onparse)) 
    onparse(stanza.getAttribute("from"), stanza.querySelector("metadata"));
}

/**
 * Query XEP-0084 User Avatar metadata.
 * 
 * @param   {number}    to        Target bare JID
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_avat_meta_get_query(to, onparse)
{
  xows_log(2,"xmp_avat_meta_get_query","Query get Avatar Metadata",to);
  
  // Create the query
  const iq =  xows_xml_node("iq",{"type":"get","to":to}, 
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUB},
                  xows_xml_node("items",{"node":XOWS_NS_AVATAR_META})));
  // Send query
  xows_xmp_send(iq, xows_xmp_avat_meta_get_parse, onparse);
}

/**
 * Publish XEP-0172 User Nickname.
 * 
 * @param   {string}    nick      Nickname to publish
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_nick_publish(nick, onparse)
{
  xows_log(2,"xmp_nick_publish","Publish Nickname",nick);
  
  // The <publish> child
  const publish = xows_xml_node("publish",{"node":XOWS_NS_NICK},
                    xows_xml_node("item",null,
                      xows_xml_node("nick",{"xmlns":XOWS_NS_NICK},nick)));

  // Publish PEP node
  xows_xmp_pubsub_publish(XOWS_NS_NICK, publish, null, onparse);
}

/**
 * Function to handle result of Query XEP-0172 User Nickname.
 * 
 * @param   {object}    stanza    Received query response stanza.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_nick_get_parse(stanza, onparse)
{
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_nick_get_parse","Parse get Nickname",xows_xmp_error_str(stanza));
    return;
  }
  
  // Forward parse result
  if(xows_is_func(onparse)) 
    onparse(stanza.getAttribute("from"), stanza.querySelector("nick"));
}

/**
 * Query XEP-0172 User Nickname.
 * 
 * @param   {number}    to        Target bare JID
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_nick_get_query(to, onparse)
{
  xows_log(2,"xmp_avat_data_get_query","Query get Nickname",to);
  
  // Create the query
  const iq =  xows_xml_node("iq",{"type":"get","to":to}, 
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUB},
                  xows_xml_node("items",{"node":XOWS_NS_NICK},
                    xows_xml_node("item",null))));
  // Send query
  xows_xmp_send(iq, xows_xmp_nick_get_parse, onparse);
}

/**
 * Function to parse result of register form query.
 * 
 * @param   {object}    stanza    Received query response stanza.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_register_get_parse(stanza, onparse) 
{
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_register_get_parse","Parse get Register",xows_xmp_error_str(stanza));
    return;
  } 
  
  // Get common registration elements
  const username = stanza.querySelector("username");
  const password = stanza.querySelector("password");
  const email = stanza.querySelector("email");
  const x = stanza.querySelector("x");
  
  // Check whether we have <registered> element, meaning already registered
  const regd = stanza.querySelector("registered") ? true : false;
  const user = username ? xows_xml_get_text(username) : null;
  const pass = password ? xows_xml_get_text(password) : null;
  const mail = email ? xows_xml_get_text(email) : null;
  const form = x ? xows_xmp_xdata_parse(x) : null;
  
  // Forward parse result
  if(xows_is_func(onparse)) 
    onparse(stanza.getAttribute("from"), regd, user, pass, mail, form);
}

/**
 * Send a register fields query to the specified destination.
 * 
 * @param   {string}    to        Peer or service JID.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_register_get_query(to, onparse)
{
  xows_log(2,"xmp_register_get_query","Query get Register");
  
  // Create and launch the query
  const iq = xows_xml_node("iq",{"type":"get"}, 
              xows_xml_node("query",{"xmlns":XOWS_NS_REGISTER}));
  
  if(to !== null) iq.setAttribute("to",to);
  
  xows_xmp_send(iq, xows_xmp_register_get_parse, onparse);
}

/**
 * Send a register form query to the specified destination.
 * 
 * @param   {string}    to        Peer or service JID or null.
 * @param   {string}    user      Content for <user> or null to ignore.
 * @param   {string}    pass      Content for <pass> or null to ignore.
 * @param   {string}    mail      Content for <mail> or null to ignore.
 * @param   {object[]}  form      Fulfilled x-data form null to ignore.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_register_set_query(to, user, pass, mail, form, onparse)
{
  xows_log(2,"xmp_register_submit","Submit Register");
  
  // Create the base <query> node
  const query = xows_xml_node("query",{"xmlns":XOWS_NS_REGISTER});
  
  // Add child nodes as supplied
  if(user !== null) xows_xml_parent(query, xows_xml_node("username",null,user));
  if(pass !== null) xows_xml_parent(query, xows_xml_node("password",null,pass));
  if(mail !== null) xows_xml_parent(query, xows_xml_node("email",null,mail));
  if(form !== null) xows_xml_parent(query, xows_xmp_xdata_make(form));
  
  // Create and launch the query
  const iq =  xows_xml_node("iq",{"type":"set"},query);
  
  if(to !== null) iq.setAttribute("to",to);
  
  // We use generical iq parse function to get potential error message
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Variable to store contextual parameters for archives query
 */
const xows_xmp_mam_query_param = {};

/**
 * Archive result parsing function called when archive query result 
 * is received.
 * 
 * @param   {object}    stanza    Received query response stanza.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_mam_parse(stanza, onparse)
{
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_mam_parse","Archive query failure",xows_xmp_error_str(stanza));
    return;
  }

  const id = stanza.getAttribute("id");
  
  // Retreive the "with" parameter corresponding to id
  const from = xows_xmp_mam_query_param[id].to;
  const _with = xows_xmp_mam_query_param[id]["with"];
  
  //Check for the <fin> node to ensure this is what we seek for
  const fin = stanza.querySelector("fin");
  if(fin) {
    
    // Variables we will need
    let node, first, last, complete, count = 0;
  
    // Check whether archive request is completed
    complete = (fin.getAttribute("complete") === "true") ? true : false;
    
    // Total page count (beyond "max" value) for this query
    node = fin.querySelector("count");
    if(node) count = parseInt(xows_xml_get_text(node));

    // Result first RSM Page id
    node = fin.querySelector("first");
    if(node) {
      first = xows_xml_get_text(node);
    } else {
      xows_log(2,"xmp_mam_parse","No result received");
      // Forward parse result
      if(xows_is_func(onparse)) 
        onparse(from, _with, [], count, complete);
      return;
    }
    
    // Result last RSM Page id
    node = fin.querySelector("last");
    if(node) last = xows_xml_get_text(node);

    // Extract messages from stack
    let i, result;
    const n = xows_xmp_mam_stk.length;
    
    // Align index to the first page
    for(i = 0; i < n; i++) 
      if(xows_xmp_mam_stk[i].page === first) break;

    if(i >= n) {
      xows_log(0, "xmp_mam_parse","First result page not found in stack",first);
      result = []; //< create empty result
    } else {
      // Get messages untile we found the last page
      let start = i, size = 0; 
      do {
        if(i === n) {
          xows_log(1, "xmp_mam_parse","Last result page not found (reached end of stack)",last);
          break;
        }
        size++;
      } while(xows_xmp_mam_stk[i++].page !== last);
      
      // extract messages from stack
      result = xows_xmp_mam_stk.splice(start, size);
    }
    
    xows_log(2,"xmp_mam_parse","Results collected","("+result.length+"/"+count+") '"+first+"'=>'"+last+"'");

    // Forward parse result
    if(xows_is_func(onparse)) 
      onparse(from, _with, result, count, complete);
  }
  
  // Delete key with id from stack the key from
  delete xows_xmp_mam_query_param[id];
}

/**
 * Send query for archived messages matching the supplied filters
 * and the specified result set page.
 * 
 * @param   {number}    to        Query destination, or Null for default.
 * @param   {number}    max       Maximum count of result pages to get.
 * @param   {object}    _with     With JID filter.
 * @param   {number}    start     Start time filter.
 * @param   {number}    end       End time filter.
 * @param   {string}    before    Result page Id to get messages before.
 * @param   {function}  onparse   Callback to receive parse result.
 */
function xows_xmp_mam_query(to, max, _with, start, end, before, onparse)
{
  // Get proper XMLNS
  const xmlns_mam = xows_xmp_get_xep(XOWS_NS_MAM);
  if(!xmlns_mam) {
    xows_log(1,"xmp_mam_query","Message Archive Management is unavailable");
    return;
  }

  // Add the needed x:data filter field
  const field = [];
  field.push({"var":"FORM_TYPE","type":"hidden","value":xmlns_mam});
  if(_with) field.push({"var":"with"  ,"value":_with});
  if(start) field.push({"var":"start" ,"value":new Date(start).toJSON()});
  if(  end) field.push({"var":"end"   ,"value":new Date(end).toJSON()});
    
  // The rsm part
  const rsm = xows_xml_node("set",{"xmlns":XOWS_NS_RSM},
                    xows_xml_node("max",null,max));
  
  // If the before value is set, or if start is endefined 
  // (ascending time query) we add the <befor> child
  if(before || !start) {
    xows_xml_parent(rsm, xows_xml_node("before",null,before));
  }

  // Create the final stanza
  const id = xows_gen_uuid();
  const iq =  xows_xml_node("iq",{"id":id,"type":"set"}, 
                xows_xml_node("query",{"xmlns":xmlns_mam},[
                  xows_xmp_xdata_make(field),rsm]));
                    
  if(to !== null) iq.setAttribute("to",to);
  
  // Store query ID with the "with" parameter
  xows_xmp_mam_query_param[id] = {"to":to,"with":_with};
  
  xows_log(2,"xmp_mam_query","Send archive query",
            "with "+_with+" start "+start+" end "+end);
  
  // Send the query
  xows_xmp_send(iq, xows_xmp_mam_parse, onparse);
}

/**
 * Http Upload result parsing function called when Http Upload query 
 * result is received.
 * 
 * @param   {object}    stanza    Received query response stanza.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_upload_parse(stanza, onparse)
{
  if(stanza.getAttribute("type") === "error") {
    const err_msg = xows_xmp_error_str(stanza);
    xows_log(1,"xmp_upload_parse","Http-upload query error",err_msg);
    // Forward parse result
    if(xows_is_func(onparse)) 
      onparse(null, null, null, err_msg);
    return;
  }
  // Get the <slot> node in the stanza
  const slot = stanza.querySelector("slot");
  if(slot) {
    // Variable we need
    let put_url, get_url, headers;
    // Get <put> node
    const put = slot.querySelector("put");
    if(put) {
      // Retreive the URL for HTTP PUT
      put_url = put.getAttribute("url");
      // Retreive header data for HTTP PUT
      headers = put.getElementsByTagName("header");
    }
    // Get the URL for HTTP GET 
    const _get = slot.querySelector("get");
    if(_get) get_url = _get.getAttribute("url");
  
    xows_log(2,"xmp_upload_parse","Accepted http-upload slot",put_url);

    // Forward parse result
    if(xows_is_func(onparse)) 
      onparse(put_url, headers, get_url);
  }
}

/**
 * Send a query to request a slot for file upload via 
 * HTTP Upload service
 * 
 * @param   {string}    url       Http-Upload service URL.
 * @param   {string}    filename  Upload filename.
 * @param   {number}    size      Upload size in bytes.
 * @param   {string}    type      Optional upload file MIM type.
 * @param   {function}  onparse   Callback to forward parse result.
 */
function xows_xmp_upload_query(url, filename, size, type, onparse)
{
  // Get the proper XMLNS
  const xmlns_httpupload = xows_xmp_get_xep(XOWS_NS_HTTPUPLOAD);
  if(!xmlns_httpupload) {
    xows_log(1,"xmp_upload_query","Http-upload is unvailable");
    return;
  }
  
  xows_log(2,"xmp_upload_query","Send http-upload query",size+" bytes required");
  
  let attr = {"xmlns":xmlns_httpupload,"filename":filename,"size":size};
  if(type) attr.type = type;
  
  const iq =  xows_xml_node("iq",{"to":url,"type":"get"},
                xows_xml_node("request",attr));
                
  xows_xmp_send(iq, xows_xmp_upload_parse, onparse);
}

/**
 * Parse account register form
 * 
 * This function is part of the account registration scenario, called
 * once the server responded to registration form query.
 * 
 * @param   {string}        from          Sender JID.
 * @param   {boolean}       registered    Indicate <registered> child in response.
 * @param   {string}        user          <user> child content or null if not present.
 * @param   {string}        pass          <pass> child content or null if not present.
 * @param   {string}        email         <email> child content or null if not present.
 * @param   {object[]}      form          Parsed x-data form to fulfill.
 */
function xows_xmp_auth_register_get_handle(from, registered, user, pass, email, form)
{
  // The server may respond with a form or via old legacy way
  // we handle both cases.
  if(form !== undefined) {
    // For each fied of form, find know var name and fulfill 
    let i = form.length;
    while(i--) {
      if(form[i]["var"] === "username") form[i].value = xows_xmp_user;
      if(form[i]["var"] === "password") form[i].value = xows_xmp_auth;
    }
  } else {
    // Fulfill <username> and <password> element as required
    if(user !== null) user = xows_xmp_user;
    if(pass !== null) pass = xows_xmp_auth;
  }
  // Submit the register parmaters
  xows_xmp_register_set_query(null, user, pass, null, form, 
                           xows_xmp_auth_register_set_handle);
}

/**
 * Parse account register form
 * 
 * This function is part of the account registration scenario, called
 * once the server responded to registration form query.
 * 
 * @param   {string}    from      Query Sender JID
 * @param   {string}    type      Query Response type.
 * @param   {string}    er_type   Error type if available.
 * @param   {string}    er_code   Error code if available.
 * @param   {string}    er_name   Error code if available.
 * @param   {string}    er_text   Error text if available.
 */
function xows_xmp_auth_register_set_handle(from, type, er_type, er_code, er_name, er_text)
{
  let err_msg = null;
  
  // Check whether we got an error as submit response
  if(type === "error") {
    // Set error message string as possible
    if(er_code === "409" || er_name === "conflict")  err_msg = "Unsername already exists";
    if(er_code === "406" || er_name === "not-acceptable")  err_msg = "Invalid username or missing password";
  } else {
    if(type === "result") {
      // Reset the client with congratulation message
      xows_log(2,"xmp_auth_register_set_handle","success");
      xows_xmp_send_close(3); //< Close without error
      // Foward the good news
      xows_xmp_fw_onregister(xows_xmp_user+"@"+xows_xmp_domain);
    } else {
      // This case is unexpected and unknown
      err_msg = "Unexpected registration error";
    }
  }

  // If we got an error the process stops here
  if(err_msg !== null) {
    xows_xmp_auth = null;
    xows_log(0,"xmp_auth_register_set_handle",err_msg);
    xows_xmp_send_close(XOWS_SIG_ERR, err_msg); //< Close with error
  }
}

/**
 * Function to send response to <iq> ping query
 * 
 * @param   {object}  stanza   Received <iq> stanza.
 */
function xows_xmp_resp_ping(stanza)
{
  // Get iq sender and ID
  const from = stanza.getAttribute("from");
  const id = stanza.getAttribute("id");
  xows_log(2,"xmp_resp_ping","Responds to ping",from);
  // Send pong
  xows_xmp_send(xows_xml_node("iq",{"id":id,"to":from,"type":"result"}));
}

/**
 *  Function to send response to <iq> time query
 * 
 * @param   {object}  stanza   Received <iq> stanza.
 */
function xows_xmp_resp_time(stanza)
{
  // Get iq sender and ID
  const from = stanza.getAttribute("from");
  const id = stanza.getAttribute("id");
  // Create date 
  const date = new Date();
  // we must add a leading zero to the time zone offset value wich may
  // be negative
  let off = date.getTimezoneOffset() / 60;
  let tzo = (off < 0) ? "-" : ""; // if negative start with minus
  off = Math.abs(off); // take absolute value
  tzo += ((off > 9) ? off : "0"+off) + ":00";
  const utc = date.toJSON();
  
  xows_log(2,"xmp_resp_time","Responds to time",from);
  
  // Send time
  xows_xmp_send( xows_xml_node("iq",{"to":from,"id":id,"type":"result"},
                    xows_xml_node("time",{"xmlns":XOWS_NS_TIME},[
                      xows_xml_node("tzo",null,tzo),
                      xows_xml_node("utc",null,utc)])));
}

/**
 *  Function to send response to <iq> version query
 * 
 * @param   {object}  stanza   Received <iq> stanza.
 */
function xows_xmp_resp_version(stanza)
{
  // Get iq sender and ID
  const from = stanza.getAttribute("from");
  const id = stanza.getAttribute("id");
  
  xows_log(2,"xmp_resp_version","Responds to version",from);
  
  // Send time
  xows_xmp_send( xows_xml_node("iq",{"to":from,"id":id,"type":"result"},
                    xows_xml_node("query",{"xmlns":XOWS_NS_VERSION},[
                      xows_xml_node("name",null,XOWS_APP_NAME),
                      xows_xml_node("version",null,XOWS_APP_VERS)])));
}

/**
 * Function to send response to <iq> disco#info query
 * 
 * @param   {object}  stanza  Received <iq> stanza.
 */
function xows_xmp_resp_discoinfo(stanza)
{
  // Get iq sender and ID
  const from = stanza.getAttribute("from");
  const id = stanza.getAttribute("id");
  // get the <query> element to get node attribute if exists
  const query = stanza.querySelector("query"); 
  const node = query ? query.getAttribute("node") : null; 
  
  xows_log(2,"xmp_resp_discoinfo","Responds to disco#info",from);
  
  // Send response
  const caps = xows_xmp_get_caps();
  xows_xmp_send(  xows_xml_node("iq",{"to":from,"id":id,"type":"result"},
                    xows_xml_node("query",{"xmlns":XOWS_NS_DISCOINFO,"node":node},caps)));
}

/**
 * Function to proceed an received <open> stanza.
 * 
 * @param   {object}  stanza  Received <open> stanza
 */
function xows_xmp_recv_open(stanza)
{
  // Check for proper name space
  let ns = (stanza.getAttribute("xmlns") === XOWS_NS_IETF_FRAMING);
  // Check for proper version
  let ve = (stanza.getAttribute("version") === "1.0");
  if(!ve || !ns) {
    const err_msg = "Invalid server framing";
    xows_log(0,"xmp_recv_open", err_msg);
    xows_xmp_send_close(XOWS_SIG_ERR, err_msg);
  }
  return true;
}

/**
 * Function to proceed an received <close> stanza.
 * 
 * @param   {object}  stanza  Received <close> stanza
 */
function xows_xmp_recv_close(stanza)
{
  const err_msg = "Server closed the stream";
  xows_log(1,"xmp_recv_close",err_msg);
  xows_xmp_send_close(XOWS_SIG_ERR, err_msg);
  return true;
}

/**
 * Function to proceed an received <stream:error> stanza.
 * 
 * @param   {object}  stanza  Received <stream:error> stanza
 */
function xows_xmp_recv_streamerror(stanza)
{
  // Get the first child of <stream:error> this is the error type
  const err_cde = stanza.firstChild.tagName;
  // Get the <text> node content if exists
  const err_txt = xows_xml_get_text(stanza.querySelector("text"));
  // Output log
  xows_log(0,"xmp_recv_streamerror",err_cde,err_txt);
  xows_xmp_send_close(XOWS_SIG_ERR, "Server thrown a stream error");
  return true; 
}

/**
 * Function to proceed an received <stream:features> stanza.
 * 
 * @param   {object}  stanza  Received <stream:features> stanza
 */
function xows_xmp_recv_streamfeatures(stanza)
{
  // We handle two cases of <stream:features> :
  //
  // - the frist received from the server should be the SASL mechanism 
  //   list for authentication with available feature such as 
  //   account registration.
  //
  // - The second is sent after authentication success to list common 
  //   server sessions features.

  // Check whether we are in account registration scenario
  if(xows_xmp_auth_register) {

    const register = stanza.querySelector("register");
    if(register) {
      // Start registration process
      xows_xmp_register_get_query(null,xows_xmp_auth_register_get_handle);
    } else {
      xows_xmp_auth = null;
      let err_msg = "Account registration is not allowed by server";
      xows_log(0,"xmp_recv_streamfeatures",err_msg);
      xows_xmp_send_close(XOWS_SIG_ERR, err_msg);
    }
    
    return true;
  }
  
  // Check for SASL feature
  const mechanisms = stanza.getElementsByTagName("mechanism"); 
  if(mechanisms.length !== 0) {

    // Get list of available mechanisms name
    const candidates = [];
    for(let i = 0, n = mechanisms.length; i < n; ++i) 
      candidates.push(xows_xml_get_text(mechanisms[i]));
      
    // Output log
    xows_log(2,"xmp_recv_streamfeatures","Received authentication mechanisms",candidates.join(", "));
    
    // Try to initialize SASL
    if(!xows_sasl_init(candidates, xows_xmp_bare, xows_xmp_user, xows_xmp_auth)) {
      xows_xmp_auth = null;
      let err_msg = "Unable to find a suitable authentication mechanism";
      xows_log(0,"xmp_recv_streamfeatures",err_msg);
      xows_xmp_send_close(XOWS_SIG_ERR, err_msg);
      return true;
    }
    
    // Delete auth data to prevent malicious use
    xows_xmp_auth = null;
    
    // SASL succeed to Initialize, we start the process 
    const sasl_mechanism = xows_sasl_get_selected();
    
    xows_log(2,"xmp_recv_streamfeatures","Select authentication mechanism",sasl_mechanism);
    
    // Create SASL starting auth request
    const sasl_request = xows_sasl_get_request(); 
    
    if(sasl_request.length !== 0) {
      xows_log(2,"xmp_recv_streamfeatures","Sending authentication request",sasl_request);
      xows_xmp_send(xows_xml_node("auth",{"xmlns":XOWS_NS_IETF_SASL,"mechanism":sasl_mechanism},btoa(sasl_request)));
    }
    
    // We should now receive an <challenge> or <success> stanza...
    return true; //< stanza processed
    
  } else {
    // no <mechanism> in stanza, this should be the second <stream:features>
    // sent after authentication success, so we check for <bind> and <session>
    // items to continue with session initialization.
    
    // Store list of stream features XMLNS
    let i = stanza.childNodes.length;
    while(i--) {
      xows_xmp_stream_feat.push(stanza.childNodes[i].getAttribute("xmlns"));
    }
    
    // Output log
    xows_log(2,"xmp_recv_streamfeatures","Received features",xows_xmp_stream_feat.join(", "));
    
    // This is not formely mandatory, but we should have a at least 
    // a <bind> feature request from the server.
    if(xows_xmp_stream_feat.includes(XOWS_NS_IETF_BIND)) {
      // Query for stream session
      xows_xmp_bind_query();
    } else {
      // Session ready, call the callback
      xows_xmp_fw_onsession(xows_xmp_bare);
    }
  }
  return false; 
}

/**
 * Function to proceed an received <challenge> stanza (SASL auth).
 * 
 * @param   {object}  stanza  Received <challenge> stanza
 */
function xows_xmp_recv_challenge(stanza)
{
  // Get SASL challenge incomming from server
  const sasl_challenge = atob(xows_xml_get_text(stanza));
  
  xows_log(2,"xmp_recv_challenge","Received authentication challenge",sasl_challenge);

  // Get SASL challenge response
  const sasl_response = xows_sasl_get_response(sasl_challenge);
  
  xows_log(2,"xmp_recv_challenge","Sending challenge response",sasl_response);
  
  // Create and send SASL challenge response stanza
  xows_xmp_send(xows_xml_node("response",{"xmlns":XOWS_NS_IETF_SASL},btoa(sasl_response)));   
                                   
  // We should now receive an <faillure> or <success> stanza...
  return true; //< stanza processed
}

/**
 * Function to proceed an received <failure> stanza (SASL auth).
 * 
 * @param   {object}  stanza  Received <failure> stanza
 */
function xows_xmp_recv_failure(stanza)
{
  // Compose error message
  let err_msg;
  const err_cde = stanza.firstChild.tagName;

  // As reminder, list of most common errors :
  //
  // <aborted/> : server acknolege abor request (not an error).
  // <malformed-request/> : auth request is empty or malformed.
  // <incorrect-encoding/> : supplied data base64 encoding is incorrect.
  // <invalid-authzid/> : invalid authoization identifier.
  // <invalid-mechanism/> : unsuported or invalid requested mechanism.
  // <mechanism-too-weak/> : requested mechanism is too weak according to current server policy.
  // <not-authorized/> : most common error, wrong username or password.
  // <temporary-auth-failure/> : failure due to server side error.
  switch(err_cde.toLowerCase()) 
  {      
  case "not-authorized" :
    err_msg = "Wrong username or password";
    break;
  default:
    err_msg = "Authentication failure";
    break;
  }
  // Output log
  xows_log(0,"xmp_recv_failure", err_msg, err_cde);
  xows_xmp_send_close(XOWS_SIG_ERR, err_msg); //< Close with error
  return true;
}

/**
 * Function to proceed an received <success> stanza (SASL auth).
 * 
 * @param   {object}  stanza    Received <success> stanza
 */
function xows_xmp_recv_success(stanza)
{
  // Get <succees> stanza embeded data, this might be the SASL sever 
  // proof (at least for SCRAM-SHA-1)
  const sasl_sproof = xows_xml_get_text(stanza);

  if(sasl_sproof.length !== 0) {
    xows_log(2,"xmp_recv_success","Received server proof signature",sasl_sproof);
  }
  // Check server integrity
  if(!xows_sasl_chk_integrity(atob(sasl_sproof))) {
    // Output log
    const err_msg = "Server integrity check failed";
    xows_log(0,"xmp_recv_success",err_msg);
    xows_xmp_send_close(XOWS_SIG_ERR, err_msg);
    return true;
  }
  xows_log(2,"xmp_recv_success","Authentication success");
  // From now the stream is implicitly closed, we must reopen it
  xows_xmp_send_open();
  return true; //< stanza processed
}

/**
 * Function to proceed an received roister push <iq> stanza.
 * 
 * @param   {object}  stanza  Received <presence> stanza
 */
function xows_xmp_recv_roster_push(stanza)
{
  // Get iq Id to create response
  const id = stanza.getAttribute("id");
  
  // Send response iq
  xows_xmp_send(  xows_xml_node("iq",{"id":id,"type":"result"},
                    xows_xml_node("query",{"xmlns":XOWS_NS_ROSTER})));
  
  // Parse <item> child, it should be alone
  const item = stanza.querySelector("item");
  
  const bare = item.getAttribute("jid");
  const name = item.getAttribute("name");
  const subs = xows_xmp_subs_mask_map[item.getAttribute("subscription")];
  let group = item.querySelector("group");
  group = group ? xows_xml_get_text(group) : null;
 
  xows_log(2,"xmp_recv_roster_push","Received roster push");
  
  // Forward parse result
  xows_xmp_fw_onroster(bare, name, subs, group);
}

/**
 * Function to proceed an received <presence> stanza.
 * 
 * @param   {object}  stanza  Received <presence> stanza
 */
function xows_xmp_recv_presence(stanza)
{
  const from = stanza.getAttribute("from"); //< Sender JID/Ress

  // Usual presence informations
  let show, prio, stat;
  
  if(stanza.hasAttribute("type")) {
    const type = stanza.getAttribute("type"); //< Presence type
    if(type === "unavailable") show = -1; // unavailabel <presence>
    if(type.includes("subscrib")) { //< subscription <presence>
      xows_log(2,"xmp_recv_presence","Received subscrib",from+" type:"+type);
      // Check for <nick> child
      const node = stanza.querySelector("nick");
      const nick = node ? xows_xml_get_text(node) : null;
      // Foward subscription
      xows_xmp_fw_onsubscrib(from, type, nick);
      return true;
    }
    if(type === "error") { //<  an error occurred
      xows_log(1,"xmp_recv_presence","Error",from+" "+xows_xmp_error_str(stanza));
      // TODO: forward error message to client ?
      return true;
    }
  }
  
  // Additionnal <presence> informations or data
  let node, muc, phot;
  
  let child, i = stanza.childNodes.length;
  while(i--) {
    child = stanza.childNodes[i];
    
    if(child.nodeType !== 1) 
      continue;
    
    // Check for usual presence informations
    if(child.tagName === "show") {
      const text = xows_xml_get_text(child);
      show = text ? xows_xmp_show_level_map[text] : 3; //< No text mean simply "available"
      continue;
    }
    if(child.tagName === "priority") {
      prio = xows_xml_get_text(child); continue;
    }
    if(child.tagName === "status") {
      stat = xows_xml_get_text(child); continue;
    }
    // Check for entity capabilities (XEP-0115)
    if(child.tagName === "c") {
      if(child.getAttribute("xmlns") === XOWS_NS_CAPS) {
        node = {"node":child.getAttribute("node"), 
                "ver" :child.getAttribute("ver")};
      }
      continue;
    }
    // Check for <x> element
    if(child.tagName === "x") {
      const xmlns = child.getAttribute("xmlns");
      // Check whether we received a MUC presence protocole
      if(xmlns === XOWS_NS_MUCUSER) {
        const item = child.querySelector("item"); //< should be an <item>
        muc = { "affiliation" : item.getAttribute("affiliation"),
                "role"        : item.getAttribute("role"),
                "jid"         : item.getAttribute("jid"),
                "nickname"    : item.getAttribute("nickname"),
                "code"        : []};
        const notes = child.getElementsByTagName("status");
        let j = notes.length;
        while(j--) muc.code.push(parseInt(notes[j].getAttribute("code")));
      }
      // Check whether we have a vcard-temp element (avatar)
      if(xmlns === XOWS_NS_VCARDXUPDATE) {
        phot = xows_xml_get_text(child.firstChild); //< should be an <photo>
      }
    }
  }
  
  // Check whether this a presence from MUC
  if(muc !== undefined) {
    xows_log(2,"xmp_recv_presence","Received MUC occupant",from);
    xows_xmp_fw_onoccupant(from, show, stat, muc, phot);
    return true;
  }
  
  // Default is usual contact presence
  xows_log(2,"xmp_recv_presence","Received presence",from+" show:"+show);
  xows_xmp_fw_onpresence(from, show, prio, stat, node, phot);
  return true;
}

/**
 * Parse recevied forwarded archived message from MAM query.
 * 
 * @param   {string}  result    <result> element of received message
 */
function xows_xmp_recv_mam_result(result)
{
  // Get the result page ID
  const page = result.getAttribute("id");
  
  // Get forwarded content
  const forward = result.querySelector("forwarded");
  if(!forward) return false;
  
  let id, from, to, time, body, stat;
  
  // We should found a <delay> node
  const delay = forward.querySelector("delay"); 
  if(delay) time = new Date(delay.getAttribute("stamp")).getTime(); 
  // We found found a <message> node
  const message = forward.querySelector("message"); 
  if(message) {
    // Get message common data
    id = message.getAttribute("id");
    from = message.getAttribute("from");
    to = message.getAttribute("to");
    // Loop over children
    let child, xmlns, tag, i = message.childNodes.length;
    while(i--) {
      child = message.childNodes[i]; 
      // Skip the non-object nodes
      if(child.nodeType !== 1)  continue;
      
      xmlns = child.getAttribute("xmlns");
      tag = child.tagName;
      // Check for.chate
      if(xmlns === XOWS_NS_CHATSTATES) {
        stat = tag; continue;
      }
      // Check for <body> node
      if(child.tagName === "body") {
        body = child.hasChildNodes() ? xows_xml_get_text(child) : "";
      }
    }
    let log;
    if(body !== undefined) {
      // This should never happen
      if(!time) time = new Date(0).getTime(); 
      // Add archived message to stack
      xows_xmp_mam_stk.push({"page":page,"id":id,"from":from,"to":to,"time":time,"body":body});                            
      log = "Adding archived message to result stack";
    } else {
      log = "Skipped archived message without body";
    }
    xows_log(2,"xmp_recv_mam_result",log,"from "+from+" to "+to);   
    return true; //< stanza processed
  }
  return false;
}

/**
 * Parse recevied forwarded Pubsub event message.
 * 
 * @param   {string}  from      Message Sender
 * @param   {string}  event     <event> element of received message
 */
function xows_xmp_recv_pubsub(from, event)
{
  const items = event.querySelector("items");
  if(!items) return false;
  
  // Get Event node
  const node = items.getAttribute("node");
  
  // Get each item child
  const item = [];
  for(let i = 0, n = items.childNodes.length; i < n; ++i) {
    item.push({ "id": items.childNodes[i].getAttribute("id"),
                "data": items.childNodes[i].firstChild});
  }
  
  // Forward event
  xows_xmp_fw_onpubsub(from, node, item);
  
  return true; //< stanza processed
}

/**
 * Parse received <message> stanza.
 * 
 * @param   {object}  stanza  Received <message> stanza
 */
function xows_xmp_recv_message(stanza)
{
  // Get message main attributes
  const type = stanza.getAttribute("type");
  
  const id = stanza.getAttribute("id");
  const from = stanza.getAttribute("from");
  const to = stanza.getAttribute("to");
  
  let body, subj, time, chat, rcid;
  
  let xmlns, tag, node, i = stanza.childNodes.length;
  while(i--) {
    node = stanza.childNodes[i];
    // Skip the non-object nodes
    if(node.nodeType !== 1) continue;
    // Store child xmlns attribute
    xmlns = node.getAttribute("xmlns");
    // Check whether this is a MAM archive query result
    if(xmlns === xows_xmp_get_xep(XOWS_NS_MAM)) {
      xows_log(2,"xmp_recv_message","Received archive result");
      return xows_xmp_recv_mam_result(node);
    }
    // Check whether this is a PubSub event 
    if(xmlns === XOWS_NS_PUBSUBEVENT) {
      xows_log(2,"xmp_recv_message","Received PubSub Event");
      return xows_xmp_recv_pubsub(from, node);
    }
    // Check whether this is an encapsuled carbons copy
    if(xmlns === xows_xmp_get_xep(XOWS_NS_CARBONS)) {
      xows_log(2,"xmp_recv_message","Received forwarded carbons");
      // Take the inner <message> node and parse it
      const message = node.querySelector("message");
      return message ? xows_xmp_recv_message(message) : false;
    }
    tag = node.tagName;
    // Check whether this is a delivery receipt request or receive
    if(xmlns === XOWS_NS_RECEIPTS) {
      if(tag === "request") {
        xows_log(2,"xmp_recv_message","Received receipt request");
        xows_xmp_send_receipt(from, id);
      } else if(tag === "received") {
        rcid = node.getAttribute("id"); 
        continue;
      }
    }
    // Check for chat state notification
    if(xmlns === XOWS_NS_CHATSTATES) {
      chat = xows_xmp_chat_mask_map[tag]; 
      continue;
    }
    // Check for <delay> node, meaning of offline storage delivery
    if(xmlns === XOWS_NS_DELAY) {
      time = new Date(node.getAttribute("stamp")).getTime(); 
      continue;
    }
    // Check for <body> node
    if(tag === "body") {
      body = xows_xml_get_text(node);
      continue;
    }
    // Check for <subject> node
    if(tag === "subject") {
      subj = xows_xml_get_text(node);
    }
  }

  // Forward message to proper callback
  let handled = false;
  
  if(chat !== undefined) {
    xows_xmp_fw_onchatstate(id, type, from, to, chat, time); 
    handled = true;
  }
  if(body !== undefined) {
    xows_xmp_fw_onmessage(id, type, from, to, body, time); 
    handled = true;
  }
  if(rcid !== undefined) {
    xows_xmp_fw_onreceipt(id, from, to, rcid, time); 
    handled = true;
  }
  if(subj !== undefined) {
    xows_xmp_fw_onsubject(id, from, subj); 
    handled = true;
  }
  
  // Write log
  xows_log(2,"xmp_recv_message",
    (handled) ? "Handling message" : "Unhandled message",
    "from "+from+" to "+to);
  
  return handled;
}

/**
 * Function to proceed an received <iq> stanza.
 * 
 * @param   {object}  stanza  Received <iq> stanza
 */
function xows_xmp_recv_iq(stanza)
{
  // Check for "get" iq type, can come from user to query infos
  if(stanza.getAttribute("type") === "get") {
    const child = stanza.firstChild; //< get the first chid
    if(child !== undefined) {
      const xmlns = child.getAttribute("xmlns");
      // Check for ping request
      if(xmlns === XOWS_NS_PING) return xows_xmp_resp_ping(stanza);
      // Check for time request
      if(xmlns === XOWS_NS_TIME) return xows_xmp_resp_time(stanza);
      // Check for version request
      if(xmlns === XOWS_NS_VERSION) return xows_xmp_resp_version(stanza);
      // Check for disco#info request
      if(xmlns === XOWS_NS_DISCOINFO) return xows_xmp_resp_discoinfo(stanza);
    }
    return false; //< stanza not processed
  }
  
  // Check for "set" iq type, can come to update roster or data
  if(stanza.getAttribute("type") === "set") {
    const child = stanza.firstChild; //< get the first chid
    if(child !== undefined) {
      const xmlns = child.getAttribute("xmlns");
      // Check for roster push
      if(xmlns === XOWS_NS_ROSTER) return xows_xmp_recv_roster_push(stanza);
    }
    return false; //< stanza not processed
  }
  
  const id = stanza.getAttribute("id"); //< Get the <iq> ID 

  // Search for query with the specified ID in stack
  let i = xows_xmp_iq_stk.length;
  while(i--) {
    
    // If the id exists in the stack, call the proper callback
    if(xows_xmp_iq_stk[i].id === id) {
      if(xows_is_func(xows_xmp_iq_stk[i].onresult)) {
        return xows_xmp_iq_stk[i].onresult(stanza, xows_xmp_iq_stk[i].onparse);
      } else {
        xows_log(1,"xmp_recv_iq","Invalid onresult callback for query",id);
      }
        
      xows_xmp_iq_stk.splice(i, 1);  //< Remove this query from stack
    }
  }

  return false; //< stanza not processed
}

/**
 * Send common <presence> stanza to server or MUC room to update 
 * client availability and/or join or exit MUC room.
 * 
 * @param   {string}  to        Destination JID (can be null).
 * @param   {string}  type      Presence type attribute (can be null).
 * @param   {number}  level     Availability level 0 to 4 (can be null).
 * @param   {string}  status    Status string tu set.
 * @param   {string}  [photo]   Optionnal photo data hash to send.
 * @param   {boolean} [muc]     Append MUC xmlns child to stanza.
 * @param   {string}  [nick]    Optional nickname for subscribe request.
 */
function xows_xmp_send_presence(to, type, level, status, photo, muc, nick)
{
  // Create the initial and default <presence> stanza
  const stanza = xows_xml_node("presence");

  // Add destination attribute
  if(to) stanza.setAttribute("to", to);
  
  // Add type attribute
  if(type) stanza.setAttribute("type", type);

  // Append the <show> and <priority> children
  if(level >= 0) {
    // Translate show level number to string
    xows_xml_parent(stanza, xows_xml_node("show",null,xows_xmp_show_name_map[level])); 
    // Set priority according show level
    xows_xml_parent(stanza, xows_xml_node("priority",null,(level * 20)));
    // Append <status> child
    if(status) xows_xml_parent(stanza, xows_xml_node("status",null,status));
    
    if(xows_cli_feat_srv_has(XOWS_NS_VCARD)) {
      // Append vcard-temp:x:update for avatar update child
      xows_xml_parent(stanza, xows_xml_node("x",{"xmlns":XOWS_NS_VCARDXUPDATE},
                                  (photo)?xows_xml_node("photo",null,photo):null));
    }

    // Append <c> (caps) child 
    xows_xml_parent(stanza, xows_xml_node("c",{ "xmlns":XOWS_NS_CAPS,
                                                "hash":"sha-1",
                                                "node":XOWS_APP_NODE,
                                                "ver":xows_xmp_get_caps_ver()})); 
  }

  // Append the proper <x> child for MUC protocole
  if(muc) xows_xml_parent(stanza, xows_xml_node("x",{"xmlns":XOWS_NS_MUC}));
  
  // Append <nick> child if required
  if(nick) xows_xml_parent(stanza, xows_xml_node("nick",{"xmlns":XOWS_NS_NICK},nick));
  
  xows_log(2,"xmp_send_presence",(type)?type:"Availability",((to)?to:"")+" show:"+xows_xmp_show_name_map[level]);
  
  // Send the final <presence> stanza
  xows_xmp_send(stanza);
}

/**
 * Send receipt for the specified message ID at the specified 
 * destination.
 * 
 * @param   {string}  to    Destnation JID
 * @param   {string}  id    Message ID to send receipt about
 */
function xows_xmp_send_receipt(to, id)
{
  xows_log(2,"xmp_send_receipt","Send message receipt","received "+id+" to "+to);
  
  xows_xmp_send(xows_xml_node("message",{"to":to},
                  xows_xml_node("received",{"id":id,"xmlns":XOWS_NS_RECEIPTS})));
}

/**
 * Send a message with chat state notification (XEP-0085).
 * 
 * @param   {string}  to      JID of the recipient.
 * @param   {string}  type    Message type to set.
 * @param   {number}  chat    Chat state to set.
 */
function xows_xmp_send_chatstate(to, type, chat) 
{
  const state = xows_xmp_chat_name_map[chat];
  
  xows_log(2,"xmp_send_chatstate","Send chat state",state+" to "+to);

  xows_xmp_send(xows_xml_node("message",{"to":to,"type":type},
                  xows_xml_node(state,{"xmlns":XOWS_NS_CHATSTATES})));
}

/**
 * Send a message with textual content.
 * 
 * @param   {string}    type    Message type.
 * @param   {string}    to      JID of the recipient.
 * @param   {string}    body    Message content.
 * @param   {boolean}   recp    Request message receipt.
 * 
 * @return  {string}  Sent message ID.
 */
function xows_xmp_send_message(type, to, body, recp) 
{
  // Generate 'custom' id to allow sender to track message
  const id = xows_gen_uuid();
  
  // Create message stanza
  const stanza =  xows_xml_node("message",{"id":id,"to":to,"type":type},
                    xows_xml_node("body",null,xows_xml_escape(body)));
  
  // Add receipt request           
  if(recp) xows_xml_parent(stanza, xows_xml_node("request",{"xmlns":XOWS_NS_RECEIPTS}));
  
  xows_log(2,"xmp_send_message","Send message","type "+type+" to "+to);
  
  // Send final message
  xows_xmp_send(stanza);
  
  return id;
}

/**
 * Send a subject to MUC room.
 * 
 * @param   {string}    id      Message ID or null for auto.
 * @param   {string}    to      JID of the recipient.
 * @param   {string}    subj    Subject content.
 * 
 * @return  {string}  Sent message ID.
 */
function xows_xmp_send_subject(to, subj) 
{
  const id = xows_gen_uuid();
  
  xows_log(2,"xmp_send_subject","Send subject to",to);
  
  // Send message
  xows_xmp_send(xows_xml_node("message",{"id":id,"to":to,"type":"groupchat"},
                  xows_xml_node("subject",null,xows_xml_escape(subj))));
                  
  return id;
}

/**
 * Close the current a new XMPP client session and WebSocket 
 * connection.
 * 
 * @parma {number}  code    Signal code for closing.
 * @param {string}  [mesg]  Optional information or error message.
 */
function xows_xmp_send_close(code, mesg)
{
  // Some log output 
  xows_log(2,"xmp_close","Closing the stream");
  
  // Send the <close> stanza to close stream
  xows_xmp_send(xows_xml_node("close",{"xmlns":XOWS_NS_IETF_FRAMING,"id":"_ciao"}));
  
  // Forward close signal
  xows_xmp_fw_onclose(code, mesg);
  
  // Close the Socket
  xows_sck_destroy();
}

/**
 * Send <open> stanza to request new XMPP stream
 */
function xows_xmp_send_open()
{
  xows_log(2,"xmp_send_open","Sending stream open request",XOWS_NS_IETF_FRAMING);
  
  // Send the first <open> stanza to init stream
  xows_xmp_send(xows_xml_node("open",{"to":xows_xmp_domain,"version":"1.0","xmlns":XOWS_NS_IETF_FRAMING}));
}

/**
 * Handle socket open event.
 */
function xows_xmp_sck_open()
{
  xows_xmp_send_open();
}

/**
 * Handle socket close event.
 * 
 * @parma {number}  code    Signal code for closing.
 * @param {string}  [mesg]  Optional information or error message.
 */
function xows_xmp_sck_close(code, mesg)
{
  xows_xmp_fw_onclose(code, mesg);
}

/**
 * Handle socket received message event. This parse the raw data as XML 
 * then forward it to the proper function.
 * 
 * @param   {string}  data   Received raw data string.
 */
function xows_xmp_sck_recv(data) 
{ 
  // Get stanza object tree from raw XML string
  const stanza = xows_xml_parse(data).firstChild;
  const name = stanza.tagName;
  
  // Session common stanzas
  if(name === "iq") return xows_xmp_recv_iq(stanza);
  if(name === "message") return xows_xmp_recv_message(stanza);
  if(name === "presence") return xows_xmp_recv_presence(stanza);
    
  // Stream and connection stanzas
  if(name === "open")  return xows_xmp_recv_open(stanza);
  if(name === "close") return xows_xmp_recv_close(stanza);
  if(name === "stream:error") return xows_xmp_recv_streamerror(stanza);
  if(name === "stream:features") return xows_xmp_recv_streamfeatures(stanza);
    
  // SASL process stanzas
  if(name === "challenge") return xows_xmp_recv_challenge(stanza);
  if(name === "success") return xows_xmp_recv_success(stanza);
  if(name === "failure") return xows_xmp_recv_failure(stanza);
  
  xows_log(1,"xmp_recv","Unprocessed stanza",event.data);
}

/**
 * Open a new XMPP client session to the specified WebSocket URL.
 * 
 * @param   {string}    url       URL to WebSocket service
 * @param   {string}    jid       Authentication JID (user@domain)
 * @param   {string}    password  Authentication password
 * @param   {boolean}   register  If true proceed to register new account.
 */
function xows_xmp_connect(url, jid, password, register)
{
  // if socket already openned, close it
  xows_sck_destroy();
  
  // Reset stuff from previous session
  xows_xmp_res = null;
  xows_xmp_jid = null;
  
  
  // Split JID into user and domain parts
  const jid_split = jid.split("@");

  // Verify we got a well formed JID
  xows_xmp_domain = null;
  if(jid_split[1] !== undefined) 
    if(jid_split[1].length !== 0) 
      xows_xmp_domain = jid_split[1];
  
  if(xows_xmp_domain === null) {
    let err_msg = "Incomplete JID (undefined domain)";
    xows_log(0,"xmp_connect",err_msg);
    xows_xmp_fw_onclose(XOWS_SIG_ERR, err_msg); //< close with error message
    return;
  }
  
  // store user and authentication data
  xows_xmp_bare = jid;
  xows_xmp_user = jid_split[0];
  xows_xmp_auth = password;
  
  // Set callback for socket events
  xows_sck_set_callback("open", xows_xmp_sck_open);
  xows_sck_set_callback("recv", xows_xmp_sck_recv);
  xows_sck_set_callback("close", xows_xmp_sck_close);
  
  // Is there a registration connexion
  xows_xmp_auth_register = register;
  
  // store connexion url
  xows_xmp_url = url;
  
  // Open new WebSocket connection
  xows_sck_create(url, "xmpp");
}

/* ------------------------------------------------------------------
 * 
 *                         Client API Layer
 * 
 * ------------------------------------------------------------------ */
 
/**
 * Constants for peer/object type
 */
const XOWS_PEER_NONE  = 0;
const XOWS_PEER_CONT  = 1;
const XOWS_PEER_ROOM  = 2;
const XOWS_PEER_OCCU  = 3;

/**
 * Default size for generated avatars
 */
const XOWS_AVAT_SIZE  = 48;

/**
 * List of available own account feature
 */
const xows_cli_feat_own = [];

/**
 * List of available server feature
 */
const xows_cli_feat_srv = [];

/**
 * Check whether own account feature is available
 * 
 * @param {string}  Feature name to search.
 * 
 * @return  True if feature was found, false otherwise.
 */
function xows_cli_feat_own_has(feat) 
{
  return xows_cli_feat_own.includes(feat);
}

/**
 * Check whether feature is available, either in own account or
 * server.
 * 
 * @param {string}  Feature name to search.
 * 
 * @return  True if feature was found, false otherwise.
 */
function xows_cli_feat_srv_has(feat) 
{
  return xows_cli_feat_srv.includes(feat);
}

/**
 * The Client Roster list of contacts.
 */
const xows_cli_cont = [];

/**
 * The Client Roster list of charooms.
 */
const xows_cli_room = [];

/**
 * Callback function for client connected.
 */
let xows_cli_fw_onconnect = function() {};

/**
 * Callback function for new account registered.
 */
let xows_cli_fw_onregister = function() {};

/**
 * Callback function for client user status change.
 */
let xows_cli_fw_onownchange = function() {};

/**
 * Callback function for Contact added or refreshed.
 */
let xows_cli_fw_oncontpush = function() {};

/**
 * Callback function for Contact removed.
 */
let xows_cli_fw_oncontrem = function() {};

/**
 * Callback function for Subscription added.
 */
let xows_cli_fw_onsubspush = function() {};

/**
 * Callback function for Subscription removed.
 */
let xows_cli_fw_onsubsrem = function() {};

/**
 * Callback function for Room added or refreshed.
 */
let xows_cli_fw_onroompush = function() {};

/**
 * Callback function for Room Occupant added or refreshed.
 */
let xows_cli_fw_onoccupush = function() {};

/**
 * Callback function for Room Occupant removed.
 */
let xows_cli_fw_onoccurem = function() {};

/**
 * Callback function for sent or received Chat Message.
 */
let xows_cli_fw_onmessage = function() {};

/**
 * Callback function for received Chatstat notification.
 */
let xows_cli_fw_onchatstate = function() {};

/**
 * Callback function for received Receipt.
 */
let xows_cli_fw_onreceipt = function() {};

/**
 * Callback function for received Room Subject.
 */
let xows_cli_fw_onsubject = function() {};

/**
 * Callback function for connection or login error.
 */
let xows_cli_fw_onerror = function() {};

/**
 * Callback function for session closed.
 */
let xows_cli_fw_onclose = function() {};

/**
 * Client current user object.
 */
let xows_cli_own = {
  "type": XOWS_PEER_CONT, 
  "jid" : "",     //< Full JID (user@domain/ressource)
  "bare": "",     //< bare JID (user@domain)
  "name": "",     //< Display name
  "avat": "",     //< Contact avatar picture
  "show": -1,     //< Presence level
  "stat": null    //< Presence Status string
};

/**
 * Store the URL of available server items such as Http Upload or MUC
 * services.
 */
const xows_cli_service_url = {};

/**
 * Check whether server item (service) is available
 * 
 * @param {string}  xmlns   XMLNS corresponding to service.
 */
function xows_cli_service_exist(xmlns)
{
  return (xmlns in xows_cli_service_url);
}

/**
 * Create a new Contact object
 * 
 * @param   {string}    bare    JID (user@service.domain).
 * @param   {string}    name    Displayed name.
 * @param   {string}    subs    Current subscription.
 * @param   {string}    avat    Avatar hash string.
 * 
 * @param {string}  xmlns   XMLNS corresponding to service.
 */
function xows_cli_new_cont(bare, name, subs, avat)
{
  const cont = {
    "type": XOWS_PEER_CONT,     //< Peer type
    "bare": bare,               //< bare JID (user@domain)
    "lock": bare,               //< Current locked (user@domain/ressource)
    "name": name ? name : bare, //< Display name
    "subs": subs,               //< Subscription mask
    "ress": {},                 //< Resource list
    "avat": avat,               //< Avatar hash string.
    "show": -1,                 //< Displayed presence show level
    "stat": "",                 //< Displayed presence status string
    "noti": true                //< Notification Enabled/Mute
  };
  xows_cli_cont.push(cont);
  return cont;
}

/**
 * Create a new Room object
 * 
 * @param   {string}    bare    JID (room@service.domain).
 * @param   {string}    name    Displayed name.
 * @param   {string}    desc    Description string.
 * @param   {boolean}   priv    Password protected.
 * 
 * @param {string}  xmlns   XMLNS corresponding to service.
 */
function xows_cli_new_room(bare, name, desc, priv)
{
  const room = {
    "type": XOWS_PEER_ROOM, //< Peer type
    "bare": bare,           //< bare JID (room@service.domain)
    "name": name,           //< Display name
    "desc": desc,           //< Room description
    "subj": "",             //< Room subject
    "priv": priv,           //< Room is protected by password
    "join": null,           //< Room join JID (room@service.domain/nick)
    "occu": [],             //< Room occupant array
    "noti": true            //< Notification Enabled/Mute
  };
  xows_cli_room.push(room);
  return room;
}

/**
 * Create a new room Occupant object
 * 
 * @param   {string}    room    Room object where to create Occupant.
 * @param   {string}    jid     Full JID (room@domaine/nick).
 * @param   {string}    affi    Room affiliation.
 * @param   {string}    role    Room role.
 * @param   {string}    full    Real full JID if available.
 * @param   {string}    avat    Avatar hash string.
 * @param   {number}    show    Current show level.
 * @param   {string}    stat    Current status string.
 * 
 * @param {string}  xmlns   XMLNS corresponding to service.
 */
function xows_cli_new_room_occu(room, jid, affi, role, full, avat, show, stat)
{
  const occu = {
    "type": XOWS_PEER_OCCU,
    "jid" : jid,                              //< Occupant full JID (room@domaine/nick)
    "name": xows_jid_to_nick(jid),            //< Nickname
    "affi": affi,                             //< Room affiliation
    "role": role,                             //< Room role
    "full": full,                             //< Real full JID (user@domain/ressource)
    "bare": full?xows_jid_to_bare(full):null, //< Real bare JID (user@domain)
    "avat": avat,                             //< Avatar hash string.
    "show": show,                             //< Presence show level
    "stat": stat,                             //< Presence status string
    "self": full?xows_cli_is_own(full):false  //< This occupant is the current client
  };
  room.occu.push(occu);
  return occu;
}


/**
 * Returns the contact object with the specified JID.
 * 
 * @param   {string}  jid    Contact JID to find
 * 
 * @return  {object}  Contact object or null if not found
 */
function xows_cli_get_cont(jid)
{
  // Get the bare JID 
  const bare_jid = xows_jid_to_bare(jid);

  let i = xows_cli_cont.length;
  while(i--) {
    if(xows_cli_cont[i].bare === bare_jid) 
      return xows_cli_cont[i];
  }
  
  return null;
}

/**
 * Returns the Room object with the specified JID.
 * 
 * @param   {string}  jid    Room JID to find
 * 
 * @return  {object}  Room object or null if not found
 */
function xows_cli_get_room(jid)
{
  // Get the bare JID 
  const bare_jid = xows_jid_to_bare(jid);

  let i = xows_cli_room.length;
  while(i--) {
    if(xows_cli_room[i].bare === bare_jid) 
      return xows_cli_room[i];
  }
  
  return null;
}

/**
 * Returns the Room or Contact object with the specified JID.
 * 
 * @param   {string}  jid    Contact JID to find
 * 
 * @return  {object}  Room object or null if not found
 */
function xows_cli_get_peer(jid)
{
  // Get the bare JID 
  const bare_jid = xows_jid_to_bare(jid);
  
  let i = xows_cli_room.length;
  while(i--) {
    if(xows_cli_room[i].bare === bare_jid) 
      return xows_cli_room[i];
  }
  
  i = xows_cli_cont.length;
  while(i--) {
    if(xows_cli_cont[i].bare === bare_jid) 
      return xows_cli_cont[i];
  }

  return null;
}

/**
 * Returns the Occupant object with the specified JID.
 * 
 * @param   {string}  room   Room object
 * @param   {string}  jid    Contact JID to find
 * 
 * @return  {object}  Occupant object or null if not found
 */
function xows_cli_get_occu(room, jid)
{
  if(!room.occu) 
    return null;
  
  let i = room.occu.length;
  while(i--) {
    if(room.occu[i].jid === jid) 
      return room.occu[i];
  }
  
  return null;
}

/**
 * Check wether the given full JID correspond to current user bare JID.
 * 
 * @param   {string}  jid    Contact JID to find
 * 
 * @return  {object}  Contact object or null if not found
 */
function xows_cli_is_own(jid)
{
  return jid.includes(xows_cli_own.bare);
}

/**
 * Get message autor, either contact or room occupant, according 
 * the specified peer and sender JID. 
 * 
 * If the room occupant is not found, the function returns a temporary 
 * generated occupant object.
 * 
 * @param   {object}  peer   Message Peer, either Room or Contact.
 * @param   {string}  from   Sender JID.
 * 
 * @return  {object}  Author object.
 */
function xows_cli_get_autor(peer, from)
{
  if(peer.type === XOWS_PEER_CONT) {
    return from.includes(xows_cli_own.bare) ? xows_cli_own : peer;
  } else {
    if(peer.join === from) {
      return xows_cli_own;
    } else {
      const occu = xows_cli_get_occu(peer,from);
      return occu ? occu : xows_cli_cache_occu_temp(from);
    }
  }
}

/**
 * Map for cached avatar data stored by SAH-1 hash.
 */
const xows_cli_cache_avat_db = {};

/**
 * Store and save avatar data to localStorage dans live DB.
 * 
 * @param   {string}    url   Image data-URL to store.
 * @param   {string}   [id]   Optional alternative ID/Hash to store data.
 * 
 * @return  {string}    Avatar data SHA-1 hash.
 */
function xows_cli_cache_avat_add(url, id)
{
  // Use the supplied ID or compute SHA-1 hash of data
  const hash = id ? id : xows_bytes_to_hex(xows_hash_sha1(xows_url_to_bytes(url)));
  
  // Store in live DB and localStorage
  xows_cli_cache_avat_db[hash] = url;
  localStorage.setItem(hash, url);
  
  return hash;
}

/**
 * Check whether avatar data with specified hash is cached.
 * 
 * @param   {string}  hash    Hash to check cached avatar data.
 * 
 * @return  {string}  True if cached data exists, false otherwise.
 */
function xows_cli_cache_avat_has(hash)
{
  if(hash in xows_cli_cache_avat_db) {
    return true;
  } else if(hash in localStorage) {
    return true;
  }
  return false;
}

/**
 * Retreive and load avatar data from supplied hash.
 * 
 * @param   {string}    hash   Avatar data hash to search.
 */
function xows_cli_cache_avat_get(hash)
{
  // Try in live DB
  if(hash in xows_cli_cache_avat_db)
    return xows_cli_cache_avat_db[hash];
    
  // Try in localStorage (and load to live DB)
  if(hash in localStorage) {
    xows_cli_cache_avat_db[hash] = localStorage.getItem(hash);
    return xows_cli_cache_avat_db[hash];
  }
  
  return null;
}

/**
 * Map for cached peer data stored by JID.
 */
const xows_cli_cache_peer_db = {};

/**
 * Store and save Peer data (vcard) to localStorage dans live DB.
 * 
 * @param   {string}    jid       Data owner JID.
 * @param   {string}    name      Nickname or displayed name depending context.
 * @param   {string}    note      Status or description depending context.
 * @param   {string}    avat      Associated avatar hash.
 */
function xows_cli_cache_peer_add(jid, name, note, avat)
{
  let cach = null;

  if(name && note && avat) {
    // All data supplied, we replace all data
    cach = {"name":name,"note":note,"avat":avat};
  } else {
    // If partial data update, we first extract existing data 
    // if any and update available data
    try { 
      cach = JSON.parse(localStorage.getItem(jid));
    } catch(e) {
      xows_log(1,"cli_cache_peer_add","JSON parse error",e);
    }
    
    if(cach !== null) {
      if(name !== null) cach.name = name;
      if(note !== null) cach.note = note;
      if(avat !== null) cach.avat = avat;
    } else {
      cach = {"name":name,"note":note,"avat":avat};
    }
  }

  // Store in live DB and localStorage
  xows_cli_cache_peer_db[jid] = cach;
  localStorage.setItem(jid, JSON.stringify(cach));
}

/**
 * Check whether peer data with specified JID is cached.
 * 
 * @param   {string}  jid     JID to check cached peer data.
 * 
 * @return  {string}  True if cached data exists, false otherwise.
 */
function xows_cli_cache_peer_has(jid)
{
  if(jid in xows_cli_cache_peer_db) {
    return true; 
  } else if(jid in localStorage) {
    return true;
  }
  return false;
}

/**
 * Retreive Peer data stored in localStorage.
 * 
 * @param   {string}    jid     Data owner JID.
 */
function xows_cli_cache_peer_get(jid)
{
  // Try in live DB
  if(jid in xows_cli_cache_peer_db) 
    return xows_cli_cache_peer_db[jid];
  
  // Try in localStorage (and load to live DB)
  if(jid in localStorage) {
    try {
      xows_cli_cache_peer_db[jid] = JSON.parse(localStorage.getItem(jid));
    } catch(e) {
      // malformed data
      xows_log(1,"cli_cache_peer_get","JSON parse error",e);
      localStorage.removeItem(jid); 
      return null;
    }
    return xows_cli_cache_peer_db[jid];
  }
  
  return null;
}

/**
 * Map for cached temporary room occupant. Used to generate temporary 
 * author for received room archives.
 */
const xows_cli_cache_occu_tmp_db = {};

/**
 * Generate and/or retreive temporary created room occupant based  
 * on supplied sender JID.
 * 
 * @param   {string}  from    Room occupant JID.
 * 
 * @param   {string}  Generated temporary occupant object.
 */
function xows_cli_cache_occu_temp(from)
{
  if(from in xows_cli_cache_occu_tmp_db)
    return xows_cli_cache_occu_tmp_db[from];
    
  // Create a new temporary occupant object with available data
  const name = xows_jid_to_nick(from);
  const cach = xows_cli_cache_peer_get(from);
  const avat = cach ? cach.avat : null;
  xows_cli_cache_occu_tmp_db[from] = {
    "name":name,
    "avat":avat ? avat : xows_cli_cache_avat_temp(name)
  };
  
  return xows_cli_cache_occu_tmp_db[from];
}

/**
 * Map for cached pseudo-random generated temporary/default avatar 
 * when user avatar data does not exists or cannot be found.
 */
const xows_cli_cache_avat_tmp_db = {};

/**
 * Generate and/or retreive pseudo-random avatar data based on 
 * supplied seed.
 * 
 * @param   {string}  seed    Seed string to generate avatar.
 * 
 * @param   {string}  Generated data hash string.
 */
function xows_cli_cache_avat_temp(seed)
{
  // Check if data exists in live memory
  if(seed in xows_cli_cache_avat_tmp_db) 
    return xows_cli_cache_avat_tmp_db[seed];

  // Generate pseudo-random avatar and its hash
  const url = xows_gen_avatar(XOWS_AVAT_SIZE,null,seed);
  
  // Compute hash from full url, as this is used only localy
  // we don't care about XEP specifications.
  const hash = xows_bytes_to_hex(xows_hash_sha1(url));
  
  // Store hash corresponding to the supplied seed
  xows_cli_cache_avat_tmp_db[seed] = hash;
  
  // Add this generated avatar to cached data
  xows_cli_cache_avat_db[hash] = url;
  
  return hash;
}

/**
 * Array to store discovered entities's capabilities (XEP-0115)
 */
const xows_cli_cache_caps_db = {};

/**
 * Store and save entity capabilities (features).
 * 
 * @param   {string}    node        Entity caps node (url).
 * @param   {string[]}  feat        Entity caps feature list.
 */
function xows_cli_cache_caps_add(node, feat)
{
  // Store in live DB and localStorage
  xows_cli_cache_caps_db[node] = feat;
  localStorage.setItem(node, JSON.stringify(feat));
}

/**
 * Check whether entity capabilities (features) is available.
 * 
 * @param   {string}    node        Entity caps node (url) to check.
 * 
 * @return  {boolean}  True if entity was found, false otherwise.
 */
function xows_cli_cache_caps_has(node)
{
  if(node in xows_cli_cache_caps_db) {
    return true;
  } else if(node in localStorage) {
    return true;
  }
  return false;
}

/**
 * Retreive entity capabilities (features).
 * 
 * @param   {string}    node        Entity caps node (url).
 * 
 * @return  {string[]}  Entity caps feature list.
 */
function xows_cli_cache_caps_get(node)
{
  if(node in xows_cli_cache_caps_db) 
    return xows_cli_cache_caps_db[node];
  
  // Try in localStorage (and load to live DB)
  if(node in localStorage) {
    try {
      xows_cli_cache_caps_db[node] = JSON.parse(localStorage.getItem(node));
    } catch(e) {
      // malformed data
      xows_log(1,"cli_cache_caps_get","JSON parse error",e);
      localStorage.removeItem(node); 
      return null;
    }
    return xows_cli_cache_caps_db[node];
  }
  
  return null;
}

/**
 * Check whether an entity has the specified capability
 * 
 * @param {string}  node    Entity identifier (node).
 * @param {string}  xmlns   XMLNS corresponding to capability.
 */
function xows_cli_cache_caps_try(node, xmlns)
{
  const feat = xows_cli_cache_caps_get(node);
  if(feat) {
    return feat.includes(xmlns);
  }
  return false;
}

/**
 * Set callback functions for common client events.
 * 
 * Possibles slot parameter value are the following:
 * connect    : Client connected and ready.
 * register   : New account registered.
 * contpush   : Add or refresh Roster Contact.
 * contrem    : Remove Contact from Roster.
 * subspush   : Add or refresh Subscription Request.
 * subsrem    : Remove Subscription Request.
 * roompush   : Add or refresh Roster Chatroom.
 * occupush   : Add or refresh Room Occupant.
 * occurem    : Remove Room Occupant.
 * message    : Common chat messages.
 * chatstate    : Chat states messages.
 * receipt    : Message receipts.
 * subject    : Room subject.
 * uplder     : HTTP Upload error.
 * upldok     : HTTP Upload success.
 * upldpg     : HTTP Upload progress.
 * upldab     : HTTP Upload Abort.
 * error      : Client Error.
 * close      : Session closed.
 * 
 * @param   {string}    type      Callback slot.
 * @param   {function}  callback  Callback function to set.
 */
function xows_cli_set_callback(type, callback)
{
  if(!xows_is_func(callback))
    return;
    
  switch(type.toLowerCase()) {
    case "connect":     xows_cli_fw_onconnect = callback; break;
    case "register":    xows_cli_fw_onregister = callback; break;
    case "ownchange":   xows_cli_fw_onownchange = callback; break;
    case "contpush":    xows_cli_fw_oncontpush = callback; break;
    case "contrem":     xows_cli_fw_oncontrem = callback; break;
    case "subspush":    xows_cli_fw_onsubspush = callback; break;
    case "subsrem":     xows_cli_fw_onsubsrem = callback; break;
    case "roompush":    xows_cli_fw_onroompush = callback; break;
    case "occupush":    xows_cli_fw_onoccupush = callback; break;
    case "occurem":     xows_cli_fw_onoccurem = callback; break;
    case "message":     xows_cli_fw_onmessage = callback; break;
    case "chatstate":   xows_cli_fw_onchatstate = callback; break;
    case "receipt":     xows_cli_fw_onreceipt = callback; break;
    case "subject":     xows_cli_fw_onsubject = callback; break;
    case "error":       xows_cli_fw_onerror = callback; break;
    case "close":       xows_cli_fw_onclose = callback; break;
  }
}

/**
 * Indicate whether client must send the initial presence and call the
 * onconnect callback. 
 * 
 * This value must be set to true each time client initialize a new
 * session, and is set to false once the initial presence is sent
 * after the first query to roster content.
 */
let xows_cli_initialize = true;

/**
 * Connecte client to the specified XMPP over WebSocket service
 * using the given auhentication data.
 * 
 * @param   {string}    url       XMPP over WebSocket service URL
 * @param   {string}    jid       User JID (username@domain)
 * @param   {string}    password  Authentication password
 * @param   {boolean}   register  Register a new account
 */
function xows_cli_connect(url, jid, password, register)
{
  // Reset all stuff from previous session
  xows_cli_cont.length = 0;
  xows_cli_room.length = 0;
  xows_cli_feat_own.length = 0;
  xows_cli_feat_srv.length = 0;
  for(const k in xows_cli_service_url) 
    delete xows_cli_service_url[k];
    
  
  // Reset client user entity
  xows_cli_own.jid = jid;
  xows_cli_own.bare = jid;
  xows_cli_own.name = null;
  xows_cli_own.avat = null;
  xows_cli_own.show = -1;
  xows_cli_own.stat = null;
  
  // Set callback functions
  xows_xmp_set_callback("session", xows_cli_xmp_session);
  xows_xmp_set_callback("register", xows_cli_xmp_register);
  xows_xmp_set_callback("presence", xows_cli_xmp_recv_presence);
  xows_xmp_set_callback("subscrib", xows_cli_xmp_recv_subscribe);
  xows_xmp_set_callback("occupant", xows_cli_xmp_recv_occupant);
  xows_xmp_set_callback("roster", xows_cli_roster_push_handle);
  xows_xmp_set_callback("message", xows_cli_xmp_recv_message);
  xows_xmp_set_callback("chatstate", xows_cli_xmp_recv_chatstate);
  xows_xmp_set_callback("receipt", xows_cli_xmp_recv_receipt);
  xows_xmp_set_callback("subject", xows_cli_xmp_recv_subject);
  xows_xmp_set_callback("pubsub", xows_cli_xmp_recv_pubsub);
  xows_xmp_set_callback("close", xows_cli_xmp_closed);
  
  // We are in initial state
  if(!register) xows_cli_initialize = true;
  
  // Open a new XMPP connection
  return xows_xmp_connect(url, jid, password, register);
}

/**
 * Handle successfull connection and opened XMPP session.
 * 
 * This function is called by the xows_xmp_* API layer once XMPP 
 * services and items discovery is completed.
 * 
 * @param   {string}  jid   Session full JID with resource.
 */
function xows_cli_xmp_session(jid)
{
  // Store the full JID for this session
  xows_cli_own.jid = jid;
  
  // Check for cached information about own account
  const cach = xows_cli_cache_peer_get(xows_cli_own.bare);
  if(cach !== null) {
    if(cach.name) xows_cli_own.name = cach.name;
    if(cach.avat) xows_cli_own.avat = cach.avat;
    if(cach.stat) xows_cli_own.stat = cach.stat;
  }
  // Compose default name and nickname from JID
  if(xows_cli_own.name === null) {
    const userid = xows_xmp_bare.split("@")[0];
    xows_cli_own.name = userid[0].toUpperCase() + userid.slice(1);
  }
  // Create default avatar if needed
  if(!xows_cli_own.avat) xows_cli_own.avat = xows_cli_cache_avat_temp(xows_cli_own.bare);
  
  // Start features & services discovery
  xows_xmp_discoinfo_query(xows_cli_own.bare, null, xows_cli_own_info_handle);
}

/**
 * Handle successfull XMPP account registration.
 * 
 * @param   {string}  jid   Registered account JID.
 */
function xows_cli_xmp_register(jid)
{
  xows_log(2,"cli_xmp_register","Registration succeed",jid);
  // Simply forward the good news
  xows_cli_fw_onregister(jid);
}

/**
 * Handle XMPP stream closed.
 * 
 * @parma {number}  code    Signal code for closing.
 * @param {string}  [mesg]  Optional information or error message.
 */
function xows_cli_xmp_closed(code, mesg)
{
  // Clean the client
  xows_cli_cont.length = 0;
  xows_cli_room.length = 0;
  
  // Reset client user entity
  xows_cli_own.jid = null;
  xows_cli_own.bare = null;
  
  // Forward the connexion close code and message
  xows_cli_fw_onclose(code, mesg);
}

/**
 * Handle disco#info query to own user JID.
 * 
 * Called once the query result is received, continue the discovery
 * process by sending a disco#info to the server.
 * 
 * @param   {string}    from        Query result sender JID.
 * @param   {object[]}  iden        Array of parsed <identity> objects.
 * @param   {string[]}  feat        Array of parsed feature strings.
 */
function xows_cli_own_info_handle(from, iden, feat)
{
  // Check for available features
  for(let i = 0, n = feat.length; i < n; ++i) {
    
    // Add to local feature list
    xows_cli_feat_own.push(feat[i]);
    
    // Search for MAM feature
    if(feat[i].includes(XOWS_NS_MAM)) {
      // Set XEP xmlns (version) to use for this session
      xows_xmp_use_xep(feat[i]);
    }
  }
  // Next discovery step with server features
  xows_xmp_discoinfo_query(xows_xmp_domain, null, xows_cli_srv_info_handle);
}

/**
 * Handle disco#info query to the current server.
 * 
 * Called once the query result is received, continue the discovery
 * process by sending a disco#items to server.
 * 
 * @param   {string}    from        Query result sender JID.
 * @param   {object[]}  iden        Array of parsed <identity> objects.
 * @param   {string[]}  feat        Array of parsed feature strings.
 */
function xows_cli_srv_info_handle(from, iden, feat)
{
  // Check for available features
  for(let i = 0, n = feat.length; i < n; ++i) {
    
    // Add to local feature list
    xows_cli_feat_srv.push(feat[i]);
    
    if(feat[i].includes(XOWS_NS_CARBONS)) {
      // Check and set the xmlns (version) to use for this session
      if(xows_xmp_use_xep(feat[i])) { 
        xows_xmp_carbons_query(true); //< enable carbons
      }
    }
    // Search for Http Upload feature
    if(feat[i].includes(XOWS_NS_HTTPUPLOAD)) {
      // Set XEP xmlns (version) to use for this session
      xows_xmp_use_xep(feat[i]);
    }
    // Search for MUC feature
    if(feat[i].includes(XOWS_NS_MUC)) {
      // Set XEP xmlns (version) to use for this session
      xows_xmp_use_xep(feat[i]);
    }
  }
  // Next discovery step with server items
  xows_xmp_discoitems_query(xows_xmp_domain, xows_cli_srv_items_handle);
}

/**
 * Stack used to fulfill the per server-item features discovery.
 */
const xows_cli_srv_items_stack = [];

/**
 * Handle disco#items query to the current server.
 * 
 * Called once the query result is received. If items are received, the
 * discovery process continue by sending disco#info to each item, 
 * otherwise the discovery is assumed completed and a query for roster 
 * is sent.
 * 
 * @param   {string}    from        Query result sender JID.
 * @param   {object[]}  item        Array of parsed <item> objects.
 */
function xows_cli_srv_items_handle(from, item)
{
  // If no item is reported we are ready right now
  if(!item.length) {
    // Server discovery finished, now query for roster
    xows_cli_roster_get_query();
    return;
  }
  // Ensure services stack is empty
  xows_cli_srv_items_stack.length = 0;
  // First, fill the services stack
  let i = item.length;
  while(i--) xows_cli_srv_items_stack.push(item[i].jid);
  // Then start query info for each services
  xows_xmp_discoinfo_query(xows_cli_srv_items_stack.pop(), null, xows_cli_srv_item_info_handle);
}

/**
 * Handle disco#info query to server item/service.
 * 
 * Called for each received query result received from item disco#info, 
 * once result is received for each item the discovery is assumed 
 * completed and a query for roster.
 * 
 * @param   {string}    from        Query result sender JID.
 * @param   {object[]}  iden        Array of parsed <identity> objects.
 * @param   {string[]}  feat        Array of parsed feature strings.
 */
function xows_cli_srv_item_info_handle(from, iden, feat)
{
  // Get item identity
  const catg = iden[0].category;
  const type = iden[0].type;
  const name = iden[0].name;
  // Output log
  xows_log(2,"cli_srv_item_info_handle","Discover service features", 
              from+": "+catg+", "+type+", \""+name+"\"");
  
  let i;
  // Check for Http-Upload service
  if(catg === "store" && type === "file") {
    // Search for the proper feature
    i = feat.length;
    while(i--) {
      if(feat[i].includes(XOWS_NS_HTTPUPLOAD)) {
        // Set XEP xmlns (version) to use for this session
        xows_xmp_use_xep(feat[i]);
        xows_cli_service_url[XOWS_NS_HTTPUPLOAD] = from;
        xows_log(2,"cli_srv_item_info_handle","Use service for Http-Upload",from);
      }
    }
  }
  // Check for MUC service
  if(catg === "conference" && type === "text") {
    // Search for the proper feature
    i = feat.length;
    while(i--) {
      if(feat[i] === XOWS_NS_MUC) {
        xows_cli_service_url[XOWS_NS_MUC] = from;
        xows_log(2,"cli_srv_item_info_handle","Use service for Multi-User Chat",from);
      }
    }
  }
  if(xows_cli_srv_items_stack.length) {
    // Query info for the next service
    xows_xmp_discoinfo_query(xows_cli_srv_items_stack.pop(), null, xows_cli_srv_item_info_handle);
  } else {
    // Server discovery finished, now query for roster
    xows_cli_roster_get_query();
  }
}

/**
 * Function to append or refresh contact in local roster. 
 * 
 * This function is used to localy reflect user roster, NOT to 
 * proceed to contact roster add query.
 * 
 * @param   {string}  bare    Contact bare JID.
 * @param   {string}  name    Contact Displayred name.
 * @param   {number}  subs    Contact subscription.
 * @param   {string}  group   Contact group (not used yet).
 */
function xows_cli_roster_push_handle(bare, name, subs, group)
{
  // Sepecial case if we receive a 'remove' subscription
  if(subs < 0) {
    xows_log(2,"cli_roster_push_handle","Roster update",bare+" \""+name+"\" subscription: "+subs);
    // Remove contact from local list
    let i = xows_cli_cont.length;
    while(i--) {
      if(xows_cli_cont[i].bare === bare) {
        xows_log(2,"cli_roster_push_handle","Removing contact",bare);
        xows_cli_cont.splice(i,1); 
        xows_cli_fw_oncontrem(bare); //< Forward contact to remove
        break;
      }
    }
    return;
  }
  
  xows_log(2,"cli_roster_push_handle","Update Contact",bare+" \""+name+"\" subscription: "+subs);
  
  let cont = xows_cli_get_cont(bare);
  if(cont !== null) {
    cont.name = name ? name : bare;
    cont.subs = subs;
  } else {
    
    let avat = null;
    
    // Check for stored data un cache (localStorage)
    const cach = xows_cli_cache_peer_get(bare);
    if(cach !== null) {
      name = cach.name;
      avat = cach.avat;
    }
    
    // If no avatar data was found, set default pseudo-random avatar
    if(!avat) avat = xows_cli_cache_avat_temp(bare);
    
    // Create new contact
    cont = xows_cli_new_cont(bare, name, subs, avat);
  }

  // Query Avatar for the contact
  if(!xows_options.avatar_notify) {
    xows_cli_avat_meta_query(bare);
  }
  
  // Query Contact Nickname
  xows_cli_nick_query(bare);
  
  // Forward added Contact
  xows_cli_fw_oncontpush(cont);
}

/**
 * Function to handle parsed result of roster query.
 * 
 * @param   {object[]}  item        Array of parsed <item> objects.
 */
function xows_cli_roster_get_handle(item)
{
  // Empty the contact list
  xows_cli_cont.length = 0;
  
  if(item.length) {
    // Fill up the Roster with received contact
    for(let i = 0, n = item.length; i < n; ++i) {
      // Create a contact into local roster
      xows_cli_roster_push_handle(item[i].bare, item[i].name, item[i].subs, item[i].group);
    }
  } else {
    // Push null contact, mean empty list
    xows_cli_fw_oncontpush(null);
  }
  
  // If we are in initialize state, we now send the initial presence
  if(xows_cli_initialize) {
    xows_cli_presence_init();
  }
}

/**
 * Function to query client roster content (contact list).
 */
function xows_cli_roster_get_query()
{
  // Query to get roster content (list of contacts)
  xows_xmp_roster_get_query(xows_cli_roster_get_handle);
}

/**
 * Handle incoming profile informations such as Avatar and Nickname
 * comming from PubSub queries or notification.
 * 
 * @param   {string}    from    Query result Sender JID.
 * @param   {string}    nick    Received Nickname (or null).
 * @param   {string}    avat    Received Avatar data hash (or null).
 * @param   {string}    stat    Received Saved status (or null).
 */
function xows_cli_profile_handle(from, nick, avat, stat)
{
  // Check whether this is own profile data
  if(!from || xows_cli_is_own(from)) {
    
    // Add peer data to cache
    xows_cli_cache_peer_add(xows_cli_own.bare, nick, stat, avat);
    
    if(nick) xows_cli_own.name = nick;
    if(avat) xows_cli_own.avat = avat;
    if(stat) xows_cli_own.stat = stat;

    // Forward user update
    xows_cli_fw_onownchange(xows_cli_own);
    
    // Send presence update
    if(avat || stat) xows_cli_presence_update();
      
    xows_log(2,"cli_profile_handle","Received own profile data");
    
  } else {
    // This may be data from roster contact or room occupant
    const peer = xows_cli_get_peer(from);
    
    if(!peer) {
      xows_log(1,"cli_profile_handle","Unknown/unsubscribed peer",from);
      return;
    }
    
    // Add peer data to cache
    xows_cli_cache_peer_add(from, nick, stat, avat);
    
    if(peer.type === XOWS_PEER_CONT) {
      if(nick) peer.name = nick;
      if(avat) peer.avat = avat;
      if(stat) peer.stat = stat;
      // Forward contact update
      xows_cli_fw_oncontpush(peer);
    } else {
      const occu = xows_cli_get_occu(peer, from);
      if(occu) {
        if(nick) occu.name = nick;
        if(avat) occu.avat = avat;
        // Forward occupant update
        xows_cli_fw_onoccupush(peer, occu);
      }
    }
    xows_log(2,"cli_profile_handle","Received profile data for",from);
  }
}

/**
 * Query Contact or Own vcard data.
 * 
 * @param   {string}    jid     Destination JID to query vcard.
 */
function xows_cli_vcard_query(jid)
{
  xows_log(2,"cli_vcard_query","Query vCard for",jid);
  
  if(xows_cli_feat_own_has(XOWS_NS_IETF_VCARD4) && !xows_options.legacy_vcard) {
    xows_xmp_vcard4_get_query(jid, xows_cli_vcard_handle);
  } else {
    xows_xmp_vcardtemp_get_query(jid, xows_cli_vcard_handle);
  }
}

/**
 * Local copy of received vCard raw data structure.
 */
let xows_cli_vcard_own = null;

/**
 * Function to handle parsed result of vcard query.
 * 
 * @param   {string}    from    Vcard Contact JID or null.
 * @param   {object}    vcard   Vcard content.
 */
function xows_cli_vcard_handle(from, vcard)
{
  let node, nick, note, phot;
 
  xows_log(2,"cli_vcard_handle","Parse recevied vCard",from);
  
  if(vcard) {
    
    // Store received vcard to local cache
    xows_cli_vcard_own = vcard;

    if(xows_cli_feat_own_has(XOWS_NS_IETF_VCARD4) && !xows_options.legacy_vcard) {
      if((node = vcard.querySelector("nickname"))) 
        nick = xows_xml_get_text(node.firstChild); //< <nickname><text>#text
      if((node = vcard.querySelector("note")))
        note = xows_xml_get_text(node.firstChild);  //< <note><text>#text
      if((node = vcard.querySelector("photo"))) 
        phot = xows_xml_get_text(node.firstChild); //< <photo><uri>#text
      
    } else {
      // vCard-Temp partial parsing
      if((node = vcard.querySelector("NICKNAME"))) 
        nick = xows_xml_get_text(node);
      // Try <NOTE> then <DESC> which is the legacy mapping
      if((node = vcard.querySelector("NOTE"))) {
        note = xows_xml_get_text(node);
      } else if((node = vcard.querySelector("DESC"))) {
        note = xows_xml_get_text(node);
      }
      if((node = vcard.querySelector("PHOTO"))) {
        const type = xows_xml_get_text(node.querySelector("TYPE"));
        const data = xows_xml_get_text(node.querySelector("BINVAL"));
        phot = "data:"+type+";base64,"+data;
      }
    }
    
    if(nick && nick.length === 0) nick = null;
    if(note && note.length === 0) note = null;
    if(phot && phot.length === 0) phot = null;
  }
  
  const avat = (phot) ? xows_cli_cache_avat_add(phot) : null;

  // Update the proper Contact, Occupant, or own profile
  xows_cli_profile_handle(from, nick, avat, note);
}

/**
 * Publish user own vcard-temp to store formated name, nickname and
 * custom status as note.
 * 
 * @param {boolean} open  Publish data with Open Access.
 */
function xows_cli_vcard_publish(open)
{
  let node;
  
  // Get avatar data-URL
  const photo = xows_cli_cache_avat_get(xows_cli_own.avat);
  
  // Get the recevied vcard to modify it or create an empty one
  const own_cach = xows_cli_vcard_own ? xows_cli_vcard_own : 
                                        xows_xml_node("vcard");

  // Check if account supports Vcard4 or fallback to vcard-temp
  if(xows_cli_feat_own_has(XOWS_NS_IETF_VCARD4) && !xows_options.legacy_vcard) {
    
    node = own_cach.querySelector("nickname");
    if(node) node.parentNode.removeChild(node);
    xows_xml_parent(own_cach, xows_xml_node("nickname",null,xows_xml_node("text",null,xows_cli_own.name)));
    
    node = own_cach.querySelector("note");
    if(node) node.parentNode.removeChild(node);
    xows_xml_parent(own_cach, xows_xml_node("note",null,xows_xml_node("text",null,xows_cli_own.stat)));

    if(photo) {
      node = own_cach.querySelector("photo");
      if(node) node.parentNode.removeChild(node);
      xows_xml_parent(own_cach, xows_xml_node("photo",null,xows_xml_node("uri",null,photo)));
    }

  } else {
    node = own_cach.querySelector("NICKNAME");
    if(node) node.parentNode.removeChild(node);
    xows_xml_parent(own_cach, xows_xml_node("NICKNAME",null,xows_cli_own.name));

    node = own_cach.querySelector("DESC");
    if(node) node.parentNode.removeChild(node);
    xows_xml_parent(own_cach, xows_xml_node("DESC",null,xows_cli_own.stat));

    if(photo) {
      const img_type = xows_url_to_type(photo);
      const img_data = xows_url_to_data(photo);
      
      node = own_cach.querySelector("PHOTO");
      if(node) node.parentNode.removeChild(node);
      xows_xml_parent(own_cach,  xows_xml_node("PHOTO",null,[
                                  xows_xml_node("TYPE",null,img_type),
                                  xows_xml_node("BINVAL",null,img_data)]));
    }
  }

  xows_log(2,"cli_vcard_publish","Publish own vCard");
  
  // Get array of vcard children
  const vcard = [];
  for(let i = 0, n = own_cach.childNodes.length; i < n; ++i) {
    vcard.push(own_cach.childNodes[i]);
  }
  
  // Send query
  if(xows_cli_feat_own_has(XOWS_NS_IETF_VCARD4) && !xows_options.legacy_vcard) {
    xows_xmp_vcard4_publish(vcard, open ? "open" : "presence");
  } else {
    xows_xmp_vcardtemp_publish(vcard);
  }
}

/**
 * Stores received XEP-0084 avatar metadata.
 */
const xows_cli_avat_handle_temp = {};

/**
 * Function to handle parsed result of avatar data query.
 * 
 * @param   {string}    from    Avatar Contact JID.
 * @param   {object}    id      Avtar ID (data SHA-1 hash, theoretically...).
 * @param   {object}   [data]   Avtar data or null to get cached.
 */
function xows_cli_avat_data_handle(from, id, data)
{
  let hash = null;
  
  // We may receive metadata for already cached data, in this case
  // we only process Own/Contact/Occupant avatar update
  if(data) {
    xows_log(2,"cli_avat_data_handle","Handle received Avatar Data",id);
    // Get stored (we hope so) received data type for this hash
    if(!(id in xows_cli_avat_handle_temp)) {
      xows_log(1,"cli_avat_data_handle","Received Avatar Data without Metadata",id);
      return;
    }
    const type = xows_cli_avat_handle_temp[id];
    // Compose data-URL and add data to cache
    hash = xows_cli_cache_avat_add("data:" + type + ";base64," + data, id);
  } else {
    xows_log(2,"cli_avat_data_handle","Handle cached Avatar Data",id);
    // Already cached avatar data, we only get id as hash
    hash = id;
  }
  
  // Update the proper Contact, Occupant, or own profile
  xows_cli_profile_handle(from, null, hash, null);
}

/**
 * Handle received XEP-0084 avatar metadata notification
 * 
 * @param   {string}    from      Query result Sender JID.
 * @param   {object}    metadata  Received metadata.
 */
function xows_cli_avat_meta_handle(from, metadata)
{
  if(metadata) {
    // Get the <info> child within <metadata>
    const info = metadata.querySelector("info");
    if(info) {
      // Get avatar data hash
      const id = info.getAttribute("id");
      // Store data type to temporary db
      xows_cli_avat_handle_temp[id] = info.getAttribute("type");
      // Check whether we need to donwload data
      if(!xows_cli_cache_avat_has(id)) {
        xows_log(2,"cli_avat_meta_handle","Avatar Data unavailable",id);
        xows_xmp_avat_data_get_query(from, id, xows_cli_avat_data_handle);
      } else {
        xows_log(2,"cli_avat_meta_handle","Avatar Data already cached",id);
        // Handle with null data to update Own/Contact/Occupant with cached data
        xows_cli_avat_data_handle(from, id, null);
      }
    }
  }
}

/**
 * Query for XEP-0084 avatar metadata 
 * 
 * @param   {string}    to       JID to query avatar metadata.
 */
function xows_cli_avat_meta_query(to)
{
  xows_log(2,"cli_avat_meta_query","Query Avatar Metadata",to);
  xows_xmp_avat_meta_get_query(to, xows_cli_avat_meta_handle);
}

/**
 * Stores parameters for XEP-0084 avatar publication process
 */
let xows_cli_avat_publish_temp = null;

/**
 * Handle result of XEP-0084 avatar data publication to send back
 * corresponding metadata. This function is used as callback and should
 * not be called on hitself.
 * 
 * @param   {string}    from    Query result Sender JID.
 * @param   {string}    type    Query result type.
 */
function xows_cli_avat_meta_publish(from = null, type = "result")
{
  // If data publish succeed, follow by sending meta-data
  if(type === "result") {
    xows_log(2,"cli_avat_meta_publish","Avatar Data publication succeed","Now publish metadata");
    // Verify we have data hash
    if(xows_cli_avat_publish_temp) {
      const open = xows_cli_avat_publish_temp.open;
      const hash = xows_cli_avat_publish_temp.hash;
      const type = xows_cli_avat_publish_temp.type;
      const bytes = xows_cli_avat_publish_temp.bytes;
      const size = XOWS_AVAT_SIZE;
      xows_xmp_avat_meta_publish(hash, type, bytes, size, size, 
                                  open ? "open" : "presence", null);
      xows_log(2,"cli_avat_meta_publish","Publish Avatar Metadata","id:"+hash+" bytes:"+bytes);
    } else {
      xows_log(1,"cli_avat_meta_publish","No temp Metadata stored");
    }
  }
  // rest params
  xows_cli_avat_publish_temp = null;
}

/**
 * Publish new XEP-0084 avatar data then automatically send metadata
 * if data publication succeed.
 * 
 * This function take avatar data from the one currently cached and 
 * used by client own account.
 * 
 * @param {boolean} open  Publish data with Open Access.
 */
function xows_cli_avat_data_publish(open)
{
  const url = xows_cli_cache_avat_get(xows_cli_own.avat);
  if(url) {
    const b64 = xows_url_to_data(url); 
    const type = xows_url_to_type(url); 
    const bin = atob(b64);
    const hash = xows_bytes_to_hex(xows_hash_sha1(bin));
    // Store metadata to be published after data publication
    xows_cli_avat_publish_temp = {"open":open,"hash":hash,
                                  "type":type,"bytes":bin.length};
    xows_log(2,"cli_avat_data_publish","Publish Avatar Data",hash);
    // Publish data, the onparse function is set to send metadata
    xows_xmp_avat_data_publish(hash, b64, open ? "open" : "presence", 
                                xows_cli_avat_meta_publish);
  } else {
    xows_log(1,"cli_avat_data_publish","No Data to publish");
  }
}

/**
 * Handle result or notification of XEP-0172 User Avatar.
 * 
 * @param   {string}    from    Query result Sender JID.
 * @param   {string}    nick    Received <nick> child.
 */
function xows_cli_nick_handle(from, nick)
{
  xows_log(2,"cli_nick_handle","Parse received Nickname",from);
  
  // Update the proper Contact, Occupant, or own profile
  xows_cli_profile_handle(from, xows_xml_get_text(nick), null, null);
}

/**
 * Query for XEP-0172 User Nickname.
 * 
 * @param   {string}    to       JID to query Nickname.
 */
function xows_cli_nick_query(to)
{
  xows_log(2,"cli_nick_query","Query nickname",to);
  xows_xmp_nick_get_query(to, xows_cli_nick_handle); 
}

/**
 * Publish new XEP-0172 User Nickname.
 */
function xows_cli_nick_publish()
{
  xows_log(2,"cli_nick_publish","Publish own Nickname",xows_cli_own.name);
  xows_xmp_nick_publish(xows_cli_own.name); 
}

/**
 * Handles received subscribe (<presence> stanza) request or result 
 * from orher contacts.
 * 
 * This function is called by xows_xmp_recv_presence
 * 
 * @param   {string}  from      Sender JID
 * @param   {string}  type      Subscribe request/result type.
 * @param   {string} [nick]      Contact prefered nickname if available.
 */
function xows_cli_xmp_recv_subscribe(from, type, nick)
{
  let log_str;
  
  switch(type) 
  {
  // The sender wishes to subscribe to us 
  case "subscribe": log_str = "request"; break;
  // The sender deny our subscribe request
  case "unsubscribed": log_str = "denied"; break;
  // The sender has allowed us to subscribe
  case "subscribed": log_str = "allowed"; break;
  // The sender is unsubscribing us
  case "unsubscribe": log_str = "removed"; break;
  }
  
  // Simply log output 
  xows_log(2,"cli_xmp_recv_subscribe","Subscription "+log_str+" by",from);
  
  if(type === "subscribe") {
    // Try to find the contact
    const cont = xows_cli_get_cont(from);
    if(cont) {
      xows_log(2,"cli_xmp_recv_subscribe","Request automatically allowed","Contact in Roster");
      // If we already have contact in roster we accept and allow
      xows_cli_subscribe_allow(cont.bare, true, nick);
    } else { // This mean someone is adding us to its roster
      // Forward add subscription request
      xows_cli_fw_onsubspush(xows_jid_to_bare(from), nick);
    }
  }
}

/**
 * Handles received presence (<presence> stanza) status from 
 * other contacts.
 * 
 * This function is called by xows_xmp_recv_presence
 * 
 * @param   {string}  from      Sender JID
 * @param   {number}  show      Numerical show level, from -1 to 4
 * @param   {number}  prio      Priority level
 * @param   {string}  stat      Status string or null if none
 * @param   {object}  node      Entity node and ver strings or null
 * @param   {string}  photo     Vcard photo hash or null if none
 */
function xows_cli_xmp_recv_presence(from, show, prio, stat, node, photo) 
{
  const cont = xows_cli_get_cont(from);
  if(!cont) {
    // prevent warning for own presence report
    if(xows_jid_to_bare(from) !== xows_xmp_bare)
      xows_log(1,"cli_xmp_recv_presence","Unknown/unsubscribed contact",from);
    return;
  }
  
  // Reset the locked resource as defined in XEP-0296
  cont.lock = cont.bare;

  // Get resource part from full JID
  let res = xows_jid_to_nick(from);
  // Updates presence of the specific resource, delete it if offline
  if(show >= 0) {
    if(!cont.ress[res]) { //< new ressource ? add it
      xows_log(2,"cli_xmp_recv_presence","Adding resource for "+cont.bare, res);
      cont.ress[res] = {"show":show,"prio":prio,"stat":stat,"node":null};
      // Check for entity capabilities
      if(node) {
        const node_ver = node.node + "#" + node.ver;
        cont.ress[res].node = node_ver;
        // If we don't know this node, get features
        if(!xows_cli_cache_caps_has(node_ver)) {
          xows_log(2,"cli_xmp_recv_presence","Query entity caps for "+cont.bare,node_ver);
          xows_xmp_discoinfo_query(from, node_ver, xows_cli_entity_caps_handle);
        }
      }
    } else { //< update existing ressource
      xows_log(2,"cli_xmp_recv_presence","Updating resource for "+cont.bare, res);
      cont.ress[res].show = show;
      cont.ress[res].prio = prio;
      cont.ress[res].stat = stat;
    }
  } else {
    if(cont.ress[res]) {
      xows_log(2,"cli_xmp_recv_presence","Removing resource for "+cont.bare, res);
      delete cont.ress[res]; //< ressource gone offline remove it
    }
  }
  // Set default show level and status
  cont.show = -1;
  cont.stat = null;
  // Select new displayed show level and status according current 
  // connected resources priority
  let p = -128;
  for(const k in cont.ress) {
    if(!cont.ress.hasOwnProperty(k)) continue;
    if(cont.ress[k].prio > p) {
      p = cont.ress[k].prio;
      cont.show = cont.ress[k].show;
      cont.stat = cont.ress[k].stat;
    }
  }
  
  xows_log(2,"cli_xmp_recv_presence","Updated presence for "+cont.bare,
            "show:"+cont.show+" stat:"+cont.stat);

  // Update avatar and query for vcard if required
  if(photo) { //< do we got photo hash ?
    if(xows_cli_cache_avat_has(photo)) {
      cont.avat = photo;
    } else {
      xows_cli_vcard_query(cont.bare);
    }
  }
  
  // Save current peer status to local storage
  xows_cli_cache_peer_add(cont.bare, null, cont.stat, null);
  
  // Forward updated Contact
  xows_cli_fw_oncontpush(cont);
}

/**
 * Handles received occupant presence (<presence> stanza) status 
 * from MUC room.
 * 
 * This function is called by xows_xmp_recv_presence
 * 
 * @param   {string}  from      Sender JID
 * @param   {number}  [show]    Optional show level if available.
 * @param   {string}  [stat]    Optional status string if available.
 * @param   {object}  muc       Occupant MUC additional infos.
 * @param   {string}  photo     Occupant vcard photo hash.
 */
function xows_cli_xmp_recv_occupant(from, show, stat, muc, photo) 
{
  const room = xows_cli_get_room(from);
  if(!room) {
    xows_log(1,"cli_xmp_recv_occupant","Unknown/unjoined room",from);
    return;
  }
  
  // Check wheter the occupant is to be removed
  if(show < 0) { //< Mean unavailable
    // Remove occupant from room
    let i = room.occu.length;
    while(i--) {
      if(room.occu[i].jid === from) {
        room.occu.splice(i,1);
        // Forward removed Occupant
        xows_cli_fw_onoccurem(room, from);
        break;
      }
    }
    // Return now
    return;
  } 

  // Handle special case of room creation
  if(muc.code.length) {
    for(let i = 0, n = muc.code.length; i < n; ++i) {
      if(muc.code[i] === 201) {
        // Send room configuration form
        xows_log(2,"cli_xmp_recv_occupant","Request initial room config",from);
        xows_xmp_muc_cfg_get_guery(room.bare, xows_cli_muc_cfg_get_handle);
        break;
      }
    }
  }
  
  // Gather occupant data
  const nick = xows_jid_to_nick(from);
  
  const affi = muc.affiliation;
  const role = muc.role;
  const full = muc.jid; //< The real JID, may be unavailable
  const bare = full ? xows_jid_to_bare(full) : null; //< The real bare JID

  // Get occupant object if exists
  let occu = xows_cli_get_occu(room, from);

  // If occupant already exists in room we update data, otherwise we
  // create a new one and add it ti list.
  if(occu) {
    
    xows_log(2,"cli_xmp_recv_occupant","Refresh occupant of "+room.name,nick+" ("+full+")");
    
    occu.full = full;
    occu.bare = bare;
    occu.affi = affi;
    occu.role = role;
    occu.show = show;
    occu.stat = stat;

    // Update avatar or query for vcard has required
    if(photo) { //< do we got photo hash ?
      if(xows_cli_cache_avat_has(photo)) {
        occu.avat = photo;
      } else {
        xows_cli_vcard_query(from); //< Must update vcard
      }
    }
      
  } else {
    xows_log(2,"cli_xmp_recv_occupant","Adding occupant to "+room.name,nick+" ("+full+")");
    
    // Check for stored data in localStorage
    let cach = null;
    if(bare) xows_cli_cache_peer_get(bare);
    if(!cach) xows_cli_cache_peer_get(from);
    
    // Get cached avatar if available, or set default pseudo-random
    let avat = null;
    if(cach) if(cach.avat) avat = cach.avat;
    if(!avat) avat = xows_cli_cache_avat_temp(from);
    
    occu = xows_cli_new_room_occu(room, from, affi, role, full, avat, show, stat);
    
    // Query avatar to get or update data
    xows_cli_avat_meta_query(from);
  }
  
  // Forward added or updated Room Occupant
  xows_cli_fw_onoccupush(room, occu);
}

/**
 * Handle disco#info capabilities query to client.
 * 
 * @param   {string}    from        Query result sender JID.
 * @param   {object[]}  iden        Array of parsed <identity> objects.
 * @param   {string[]}  feat        Array of parsed feature strings.
 * @param   {object[]}  form        Array of parsed X-Data fields.
 * @param   {string}    node        Entity Node or null if unavailable.
 */
function xows_cli_entity_caps_handle(from, iden, feat, form, node)
{
  if(!xows_cli_cache_caps_has(node)) {
    xows_log(2,"cli_entity_caps_handle","Caching entity caps",node);
    // Add entity feature list to cache
    xows_cli_cache_caps_add(node, feat);
  } else {
    xows_log(2,"cli_entity_caps_handle","Node already cached",node);
  }
}

/**
 * Handles an incoming chat state notification.
 * 
 * @param   {string}  id          Message ID
 * @param   {string}  type        Message type
 * @param   {string}  from        Sender JID
 * @param   {string}  to          Recipient JID
 * @param   {string}  chat        Chat state
 * @param   {number}  time        Optional provided time (Unix epoch)
 */
function xows_cli_xmp_recv_chatstate(id, type, from, to, chat, time)
{
  if(type !== "chat" && type !== "groupchat") {
    xows_log(1,"cli_xmp_recv_chatstate","Invalid message type",type);
    return;
  }
  
  // Retreive message peer and author
  let peer;
  if(type === "chat") {
    // Check whether message is a carbons copy of a message sent by  
    // own account but from another connected client.
    if(xows_cli_is_own(from)) {
      xows_log(2,"cli_xmp_recv_chatstate","Carbons chat state ignored",from);
      return;
    }
    peer = xows_cli_get_cont(from);
  } else {
    peer = xows_cli_get_room(from);
    // Check whether message is an echo send by own account
    if(peer.join === from) {
      xows_log(2,"cli_xmp_recv_chatstate","Echo chat state ignored",from);
      return;
    }
  }
  
  if(!peer) {
    xows_log(1,"cli_recv_message","Unknown/unsubscribed JID",from);
    return;
  }
  
  // Update "locked" ressourceas as recommended in XEP-0296
  if(peer.type === XOWS_PEER_CONT) {
    peer.lock = from; 
    peer.chat = chat;
  }

  xows_log(2,"cli_xmp_recv_chatstate","Chat state",from+" "+chat);
  
  // Forward received Chat State
  xows_cli_fw_onchatstate(peer, from, chat); 
}

/**
 * Handles an incoming chat message with content.
 * 
 * @param   {string}  id      Message ID
 * @param   {string}  type    Message type
 * @param   {string}  from    Sender JID
 * @param   {string}  to      Recipient JID
 * @param   {string}  body    Message content
 * @param   {number} [time]   Optional provided time (Unix epoch)
 */
function xows_cli_xmp_recv_message(id, type, from, to, body, time)
{
  if(type !== "chat" && type !== "groupchat") {
    xows_log(1,"cli_recv_message","Invalid message type",type);
    return;
  }
  
  let sent, peer;
  
  // Retreive message peer and author
  if(type === "chat") {
    sent = xows_cli_is_own(from);
    peer = xows_cli_get_cont(sent ? to : from);
  } else {
    peer = xows_cli_get_room(from);
    sent = (from === peer.join);
  }
  
  if(!peer) {
    xows_log(1,"cli_recv_message","Unknown/unsubscribed JID",from);
    return;
  }
  
  // If no time is specified set as current
  if(!time) time = new Date().getTime();
  
  // Update "locked" ressourceas as recommended in XEP-0296
  if(peer.type === XOWS_PEER_CONT) {
    if(!sent) peer.lock = from;
  }
  
  xows_log(2,"cli_recv_message","Chat message",from+" \""+body+"\"");
  
  // Forward received message
  xows_cli_fw_onmessage(peer, id, from, body, time, sent, true);
}

/**
 * Handles an incoming message subject
 * 
 * @param   {string}  id        Message ID
 * @param   {string}  from      Sender JID
 * @param   {string}  subj      Subject content
 */
function xows_cli_xmp_recv_subject(id, from, subj)
{
  const room = xows_cli_get_room(from);
  if(!room) {
    xows_log(1,"cli_xmp_recv_subject","Unknown/unsubscribed JID",from);
    return;
  }
  
  room.subj = subj;
  
  xows_log(2,"cli_xmp_recv_subject","Room subject",from+" \""+subj+"\"");
  
  // Forward received Room subject
  xows_cli_fw_onsubject(room, subj);
}

/**
 * Handles an incoming message receipt
 * 
 * @param   {string}  id      Message ID
 * @param   {string}  from    Sender JID
 * @param   {string}  to      Recipient JID
 * @param   {string}  rcid    Receipt message ID
 * @param   {number} [time]   Optional provided time (Unix epoch)
 */
function xows_cli_xmp_recv_receipt(id, from, to, rcid, time)
{
  let peer;
  // Check whether message is a carbons copy of a message sent by  
  // current user but from another connected client.
  if(xows_cli_is_own(from)) {
    xows_log(2,"cli_recv_receipt","Receipt from other resource ignored",from);
    return;
  } else {
    peer = xows_cli_get_peer(from);
  }
  if(!peer) {
    xows_log(1,"cli_recv_receipt","Unknown/unsubscribed JID",from);
    return;
  }
  xows_log(2,"cli_recv_receipt","Message receipt received",from+" "+rcid);
  // Forward received Receipt
  xows_cli_fw_onreceipt(peer, rcid);
}

/**
 * Handles an incoming PubSub event
 * 
 * @param   {string}    from    Sender JID
 * @param   {string}    node    PubSub node
 * @param   {object[]}  item    Received items.
 */
function xows_cli_xmp_recv_pubsub(from, node, item)
{
  // Check whether this is a vcard notification
  if(node === XOWS_NS_VCARD4) {
    if(item.length) {
      xows_log(2,"cli_xmp_recv_pubsub","Received vCard notification",from);
      // Send vcard to handling function
      xows_cli_vcard_handle(from, item[0].data);
    }
  }
  
  // Check whether this is an avatar notification
  if(node === XOWS_NS_AVATAR_META) {
    if(item.length) {
      xows_log(2,"cli_xmp_recv_pubsub","Received Avatar notification",from);
      // Send vcard to handling function
      xows_cli_avat_meta_handle(from, item[0].data);
    }
  }
  
  // Check whether this is an nickname notification
  if(node === XOWS_NS_NICK) {
    if(item.length) {
      xows_log(2,"cli_xmp_recv_pubsub","Received Nickname notification",from);
      // Send vcard to handling function
      xows_cli_nick_handle(from, item[0].data);
    }
  }
}

/**
 * User callback to receive MAM query result
 */
let xows_cli_mam_cb = null;

/**
 * Handles the archive query parsed result.
 * 
 * @param   {string}    from      Archives sender JID, may be Room or Null.
 * @param   {string}    _with     With JID used as filter or Null.
 * @param   {object[]}  result    Received archived messages.
 * @param   {number}    count     Total result count.
 * @param   {boolean}   complete  Current result set is complete.
 */
function xows_cli_mam_handle(from, _with, result, count, complete)
{
  // Retreive the contact related to this query
  const peer = xows_cli_get_peer(from ? from : _with);
  if(!peer) {
    xows_log(1,"cli_mam_handle","Unknown/unsubscribed JID",from ? from : _with);
    return;
  }

  xows_log(2,"cli_mam_handle","Received archives for",peer.bare);
  
  // Forward archive result
  if(xows_is_func(xows_cli_mam_cb))  
    xows_cli_mam_cb(peer, result, complete);
}

/**
 * Query for archived messages with the specified JID.
 *  
 * @param   {object}    peer      Peer to get archive.
 * @param   {number}    max       Maximum count of message to get.
 * @param   {number}    start     Archive start time parameter.
 * @param   {number}    end       Archive end time parameter.
 * @param   {object}    onresult  Callback to handle received result.
 */
function xows_cli_mam_query(peer, max, start, end, onresult)
{
  if(peer.type === XOWS_PEER_CONT) {
    // Send new query to XMPP interface
    xows_xmp_mam_query(null, max, peer.bare, start, end, null, xows_cli_mam_handle);
  } else {
    // Send new query to XMPP interface
    xows_xmp_mam_query(peer.bare, max, null, start, end, null, xows_cli_mam_handle);
  }
  
  xows_cli_mam_cb = onresult;
}

/**
 * Send a chat message to the specified recipient.
 * 
 * @param   {string}  peer      Recipient peer (Room or Contact).
 * @param   {string}  body      Message content.
 */
function xows_cli_send_message(peer, body) 
{
  // Message with empty body are devil
  if(!body.length) {
    xows_log(1,"cli_user_send_message","Message with empty body","Who you gonna call ?");
    return;
  }
  
  let type, to, from, use_recp = false;
  
  // Check whether peer is a MUC room or a subscribed Contact
  if(peer.type === XOWS_PEER_ROOM) {
    
    type = "groupchat";
    to = peer.bare;
    from = peer.join;
    use_recp = true; //FIXME: Does MUC room always support receipt ?
    
  } else {
    
    // If current peer client is online and support receipt, the 
    // message should not be marked as "receip received"
    if(peer.lock !== peer.bare) {
      // Get resource object of current locked
      const res = peer.ress[xows_jid_to_nick(peer.lock)];
      // Check for receipt support
      if(res) use_recp = xows_cli_cache_caps_try(res.node, XOWS_NS_RECEIPTS);
    }
    
    type = "chat";
    to = peer.lock;
    from = xows_cli_own.bare;
  } 
  
  xows_log(2,"cli_user_send_message","Send "+type+" message",to+" \""+body+"\"");
        
  // Send message with body
  const id = xows_xmp_send_message(type, to, body, use_recp);
  
  // Forward sent message
  xows_cli_fw_onmessage(peer, id, from, body, new Date().getTime(), true, !use_recp);
}

/**
 * Send a chat message to the specified recipient.
 * 
 * @param   {string}  peer  Recipient peer (Room or Contact).
 * @param   {string}  chat  Chatstate value to send.
 */
function xows_cli_send_chatstate(peer, chat) 
{
  let type, to;
  
  // Check whether peer is a MUC room or a subscribed Contact
  if(peer.type === XOWS_PEER_ROOM) {
    type = "groupchat";
    to = peer.bare;
  } else {
    type = "chat";
    to = peer.lock;
  }

  xows_log(2,"cli_send_chatstate","Send Chatstat",to+" \""+chat+"\"");

  // Send chatstat message
  xows_xmp_send_chatstate(to, type, chat);
}

/**
 * Send a subject to the specified room.
 * 
 * @param   {string}  room      Recipient Room.
 * @param   {string}  subj      Subject content.
 */
function xows_cli_send_subject(room, subj) 
{
  xows_log(2,"cli_muc_subject_send","Send subject",room.bare+" \""+subj+"\"");
  // Send message with subject
  xows_xmp_send_subject(room.bare, subj);
}

/**
 * Stack used to fulfill the per roominfos features discovery.
 */
const xows_cli_muc_item_info_stack = [];

/**
 * Query disco#items to MUC service, to retrieve public room list.
 */
function xows_cli_muc_items_query()
{
  // Verify the server provide MUC service
  if(!xows_cli_service_exist(XOWS_NS_MUC)) {
    xows_log(1,"cli_muc_items_query","service not found",
                "the server does not provide "+XOWS_NS_MUC+" service");
    xows_cli_fw_onerror(XOWS_SIG_WRN, "Multi-User Chat (XEP-0045) service is unavailable");
    return;
  }

  // Send Item discovery to the MUC service URL
  xows_xmp_discoitems_query(xows_cli_service_url[XOWS_NS_MUC], 
                        xows_cli_muc_items_handle);
}

/**
 * Handle disco#items query to MUC service for existing public rooms
 * 
 * 
 * @param   {string}    from        Query result sender JID.
 * @param   {object[]}  item        Array of parsed <item> objects.
 */
function xows_cli_muc_items_handle(from, item)
{
  // Empty the chatroom list
  xows_cli_room.length = 0;
    
  if(item.length) {
    // Ensure services stack is empty
    xows_cli_muc_item_info_stack.length = 0;
    // First, fill the services stack
    let i = item.length;
    while(i--) xows_cli_muc_item_info_stack.push(item[i].jid);
    // Then start query info for each services
    xows_xmp_discoinfo_query(xows_cli_muc_item_info_stack.pop(), null, xows_cli_muc_item_info_handle);
  } else {
    // Null room mean empty room list
    xows_cli_fw_onroompush(null);
  }
}

/**
 * Handle disco#info query to a MUC room.
 * 
 * @param   {string}    from        Query result sender JID.
 * @param   {object[]}  iden        Array of parsed <identity> objects.
 * @param   {string[]}  feat        Array of parsed feature strings.
 * @param   {object[]}  form        Array of parsed X-Data fields.
 */
function xows_cli_muc_item_info_handle(from, iden, feat, form)
{
  let i, n, name, subj = "", desc = "", priv = false;
  
  // Retrieve or extract the name for this room
  if(iden.length) {
    name = iden[0].name;
  } else {
    name = from.split("@")[0];
  }
  // Check room features
  for(i = 0, n = feat.length; i < n; ++i) {
    if(feat[i] === "muc_passwordprotected") priv = true;
  }
  // Get available informations
  if(form) {
    for(i = 0, n = form.length; i < n; ++i) {
      if(form[i]["var"] == "muc#roominfo_description")  desc = form[i].value;
      if(form[i]["var"] == "muc#roominfo_subject") subj = form[i].value;
    } 
  }
  // Check whether this room already exists in local list
  let room = xows_cli_get_room(from);
  // If romm already exists, we simply refresh infos, otherwise we
  // create and add a new room in list
  if(room) {
    room.name = name;
    room.desc = desc;
    room.priv = priv;
    xows_log(2,"cli_handle_roominfo","Refresh Room",name+" ("+from+") :\""+desc+"\"");
  } else {
    // Create new room in local list
    room = xows_cli_new_room(from, name, desc, priv);
    xows_log(2,"cli_handle_roominfo","Adding Room",name+" ("+from+") :\""+desc+"\"");
  }
  
  // Forward added Chatroom
  xows_cli_fw_onroompush(room);
  
  // Proceed the next room in stack to get info
  if(xows_cli_muc_item_info_stack.length) {
    // Query info for the next service
    xows_xmp_discoinfo_query(xows_cli_muc_item_info_stack.pop(), null, xows_cli_muc_item_info_handle);
  }
}

/**
 * Callback for user Room get config query result
 */
let xows_cli_muc_cfg_get_cb = null;

/**
 * Handle result for MUC room configuration form query
 * 
 * @param   {string}    from    Result sender JID.
 * @param   {object[]}  submit  Array of fulfilled x fata form to submit.
 */
function xows_cli_muc_cfg_get_handle(from, form)
{
  // Retreive the contact related to this query
  const room = xows_cli_get_room(from);
  if(!room) {
    xows_log(1,"cli_muc_cfg_get_handle","Unknown/unsubscribed Room",from);
    return;
  }
  xows_log(2,"cli_muc_cfg_get_handle","Received room form",room.bare);
  
  // Forward Room Owner config form
  if(xows_is_func(xows_cli_muc_cfg_get_cb))
    xows_cli_muc_cfg_get_cb(room, form);
}

/**
 * Query get MUC room configuration form (current config).
 * 
 * @param   {string}    room        Room object to query conf.
 * @param   {object}    onresult    Callback to handle received result.
 */
function xows_cli_room_cfg_get(room, onresult)
{
  xows_log(2,"cli_user_room_cfg_get","Query for room config",room.bare);
  xows_xmp_muc_cfg_get_guery(room.bare, xows_cli_muc_cfg_get_handle);
  
  // set the onresult function
  xows_cli_muc_cfg_get_cb = onresult;
}

/**
 * Submit MUC room configuration form.
 * 
 * @param   {string}    room    Room object to query conf.
 * @param   {object[]}  submit  Array of fulfilled x fata form to submit.
 */
function xows_cli_room_cfg_set(room, form)
{
  xows_log(2,"cli_user_room_cfg_set","Submit MUC room config",room.bare);
  if(form) {
    xows_xmp_muc_cfg_set_query(room.bare, form, xows_cli_muc_cfg_set_handle);
  } else {
    xows_xmp_muc_cfg_set_cancel(room.bare, null);
  }
}

/**
 * Function to handle result of MUC room configuration form submition.
 * 
 * @param   {string}    from    Result sender JID.
 * @param   {object[]}  type    Result type.
 */
function xows_cli_muc_cfg_set_handle(from, type)
{
  if(type === "result") {
    // Retreive the contact related to this query
    const room = xows_cli_get_room(from);
    if(!room) {
      xows_log(1,"cli_handle_room_submit","Unknown/unsubscribed Room",from);
      return;
    }
    // Query room info to update data
    xows_xmp_discoinfo_query(room.bare, null, xows_cli_muc_item_info_handle);
  }
}

/**
 * Add, update or remove item (contact or room) to/from Roster.
 * 
 * To remove existing item, set the name parameter ot null.
 * 
 * @param   {string}  bare    Item bare JID to add.
 * @param   {string}  name    Displayed name for item or null.
 */
function xows_cli_change_roster(bare, name)
{
  xows_log(2,"cli_change_roster",(name?"Add":"Remove")+" contact",bare);
  
  // Send roster add request
  xows_xmp_roster_set_query(bare, name, null, null);
  
  if(name) {
    xows_log(2,"cli_change_roster","Request subscribe to",bare);
    // Send a subscription request to the contact
    xows_xmp_send_presence(bare, "subscribe", null, null, null, null, xows_cli_own.name);
  }
}

/**
 * Object used to store Current Http Upload query related data.
 */
let xows_cli_upld_param = null;

/**
 * Callback function for HTTP Upload Rrror.
 */
let xows_cli_upld_fw_error = function() {};

/**
 * Callback function for HTTP Upload Success.
 */
let xows_cli_upld_fw_success = function() {};

/**
 * Callback function for HTTP Upload Progress.
 */
let xows_cli_upld_fw_progress = function() {};

/**
 * Callback function for HTTP Upload Abort.
 */
let xows_cli_upld_fw_abort = function() {};

/**
 * Function to query an Http upload slot.
 * 
 * @param   {object}  file        File object to upload.
 * @param   {object}  onerror     On upload error callback.
 * @param   {object}  onsuccess   On upload success callback.
 * @param   {object}  onprogress  On upload progress callback.
 * @param   {object}  onabort     On upload aborted callback.
 */
function xows_cli_upld_query(file, onerror, onsuccess, onprogress, onabort)
{
  // No upload until another is pending
  if(xows_cli_upld_param)
    return;

  if(!xows_cli_service_exist(XOWS_NS_HTTPUPLOAD)) {
    xows_log(1,"cli_user_upload_query","service not found",
                "the server does not provide "+XOWS_NS_HTTPUPLOAD+"(:0) service");
    xows_cli_fw_onerror(XOWS_SIG_ERR, "HTTP File Upload (XEP-0363) service is unavailable");
    return;
  }

  xows_log(2,"cli_user_upload_query","Upload query for",file.name);

  // Create a new param object to store query data
  xows_cli_upld_param = {"file":file,"url":""};
  
  xows_cli_upld_fw_error = onerror;
  xows_cli_upld_fw_success = onsuccess;
  xows_cli_upld_fw_progress = onprogress;
  xows_cli_upld_fw_abort = onabort;

  // Query an upload slot to XMPP service
  xows_xmp_upload_query(xows_cli_service_url[XOWS_NS_HTTPUPLOAD], 
                        file.name, file.size, file.type, xows_cli_upld_handle);
}

/**
 * Abort the current progressing file upload if any.
 */
function xows_cli_upld_abort()
{
  xows_log(2,"cli_user_upload_abort","Upload abort requested");
  if(xows_cli_upld_xhr) {
    xows_cli_upld_xhr.abort();
  }
}

/**
 * Reference to the XMLHttpRequest object created to upload file using
 * PUT request in Http upload context.
 */
let xows_cli_upld_xhr = null;

/**
 * Http Upload query XMLHttpRequest.upload "progress" callback function.
 * 
 * @param   {object}  event   Progress event object.
 */
function xows_cli_upld_xhr_progress(event)
{
  // Forward loading percent
  if(xows_is_func(xows_cli_upld_fw_progress))
    xows_cli_upld_fw_progress((event.loaded / event.total) * 100);
}

/**
 * Http Upload query XMLHttpRequest.upload "load" callback function.
 */
function xows_cli_upld_xhr_success()
{ 
  // Forward file download URL
  if(xows_is_func(xows_cli_upld_fw_success))
    xows_cli_upld_fw_success(xows_cli_upld_param.url);
    
  xows_cli_upld_param = null; //< Reset query data
  xows_cli_upld_xhr = null;
}

/**
 * Http Upload query XMLHttpRequest.upload "error" callback function.
 * 
 * @param   {object}  event   Error event object.
 */
function xows_cli_upld_xhr_error(event)
{
  xows_log(1,"cli_upload_xhr_error","http PUT request failed");
  // Forward the error event
  if(xows_is_func(xows_cli_upld_fw_error))
    xows_cli_upld_fw_error("("+xows_cli_upld_xhr.status+") "+xows_cli_upld_xhr.statusText+"");
    
  xows_cli_upld_param = null; //< Reset query data
  xows_cli_upld_xhr = null;
}

/**
 * Http Upload query XMLHttpRequest.upload "abort" callback function.
 * 
 * @param   {object}  event   Error event object.
 */
function xows_cli_upld_xhr_abort(event)
{
  xows_log(1,"cli_upload_xhr_abort","http PUT request aborted by user");
  xows_cli_upld_param = null; //< Reset query data
  xows_cli_upld_xhr = null;
  // Forward Uploard aborted
  if(xows_is_func(xows_cli_upld_fw_abort))
    xows_cli_upld_fw_abort();
}

/**
 * Function to handle an Http Upload query result, then start upload
 * if slot was given.
 * 
 * @param   {string}  put_url   URL for HTTP PUT request or null if denied.
 * @param   {string}  head_list Additionnal <header> elements list for PUT request.
 * @param   {string}  get_url  URL to donwload file once uploaded.
 * @param   {string}  error    Optional error message if denied.
 */
function xows_cli_upld_handle(put_url, head_list, get_url, error)
{
  // Check if we got an error
  if(!put_url) {
    xows_cli_upld_param = null; //< Reset query data
    if(xows_is_func(xows_cli_upld_fw_error))
      xows_cli_upld_fw_error(error);
    return;
  }
  // Store the URL to download the file once uploaded
  xows_cli_upld_param.url = get_url;
  // Retreive file object and create formdata
  const file = xows_cli_upld_param.file;
  const data = new FormData();
  data.append(file.name, file);
  // Open new HTTP request for PUT form-data
  const xhr = new XMLHttpRequest();
  // Set proper callbacks to Xhr object
  xhr.upload.addEventListener("progress", xows_cli_upld_xhr_progress, false);
  xhr.upload.addEventListener("load", xows_cli_upld_xhr_success, false);
  xhr.upload.addEventListener("error", xows_cli_upld_xhr_error, false);
  xhr.upload.addEventListener("abort", xows_cli_upld_xhr_abort, false);
  xhr.open("PUT", put_url, true);
  xhr.setRequestHeader("Content-Type","main_menucation/octet-stream");
  xows_log(2,"cli_upload_handle","Send PUT http request",put_url);
  // Store reference to XMLHttpRequest
  xows_cli_upld_xhr = xhr;
  // Here we go...
  xhr.send(file);
}

/**
 * Query for MUC chatroom registration request.
 * 
 * @param   {object}  room   Room object to join.
 */
function xows_cli_muc_register_query(room)
{
  // Send request for Room register (will respond by xform)
  xows_xmp_register_get_query(room.bare, xows_cli_muc_register_handle);
}

/**
 * Handle MUC chatroom registration request form submit.
 * 
 * @param   {object}    from        Send JID or adress.
 * @param   {boolean}   registerd   Boolean that indicate already registered.
 * @param   {string}    user        Username string and/or request (not used).
 * @param   {string}    pass        password string and/or request (not used).
 * @param   {string}    mail        email string and/or request (not used).
 * @param   {object[]}  form        x:data form to be fulfilled.
 */
function xows_cli_muc_register_handle(from, registered, user, pass, mail, form)
{
  // Retreive the contact related to this query
  const room = xows_cli_get_room(from);
  if(!room) {
    xows_log(1,"cli_muc_register_handle","Unknown/unsubscribed Room",from);
    return;
  }
  // TODO: Maybe there is something to do here
  if(registered) {
    return;
  }
  if(form) {
    // Fulfill the form with proper informations
    for(let i = 0, n = form.length; i <n; ++i) {
      if(form[i]["var"] === "muc#register_roomnick") form[i].value = xows_cli_own.name;
    }
    // Send room register fields and values
    xows_xmp_register_set_query(from, null, null, null, form, null);
  }
}

/**
 * Send presence subscribe request to contact.
 * 
 * @param   {object}  bare   Contact bare JID to send subsribe request.
 */
function xows_cli_subscribe_request(bare)
{
  xows_log(2,"cli_subscribe_request","Request subscribe to",bare);
  // Send or resent subscribe request to contact
  xows_xmp_send_presence(bare, "subscribe");
}

/**
 * Send presence subscribtion allow or deny to contact.
 * 
 * @param   {string}    bare    Contact JID bare.
 * @param   {boolean}   allow   True to allow, false to deny.
 * @param   {string}   [nick]   Preferend nickname if available.
 */
function xows_cli_subscribe_allow(bare, allow, nick)
{
  // Send an allow or deny subscription to contact
  xows_xmp_send_presence(bare, allow?"subscribed":"unsubscribed");
  xows_log(2,"cli_subscribe_request",(allow?"Allow":"Deny")+" subscription from",bare);
  // If subscription is allowed, we add the contact
  if(allow) {
    // Check whether we must add this contact
    if(!xows_cli_get_cont(bare)) {
      // Compose displayed name from JID
      let name;
      if(nick) {
        name = nick;
      } else {
        const userid = bare.split("@")[0];
        name = userid[0].toUpperCase() + userid.slice(1);
      }
      // We add the contact to roster (and send back subscription request)
      xows_cli_change_roster(bare, name);
    }
  }
  // Forward subscription request to be removed
  xows_cli_fw_onsubsrem(bare);
}

/**
 * Join existing room or create new one. If not room object is supplied
 * the function try to join (ie. create) the room using the supplied
 * room name.
 * 
 * @param   {object}  room   Room object to join, or null.
 * @param   {string}  name   Optional room name to join or create.
 * @param   {string}  nick   Optional nickname to join room.
 * @param   {string}  pass   Optional password to join room (not implemented yet).
 */
function xows_cli_room_join(room, name, nick, pass)
{
  // Verify the server provide MUC service
  if(!xows_cli_service_exist(XOWS_NS_MUC)) {
    xows_log(1,"cli_muc_items_query","service not found",
                "the server does not provide "+XOWS_NS_MUC+" service");
    xows_cli_fw_onerror(XOWS_SIG_WRN, "Multi-User Chat (XEP-0045) service is unavailable");
    return;
  }
  
  // Check if we got a room object
  if(room) {
    // Ignore request if already joined room
    if(room.join) return;
  } else {
    // Room is not public or does not exists, we add it
    const muc_url = xows_cli_service_url[XOWS_NS_MUC];
    let bare = name.toLowerCase() + "@" + muc_url;
    room = xows_cli_new_room(bare, name, "", false);
    xows_log(2,"cli_muc_room_join","Adding Room",name+" ("+bare+")");
    // Forward created chatroom
    xows_cli_fw_onroompush(room);
  }

  // Compose destination using Room JID and our nickname
  const to = room.bare + "/" + (nick ? nick : xows_cli_own.name);
  xows_log(2,"cli_muc_room_join","Joining room",to);
  // Send initial presence to Room to join
  xows_xmp_send_presence(to, null, xows_cli_own.show, xows_cli_own.stat, xows_cli_own.avat, true);
  // Room joigned
  room.join = to;
  // Try to register
  //xows_cli_muc_register_query(room);
}

/**
 * Change user name (nickname) and avatar picture.
 * 
 * @param {string}  name  Prefered nickname.
 * @param {string}  url   Image Data-URL to set as avatar.
 * @param {boolean} open  Publish data with Open Access.
 */
function xows_cli_change_profile(name, url, open)
{
  // Update user settings
  if(name) {
    xows_cli_own.name = name;
    xows_log(2,"cli_change_profile","Change user name",name);
  }
  
  // Update user settings
  if(url) {
    xows_log(2,"cli_change_profile","Change avatar data");
    // Create new avatar from supplied image
    xows_cli_own.avat = xows_cli_cache_avat_add(url);
  } else {
    xows_log(2,"cli_change_profile","Removing avatar data");
    // Generate or retreive pseudo-random avatar
    xows_cli_own.avat = xows_cli_cache_avat_temp(xows_cli_own.bare);
  }
  
  // Update vcard with new avatar
  xows_cli_vcard_publish(open);
  
  // Publish user nickname
  xows_cli_nick_publish();
    
  // Publish new avatar
  xows_cli_avat_data_publish(open);
  
  // For legacy vcard-temps, send presence with new avatar hash
  xows_cli_presence_update();
  
  // Forward changes
  xows_cli_fw_onownchange(xows_cli_own);
}

/**
 * Presence level as chosen by user
 */
let xows_cli_chosen_show = 0;

/**
 * Setup and send initial presence. This function should be called
 * only once after client properly retreived roster content.
 */
function xows_cli_presence_init()
{
  xows_cli_own.stat = null;
  xows_cli_own.show = xows_cli_chosen_show = 3;
 
  xows_log(2,"cli_presence_init","Send intial presence");
  
  // Send simple initial presence, without avatar advert
  xows_xmp_send_presence(null, null, 3);
  
  // Do not initialize again for this session
  xows_cli_initialize = false;
  
  // Query for own vcard
  if(!xows_options.vcard4_notify) {
    xows_cli_vcard_query(xows_cli_own.bare);
  }

  // Query for own avatar
  if(!xows_options.avatar_notify) {
    xows_cli_avat_meta_query(xows_cli_own.bare);
  }
  
  // Query for own nickname
  xows_cli_nick_query(xows_cli_own.bare);
  
  // All discovery finished, client is ready
  xows_cli_fw_onconnect(xows_cli_own);
}

/**
 * Send and update presence to proper destination and modify internal
 * client data to reflect new user presence.
 */
function xows_cli_presence_update()
{
  // Define values as required
  let type, show, stat, avat;
  
  if(xows_cli_own.show >= 0) { 
    show = xows_cli_own.show;
    stat = xows_cli_own.stat;
    avat = xows_cli_own.avat;
  } else { // XOWS_SHOW_OFF === -1
    type = "unavailable";
  }
  
  xows_log(2,"cli_presence_update","Send updated presence");
  
  // Simple presence to server
  xows_xmp_send_presence(null, type, show, stat, avat);
  
  // Presence to all joined rooms
  let i = xows_cli_room.length;
  while(i--) {
    if(xows_cli_room[i].join) {
      xows_xmp_send_presence(xows_cli_room[i].join, type, show, stat, avat);
      // Unavailable client exited the room
      if(type) xows_cli_room[i].join = null;
    }
  }
}

/**
 * Set the client current presence show level.
 * 
 * @param   {number}  level   Numerical show level to set (-1 to 4)
 */
function xows_cli_change_presence(level)
{
  // Change the show level and send to server
  xows_cli_own.show = xows_cli_chosen_show = level;
  // Send presence with updated values
  xows_cli_presence_update();
  // Forward user status upate
  xows_cli_fw_onownchange(xows_cli_own);
}

/**
 * Set the client current presence status.
 * 
 * @param   {string}  status  Status string to set.
 */
function xows_cli_change_status(status)
{
  // Do not send useless presence
  if(xows_cli_own.stat === status) return;
  // Change the status and send to server
  xows_cli_own.stat = status;
  
  // Save current status to local storage
  xows_cli_cache_peer_add(xows_cli_own.bare, null, status, null);
  
  // Send presence only if there will be no wakeup
  if(xows_cli_own.show === xows_cli_chosen_show) {
    // Send presence with updated values
    xows_cli_presence_update();
  }
  // Forward user status upate
  xows_cli_fw_onownchange(xows_cli_own);
}

/**
 * Current presence level for Auto Away
 */
let xows_cli_activity_timeout = null;

/**
 * Decrease the client presence level to away or xa.
 */
function xows_cli_activity_sleep()
{
  if(xows_cli_activity_timeout) 
    clearTimeout(xows_cli_activity_timeout);
    
  if(xows_cli_own.show > 1) {
    xows_cli_activity_timeout = setTimeout(xows_cli_activity_sleep, 600000); //< 10 min
    // Decrease the show level
    xows_cli_own.show--;
    // Send presence with updated values
    xows_cli_presence_update();
    // Forward user status upate
    xows_cli_fw_onownchange(xows_cli_own);
  }
}

/**
 * Set presence back to the user chosen one if it is greater than
 * the current "away" value and reset the timer for auto-away.
 */
function xows_cli_activity_wakeup()
{
  if(xows_cli_activity_timeout) 
    clearTimeout(xows_cli_activity_timeout);
    
  xows_cli_activity_timeout = setTimeout(xows_cli_activity_sleep, 600000); //< 10 min
    
  if(xows_cli_own.show < xows_cli_chosen_show) {
    // Reset all to last chosen level
    xows_cli_own.show = xows_cli_chosen_show;
    // Send presence with updated values
    xows_cli_presence_update();
    // Forward user status upate
    xows_cli_fw_onownchange(xows_cli_own);
  }
}

/**
 *  Reference to composing chatsate timeout thread.
 */
let xows_cli_chatstate_timeout = null;

/**
 * Set chat state to and send the proper notification to peer.
 * 
 * @param   {object}  peer  Peer object to send notification.
 * @param   {object}  chat  New chat state to set.
 */
function xows_cli_chatstate_set(peer, chat)
{
  if(chat > XOWS_CHAT_PAUS) { //< composing
    if(xows_cli_chatstate_timeout) {
      clearTimeout(xows_cli_chatstate_timeout);
    } else {
      xows_cli_send_chatstate(peer, chat);
    }
    // Create/reset a timeout to end typing state after delay
    xows_cli_chatstate_timeout = setTimeout(xows_cli_chatstate_set,4000,peer,XOWS_CHAT_PAUS);
  } else {
    clearTimeout(xows_cli_chatstate_timeout);
    xows_cli_send_chatstate(peer, chat);
    xows_cli_chatstate_timeout = null;
  }
}

/**
 * Close the XMPP session and disconnect from server.
 */
function xows_cli_disconnect()
{
  xows_log(2,"cli_disconnect","Cleaning Client session");

  // Client is now Offline
  xows_cli_own.show = XOWS_SHOW_OFF;
  // Send presence with updated values
  xows_cli_presence_update();
  
  // Close the connection
  xows_xmp_send_close(3); //< Close without error
}

/***********************************************************************
 *                        Templates API Module
 **********************************************************************/

/**
 * List of CSS classes for common template instances
 */ 
const XOWS_CLS_FLATTEN        = "flatten";      //< Flattened element (height forced to 0)
const XOWS_CLS_HIDDEN         = "hidden";       //< Hidden element (display forced to none)

const XOWS_CLS_ROST_CONT      = "rost-cont";    //< Roster Contact Instance <li>
const XOWS_CLS_ROST_SUBS      = "rost-subs";    //< Roster Subscribe Request Instance <li>
const XOWS_CLS_ROST_ROOM      = "rost-room";    //< Roster Chatroom Instance <li>
const XOWS_CLS_ROST_LOAD      = "rost-load";    //< Roster Loading animation <li>
const XOWS_CLS_CONT_NAME      = "cont-name";    //< Contact Name <div>
const XOWS_CLS_CONT_STAT      = "cont-stat";    //< Contact Status <div>
const XOWS_CLS_CONT_SHOW      = "cont-show";    //< Contact Show dot <div>
const XOWS_CLS_CONT_UNRD      = "cont-unrd";    //< Contact Unread Notification <div>
const XOWS_CLS_CONT_DENY      = "cont-deny";    //< Contact Unsuscribed/Subscribe Denied <div>
const XOWS_CLS_CONT_SUBS      = "cont-subs";    //< Resend subscribe request <button>
const XOWS_CLS_SUBS_BARE      = "subs-bare";    //< Subscribe Request JID Bare <div>
const XOWS_CLS_SUBS_ALLO      = "subs-allo";    //< Subscribe Request Allow <button>
const XOWS_CLS_SUBS_DENY      = "subs-deny";    //< Subscribe Request Deny <button>
const XOWS_CLS_ROOM_NAME      = "room-name";    //< Chatroom Name <div>
const XOWS_CLS_ROOM_DESC      = "room-desc";    //< Chatroom Description <div>
const XOWS_CLS_ROOM_AVAT      = "room-avat";    //< Chatroom Avatar <div>
const XOWS_CLS_ROOM_LOCK      = "room-lock";    //< Chatroom Locked <div>
const XOWS_CLS_ROOM_UNRD      = "room-unrd";    //< Chatroom Unread Notification <div>
const XOWS_CLS_ROOM_OCCU      = "room-occu";    //< Chatroom Contact Instance <li>
const XOWS_CLS_OCCU_SUBS      = "occu-subs";    //< Chatroom Contact Add Button <button>
const XOWS_CLS_MESG_FULL      = "mesg-full";    //< Chat History Message Instance (Full) <li>
const XOWS_CLS_MESG_AGGR      = "mesg-aggr";    //< Chat History Message Instance (Aggregated)  <li>
const XOWS_CLS_MESG_FROM      = "mesg-from";    //< Chat History Message From <div>
const XOWS_CLS_MESG_DATE      = "mesg-date";    //< Chat History Message Date <div>
const XOWS_CLS_MESG_HOUR      = "mesg-hour";    //< Chat History Message Hour <div>
const XOWS_CLS_MESG_SENT      = "mesg-sent";    //< Chat History Message Style: Outgoing 
const XOWS_CLS_MESG_RECV      = "mesg-recv";    //< Chat History Message Style: Incoming 
const XOWS_CLS_MESG_RECP      = "mesg-recp";    //< Chat History Message Style: Receipt Received

const XOWS_CLS_EMBD_LOAD      = "embd-load";    //< Embeded element loading (loading spinner)

/**
 * Custom attributes constants
 */ 
const XOWS_ATTR_NOLOAD        = "noload";      //< Embeded media NoLoading attribute

/**
 * Lazy-Loader constants
 */ 
const XOWS_LAZY_SRC_ATTR      = "data_src";         //< Lazy-Loader source attribute to track

/**
 * Private parser for HTML parsing from string.
 */
const xows_tpl_template_parser = new DOMParser();

/**
 * Callback function called once templates successfully loaded.
 */
let xows_tpl_fw_onready = function() {};

/**
 * Stored remaining template loading.
 */
let xows_tpl_template_parse_remain = 0;

/**
 * Stored instantiable templates list.
 */
let xows_tpl_model = [];

/**
 * Temporary variable used to store template document root during
 * loading and parsing job
 */
let xows_tpl_fragment = null;

/**
 * Template URL theme folder to get template files. Finale path is 
 * built as follow: <root>/themes/<theme>/<template_name>.html
 */
let xows_tpl_theme = "dark";

/**
 * Emojis short code to unicode map.
 */
const xows_tpl_emoj_map = {
  "100":"1F4AF","1234":"1F522","grinning":"1F600","smiley":"1F603","smile":"1F604","grin":"1F601","laughing":"1F606","sweat_smile":"1F605","rolling_on_the_floor_laughing":"1F923","joy":"1F602","slightly_smiling_face":"1F642","upside_down_face":"1F643","wink":"1F609","blush":"1F60A","innocent":"1F607","smiling_face_with_3_hearts":"1F970",
  "heart_eyes":"1F60D","star-struck":"1F929","kissing_heart":"1F618","kissing":"1F617","kissing_closed_eyes":"1F61A","kissing_smiling_eyes":"1F619","yum":"1F60B","stuck_out_tongue":"1F61B","stuck_out_tongue_winking_eye":"1F61C","zany_face":"1F92A","stuck_out_tongue_closed_eyes":"1F61D","money_mouth_face":"1F911","hugging_face":"1F917",
  "face_with_hand_over_mouth":"1F92D","shushing_face":"1F92B","thinking_face":"1F914","zipper_mouth_face":"1F910","face_with_raised_eyebrow":"1F928","neutral_face":"1F610","expressionless":"1F611","no_mouth":"1F636","smirk":"1F60F","unamused":"1F612","face_with_rolling_eyes":"1F644","grimacing":"1F62C","lying_face":"1F925","relieved":"1F60C",
  "pensive":"1F614","sleepy":"1F62A","drooling_face":"1F924","sleeping":"1F634","mask":"1F637","face_with_thermometer":"1F912","face_with_head_bandage":"1F915","nauseated_face":"1F922","face_vomiting":"1F92E","sneezing_face":"1F927","hot_face":"1F975","cold_face":"1F976","woozy_face":"1F974","dizzy_face":"1F635","exploding_head":"1F92F",
  "face_with_cowboy_hat":"1F920","partying_face":"1F973","sunglasses":"1F60E","nerd_face":"1F913","face_with_monocle":"1F9D0","confused":"1F615","worried":"1F61F","slightly_frowning_face":"1F641","open_mouth":"1F62E","hushed":"1F62F","astonished":"1F632","flushed":"1F633","pleading_face":"1F97A","frowning":"1F626","anguished":"1F627",
  "fearful":"1F628","cold_sweat":"1F630","disappointed_relieved":"1F625","cry":"1F622","sob":"1F62D","scream":"1F631","confounded":"1F616","persevere":"1F623","disappointed":"1F61E","sweat":"1F613","weary":"1F629","tired_face":"1F62B","yawning_face":"1F971","triumph":"1F624","rage":"1F621","angry":"1F620","face_with_symbols_on_mouth":"1F92C",
  "smiling_imp":"1F608","imp":"1F47F","skull":"1F480","hankey":"1F4A9","clown_face":"1F921","japanese_ogre":"1F479","japanese_goblin":"1F47A","ghost":"1F47B","alien":"1F47D","space_invader":"1F47E","robot_face":"1F916","smiley_cat":"1F63A","smile_cat":"1F638","joy_cat":"1F639","heart_eyes_cat":"1F63B","smirk_cat":"1F63C","kissing_cat":"1F63D",
  "scream_cat":"1F640","crying_cat_face":"1F63F","pouting_cat":"1F63E","see_no_evil":"1F648","hear_no_evil":"1F649","speak_no_evil":"1F64A","kiss":"1F48B","love_letter":"1F48C","cupid":"1F498","gift_heart":"1F49D","sparkling_heart":"1F496","heartpulse":"1F497","heartbeat":"1F493","revolving_hearts":"1F49E","two_hearts":"1F495","heart_decoration":"1F49F",
  "broken_heart":"1F494","orange_heart":"1F9E1","yellow_heart":"1F49B","green_heart":"1F49A","blue_heart":"1F499","purple_heart":"1F49C","brown_heart":"1F90E","black_heart":"1F5A4","white_heart":"1F90D","anger":"1F4A2","boom":"1F4A5","dizzy":"1F4AB","sweat_drops":"1F4A6","dash":"1F4A8","bomb":"1F4A3","speech_balloon":"1F4AC","thought_balloon":"1F4AD",
  "zzz":"1F4A4","wave":"1F44B","raised_back_of_hand":"1F91A","hand":"270B","spock-hand":"1F596","ok_hand":"1F44C","pinching_hand":"1F90F","crossed_fingers":"1F91E","i_love_you_hand_sign":"1F91F","the_horns":"1F918","call_me_hand":"1F919","point_left":"1F448","point_right":"1F449","point_up_2":"1F446","middle_finger":"1F595","point_down":"1F447",
  "+1":"1F44D","-1":"1F44E","fist":"270A","facepunch":"1F44A","left-facing_fist":"1F91B","right-facing_fist":"1F91C","clap":"1F44F","raised_hands":"1F64C","open_hands":"1F450","palms_up_together":"1F932","handshake":"1F91D","pray":"1F64F","nail_care":"1F485","selfie":"1F933","muscle":"1F4AA","mechanical_arm":"1F9BE","mechanical_leg":"1F9BF","leg":"1F9B5",
  "foot":"1F9B6","ear":"1F442","ear_with_hearing_aid":"1F9BB","nose":"1F443","brain":"1F9E0","tooth":"1F9B7","bone":"1F9B4","eyes":"1F440","tongue":"1F445","lips":"1F444","baby":"1F476","child":"1F9D2","boy":"1F466","girl":"1F467","adult":"1F9D1","person_with_blond_hair":"1F471","man":"1F468","bearded_person":"1F9D4","woman":"1F469","older_adult":"1F9D3",
  "older_man":"1F474","older_woman":"1F475","person_frowning":"1F64D","person_with_pouting_face":"1F64E","no_good":"1F645","ok_woman":"1F646","information_desk_person":"1F481","raising_hand":"1F64B","deaf_person":"1F9CF","bow":"1F647","face_palm":"1F926","shrug":"1F937","cop":"1F46E","guardsman":"1F482","construction_worker":"1F477","prince":"1F934",
  "princess":"1F478","man_with_turban":"1F473","man_with_gua_pi_mao":"1F472","person_with_headscarf":"1F9D5","man_in_tuxedo":"1F935","bride_with_veil":"1F470","pregnant_woman":"1F930","breast-feeding":"1F931","angel":"1F47C","santa":"1F385","mrs_claus":"1F936","superhero":"1F9B8","supervillain":"1F9B9","mage":"1F9D9","fairy":"1F9DA","vampire":"1F9DB",
  "merperson":"1F9DC","elf":"1F9DD","genie":"1F9DE","zombie":"1F9DF","massage":"1F486","haircut":"1F487","walking":"1F6B6","standing_person":"1F9CD","kneeling_person":"1F9CE","runner":"1F3C3","dancer":"1F483","man_dancing":"1F57A","dancers":"1F46F","person_in_steamy_room":"1F9D6","person_climbing":"1F9D7","fencer":"1F93A","horse_racing":"1F3C7",
  "snowboarder":"1F3C2","surfer":"1F3C4","rowboat":"1F6A3","swimmer":"1F3CA","bicyclist":"1F6B4","mountain_bicyclist":"1F6B5","person_doing_cartwheel":"1F938","wrestlers":"1F93C","water_polo":"1F93D","handball":"1F93E","juggling":"1F939","person_in_lotus_position":"1F9D8","bath":"1F6C0","sleeping_accommodation":"1F6CC","two_women_holding_hands":"1F46D",
  "couple":"1F46B","two_men_holding_hands":"1F46C","couplekiss":"1F48F","couple_with_heart":"1F491","family":"1F46A","bust_in_silhouette":"1F464","busts_in_silhouette":"1F465","footprints":"1F463","monkey_face":"1F435","monkey":"1F412","gorilla":"1F98D","orangutan":"1F9A7","dog":"1F436","dog2":"1F415","guide_dog":"1F9AE","poodle":"1F429","wolf":"1F43A",
  "fox_face":"1F98A","raccoon":"1F99D","cat":"1F431","cat2":"1F408","lion_face":"1F981","tiger":"1F42F","tiger2":"1F405","leopard":"1F406","horse":"1F434","racehorse":"1F40E","unicorn_face":"1F984","zebra_face":"1F993","deer":"1F98C","cow":"1F42E","ox":"1F402","water_buffalo":"1F403","cow2":"1F404","pig":"1F437","pig2":"1F416","boar":"1F417",
  "pig_nose":"1F43D","ram":"1F40F","sheep":"1F411","goat":"1F410","dromedary_camel":"1F42A","camel":"1F42B","llama":"1F999","giraffe_face":"1F992","elephant":"1F418","rhinoceros":"1F98F","hippopotamus":"1F99B","mouse":"1F42D","mouse2":"1F401","rat":"1F400","hamster":"1F439","rabbit":"1F430","rabbit2":"1F407","hedgehog":"1F994","bat":"1F987","bear":"1F43B",
  "koala":"1F428","panda_face":"1F43C","sloth":"1F9A5","otter":"1F9A6","skunk":"1F9A8","kangaroo":"1F998","badger":"1F9A1","feet":"1F43E","turkey":"1F983","chicken":"1F414","rooster":"1F413","hatching_chick":"1F423","baby_chick":"1F424","hatched_chick":"1F425","bird":"1F426","penguin":"1F427","eagle":"1F985","duck":"1F986","swan":"1F9A2","owl":"1F989",
  "flamingo":"1F9A9","peacock":"1F99A","parrot":"1F99C","frog":"1F438","crocodile":"1F40A","turtle":"1F422","lizard":"1F98E","snake":"1F40D","dragon_face":"1F432","dragon":"1F409","sauropod":"1F995","t-rex":"1F996","whale":"1F433","whale2":"1F40B","dolphin":"1F42C","fish":"1F41F","tropical_fish":"1F420","blowfish":"1F421","shark":"1F988","octopus":"1F419",
  "shell":"1F41A","snail":"1F40C","butterfly":"1F98B","bug":"1F41B","ant":"1F41C","bee":"1F41D","beetle":"1F41E","cricket":"1F997","scorpion":"1F982","mosquito":"1F99F","microbe":"1F9A0","bouquet":"1F490","cherry_blossom":"1F338","white_flower":"1F4AE","rose":"1F339","wilted_flower":"1F940","hibiscus":"1F33A","sunflower":"1F33B","blossom":"1F33C",
  "tulip":"1F337","seedling":"1F331","evergreen_tree":"1F332","deciduous_tree":"1F333","palm_tree":"1F334","cactus":"1F335","ear_of_rice":"1F33E","herb":"1F33F","four_leaf_clover":"1F340","maple_leaf":"1F341","fallen_leaf":"1F342","leaves":"1F343","grapes":"1F347","melon":"1F348","watermelon":"1F349","tangerine":"1F34A","lemon":"1F34B","banana":"1F34C",
  "pineapple":"1F34D","mango":"1F96D","apple":"1F34E","green_apple":"1F34F","pear":"1F350","peach":"1F351","cherries":"1F352","strawberry":"1F353","kiwifruit":"1F95D","tomato":"1F345","coconut":"1F965","avocado":"1F951","eggplant":"1F346","potato":"1F954","carrot":"1F955","corn":"1F33D","cucumber":"1F952","leafy_green":"1F96C","broccoli":"1F966",
  "garlic":"1F9C4","onion":"1F9C5","mushroom":"1F344","peanuts":"1F95C","chestnut":"1F330","bread":"1F35E","croissant":"1F950","baguette_bread":"1F956","pretzel":"1F968","bagel":"1F96F","pancakes":"1F95E","waffle":"1F9C7","cheese_wedge":"1F9C0","meat_on_bone":"1F356","poultry_leg":"1F357","cut_of_meat":"1F969","bacon":"1F953","hamburger":"1F354",
  "fries":"1F35F","pizza":"1F355","hotdog":"1F32D","sandwich":"1F96A","taco":"1F32E","burrito":"1F32F","stuffed_flatbread":"1F959","falafel":"1F9C6","egg":"1F95A","fried_egg":"1F373","shallow_pan_of_food":"1F958","stew":"1F372","bowl_with_spoon":"1F963","green_salad":"1F957","popcorn":"1F37F","butter":"1F9C8","salt":"1F9C2","canned_food":"1F96B",
  "bento":"1F371","rice_cracker":"1F358","rice_ball":"1F359","rice":"1F35A","curry":"1F35B","ramen":"1F35C","spaghetti":"1F35D","sweet_potato":"1F360","oden":"1F362","sushi":"1F363","fried_shrimp":"1F364","fish_cake":"1F365","moon_cake":"1F96E","dango":"1F361","dumpling":"1F95F","fortune_cookie":"1F960","takeout_box":"1F961","crab":"1F980","lobster":"1F99E",
  "shrimp":"1F990","squid":"1F991","oyster":"1F9AA","icecream":"1F366","shaved_ice":"1F367","ice_cream":"1F368","doughnut":"1F369","cookie":"1F36A","birthday":"1F382","cake":"1F370","cupcake":"1F9C1","pie":"1F967","chocolate_bar":"1F36B","candy":"1F36C","lollipop":"1F36D","custard":"1F36E","honey_pot":"1F36F","baby_bottle":"1F37C","glass_of_milk":"1F95B",
  "coffee":"2615","tea":"1F375","sake":"1F376","champagne":"1F37E","wine_glass":"1F377","cocktail":"1F378","tropical_drink":"1F379","beer":"1F37A","beers":"1F37B","clinking_glasses":"1F942","tumbler_glass":"1F943","cup_with_straw":"1F964","beverage_box":"1F9C3","mate_drink":"1F9C9","ice_cube":"1F9CA","chopsticks":"1F962","fork_and_knife":"1F374",
  "spoon":"1F944","hocho":"1F52A","amphora":"1F3FA","eyeglasses":"1F453","goggles":"1F97D","lab_coat":"1F97C","safety_vest":"1F9BA","necktie":"1F454","shirt":"1F455","jeans":"1F456","scarf":"1F9E3","gloves":"1F9E4","coat":"1F9E5","socks":"1F9E6","dress":"1F457","kimono":"1F458","sari":"1F97B","one-piece_swimsuit":"1FA71","briefs":"1FA72",
  "shorts":"1FA73","bikini":"1F459","womans_clothes":"1F45A","purse":"1F45B","handbag":"1F45C","pouch":"1F45D","school_satchel":"1F392","mans_shoe":"1F45E","athletic_shoe":"1F45F","hiking_boot":"1F97E","womans_flat_shoe":"1F97F","high_heel":"1F460","sandal":"1F461","ballet_shoes":"1FA70","boot":"1F462","crown":"1F451","womans_hat":"1F452",
  "tophat":"1F3A9","mortar_board":"1F393","billed_cap":"1F9E2","prayer_beads":"1F4FF","lipstick":"1F484","ring":"1F48D","gem":"1F48E","mute":"1F507","speaker":"1F508","sound":"1F509","loud_sound":"1F50A","loudspeaker":"1F4E2","mega":"1F4E3","postal_horn":"1F4EF","bell":"1F514","no_bell":"1F515","musical_score":"1F3BC","musical_note":"1F3B5",
  "notes":"1F3B6","microphone":"1F3A4","headphones":"1F3A7","radio":"1F4FB","saxophone":"1F3B7","guitar":"1F3B8","musical_keyboard":"1F3B9","trumpet":"1F3BA","violin":"1F3BB","banjo":"1FA95","drum_with_drumsticks":"1F941","iphone":"1F4F1","calling":"1F4F2","telephone_receiver":"1F4DE","pager":"1F4DF","fax":"1F4E0","battery":"1F50B","electric_plug":"1F50C",
  "computer":"1F4BB","minidisc":"1F4BD","floppy_disk":"1F4BE","cd":"1F4BF","dvd":"1F4C0","abacus":"1F9EE","movie_camera":"1F3A5","clapper":"1F3AC","tv":"1F4FA","camera":"1F4F7","camera_with_flash":"1F4F8","video_camera":"1F4F9","vhs":"1F4FC","mag":"1F50D","mag_right":"1F50E","bulb":"1F4A1","flashlight":"1F526","izakaya_lantern":"1F3EE","diya_lamp":"1FA94",
  "notebook_with_decorative_cover":"1F4D4","closed_book":"1F4D5","book":"1F4D6","green_book":"1F4D7","blue_book":"1F4D8","orange_book":"1F4D9","books":"1F4DA","notebook":"1F4D3","ledger":"1F4D2","page_with_curl":"1F4C3","scroll":"1F4DC","page_facing_up":"1F4C4","newspaper":"1F4F0","bookmark_tabs":"1F4D1","bookmark":"1F516","moneybag":"1F4B0","yen":"1F4B4",
  "dollar":"1F4B5","euro":"1F4B6","pound":"1F4B7","money_with_wings":"1F4B8","credit_card":"1F4B3","receipt":"1F9FE","chart":"1F4B9","currency_exchange":"1F4B1","heavy_dollar_sign":"1F4B2","e-mail":"1F4E7","incoming_envelope":"1F4E8","envelope_with_arrow":"1F4E9","outbox_tray":"1F4E4","inbox_tray":"1F4E5","package":"1F4E6","mailbox":"1F4EB",
  "mailbox_closed":"1F4EA","mailbox_with_mail":"1F4EC","mailbox_with_no_mail":"1F4ED","postbox":"1F4EE","memo":"1F4DD","briefcase":"1F4BC","file_folder":"1F4C1","open_file_folder":"1F4C2","date":"1F4C5","calendar":"1F4C6","card_index":"1F4C7","chart_with_upwards_trend":"1F4C8","chart_with_downwards_trend":"1F4C9","bar_chart":"1F4CA","clipboard":"1F4CB",
  "pushpin":"1F4CC","round_pushpin":"1F4CD","paperclip":"1F4CE","straight_ruler":"1F4CF","triangular_ruler":"1F4D0","lock":"1F512","unlock":"1F513","lock_with_ink_pen":"1F50F","closed_lock_with_key":"1F510","key":"1F511","hammer":"1F528","axe":"1FA93","gun":"1F52B","bow_and_arrow":"1F3F9","wrench":"1F527","nut_and_bolt":"1F529","probing_cane":"1F9AF",
  "link":"1F517","toolbox":"1F9F0","magnet":"1F9F2","test_tube":"1F9EA","petri_dish":"1F9EB","dna":"1F9EC","microscope":"1F52C","telescope":"1F52D","satellite_antenna":"1F4E1","syringe":"1F489","drop_of_blood":"1FA78","pill":"1F48A","adhesive_bandage":"1FA79","stethoscope":"1FA7A","door":"1F6AA","chair":"1FA91","toilet":"1F6BD","shower":"1F6BF",
  "bathtub":"1F6C1","razor":"1FA92","lotion_bottle":"1F9F4","safety_pin":"1F9F7","broom":"1F9F9","basket":"1F9FA","roll_of_paper":"1F9FB","soap":"1F9FC","sponge":"1F9FD","fire_extinguisher":"1F9EF","shopping_trolley":"1F6D2","smoking":"1F6AC","moyai":"1F5FF","earth_africa":"1F30D","earth_americas":"1F30E","earth_asia":"1F30F","globe_with_meridians":"1F310",
  "japan":"1F5FE","compass":"1F9ED","volcano":"1F30B","mount_fuji":"1F5FB","bricks":"1F9F1","house":"1F3E0","house_with_garden":"1F3E1","office":"1F3E2","post_office":"1F3E3","european_post_office":"1F3E4","hospital":"1F3E5","bank":"1F3E6","hotel":"1F3E8","love_hotel":"1F3E9","convenience_store":"1F3EA","school":"1F3EB","department_store":"1F3EC",
  "factory":"1F3ED","japanese_castle":"1F3EF","european_castle":"1F3F0","wedding":"1F492","tokyo_tower":"1F5FC","statue_of_liberty":"1F5FD","church":"26EA","mosque":"1F54C","hindu_temple":"1F6D5","synagogue":"1F54D","kaaba":"1F54B","fountain":"26F2","tent":"26FA","foggy":"1F301","night_with_stars":"1F303","sunrise_over_mountains":"1F304","sunrise":"1F305",
  "city_sunset":"1F306","city_sunrise":"1F307","bridge_at_night":"1F309","carousel_horse":"1F3A0","ferris_wheel":"1F3A1","roller_coaster":"1F3A2","barber":"1F488","circus_tent":"1F3AA","steam_locomotive":"1F682","railway_car":"1F683","bullettrain_side":"1F684","bullettrain_front":"1F685","train2":"1F686","metro":"1F687","light_rail":"1F688",
  "station":"1F689","tram":"1F68A","monorail":"1F69D","mountain_railway":"1F69E","train":"1F68B","bus":"1F68C","oncoming_bus":"1F68D","trolleybus":"1F68E","minibus":"1F690","ambulance":"1F691","fire_engine":"1F692","police_car":"1F693","oncoming_police_car":"1F694","taxi":"1F695","oncoming_taxi":"1F696","car":"1F697","oncoming_automobile":"1F698",
  "blue_car":"1F699","truck":"1F69A","articulated_lorry":"1F69B","tractor":"1F69C","motor_scooter":"1F6F5","manual_wheelchair":"1F9BD","motorized_wheelchair":"1F9BC","auto_rickshaw":"1F6FA","bike":"1F6B2","scooter":"1F6F4","skateboard":"1F6F9","busstop":"1F68F","fuelpump":"26FD","rotating_light":"1F6A8","traffic_light":"1F6A5",
  "vertical_traffic_light":"1F6A6","octagonal_sign":"1F6D1","construction":"1F6A7","anchor":"2693","boat":"26F5","canoe":"1F6F6","speedboat":"1F6A4","ship":"1F6A2","airplane_departure":"1F6EB","airplane_arriving":"1F6EC","parachute":"1FA82","seat":"1F4BA","helicopter":"1F681","suspension_railway":"1F69F","mountain_cableway":"1F6A0","aerial_tramway":"1F6A1",
  "rocket":"1F680","flying_saucer":"1F6F8","luggage":"1F9F3","hourglass":"231B","hourglass_flowing_sand":"23F3","watch":"231A","alarm_clock":"23F0","clock12":"1F55B","clock1230":"1F567","clock1":"1F550","clock130":"1F55C","clock2":"1F551","clock230":"1F55D","clock3":"1F552","clock330":"1F55E","clock4":"1F553","clock430":"1F55F","clock5":"1F554",
  "clock530":"1F560","clock6":"1F555","clock630":"1F561","clock7":"1F556","clock730":"1F562","clock8":"1F557","clock830":"1F563","clock9":"1F558","clock930":"1F564","clock10":"1F559","clock1030":"1F565","clock11":"1F55A","clock1130":"1F566","new_moon":"1F311","waxing_crescent_moon":"1F312","first_quarter_moon":"1F313","moon":"1F314","full_moon":"1F315",
  "waning_gibbous_moon":"1F316","last_quarter_moon":"1F317","waning_crescent_moon":"1F318","crescent_moon":"1F319","new_moon_with_face":"1F31A","first_quarter_moon_with_face":"1F31B","last_quarter_moon_with_face":"1F31C","full_moon_with_face":"1F31D","sun_with_face":"1F31E","ringed_planet":"1FA90","star":"2B50","star2":"1F31F","stars":"1F320",
  "milky_way":"1F30C","partly_sunny":"26C5","cyclone":"1F300","rainbow":"1F308","closed_umbrella":"1F302","umbrella_with_rain_drops":"2614","zap":"26A1","snowman_without_snow":"26C4","fire":"1F525","droplet":"1F4A7","ocean":"1F30A","jack_o_lantern":"1F383","christmas_tree":"1F384","fireworks":"1F386","sparkler":"1F387","firecracker":"1F9E8",
  "sparkles":"2728","balloon":"1F388","tada":"1F389","confetti_ball":"1F38A","tanabata_tree":"1F38B","bamboo":"1F38D","dolls":"1F38E","flags":"1F38F","wind_chime":"1F390","rice_scene":"1F391","red_envelope":"1F9E7","ribbon":"1F380","gift":"1F381","ticket":"1F3AB","trophy":"1F3C6","sports_medal":"1F3C5","first_place_medal":"1F947",
  "second_place_medal":"1F948","third_place_medal":"1F949","soccer":"26BD","baseball":"26BE","softball":"1F94E","basketball":"1F3C0","volleyball":"1F3D0","football":"1F3C8","rugby_football":"1F3C9","tennis":"1F3BE","flying_disc":"1F94F","bowling":"1F3B3","cricket_bat_and_ball":"1F3CF","field_hockey_stick_and_ball":"1F3D1","ice_hockey_stick_and_puck":"1F3D2",
  "lacrosse":"1F94D","table_tennis_paddle_and_ball":"1F3D3","badminton_racquet_and_shuttlecock":"1F3F8","boxing_glove":"1F94A","martial_arts_uniform":"1F94B","goal_net":"1F945","golf":"26F3","fishing_pole_and_fish":"1F3A3","diving_mask":"1F93F","running_shirt_with_sash":"1F3BD","ski":"1F3BF","sled":"1F6F7","curling_stone":"1F94C","dart":"1F3AF",
  "yo-yo":"1FA80","kite":"1FA81","8ball":"1F3B1","crystal_ball":"1F52E","nazar_amulet":"1F9FF","video_game":"1F3AE","slot_machine":"1F3B0","game_die":"1F3B2","jigsaw":"1F9E9","teddy_bear":"1F9F8","black_joker":"1F0CF","mahjong":"1F004","flower_playing_cards":"1F3B4","performing_arts":"1F3AD","art":"1F3A8","thread":"1F9F5","yarn":"1F9F6","atm":"1F3E7",
  "put_litter_in_its_place":"1F6AE","potable_water":"1F6B0","wheelchair":"267F","mens":"1F6B9","womens":"1F6BA","restroom":"1F6BB","baby_symbol":"1F6BC","wc":"1F6BE","passport_control":"1F6C2","customs":"1F6C3","baggage_claim":"1F6C4","left_luggage":"1F6C5","children_crossing":"1F6B8","no_entry":"26D4","no_entry_sign":"1F6AB","no_bicycles":"1F6B3",
  "no_smoking":"1F6AD","do_not_litter":"1F6AF","non-potable_water":"1F6B1","no_pedestrians":"1F6B7","no_mobile_phones":"1F4F5","underage":"1F51E","arrows_clockwise":"1F503","arrows_counterclockwise":"1F504","back":"1F519","end":"1F51A","on":"1F51B","soon":"1F51C","top":"1F51D","place_of_worship":"1F6D0","menorah_with_nine_branches":"1F54E",
  "six_pointed_star":"1F52F","aries":"2648","taurus":"2649","gemini":"264A","cancer":"264B","leo":"264C","virgo":"264D","libra":"264E","scorpius":"264F","sagittarius":"2650","capricorn":"2651","aquarius":"2652","pisces":"2653","ophiuchus":"26CE","twisted_rightwards_arrows":"1F500","repeat":"1F501","repeat_one":"1F502","fast_forward":"23E9","rewind":"23EA",
  "arrow_up_small":"1F53C","arrow_double_up":"23EB","arrow_down_small":"1F53D","arrow_double_down":"23EC","cinema":"1F3A6","low_brightness":"1F505","high_brightness":"1F506","signal_strength":"1F4F6","vibration_mode":"1F4F3","mobile_phone_off":"1F4F4","trident":"1F531","name_badge":"1F4DB","beginner":"1F530","o":"2B55","white_check_mark":"2705","x":"274C",
  "negative_squared_cross_mark":"274E","heavy_plus_sign":"2795","heavy_minus_sign":"2796","heavy_division_sign":"2797","curly_loop":"27B0","loop":"27BF","question":"2753","grey_question":"2754","grey_exclamation":"2755","exclamation":"2757","keycap_ten":"1F51F","capital_abcd":"1F520","abcd":"1F521","symbols":"1F523","abc":"1F524","ab":"1F18E","cl":"1F191",
  "cool":"1F192","free":"1F193","id":"1F194","new":"1F195","ng":"1F196","ok":"1F197","sos":"1F198","up":"1F199","vs":"1F19A","koko":"1F201","u6709":"1F236","u6307":"1F22F","ideograph_advantage":"1F250","u5272":"1F239","u7121":"1F21A","u7981":"1F232","accept":"1F251","u7533":"1F238","u5408":"1F234","u7a7a":"1F233","u55b6":"1F23A","u6e80":"1F235",
  "red_circle":"1F534","large_orange_circle":"1F7E0","large_yellow_circle":"1F7E1","large_green_circle":"1F7E2","large_blue_circle":"1F535","large_purple_circle":"1F7E3","large_brown_circle":"1F7E4","black_circle":"26AB","white_circle":"26AA","large_red_square":"1F7E5","large_orange_square":"1F7E7","large_yellow_square":"1F7E8","large_green_square":"1F7E9",
  "large_blue_square":"1F7E6","large_purple_square":"1F7EA","large_brown_square":"1F7EB","black_large_square":"2B1B","white_large_square":"2B1C","black_medium_small_square":"25FE","white_medium_small_square":"25FD","large_orange_diamond":"1F536","large_blue_diamond":"1F537","small_orange_diamond":"1F538","small_blue_diamond":"1F539",
  "small_red_triangle":"1F53A","small_red_triangle_down":"1F53B","diamond_shape_with_a_dot_inside":"1F4A0","radio_button":"1F518","white_square_button":"1F533","black_square_button":"1F532"
  };

/**
 * ASCII emoticons to unicode map, this member is filled with
 * JSON data dynamically loaded at startup. 
 * 
 *  See: xows_tpl_init, xows_tpl_init_json, xows_tpl_template_parse_json
 */
const xows_tpl_emot_map = { 
 ":": {
    ")":"1F642","(":"1F641","O":"1F62E",
    "P":"1F61B","D":"1F604","*":"1F617",
    "|":"1F610","#":"1F910","S":"1F616",
    "$":"1F633","/":"1F615",".":"1F636",
    "X":"1F922"},
  "8": {
    ")":"1F60E"},
  ":&APOS;": {
    ")":"1F602","(":"1F622","D":"1F923"},
  ";": {
    ")":"1F609","P":"1F61C"},
  "X": {
    ")":"1F606","D":"1F606","P":"1F61D"}
};

/**
 * Launch the download of the specified template file.
 * 
 * @param   {string}  name    Template name to retreive file path.
 * @param   {boolean} isinst  Indicate whether is instantiable, 
 *                            otherwise parse as static.
 */
function xows_tpl_template_load(name, isinst)
{
  // build download path URL
  let path = xows_options.root+"/themes/"+xows_tpl_theme+"/"+name+".html";
  // Forces browser to reload (uncache) templates files by adding a 
  // random string to URL. This option is mainly for dev and debug
  if(xows_options.uncache) {
    path += "?" + xows_gen_nonce_asc(4);
  }
  // Launch request to download template file
  const xhr = new XMLHttpRequest();
  xhr.open("GET", path, true);
  xhr._isinst = isinst; //< set ad hoc member
  xhr.onreadystatechange= function() {
    if(this.readyState === 4) 
      if(this.status === 200) {
        xows_tpl_template_parse(this.responseText, this.responseURL, this._isinst);
      } else {
        xows_log(0,"tpl_template_load","file \""+this.responseURL+"\" loading error","HTTP status:\""+this.status+"\"");
      }
  };
  // Increase count of template remaining to load
  xows_tpl_template_parse_remain++;
  xows_log(2,"tpl_template_load","loading file",path);
  xhr.send();
}

/**
 * Check for completed template loading and parsing. This function is
 * called each time a template is successfully parsed. 
 * 
 * Once all templates are parsed, the function call the DOM 
 * initialization function.
 */
function xows_tpl_template_done()
{
  // Transfert template children
  while(xows_tpl_fragment.childNodes.length > 0) {
    document.body.appendChild(xows_tpl_fragment.firstChild);
  }
  
  xows_log(2,"tpl_template_done","Template parsing completed","Fragment transfered into document");
  
  xows_tpl_fragment = null;
  
  // Call the onready callback
  xows_tpl_fw_onready();
}

/**
 * Parse the given HTML data as static template. 
 * 
 * Static template are intended to be added once in the document, they
 * are typically base GUI/layout templates.
 * 
 * Intanciables templates are intended to be dynamically cloned 
 * (instanced) multiple times, such as history messages or roster 
 * contacts.
 * 
 * Templates are loaded recursively, each template may include 
 * indirections to other child templates. Static templates are 
 * included as child within the static document while the 
 * instanciable templates are stored in a separate pool. However notice 
 * that a static templates cannot be included within instanciables ones
 * and will be ignored in this case.
 * 
 * @param   {string}  html    HTML data to parse.
 * @param   {string}  path    File URL/Path the data come from.
 * @param   {boolean} isinst  Indicate whether is instantiable, 
 *                            otherwise parse as static.
 */
function xows_tpl_template_parse(html, path, isinst)
{
  xows_log(2,"tpl_template_parse","parsing template", path);

  // Translate HTML content to desired locale
  html = xows_l10n_parse(html);

  // Parse the given string as HTML to create the corresponding DOM tree
  // then returns the generated <body>.
  const template = xows_clean_dom(xows_tpl_template_parser.parseFromString(html,"text/html").body);
  
  if(!template) {
    xows_log(0,"tpl_template_parse","template \""+path+"\" parse error");
    return;
  }
  
  let i, nodes;
  const stat_load = [];
  const inst_load = [];
  
  if(!isinst) {
    // Search for element with "has_template" attribute, meaning 
    // its inner content must be loaded from another template file
    nodes = template.querySelectorAll("[has_template]");
    i = nodes.length;
    while(i--) {
      stat_load.push(nodes[i].getAttribute("id")); //< id is template name
      nodes[i].removeAttribute("has_template"); //< Remove the attribute
    }
  }
  
  // Search for element with "is_instance" attribute, meaning 
  // its inner content is made of instantiable (clonable) element 
  // and must be loaded from another template file
  nodes = template.querySelectorAll("[is_instance]");
  i = nodes.length;
  while(i--) {
    inst_load.push(nodes[i].className); //< className si template name
    nodes[i].parentNode.removeChild(nodes[i]); //< Remove the example object
  }

  // Extract file name from path
  let name = path.substring(path.lastIndexOf("/")+1).split(".")[0];

  if(isinst) {
    // Store instantiable data
    xows_tpl_model[name] = document.createDocumentFragment();
    xows_tpl_model[name].appendChild(template.firstChild); 
  } else {
    // Search for an element the id that matches the name to append data
    // if an element is found, we place parsed data within it, otherwise
    // the parsed data is placed at root of document fragment
    let parent = xows_tpl_fragment.querySelector("#"+name);
    if(!parent) parent = xows_tpl_fragment;
    
    while(template.childNodes.length > 0) {
      parent.appendChild(template.firstChild);
    }
    // Start loading the needed static template files
    i = stat_load.length;
    while(i--) xows_tpl_template_load(stat_load[i], false);
  }
  // Start loading the needed instantiable template files
  i = inst_load.length;
  while(i--) xows_tpl_template_load(inst_load[i], true);
  
  // Decrease remain count
  xows_tpl_template_parse_remain--;
  
  // If we no remain, template parsing is finished
  if(xows_tpl_template_parse_remain === 0) {
    xows_tpl_template_done();
  }
}

/**
 * Entry point to start the whole template loading and parsing job.
 * This function must be called once to load the desired set of 
 * template.
 * 
 * @param   {object}    onready   Callback function to be called once 
 *                                templates successfully loaded.
 */
function xows_tpl_init(onready)
{
  // Set the onready callback
  if(onready) xows_tpl_fw_onready = onready;
  // Change default root and theme folder if requested
  if(xows_options.root) 
    xows_options.root = xows_options.root;
    
  if(xows_options.theme)
    xows_tpl_theme = xows_options.theme;
  
  // Load the theme CSS 
  const css = document.createElement('link');
  css.rel = "stylesheet";
  css.type = "text/css";
  // Select normal or minified style file
  const css_file = "/style.css";
  css.href = xows_options.root+"/themes/"+xows_tpl_theme+css_file;

  // Forces browser to reload (uncache) templates files by adding a 
  // random string to URL. This option is mainly for dev and debug
  if(xows_options.uncache) 
    css.href += "?" + xows_gen_nonce_asc(4);

  // Add the CSS <link to head
  document.head.appendChild(css);
  
  // Initialize for loading job
  xows_tpl_template_parse_remain = 0;
  xows_tpl_fragment = document.createDocumentFragment();
  // Start loading the first essential template file
  xows_tpl_template_load("body");
}

/**
 * Correspondence map to escape HTML reserved or special characters.
 */
const XOWS_HTML_ESCAP_MAP = {"&":"&amp;","<":"&lt;",">":"&gt;","'":"&apos;","\"":"&quot;","\n":"<br>"};

/**
 * Remplacement function for HTML string escape.
 */
function xows_html_escap_fnc(m) {return XOWS_HTML_ESCAP_MAP[m];}

/**
 * Rewrites the given string with HTML escapes for reserved or special 
 * characters.
 * 
 * @param   {string}  str   String to be escaped.
 * 
 * @return  {string}  Escaped string.
 */
function xows_html_escape(str) 
{
  return str.replace(/[\&<>'"\n]/g, xows_html_escap_fnc);
}

/**
 * Function to create HTML embeded image from url.
 * 
 * @param   {string}  href  Image URL
 * @param   {string}  ext   Image file extension part.
 * 
 * @return  {string} Replacement HTML sample.
 */
function xows_tpl_embed_image(href, ext)
{
  const noload = (ext === "GIF") ? XOWS_ATTR_NOLOAD : "";
  return "<a href=\""+href+"\" target=\"_blank\"><img src=\""+href+"\" "+noload+"/></a>";
}

/**
 * Function to create HTML embeded movie from url.
 * 
 * @param   {string}  href  Movie URL
 * @param   {string}  ext   Movie file extension part.
 * 
 * @return  {string} Replacement HTML sample.
 */
function xows_tpl_embed_movie(href, ext)
{
  return "<iframe src=\""+href+"\"/>"; 
}

/**
 * Function to create HTML embeded audio from url.
 * 
 * @param   {string}  href  Audio URL
 * @param   {string}  ext   Audio file extension part.
 * 
 * @return  {string} Replacement HTML sample.
 */
function xows_tpl_embed_audio(href, ext)
{
  return "<audio controls src=\""+href+"\" "+XOWS_ATTR_NOLOAD+"/>"; 
}

/**
 * Function to create HTML embeded Youtube movie from url.
 * 
 * @param   {string}  href    Youtube movie URL
 * @param   {string}  match   Matched substring in the source URL
 * 
 * @return  {string} Replacement HTML sample.
 */
function xows_tpl_embed_youtube(href, match)
{
  let ref = href.match(/(v=|embed\/|youtu\.be\/)(.+)/)[2];
  ref = ref.replace(/t=/,"start="); //< replace the potential t= by start=
  return "<iframe src=\"https://www.youtube.com/embed/"+ref+"\"/>";
}

/**
 * Function to create HTML embeded Dailymotion movie from url.
 * 
 * @param   {string}  href    Dailymotion movie URL
 * @param   {string}  match   Matched substring in the source URL
 * 
 * @return  {string} Replacement HTML sample.
 */
function xows_tpl_embed_dailymo(href, match) 
{
  const ref = href.match(/(video|dai\.ly)\/([\w\d]+)/)[2];
  return "<iframe src=\"https://www.dailymotion.com/embed/video/"+ref+"\"/>";
}

/**
 * Function to create HTML embeded Dailymotion movie from url.
 * 
 * @param   {string}  href    Dailymotion movie URL
 * @param   {string}  match   Matched substring in the source URL
 * 
 * @return  {string} Replacement HTML sample.
 */
function xows_tpl_embed_vimeo(href, match) 
{
  const ref = href.match(/\/([\d]+)/)[1];
  return "<iframe src=\"https://player.vimeo.com/video/"+ref+"\"/>";
}

/**
 * Function to create HTML embeded file of unknown type to be
 * downloaded.
 * 
 * @param   {string}  href    Dailymotion movie URL
 * @param   {string}  match   Matched substring in the source URL
 * 
 * @return  {string} Replacement HTML sample.
 */
function xows_tpl_embed_dwnl(href, match) 
{
  const file = decodeURI(href.match(/(.+\/)*(.+\..+)/)[2]);
  console.warn("xows_tpl_embed_dwnl: " + file);
  return "<a class=\"download\" href=\""+href+"\" target=\"_blank\">"+file+"</a>";
}

/**
 * Per file extension embeding function correspondance map.
 */
let xows_tpl_embed_files = { 
  "JPG"             : xows_tpl_embed_image,
  "JPEG"            : xows_tpl_embed_image,
  "GIF"             : xows_tpl_embed_image,
  "PNG"             : xows_tpl_embed_image,
  "WEBP"            : xows_tpl_embed_image,
  "SVG"             : xows_tpl_embed_image,
  "MP4"             : xows_tpl_embed_movie,
  "MPEG"            : xows_tpl_embed_movie,
  "AVI"             : xows_tpl_embed_movie,
  "MP3"             : xows_tpl_embed_audio,
  "OGG"             : xows_tpl_embed_audio
};

/**
 * Per plateform embeding function correspondance map.
 */
let xows_tpl_embed_sites = { 
  "www.youtube.com"       : xows_tpl_embed_youtube,
  "youtu.be"              : xows_tpl_embed_youtube,
  "www.dailymotion.com"   : xows_tpl_embed_dailymo,
  "dai.ly"                : xows_tpl_embed_dailymo,
  "vimeo.com"             : xows_tpl_embed_vimeo
};

/**
 * Add or modify an embedding site/plateform with its parsing function.
 * 
 * @param   {string}  match  Domain name to match in the parsed URL.
 * @param   {object}  parse  Function to create embd media from URL.
 */
function xows_tpl_add_embed_site(match, parse)
{
  xows_tpl_embed_sites[match] = parse;
}

/**
 * Add or modify an embedding site/plateform with its parsing function.
 * 
 * @param   {string}  match  File extension to match in the parsed URL.
 * @param   {object}  parse  Function to create embd media from URL.
 */
function xows_tpl_add_embed_file(match, parse)
{
  xows_tpl_embed_files[match] = parse;
}

/**
 * Add an embedding site for file download.
 * 
 * @param   {string}  match  Domain name to match in the parsed URL.
 */
function xows_tpl_add_embed_dwnl(match)
{
  xows_tpl_embed_sites[match] = xows_tpl_embed_dwnl;
}

/**
 * Substitute raw link string by enhanced HTML element such as HTML
 * <link> element or embd media.
 * 
 * @param   {string}    href   Link to substitute by enhanced HTML.
 *  
 * @return  {string} Replacement enhanced HTML sample.
 */
function xows_tpl_enhance_url(href) 
{
  // Create the link from parsed URL
  const link = "<a href=\""+href+"\" title=\""+href+"\" target=\"_blank\">"+href+"</a>";
 
  let match, k, embed = null;
  
  // Check whether we found a known and supported file extension
  match = href.match(/\.([\w\d]+)(\?|$)/); 
  if(match) {
    k = match[1].toUpperCase(); //< always compare with uppercase
    if(xows_tpl_embed_files[k]) embed = xows_tpl_embed_files[k](href,k);
  }

  if(!embed) {
    // Check whether we found a known and supported plateform/site
    match = href.match(/\/\/(.*?[\w\d-_]+\.\w+)\//);
    if(match) {
      k = match[1].toLowerCase(); //< always compare with lowercase
      if(xows_tpl_embed_sites[k]) embed = xows_tpl_embed_sites[k](href,k);
    }
  }
  
  if(embed) {
    // Replace src attribute for lazy loading
    return link + "<br><div class=\"embd\">" +
              embed.replace(/src=/g,XOWS_LAZY_SRC_ATTR+"=") + "</div>";
  } else {
    return link;
  }
}

/**
 * Replacement function to substitute emojis shortcode by enhanced HTML  
 * sample with proper escaped emoji unicode.
 * 
 * @param   {string}  match   Regex full match string.
 * @param   {string}  code    Extracted emoji short code.
 *  
 * @return  {string} Replacement HTML sample.
 */
function xows_tpl_replace_emoji(match, code) 
{
  const hex = xows_tpl_emoj_map[code];
  return (hex) ? "<emoj>&#x"+hex+";</emoj>" : match;
}

/**
 * Replacement function to substitute ASCII emoticons by 
 * enhanced HTML with proper escaped emoji unicode.
 * 
 * @param   {string}  match   Regex full match string.
 * @param   {string}  space   Preceding space or null.
 * @param   {string}  eyes    Emoticon eyes (including tears).
 * @param   {string}  mouth   Emoticon mouth.
 *  
 * @return  {string} Replacement HTML sample.
 */
function xows_tpl_replace_emots(match, space, eyes, mouth) 
{
  const hex = xows_tpl_emot_map[eyes.toUpperCase()][mouth.toUpperCase()];
  return (hex) ? "<emoj>&#x"+hex+";</emoj>" : match;
}

/**
 * Parses the given text to create links and embd medias from 
 * URL patterns.
 * 
 * @param   {string} body   Original text to parse.
 *  
 * @return  {string} Enhanced body with HTML inclusions
 */
function xows_tpl_enrich_content(body)
{
  // First of all, escape HTML characters for correct display
  body = xows_html_escape(body);
    
  // Search for emoji short code to replace
  body = body.replace(/:([\w-+-_]*):/g, xows_tpl_replace_emoji);
  
  // Search for known and common ASCII emots to replace
  body = body.replace(/(\s|^)([Xx8:;]|:&apos;)-?([()|DpPxXoO#$.\/*sS])/g, xows_tpl_replace_emots);

  // Search for URL pattern in body, then parse them as link and/or
  // create embeded medias
  return body.replace(/(http|https|ftp|ftps):\/\/(\S*)/g, xows_tpl_enhance_url);
}

/**
 * Stores the dynamically created CSS classes for avatars DataURL.
 */
let xows_tpl_avat_cls_db = {};

/**
 * Create a new CSS class with data-url as background-image style to 
 * be used as avatar.
 * 
 * @param   {string}  hash    Avatar data hash (class name)
 */
function xows_tpl_spawn_avat_cls(hash)
{
  if(hash) {
    if(!(hash in xows_tpl_avat_cls_db)) {
      // Compose the CSS class string
      const cls = ".h-"+hash+" {background-image:url(\""+xows_cli_cache_avat_get(hash)+"\");}\r\n";
      
      // Add this to local DB to keep track of added classes
      xows_tpl_avat_cls_db[hash] = cls;
      
      // Add new style sheet with class
      const style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = cls;
      document.head.appendChild(style);
    }
  }
}

/**
 * Build and returns a new instance of roster contact <li> object from
 * template be added in the document cont_list <ul>
 * 
 * @param   {string}  jid     Contact JID
 * @param   {string}  name    Contact display name
 * @param   {string}  avat    Contact avatar hash
 * @param   {number}  subs    Contact subscription
 * @param   {number}  [show]  Optional Contact Show level
 * @param   {string}  [stat]  Optional Contact Status
 *  
 * @return  {object} Contact <li> HTML Elements
 */
function xows_tpl_spawn_rost_cont(jid, name, avat, subs, show, stat)
{
  // Clone DOM tree from template
  const inst = xows_tpl_model[XOWS_CLS_ROST_CONT].firstChild.cloneNode(true);
  
  // Set content to proper elements
  inst.setAttribute("id", jid);
  inst.setAttribute("title", name+" ("+jid+")");
  inst.querySelector("."+XOWS_CLS_CONT_NAME).innerHTML = name;
  inst.querySelector("."+XOWS_CLS_CONT_STAT).innerHTML = stat?stat:"";
  const show_dv = inst.querySelector("."+XOWS_CLS_CONT_SHOW);
  const subs_bt = inst.querySelector("."+XOWS_CLS_CONT_SUBS);
  const avat_fi = inst.querySelector("FIGURE");
  if(subs < XOWS_SUBS_TO) {
    show_dv.classList.add(XOWS_CLS_HIDDEN);
    subs_bt.classList.remove(XOWS_CLS_HIDDEN);
    avat_fi.className = XOWS_CLS_CONT_DENY;
  } else {
    show_dv.setAttribute("show",(show!==null)?show:-1);
    // Set proper class for avatar
    xows_tpl_spawn_avat_cls(avat); //< Add avatar CSS class 
    avat_fi.className = "h-"+avat;
  }
  
  return inst;
}

/**
 * Update the given instance of roster contact <li> object.
 * 
 * @param   {object}  li      Contact <li> element to update.
 * @param   {string}  name    Contact display name
 * @param   {string}  avat    Contact avatar image URL
 * @param   {number}  subs    Contact subscription
 * @param   {number}  [show]  Optional Contact Show level
 * @param   {string}  [stat]  Optional Contact Status
 */
function xows_tpl_update_rost_cont(li, name, avat, subs, show, stat)
{
  const jid = li.getAttribute("id");

  // Update content
  li.setAttribute("title", name+" ("+jid+")");
  li.querySelector("."+XOWS_CLS_CONT_NAME).innerHTML = name;
  li.querySelector("."+XOWS_CLS_CONT_STAT).innerHTML = stat?stat:"";
  const show_dv = li.querySelector("."+XOWS_CLS_CONT_SHOW);
  const subs_bt = li.querySelector("."+XOWS_CLS_CONT_SUBS);
  const avat_fi = li.querySelector("FIGURE");
  if(subs < XOWS_SUBS_TO) {
    show_dv.classList.add(XOWS_CLS_HIDDEN);
    subs_bt.classList.remove(XOWS_CLS_HIDDEN);
    avat_fi.className = XOWS_CLS_CONT_DENY;
  } else {
    show_dv.classList.remove(XOWS_CLS_HIDDEN);
    show_dv.setAttribute("show",(show!==null)?show:-1);
    subs_bt.classList.add(XOWS_CLS_HIDDEN);
    // Set proper class for avatar
    xows_tpl_spawn_avat_cls(avat); //< Add avatar CSS class 
    avat_fi.className = "h-"+avat;
  }
}

/**
 * Build and returns a new instance of room contact (occupant) <li> 
 * object from template be added in the document occu_list <ul>
 * 
 * @param   {string}  jid       Occupant JID
 * @param   {string}  nick      Occupant Nickname
 * @param   {string}  avat      Occupant avatar image URL
 * @param   {string}  [lock]    Occupant real bare JID if available
 * @param   {number}  [show]    Optional Contact Show level
 * @param   {string}  [stat]    Optional Contact Status
 *  
 * @return  {object} Contact <li> HTML Elements
 */
function xows_tpl_spawn_room_occu(jid, nick, avat, lock, show, stat)
{
  // Clone DOM tree from template
  const inst = xows_tpl_model[XOWS_CLS_ROOM_OCCU].firstChild.cloneNode(true);
  
  // Set content to proper elements
  inst.setAttribute("id", jid);
  inst.setAttribute("jid", lock);
  inst.setAttribute("title", nick+" ("+lock+")");
  inst.querySelector("."+XOWS_CLS_CONT_NAME).innerHTML = nick;
  inst.querySelector("."+XOWS_CLS_CONT_SHOW).setAttribute("show",(show!==null)?show:-1);
  inst.querySelector("."+XOWS_CLS_CONT_STAT).innerHTML = stat?stat:"";
  // Occupant JID (lock) may be null, undefined or empty string
  inst.querySelector("."+XOWS_CLS_OCCU_SUBS).disabled = (lock) ? (lock.length === 0) : true;
  // Set proper class for avatar
  xows_tpl_spawn_avat_cls(avat); //< Add avatar CSS class 
  inst.querySelector("FIGURE").className = "h-"+avat;

  return inst;
}

/**
 * Update the given instance of room occupant <li> object.
 * 
 * @param   {string}  li        Contact <li> element to update.
 * @param   {string}  nick      Occupant Nickname
 * @param   {string}  avat      Occupant avatar image URL
 * @param   {string}  [lock]    Occupant real full JID if available
 * @param   {number}  [show]    Optional Contact Show level
 * @param   {string}  [stat]    Optional Contact Status
 */
function xows_tpl_update_room_occu(li, nick, avat, lock, show, stat)
{
  // Update content
  li.setAttribute("jid", lock);
  li.setAttribute("title", nick+" ("+lock+")");
  li.querySelector("."+XOWS_CLS_CONT_NAME).innerHTML = nick;
  li.querySelector("."+XOWS_CLS_CONT_SHOW).setAttribute("show",(show!==null)?show:-1);
  li.querySelector("."+XOWS_CLS_CONT_STAT).innerHTML = stat?stat:"";
  // Occupant JID (lock) may be null, undefined or empty string
  li.querySelector("."+XOWS_CLS_OCCU_SUBS).disabled = (lock) ? (lock.length === 0) : true;
  // Set proper class for avatar
  xows_tpl_spawn_avat_cls(avat); //< Add avatar CSS class 
  li.querySelector("FIGURE").className = "h-"+avat;
}

/**
 * Build and returns a new instance of roster chatroom <li> object from
 * template be added in the document room_list <ul>
 * 
 * @param   {string}  jid    Charoom JID
 * @param   {string}  name   Charoom display name
 * @param   {string}  desc   Charoom description
 * @param   {string}  lock   Charoom is password protected
 *  
 * @return  {object} Contact <li> HTML Elements
 */
function xows_tpl_spawn_rost_room(jid, name, desc, lock)
{
  // Clone DOM tree from template
  const inst = xows_tpl_model[XOWS_CLS_ROST_ROOM].firstChild.cloneNode(true);
  
  // Set content to proper elements
  inst.setAttribute("id", jid);
  inst.setAttribute("title", name+" ("+jid+")");
  inst.querySelector("."+XOWS_CLS_ROOM_NAME).innerHTML = name;
  inst.querySelector("."+XOWS_CLS_ROOM_DESC).innerHTML = desc;
  const avat_dv = inst.querySelector("."+XOWS_CLS_ROOM_AVAT);
  if(lock) avat_dv.classList.add(XOWS_CLS_ROOM_LOCK);

  return inst;
}

/**
 * Update the given instance of roster chatroom <li> object.
 * 
 * @param   {string}  li     Chatroom <li> element to update.
 * @param   {string}  name   Chatroom display name
 * @param   {string}  desc   Chatroom description
 * @param   {string}  lock   Chatroom is password protected
 */
function xows_tpl_update_rost_room(li, name, desc, lock)
{
  // Set content tu proper elements
  const jid = li.getAttribute("id");
  
  // Update content
  li.setAttribute("title", name+" ("+jid+")");
  li.querySelector("."+XOWS_CLS_ROOM_NAME).innerHTML = name;
  li.querySelector("."+XOWS_CLS_ROOM_DESC).innerHTML = desc;
  const avat_dv = li.querySelector("."+XOWS_CLS_ROOM_AVAT);
  if(lock) {
    avat_dv.classList.add(XOWS_CLS_ROOM_LOCK);
  } else {
    avat_dv.classList.remove(XOWS_CLS_ROOM_LOCK);
  }
}

/**
 * Build and returns a new instance of room contact (occupant) <li> 
 * object from template be added in the document occu_list <ul>
 * 
 * @param   {string}  bare      Subscribe sender JID bare
 * @param   {string}  [nick]    Subscribe sender preferend nick (if available)
 *  
 * @return  {object} Contact <li> HTML Elements
 */
function xows_tpl_spawn_rost_subs(bare, nick)
{
  // Clone DOM tree from template
  const inst = xows_tpl_model[XOWS_CLS_ROST_SUBS].firstChild.cloneNode(true);
  
  // Set content to proper elements
  inst.setAttribute("id", bare);
  if(nick) inst.setAttribute("name", nick);
  inst.setAttribute("title", bare+" ("+nick+")");
  inst.querySelector("."+XOWS_CLS_SUBS_BARE).innerHTML = nick ? nick : bare;

  return inst;
}

/**
 * Build and returns a new instance of history full message <li> object 
 * from template be added in the document history list <ul>
 * 
 * @param   {string}    id      Message ID.
 * @param   {string}    from    Sender JID.
 * @param   {string}    time    Timestamp.
 * @param   {string}    body    Content.
 * @param   {boolean}   sent    Marks as sent by client.
 * @param   {boolean}   recp    Marks as receipt received.
 * @param   {string}    name    Author (sender) display name.
 * @param   {string}    avat    Author (sender) avatar image URL.
 *  
 * @return  {object} History message <li> HTML Elements
 */
function xows_tpl_mesg_full_spawn(id, from, body, time, sent, recp, name, avat)
{
  // Clone DOM tree from template
  const inst = xows_tpl_model[XOWS_CLS_MESG_FULL].firstChild.cloneNode(true);
  
  // Set proper value to message elements
  inst.classList.add(sent ? XOWS_CLS_MESG_SENT : XOWS_CLS_MESG_RECV);
  if(recp) inst.classList.add(XOWS_CLS_MESG_RECP);
  inst.setAttribute("id", id); 
  inst.setAttribute("from", from);
  inst.setAttribute("time", time);
  inst.querySelector("."+XOWS_CLS_MESG_FROM).innerHTML = name;
  inst.querySelector("."+XOWS_CLS_MESG_DATE).innerHTML = xows_l10n_date(time);

  // Add formated body 
  inst.querySelector("P").innerHTML = xows_tpl_enrich_content(body);
  
  // Set proper class for avatar
  xows_tpl_spawn_avat_cls(avat); //< Add avatar CSS class 
  inst.querySelector("FIGURE").className = "h-"+avat;
  
  // Return final tree
  return inst;
}

/**
 * Build and returns a new instance of history aggregated message <li>  
 * object from template be added in the document history list <ul>
 * 
 * 
 * @param   {string}    id      Message ID.
 * @param   {string}    from    Sender full JID.
 * @param   {string}    time    Timestamp.
 * @param   {string}    body    Content.
 * @param   {boolean}   sent    Marks as sent by client.
 * @param   {boolean}   recp    Marks as receipt received.
 *  
 * @return  {object} History message <li> HTML Elements
 */
function xows_tpl_mesg_aggr_spawn(id, from, body, time, sent, recp)
{
  // Clone DOM tree from template
  const inst = xows_tpl_model[XOWS_CLS_MESG_AGGR].firstChild.cloneNode(true);
  
  // Set proper value to message elements
  inst.classList.add(sent ? XOWS_CLS_MESG_SENT : XOWS_CLS_MESG_RECV);
  if(recp) inst.classList.add(XOWS_CLS_MESG_RECP);
  inst.setAttribute("id", id); 
  inst.setAttribute("from", from);
  inst.setAttribute("time", time);
  inst.querySelector("."+XOWS_CLS_MESG_HOUR).innerHTML = xows_l10n_houre(time);

  // Add formated body 
  inst.querySelector("P").innerHTML = xows_tpl_enrich_content(body);

  // Return final tree
  return inst;
}

/***********************************************************************
 *                            DOM API Layer
 **********************************************************************/

/**
 * Reference list to current document used DOM objects
 */
const xows_doc = {};

/**
 * Object that stores backed documents Fragments.
 */
const xows_doc_frag_db = {};

/**
 * Variable to hold scroll position of the last loading checkup to 
 * prevent useless flood while scrolling.
 */
let xows_doc_loader_scroll = 99999; 

/**
 * Current target of the lazy loader, this is the element with 
 * monitored scrolling which the inner medias are checked for loading.
 */
let xows_doc_loader_client = null;

/**
 * Placeholder source attribute name to get media source URL.
 */
let xows_doc_loader_attrib = "";

/**
 * Array of objects to be checked against viewport for Lazy loading.
 */
const xows_doc_loader_stack = [];

/**
 * Create local reference of the specified DOM object
 * 
 * @param   {string}  id  Element id to cache
 */
function xows_doc_cache(id)
{
  xows_doc[id] = document.getElementById(id);
}

/**
 * Add an event listener to the specified object with proper options
 * 
 * @param   {object}    element   Element to add event listener to.
 * @param   {string}    event     Event type to listen.
 * @param   {function}  callback  Callback function for event listener
 */
function xows_doc_listener_add(element, event, callback, passive = true)
{
  element.addEventListener(event,callback,{capture:false,passive:passive});
}

/**
 * Remove an event listener from the specified object
 * 
 * @param   {object}    element  Element to add event listener to.
 * @param   {string}    event    Event type to listen.
 * @param   {function}  callback Callback function for event listener.
 */
function xows_doc_listener_rem(element, event, callback, passive = true)
{
  element.removeEventListener(event,callback,{capture:false,passive:passive});
}

/**
 * Chechk whether element has class in its class list.
 * 
 * @param   {string}  id        Cached element id. 
 * @param   {string}  clsname   Class name.
 */
function xows_doc_cls_has(id, clsname)
{
  return xows_doc[id].classList.contains(clsname);
}

/**
 * Toggle the specified class in element class list.
 * 
 * @param   {string}  id        Cached element id. 
 * @param   {string}  clsname   Class name.
 */
function xows_doc_cls_tog(id, clsname)
{
  xows_doc[id].classList.toggle(clsname);
}

/**
 * Add the specified class to element class list.
 * 
 * @param   {string}  id        Cached element id. 
 * @param   {string}  clsname   Class name.
 */
function xows_doc_cls_add(id, clsname)
{
  xows_doc[id].classList.add(clsname);
}

/**
 * Remove the specified class to element class list.
 * 
 * @param   {string}  id        Cached element id. 
 * @param   {string}  clsname   Class name.
 */
function xows_doc_cls_rem(id, clsname)
{
  xows_doc[id].classList.remove(clsname);
}

/**
 * Add or remove the specified class to/from element class list.
 * 
 * @param   {string}  id        Cached element id. 
 * @param   {string}  clsname   Class name.
 * @param   {boolean} add       Boolean to add or remove class.
 */
function xows_doc_cls_set(id, clsname, add)
{
  add ? xows_doc[id].classList.add(clsname) 
      : xows_doc[id].classList.remove(clsname);
}

/**
 * Show the specified item, either element object or id.
 * 
 * @param   {string}  id        Cached element id.  
 * @param   {boolean} show      Boolean to show or hide.
 */
function xows_doc_show(id, show)
{
  show  ? xows_doc[id].classList.remove(XOWS_CLS_HIDDEN) 
        : xows_doc[id].classList.add(XOWS_CLS_HIDDEN);
}

/**
 * Check whether the specified item, either element object or id is
 * hidden (has the .hidden class).
 * 
 * @param   {string}  id        Cached element id.  
 *   
 * @return  {boolean}   True if element is visible, false otherwise.
 */
function xows_doc_hidden(id)
{
  return xows_doc[id].classList.contains(XOWS_CLS_HIDDEN);
}

/**
 * Backup specified element content to an offscreen document fragment. 
 * 
 * @param   {string}  name      Bakcup name.
 * @param   {string}  id        Cached element id to backup.
 */
function xows_doc_frag_backup(name, id)
{
  if(!(name in xows_doc_frag_db)) 
    xows_doc_frag_db[name] = {};
    
  if(xows_doc_frag_db[name][id]) {
    xows_doc_frag_db[name][id].innerHTML = "";
  } else {
    xows_doc_frag_db[name][id] = document.createDocumentFragment();
  }

  while(xows_doc[id].childNodes.length) 
    xows_doc_frag_db[name][id].appendChild(xows_doc[id].firstChild);
}

/**
 * Copy offscreen fragment from another one or current DOM element.
 * 
 * @param   {string}  dst     Destination fragment name.
 * @param   {string}  src     Source fragment name or null to copy from DOM.
 * @param   {string}  id      Cached element id to copy.
 */
function xows_doc_frag_copy(dst, src, id)
{
  let s, d, e, cache = false;
  
  if(src) {
    if(src in xows_doc_frag_db) {
      if(id in xows_doc_frag_db[src]) {
        s = xows_doc_frag_db[src][id];
      }
    }
  } else {
    s = xows_doc[id];
  }
  
  if(dst) {
    
    if(!(dst in xows_doc_frag_db)) 
      xows_doc_frag_db[dst] = {};
    
    if(!xows_doc_frag_db[dst][id]) 
      xows_doc_frag_db[dst][id] = document.createDocumentFragment();

    d = xows_doc_frag_db[dst][id];
    
  } else {
    
    d = xows_doc[id];
    
    d.innerHTML = "";
    
    cache = true;
  }
  
  if(s && (d !== s)) {
    for(let i = 0, n = s.childNodes.length; i < n; ++i) {
      e = s.childNodes[i].cloneNode(true);
      d.appendChild(e);
      if(cache && e.id) xows_doc[e.id] = e; //< replace document cached elements
    }
  } 
}

/**
 * Restore specified element content from offscreen document fragment. 
 * 
 * @param   {string}  name      Fragment name.
 * @param   {string}  id        Cached element id to restore.
 */
function xows_doc_frag_restore(name, id)
{
  if(name in xows_doc_frag_db) {
    xows_doc[id].innerHTML = "";
    
    let e;
    while(xows_doc_frag_db[name][id].childNodes.length) {
      e = xows_doc_frag_db[name][id].firstChild;
      xows_doc[id].appendChild(e);
      if(e.id) xows_doc[e.id] = e; //< replace document cached elements
    }
  }
}

/**
 * Get backed document fragment element.
 * 
 * @param   {string}  name      Bakcup name.
 * @param   {string}  id        Cached element id to get.
 */
function xows_doc_frag(name, id)
{
  return xows_doc_frag_db[name] ? xows_doc_frag_db[name][id] : null;
}

/**
 * Get element within backed document fragment element.
 * 
 * @param   {string}  name      Bakcup name.
 * @param   {string}  id        Id of element to retreive.
 */
function xows_doc_frag_element(name, id)
{
  let element;
  
  for(const frag in xows_doc_frag_db[name]) {
    element = xows_doc_frag_db[name][frag].getElementById(id);
    if(element) return element;
  }
  
  return null;
}

/**
 * Get child with the specified id in the given parent.
 * 
 * @param   {object}    parent  Parent object to search child.
 * @param   {boolean}   id      Child id to search for.
 * 
 * @return  {object}  Found object or null if not found.  
 */
function xows_doc_get_child(parent, id)
{  
  let i = parent.childNodes.length;
  
  while(i--) 
    if(parent.childNodes[i].id === id) 
      return parent.childNodes[i];
      
  return null;
}

/**
 * Initializes document manager and browser interactions. 
 * 
 * This function cache the static document elements for fast access and 
 * setup the nécessary listeners and the callbacks for user and client 
 * interactions.
 * 
 * @param   {object}    onready   Callback function to be called once 
 *                                templates successfully loaded.
 */
function xows_doc_init(onready)
{
  // Localy store references to all DOM elements with an id
  const element = document.querySelectorAll("[id]");
  let i = element.length;
  while(i--) xows_doc_cache(element[i].id);

  // Main Page "page_main" event listeners
  xows_doc_listener_add(xows_doc.hnd_lside,   "click",    xows_gui_evt_click_hnd);
  xows_doc_listener_add(xows_doc.hnd_rside,   "click",    xows_gui_evt_click_hnd);
  xows_doc_listener_add(xows_doc.rost_tabs,   "click",    xows_gui_evt_click_rost_tabs);
  xows_doc_listener_add(xows_doc.cont_ul,     "click",    xows_gui_evt_click_rost_ul);
  xows_doc_listener_add(xows_doc.subs_ul,     "click",    xows_gui_evt_click_subs_ul);
  xows_doc_listener_add(xows_doc.cont_add,    "click",    xows_gui_evt_click_cont_add);
  xows_doc_listener_add(xows_doc.room_ul,     "click",    xows_gui_evt_click_rost_ul);
  xows_doc_listener_add(xows_doc.room_add,    "click",    xows_gui_evt_click_room_add);
  xows_doc_listener_add(xows_doc.room_upd,    "click",    xows_gui_room_list_reload);
  xows_doc_listener_add(xows_doc.occu_list,   "click",    xows_gui_evt_click_occu_list);
  xows_doc_listener_add(xows_doc.menu_show,   "click",    xows_gui_evt_click_show_menu);
  xows_doc_listener_add(xows_doc.drop_show,   "click",    xows_gui_evt_click_show_menu);
  xows_doc_listener_add(xows_doc.menu_user,   "click",    xows_gui_evt_click_user_menu);
  xows_doc_listener_add(xows_doc.user_stat,   "keypress", xows_gui_evt_keyp_user_stat);
  xows_doc_listener_add(xows_doc.send_edit,   "keydown",  xows_gui_evt_keyud_send_edit, false); //< need preventDefault()
  xows_doc_listener_add(xows_doc.send_edit,   "keyup",    xows_gui_evt_keyud_send_edit);
  xows_doc_listener_add(xows_doc.send_edit,   "input",    xows_gui_evt_input_send_edit);
  xows_doc_listener_add(xows_doc.chat_main,   "scroll",   xows_gui_evt_scroll_chat_main);
  xows_doc_listener_add(xows_doc.chat_main,   "click",    xows_gui_evt_click_chat_main);
  xows_doc_listener_add(xows_doc.chat_file,   "change",   xows_gui_evt_change_chat_file);
  xows_doc_listener_add(xows_doc.chat_upld,   "click",    xows_gui_evt_click_chat_upld);
  xows_doc_listener_add(xows_doc.menu_emoj,   "click",    xows_gui_evt_click_emoj_menu);
  xows_doc_listener_add(xows_doc.drop_emoj,   "click",    xows_gui_evt_click_emoj_menu);
  xows_doc_listener_add(xows_doc.menu_room,   "click",    xows_gui_evt_click_room_menu);
  xows_doc_listener_add(xows_doc.drop_room,   "click",    xows_gui_evt_click_room_menu);
  xows_doc_listener_add(xows_doc.chat_noti,   "click",    xows_gui_evt_click_chat_noti);
  xows_doc_listener_add(xows_doc.chat_mute,   "click",    xows_gui_evt_click_chat_noti);

  // HTTP Upload Page "page_upld" event listeners
  xows_doc_listener_add(xows_doc.page_upld,  "click",    xows_gui_evt_click_page_upld);
  
  // Add Contact "page_cont" event listeners
  xows_doc_listener_add(xows_doc.page_cont,  "keyup",    xows_gui_evt_key_page_cont);
  xows_doc_listener_add(xows_doc.page_cont,  "click",    xows_gui_evt_click_page_cont);

  // Add Contact "page_card" event listeners
  xows_doc_listener_add(xows_doc.page_card,  "keyup",    xows_gui_evt_key_page_card);
  xows_doc_listener_add(xows_doc.page_card,  "click",    xows_gui_evt_click_page_card);
  
  // Room Config "page_room" event listeners
  xows_doc_listener_add(xows_doc.page_room,  "keyup",    xows_gui_evt_key_page_room);
  xows_doc_listener_add(xows_doc.page_room,  "click",    xows_gui_evt_click_page_room);

  // Room Create/joint "page_join" event listeners
  xows_doc_listener_add(xows_doc.page_join,  "keyup",    xows_gui_evt_key_page_join);
  xows_doc_listener_add(xows_doc.page_join,  "click",    xows_gui_evt_click_page_join);

  // Login Page "page_auth" event listeners
  xows_doc_listener_add(xows_doc.page_auth,   "keyup",    xows_gui_evt_key_page_auth);
  xows_doc_listener_add(xows_doc.page_auth,   "click",    xows_gui_evt_click_page_auth);

  // Checl whether Registering option is enabled
  if(xows_options.allow_register) {
    
    // Show and configure the "Register new account" link in the Login Page
    xows_doc_show("auth_regi", true); 
    
    // Register Page "page_regi" event listeners
    xows_doc_listener_add(xows_doc.page_regi,  "keyup",    xows_gui_evt_key_page_regi);
    xows_doc_listener_add(xows_doc.page_regi,  "click",    xows_gui_evt_click_page_regi);
  }
  
  // Info Dialog page "page_info" event listeners
  xows_doc_listener_add(xows_doc.page_info,   "click",    xows_gui_evt_click_page_info);
  
  // Set event listener to handle user presence and GUI focus
  let opt = {capture:false,passive:true};
  document.addEventListener("visibilitychange", xows_gui_evt_focus,opt);
  window.addEventListener("focus", xows_gui_evt_focus,opt);
  window.addEventListener("blur", xows_gui_evt_focus,opt);
  //window.addEventListener("click", xows_gui_evt_mouseup,{capture:true,passive:true});
  
  // Set event listenir to handle page quit or reload
  window.addEventListener("beforeunload", xows_gui_evt_unload,opt);
  
  // Load the notification sound
  xows_gui_notify_sound = new Audio("/" + xows_options.root + "/sounds/notify.mp3?456");
  
  // Clone intial empty document fragment
  xows_doc_frag_copy("empty", null, "chat_hist");
  xows_doc_frag_copy("empty", null, "occu_list");

  xows_log(2,"gui_start","document ready");

  // Finaly call onready callback
  if(xows_is_func(onready)) onready();
}

/**
 * Empty the Lazy Loading stack to avoid useless checks.
 */
function xows_doc_loader_clear()
{
  xows_doc_loader_stack.length = 0;
  xows_doc_loader_scroll = 99999;
  xows_log(2,"doc_loader_clear","loader stack cleared");
}

/**
 * Define a new client viewport for lazy-loading monitor.
 * 
 * The specified element will be used as viewport to calculate whether
 * the monitored elements in the stack are currently visible and should 
 * start loading.
 * 
 * @param   {object}  client  Scrolling element with content to be monitored.
 * @param   {string}  attrib  Placeholder attribute containing media URL.
 */
function xows_doc_loader_setup(client, attrib)
{
  xows_doc_loader_attrib = attrib;
  xows_log(2,"doc_loader_setup","now search elements with attribute",attrib);

  // Add and/or remove the proper event listener if needed
  if(xows_doc_loader_client !== client) {
    
    if(xows_doc_loader_client) {
      xows_doc_listener_rem(xows_doc_loader_client,"scroll",xows_doc_loader_check);
      xows_log(2,"doc_loader_setup","removing scroll listener from element",
                "<"+xows_doc_loader_client.tagName+" id=\""+xows_doc_loader_client.getAttribute("id")+"\">");
    }

    xows_doc_loader_client = client;
    
    if(xows_doc_loader_client) {
      xows_doc_listener_add(xows_doc_loader_client,"scroll",xows_doc_loader_check);
      xows_log(2,"doc_loader_setup","adding scroll listener to element",
              "<"+client.tagName+" id=\""+client.getAttribute("id")+"\">");
    }
  }
  
  // Reset scroll to "infinite" to ve sure we make a first check
  xows_doc_loader_scroll = 99999;
}

/**
 * Add the specified element to the lazy-loading stack.
 * 
 * @param   {object}  target  Element to check for load monitoring.
 */
function xows_doc_loader_monitor(target)
{
  const targets = Array.from(target.querySelectorAll("["+xows_doc_loader_attrib+"]"));
  if(targets.length) {
    xows_log(2,"doc_loader_monitor","adding to monitoring stack",targets.length+" new element(s)");
    let i = targets.length;
    while(i--) xows_doc_loader_stack.push(targets[i]);
  }
}

/**
 * Function to test media placeholder against current viewport to 
 * start loading source.
 */
function xows_doc_loader_check(event)
{
  if(!xows_doc_loader_stack.length)
    return;
    
  // We perform check only if scroll changed enough to justify it
  if(Math.abs(xows_doc_loader_client.scrollTop - xows_doc_loader_scroll) < 120) 
    return;

  // Keep last check scroll
  xows_doc_loader_scroll = xows_doc_loader_client.scrollTop;
  
  // Used variables
  const view_bound = xows_doc_loader_client.getBoundingClientRect();
  let media_bound;

  let media, i = xows_doc_loader_stack.length;
  while(i--) {
    
    media = xows_doc_loader_stack[i];

    // Get client bounding for this element
    media_bound = media.getBoundingClientRect();

    // Check whether the object is currently within the chat history
    // window client
    if(media_bound.bottom > view_bound.top && media_bound.top <= view_bound.bottom) {
      
      // The XOWS_ATTR_NOLOAD attribute, non-standard HTML attribute, is 
      // used to indiate the media should not be hidden during 
      // loading. This is typically used for GIF images, assumed as 
      // animated, to let them starting playing without waiting full 
      // loading (which can take long).
      if(media.hasAttribute(XOWS_ATTR_NOLOAD)) {
        // Removes the attribute, it have no effect outside this algorithme
        media.removeAttribute(XOWS_ATTR_NOLOAD);
      } else {
        // We virtually hide the media by setting its height to 0 using
        // the flatten class, then we add a spin loader to its 
        // parent, which is usualy the placeholder
        media.classList.add(XOWS_CLS_FLATTEN);
        media.parentNode.classList.add(XOWS_CLS_EMBD_LOAD);

        // Define an onload function to handle the end of loading
        media.onload = function() {
          // Remove the spin loader and show the media (normal height)
          this.parentNode.classList.remove(XOWS_CLS_EMBD_LOAD);
          this.classList.remove(XOWS_CLS_FLATTEN);
        };
      }
      
      // Set the src from data_src to start load data
      media.src = media.getAttribute(xows_doc_loader_attrib);
      media.removeAttribute(xows_doc_loader_attrib);

      // Remove this one from stack
      xows_doc_loader_stack.splice(i,1);
      
      // Output log
      xows_log(2,"doc_loader_check","loading",media.src);
    }
  }
}

/***********************************************************************
 *                         GUI API Interface
 **********************************************************************/

/**
 * Threshold time for aggregated to full message
 */
const XOWS_MESG_AGGR_THRESHOLD = 600000; //< 10 min

/**
 * Maximum count of message per history
 */
const XOWS_GUI_HIST_SIZE = 55; //< Size of the history "window"

/**
 * Current selected GUI locale code.
 */
let xows_gui_locale = "en-US";

/**
 * Object to temporarly store login user and password
 */
let xows_gui_auth = null;

/**
 * JID of the currently selected peer (room or contact) in Roster.
 */
let xows_gui_peer = null;

/**
 * Reference to notification sound.
 */
let xows_gui_notify_sound = null;

/**
 * Current state of browser focus.
 */
let xows_gui_has_focus = true;

/**
 * Get the DOM or Fragement element associated with the specified peer
 * either offscreen or in the current document.
 * 
 * @param   {object}  peer  Peer object to get element.
 * @param   {string}  id    Element ID to get.
 * 
 * @return  {object}  Element or null if not found.
 */
function xows_gui_peer_element(peer, id)
{
  if(peer === xows_gui_peer) {
    return xows_doc[id] ? xows_doc[id] : document.getElementById(id);
  } else {
    return xows_doc_frag_element(peer.bare, id);
  }
}

/**
 * Object that stores backed scroll values.
 */
const xows_gui_peer_scroll_db = {};

/**
 * Save the main chat scroll and client values for the specified peer.
 * 
 * @param   {string}  peer      Peer to save scroll value.
 */
function xows_gui_peer_scroll_backup(peer)
{
  if(!(peer.bare in xows_gui_peer_scroll_db)) 
    xows_gui_peer_scroll_db[peer.bare] = {};
    
  xows_gui_peer_scroll_db[peer.bare] = {
    "scrollTop"  : xows_doc.chat_main.scrollTop,
    "scrollHeight"  : xows_doc.chat_main.scrollHeight,
    "clientHeight"  : xows_doc.chat_main.clientHeight
  };
}

/**
 * Restore the saved main chat scroll top position of the specified peer.
 * 
 * @param   {string}  peer      Peer to restore scroll value.
 */
function xows_gui_peer_scroll_restore(peer)
{
  if(peer.bare in xows_gui_peer_scroll_db) 
    xows_doc.chat_main.scrollTop = xows_gui_peer_scroll_db[peer.bare].scrollTop;
}

/**
 * Get the main chat scroll top position corresponding to the given
 * Peer. 
 * 
 * If the specified Peer history is offscree, the function
 * return the last saved scroll values.
 * 
 * @param   {string}  peer      Peer to get scroll value.
 */
function xows_gui_peer_scroll_top(peer)
{
  return (peer !== xows_gui_peer) ? 
          xows_gui_peer_scroll_db[peer.bare].scrollTop :
          xows_doc.chat_main.scrollTop;
}

/**
 * Get the main chat scroll bottom relative position corresponding 
 * to the given Peer. 
 * 
 * If the specified Peer history is offscree, the function
 * return the last saved scroll values.
 * 
 * @param   {string}  peer      Peer to get scroll value.
 */
function xows_gui_peer_scroll_bot(peer)
{
  const obj = (peer !== xows_gui_peer) ?
            xows_gui_peer_scroll_db[peer.bare] :
            xows_doc.chat_main;
  
  return ((obj.scrollHeight - obj.scrollTop) - obj.clientHeight);
}

/**
 * Get the main chat scroll offset to top corresponding 
 * to the given Peer. 
 * 
 * If the specified Peer history is offscree, the function
 * return the last saved scroll values.
 * 
 * @param   {string}  peer      Peer to get scroll value.
 */
function xows_gui_peer_scroll_off(peer)
{
  const obj = (peer !== xows_gui_peer) ?
            xows_gui_peer_scroll_db[peer.bare] :
            xows_doc.chat_main;
            
  return (obj.scrollHeight - obj.scrollTop);  
}

/**
 * Move to bottom the main chat scroll corresponding 
 * to the given Peer. 
 * 
 * If the specified Peer history is offscree, the function
 * return the last saved scroll values.
 * 
 * @param   {string}  peer      Peer to get scroll value.
 */
function xows_gui_peer_scroll_down(peer)
{
  const obj = (peer !== xows_gui_peer) ?
            xows_gui_peer_scroll_db[peer.bare] :
            xows_doc.chat_main;

  obj.scrollTop = obj.scrollHeight;
}

/**
 * Move by offset the main chat scroll corresponding 
 * to the given Peer. 
 * 
 * If the specified Peer history is offscree, the function
 * return the last saved scroll values.
 * 
 * @param   {string}  peer      Peer to get scroll value.
 * @param   {string}  offset    Offset value to move the scroll.
 */
function xows_gui_peer_scroll_seek(peer, offset)
{
  const obj = (peer !== xows_gui_peer) ?
            xows_gui_peer_scroll_db[peer.bare] :
            xows_doc.chat_main;

  obj.scrollTop = obj.scrollHeight - offset;
}

/**
 * Page to display in case of incomming error
 */
let xows_gui_error_page = "page_auth";

/**
 * Function to connect (try login)
 */
function xows_gui_connect()
{
  // Append domain if the option is set, otherwise it should be
  // set in the usename as typed by user.
  const auth_jid = xows_options.domain ?
                    xows_gui_auth.user+"@"+xows_options.domain :
                    xows_gui_auth.user;
                    
  // Configure client callbacks
  xows_cli_set_callback("connect", xows_gui_loggedin);
  xows_cli_set_callback("ownchange", xows_gui_user_update);
  xows_cli_set_callback("contpush", xows_gui_cont_push);
  xows_cli_set_callback("contrem", xows_gui_cont_remove);
  xows_cli_set_callback("subspush", xows_gui_subs_push);
  xows_cli_set_callback("subsrem", xows_gui_subs_remove);
  xows_cli_set_callback("roompush", xows_gui_room_push);
  xows_cli_set_callback("occupush", xows_gui_occu_push);
  xows_cli_set_callback("occurem", xows_gui_occu_remove);
  xows_cli_set_callback("message", xows_gui_hist_push);
  xows_cli_set_callback("chatstate", xows_gui_recv_chatstate);
  xows_cli_set_callback("receipt", xows_gui_recv_receipt);
  xows_cli_set_callback("subject", xows_gui_recv_subject);
  xows_cli_set_callback("error", xows_gui_cli_error);
  xows_cli_set_callback("close", xows_gui_cli_close);
  // Set page to show if an error occure
  xows_gui_error_page = "page_auth";
  // Launch the client connection
  xows_cli_connect( xows_options.url, auth_jid, 
                    xows_gui_auth.pass, false);
}

/**
 * Function to handle register submit button click by user
 * 
 * @param   {object}  event   Event object associated with trigger.
 */
function xows_gui_register()
{
  // Append domain if the option is set, otherwise it should be
  // set in the usename as typed by user.
  const auth_jid = xows_options.domain ?
                    xows_gui_auth.user+"@"+xows_options.domain :
                    xows_gui_auth.user;
                    
  // Define the connexion close callback
  xows_cli_set_callback("register", xows_gui_cli_register);
  xows_cli_set_callback("close", xows_gui_cli_close);
  xows_cli_set_callback("error", xows_gui_cli_error);
  // Set page to show if an error occure
  xows_gui_error_page = "page_regi";
  // Launch the connection with registration process
  xows_cli_connect( xows_options.url, auth_jid, 
                    xows_gui_auth.pass, true);
}

/**
 * Function to force query and refresh for chatroom list
 */
function xows_gui_cont_list_reload()
{
  // Empty the list
  xows_doc.cont_ul.innerHTML = "";
  // Add loading spinner at top of list
  xows_doc_cls_add("cont_ul", XOWS_CLS_ROST_LOAD);
  // Query for roster content
  xows_cli_roster_get_query();
}

/**
 * Function to add or update item of the roster contact list
 * 
 * @param   {object}  cont      Contact object to add or update.
 */
function xows_gui_cont_push(cont)
{
  // Null room mean empty contact list
  if(cont === null) {
    // Remove the loadding spinner
    xows_doc_cls_rem("cont_ul", XOWS_CLS_ROST_LOAD);
    return;
  }
  
  const li = document.getElementById(cont.bare);
  if(li) {
    // Update the existing contact <li> element according template
    xows_tpl_update_rost_cont(li, cont.name, cont.avat, 
                                cont.subs, cont.show, cont.stat);
    // If updated contact is current peer, alos update title bar
    if(cont === xows_gui_peer) xows_gui_chat_fram_update();
  } else {
    // Remove the potential loading spinner
    xows_doc_cls_rem("cont_ul", XOWS_CLS_ROST_LOAD);
    // Append new instance of contact <li> from template to roster <ul>
    xows_doc.cont_ul.appendChild(xows_tpl_spawn_rost_cont(cont.bare, cont.name, cont.avat,
                                                        cont.subs, cont.show, cont.stat));
    // Clone current empty history to contact offscreen history
    xows_doc_frag_copy(cont.bare, "empty", "chat_hist");
    // Initial history scroll backup
    xows_gui_peer_scroll_backup(cont);
    // Clone current empty occupant list
    xows_doc_frag_copy(cont.bare, "empty", "occu_list");
  }
}

/**
 * Function to remove item from the roster contact list
 * 
 * @param   {string}  bare    Contact bare JID to remove.
 */
function xows_gui_cont_remove(bare)
{
  // Remove the DOM element
  const li = document.getElementById(bare);
  if(li) li.parentNode.removeChild(li);
}

/**
 * Function to force query and refresh for chatroom list
 */
function xows_gui_room_list_reload()
{
  // Empty the list
  xows_doc.room_ul.innerHTML = "";
  // Add loading spinner at top of list
  xows_doc_cls_add("room_ul", XOWS_CLS_ROST_LOAD);
  // Query to get public room list
  xows_cli_muc_items_query();
}

/**
 * Function to add or update item of the roster chatroom list
 * 
 * @param   {object}  room    Room object to add or update.
 */
function xows_gui_room_push(room)
{
  // Null room mean empty room list
  if(room === null) {
    // Remove the loadding spinner
    xows_doc_cls_rem("room_ul", XOWS_CLS_ROST_LOAD);
    return;
  }
  const li = document.getElementById(room.bare);
  if(li) {
    // Update chatroom <li> element according template
    xows_tpl_update_rost_room(li, room.name, room.desc, room.lock);
    // If updated contact is current peer, alos update title bar
    if(room === xows_gui_peer) xows_gui_chat_fram_update();
  } else {
    // Remove the potential loading spinner
    xows_doc_cls_rem("room_ul", XOWS_CLS_ROST_LOAD);
    // Append new instance of contact <li> from template to roster <ul>
    xows_doc.room_ul.appendChild(xows_tpl_spawn_rost_room(room.bare, room.name, room.desc, room.lock));
    // Clone current empty history to chatroom offscreen history
    xows_doc_frag_copy(room.bare, "empty", "chat_hist");
    // Initial history scroll backup
    xows_gui_peer_scroll_backup(room);
    // Clone current empty occupant list for chatroom offscreen occupant list
    xows_doc_frag_copy(room.bare, "empty", "occu_list");
  }
}

/**
 * Handle the received occupant from MUC chatroom
 * 
 * @param   {object}    room      Room object.
 * @param   {object}    occu      Occupant object.
 */
function xows_gui_occu_push(room, occu)
{
  // Search for existing <li> element, either in the current document or
  // in an offscreen document fragment
  const li = xows_gui_peer_element(room,occu.jid);
              
  // Update existing or append new <li>
  if(li) {
    
    // Update the existing <li> ellement according template
    xows_tpl_update_room_occu(li, occu.name, occu.avat, 
                            occu.full, occu.show, occu.stat);
                            
    // Update message history
    xows_gui_hist_avat_upd(room, occu.jid, occu.avat);
    
  } else {
    
    // Select the proper role <ul> to put the occupant in
    let role_id = (occu.role === "moderator") ? "modo_ul" : "memb_ul";
    
    // If occupant is off-screen we get history <div> and <ul> of 
    // fragment history corresponding to contact
    const occu_ul = xows_gui_peer_element(room,role_id);
                    
    // Create and append new <li> element from template
    const inst = xows_tpl_spawn_room_occu(occu.jid, occu.name, occu.avat, 
                                        occu.full, occu.show, occu.stat);
    
    // Check whether we are this occupant
    if(occu.self) {
      // Hide the "Add Contact" button for self
      inst.querySelector("."+XOWS_CLS_OCCU_SUBS).classList.add(XOWS_CLS_HIDDEN);
      // If we are room owner, enable the room config button
      if(occu.affi === "owner") {
        xows_doc.menu_room.disabled = false;
      }
    }
    // Hide "Add Contact" button for Contacts already in roster
    if(occu.full) {
      if(xows_cli_get_cont(occu.full))
        inst.querySelector("."+XOWS_CLS_OCCU_SUBS).classList.add(XOWS_CLS_HIDDEN);
    }
    // Create and append new <li> element from template
    occu_ul.appendChild(inst);
  }
}

/**
 * Function to remove item from the room occupant list
 * 
 * @param   {object}  room    Room object to remove occupant from.
 * @param   {string}  full    Occupant full JID.
 */
function xows_gui_occu_remove(room, full)
{
  // Search for existing <li> element, either in the current document or
  // in an offscreen document fragment
  const li = xows_gui_peer_element(room,full);
  if(li) li.parentNode.removeChild(li);
}

/**
 * Function to handle client login success and ready.
 * 
 * @param {object}  user    User object.
 */
function xows_gui_loggedin(user)
{ 
  // Check whether user asked to remember
  if(xows_gui_auth.cred) {
    
    // Output log
    xows_log(2,"xows_gui_loggedin","Saving credential");
    
    // Store credentials
    if(window.PasswordCredential) {
      const cred_data = { "id"        : xows_gui_auth.user, 
                          "password"  : xows_gui_auth.pass};
      const cred = new PasswordCredential(cred_data);
      navigator.credentials.store(cred);
    }
  }
  
  // Erase auth data
  xows_gui_auth = null;
                    
  // Show the main client page and hide wait page
  xows_doc_show("page_main", true); //< show
  xows_doc_show("page_wait", false); //< hide
  // Reset the Roster and Chat window
  xows_gui_peer = null;
  // Setup the lazy loader
  xows_doc_loader_setup(xows_doc.chat_main, XOWS_LAZY_SRC_ATTR);
  // Check whether file Upload is available
  if(xows_cli_service_exist(XOWS_NS_HTTPUPLOAD)) {
    xows_doc.chat_upld.disabled = false;
    // Add embeded download matching http upload service domain
    xows_tpl_add_embed_dwnl(xows_cli_service_url[XOWS_NS_HTTPUPLOAD]);
  }
  // Check whether MUC service is available
  if(xows_cli_service_exist(XOWS_NS_MUC)) {
    xows_doc.room_tab.disabled = false;
  }
  // Set the presence menu for current user
  xows_gui_user_update(user);
  
  // Refresh public room list
  xows_gui_room_list_reload();
}

/**
 * Stack for currently wrinting Contact or Room Occupant
 */
const xows_gui_writing_list = [];

/**
 * Clear the currently writing stack and notification message.
 */
function xows_gui_writing_notif_clear()
{
  // Empty the typing stack
  if(xows_gui_writing_list.length !== 0)
    xows_gui_writing_list.length = 0;
  
  // Hide and clear the typing notification
  xows_doc_show("chat_stat", false);
  xows_doc.chat_stat.innerHTML = "";
}

/**
 * Add or remove currently writing people to stack and 
 * compose the proper notification message.
 * 
 * @param   {string}  from     Wrinting full JID.
 * @param   {boolean} writing  Is currently writing value.
 */
function xows_gui_writing_notif_set(from, writing)
{
  // Simply get list reference
  const list = xows_gui_writing_list;
  
  // Get JID position in stack or -1
  const i = list.indexOf(from);
  
  if(writing) {
    // Add peer (contact or room occupant) to stack
    if(i < 0) list.push(from);
  } else {
    // Remove Peer (contact or room occupant) from stack
    if(i >= 0) list.splice(i,1);
  }
  
  const n = list.length;
  
  if(n > 0) {
    if(xows_gui_peer) {
      // Show the notification
      xows_doc_show("chat_stat", true);
      // Compose the notification string
      if(xows_gui_peer.type === XOWS_PEER_CONT) {
        // The easy part, peer is a single Contact
        xows_doc.chat_stat.innerHTML = "<b>"+xows_gui_peer.name+"</b> " + 
                                      xows_l10n_get("is currently writing");                            
      } else {
        // The hard part, peer is a chat room, we may have
        // several people typing the same time
        let str = "";
        if(n > 1) {
          // We display tow names maximum with the count of other 
          // typing people if needed
          const l = (n > 2) ? 2 : n - 1;
          // Add the first, or tow first name(s).
          for(let i = 0; i < l; ++i) {
            str += "<b>"+xows_jid_to_nick(list[i])+"</b>";
            if(i < (l-1)) str += ", ";
          }
          // Now append the last part
          str += " "+xows_l10n_get("and")+" <b>";
          // We add either the last name or the remaining count
          const r = (n - l);
          if(r > 1) {
            str += r + " " + xows_l10n_get("other(s)")+"</b> ";
          } else {
            str += xows_jid_to_nick(list[n-1])+"</b> ";
          }
          xows_doc.chat_stat.innerHTML = str + xows_l10n_get("are currently writing");
        } else {
          // The easy part, peer is alone
          xows_doc.chat_stat.innerHTML = "<b>"+xows_jid_to_nick(list[0])+"</b> " + 
                                        xows_l10n_get("is currently writing");
        }
      }
    }
  } else {
    // Clear the typing notification
    xows_gui_writing_notif_clear();
  }
}

/**
 * Update the presence menu according current own presence show level
 * and status
 * 
 * @param {object}  user    User object.
 */
function xows_gui_user_update(user)
{
  // Compose status string
  xows_doc.user_stat.placeholder = user.stat?user.stat:xows_l10n_get("No status defined");
  // Reset the Status input value
  xows_doc.user_stat.value = "";
  xows_doc.user_stat.blur();
  // Change Show Status displays
  xows_doc.user_show.setAttribute("show", user.show);
  xows_doc.user_name.innerHTML = user.name;
  xows_doc.user_addr.innerHTML = "("+user.bare+")";
  
  // Update avatar
  xows_tpl_spawn_avat_cls(user.avat); //< Add avatar CSS class 
  xows_doc.user_avat.className = "h-"+user.avat;
}

/**
 * Update the window title bar according current selected contact
 */
function xows_gui_chat_fram_update()
{
  if(!xows_gui_peer) {
    // Reset to empty chat window
    xows_doc.chat_titl.innerHTML = "";
    xows_doc.chat_addr.innerHTML = "";
    xows_doc.head_meta.innerHTML = "";
    xows_doc.send_wrap.setAttribute("placeholder", "");
    xows_doc.chat_stat.innerHTML = "";
    xows_doc_show("chat_show", false);
    return;
  }
  // Update chat title bar
  xows_doc.chat_titl.innerHTML = xows_gui_peer.name;
  if(xows_gui_peer.type === XOWS_PEER_CONT) {
    xows_doc_show("chat_show", true);
    xows_doc_show("chat_addr", true);
    xows_doc.chat_show.setAttribute("show", xows_gui_peer.show);
    xows_doc.chat_addr.innerHTML = "("+xows_gui_peer.bare+")";
    xows_doc.head_meta.innerHTML = xows_gui_peer.stat?xows_gui_peer.stat:"";
  } else {
    xows_doc_show("chat_show", false);
    xows_doc_show("chat_addr", false);
    xows_doc.head_meta.innerHTML = xows_gui_peer.subj;
  }
  // Hide or show the proper notification button
  xows_doc_show("chat_noti", xows_gui_peer.noti);
  xows_doc_show("chat_mute", !xows_gui_peer.noti);
    
  // Change the input placeholder text
  xows_doc.send_wrap.setAttribute("placeholder",xows_l10n_get("Send a message to")+" "+xows_gui_peer.name+" ...");
}

/**
 * Switch the current roster tab.
 * 
 * @param   {string}  tab   Tab ID to select.
 */
function xows_gui_rost_switch(tab)
{
  let list = null;
  
  if(tab === "cont_tab") {
    if(xows_doc_hidden("cont_list")) {
      xows_doc_show("cont_list", true);             //< show
      xows_doc_show("room_list", false);            //< hide
      xows_doc_cls_rem("room_tab", "tab-enabled");  //< unselect
      xows_doc_cls_add("cont_tab", "tab-enabled");  //< select
      // Close right side panel
      xows_doc_cls_add("col_rside", "column-hide"); //< close
      // Search selected peer in contact list
      list = xows_doc.cont_ul;
    }
  } else {
    if(xows_doc_hidden("room_list")) {
      xows_doc_show("room_list", true);             //< show
      xows_doc_show("cont_list", false);            //< hide
      xows_doc_cls_rem("cont_tab", "tab-enabled");  //< unselect
      xows_doc_cls_add("room_tab", "tab-enabled");  //< select
      // Open right side panel
      xows_doc_cls_rem("col_rside", "column-hide"); //< open
      // Search selected peer in room list
      list = xows_doc.room_ul;
    }
  }
  if(list) {
    const select = list.querySelector(".peer-selected");
    xows_gui_switch_peer(select ? select.id : null);
  }
}

/**
 * Switch the current active chat contact.
 * 
 * @param   {string}  jid   Peer JID to select.
 */
function xows_gui_switch_peer(jid)
{
  // Get previous (current) contact
  const prev = xows_gui_peer;
  // Do no switch to same contact
  if(prev) {
    if(jid === prev.bare) return;
    // Send chat state to notify current user
    xows_cli_chatstate_set(prev, XOWS_CHAT_GONE);
  }
  // Get the next (to be selected) contact
  const next = jid ? xows_cli_get_peer(jid) : null;
  
  if(prev) {
    // Backup current history scroll position
    xows_gui_peer_scroll_backup(prev);
    // Backup current contact history in a document fragment
    xows_doc_frag_backup(prev.bare, "chat_hist");
    // Backup current occupant list in a document fragment
    xows_doc_frag_backup(prev.bare, "occu_list");
    // Remove "selected" class from <li> element
    if(next) {
      if(next.type === prev.type) {
        document.getElementById(prev.bare).classList.remove("peer-selected");
      }
    }
  }
  
  // If next contact is valid, show the chat <div>
  xows_doc_show("chat_fram", (next !== null));
  
  if(next) {
    // Add highlight class to new <li> element
    document.getElementById(next.bare).classList.add("peer-selected");
    // Restore contact history from document fragment
    xows_doc_frag_restore(next.bare, "chat_hist");
    // Restore occupant list from document fragment
    xows_doc_frag_restore(next.bare, "occu_list");
    // Restore history scroll position
    xows_gui_peer_scroll_restore(next);
    // Open or close right panel
    xows_doc_cls_set("col_rside", "column-hide", (next.type !== XOWS_PEER_ROOM));
    // Set the current contact
    xows_gui_peer = next;
    // Join the room if required
    if(next.type === XOWS_PEER_ROOM) 
      if(!next.join) xows_cli_room_join(next);
    // Clear contact unread notification for next peer
    xows_gui_unread_reset(next);
    // Reset the lazy loader and force update
    xows_doc_loader_clear();
    xows_doc_loader_monitor(xows_doc.chat_main);
    xows_doc_loader_check();
    // Check whether we should query some archived messages for this contact
    if(xows_doc.hist_ul.childNodes.length < 40) 
      xows_gui_mam_query(false, 40, 0);
    // If scroll is almost bottom, force it to bottom, because the 
    // browser seem to add some offset dans I don't want to spend houres
    // understanding why and how to prevent it...
    if(xows_gui_peer_scroll_bot(next) < 50) 
      xows_gui_peer_scroll_down(next);
    xows_log(2,"gui_switch_peer","peer \""+next.bare+"\"","selected");
  } else {
    // Set the current contact
    xows_gui_peer = null;
    // Copy initial empty element to current document
    xows_doc_frag_copy(null, "empty", "chat_hist");
    xows_doc_frag_copy(null, "empty", "occu_list");
    // Close right panel
    xows_doc_cls_add("col_rside", "column-hide");
    xows_log(2,"gui_switch_peer","peer","unselect");
  }
  
  // Reset the typing notification and stack
  xows_gui_writing_notif_clear();
  
  // Update chat controls and title bar
  xows_gui_chat_fram_update();
}

/**
 * Function to add and/or increase an unread message notification on 
 * the displayed roster contact DOM element.
 * 
 * @param   {object}  peer      Peer object, either Room or Contact.
 * @param   {string}  id        Message Id (not yet used).
 */
function xows_gui_unread_notify(peer, id)
{
  let n, cls, tab;
  // Select proper values depending peer type
  if(peer.type === XOWS_PEER_ROOM) {
    cls = "."+XOWS_CLS_ROOM_UNRD;
    tab = xows_doc.room_unrd;
  } else {
    cls = "."+XOWS_CLS_CONT_UNRD;
    tab = xows_doc.cont_unrd;
  }
  // Add the unread for the roster tab
  n = tab.firstChild ? parseInt(tab.innerHTML) : 0;
  tab.innerHTML = n + 1;
  tab.classList.remove(XOWS_CLS_HIDDEN); //< show
  // Get the corresponding peer <li> (room or contact) in roster 
  const li = document.getElementById(peer.bare);
  if(li) {
    // Inside the <li> search for the unread <div>
    const dv = li.querySelector(cls);
    // Increase the current unread count
    n = dv.firstChild ? parseInt(dv.innerHTML) : 0;
    dv.innerHTML = n + 1;
    dv.classList.remove(XOWS_CLS_HIDDEN); //< show
  }
}

/**
 * Function to clear any unread message notification on 
 * the displayed roster contact DOM element.
 * 
 * @param   {object} peer      Peer object, either Room or Contact.
 */
function xows_gui_unread_reset(peer)
{
  let n, cls, tab;
  // Select proper values depending peer type
  if(peer.type === XOWS_PEER_ROOM) {
    cls = "."+XOWS_CLS_ROOM_UNRD;
    tab = xows_doc.room_unrd;
  } else {
    cls = "."+XOWS_CLS_CONT_UNRD;
    tab = xows_doc.cont_unrd;
  }
  // Store current tab total unread
  n = tab.firstChild ? parseInt(tab.innerHTML) : 0;
  // Get the corresponding peer <li> (room or contact) in roster 
  const li = document.getElementById(peer.bare);
  if(li) {
    // Inside the <li> search for the unread <div>
    const dv = li.querySelector(cls);
    // Subtract the element unread from tab total
    n -= dv.firstChild ? parseInt(dv.innerHTML) : 0;
    // Reset the unready div properties
    dv.innerHTML = "";
    dv.classList.add(XOWS_CLS_HIDDEN); //< hide
  }
  // Update the tab unread count, or disable it if suitable
  tab.innerHTML = (n > 0) ? n : "";
  if(n <= 0) tab.classList.add(XOWS_CLS_HIDDEN); //< hide
}

/**
 * Add subscription request to the roster.
 * 
 * This function add a new Subscription request element in the 
 * roster
 * 
 * @param   {string}    bare    Subscription request sender bare JID.
 * @param   {string}    [nick]  Prefered nickname (if available).
 */
function xows_gui_subs_push(bare, nick)
{
  // Ensure subscribe <li> does not already exists
  let i = xows_doc.subs_ul.childNodes.length;
  while(i--) if(xows_doc.subs_ul.childNodes[i].id === bare) return;
  // Create a new subcription <li> element from template
  xows_doc.subs_ul.appendChild(xows_tpl_spawn_rost_subs(bare, nick));
  // Enable the notification on roster Contact Tab button
  xows_doc_show("subs_unrd", true); //< show
  xows_doc.subs_unrd.innerHTML = xows_doc.subs_ul.childNodes.length;
}

/**
 * Cleanup subscription request from roster.
 * 
 * This function remove a Subscription request element from the 
 * roster
 * 
 * @param   {string}    bare   Subscription request bare JID.
 */
function xows_gui_subs_remove(bare)
{
  // To ensure we don't remove the Contact <li> we manualy search
  // in subs_ul children
  let i = xows_doc.subs_ul.childNodes.length;
  while(i--) {
    if(xows_doc.subs_ul.childNodes[i].id === bare) {
      xows_doc.subs_ul.removeChild(xows_doc.subs_ul.childNodes[i]);
      break;
    }
  }
  // Update or disable the notification on roster Contact Tab button
  const n = xows_doc.subs_ul.childNodes.length;
  if(n) {
    xows_doc.subs_unrd.innerHTML = n;
  } else {
    xows_doc.subs_unrd.innerHTML = "";
    xows_doc_show("subs_unrd", false); //< hide
  }
}

/**
 * Handle the received composing state from other contacts to display
 * it in the chat window.
 * 
 * @param   {object}    peer  Sender peer object.
 * @param   {string}    from  Sender full JID.
 * @param   {number}    chat  Chat state value.
 */
function xows_gui_recv_chatstate(peer, from, chat)
{
  // Check whether incoming composing is the currently selected contact
  if(peer === xows_gui_peer) {
    // Check whether this is composing or another
    if(chat > XOWS_CHAT_PAUS) {
      xows_gui_writing_notif_set(from , true);
    } else {
      xows_gui_writing_notif_set(from , false);
    }
  }
}

/**
 * Create new message DOM object to be inserted in history.
 * 
 * @param   {object}    prev    Previous message in history.
 * @param   {object}    autor   Message autor (Contact, Own or Occupant).
 * @param   {string}    id      Message ID.
 * @param   {string}    from    Sender JID.
 * @param   {string}    body    Content.
 * @param   {string}    time    Time stamp.
 * @param   {boolean}   sent    Message is sent by client.
 * @param   {boolean}   recp    Force receipt received.
 */
function xows_gui_hist_gen_mesg(prev, autor, id, from, body, time, sent, recp)
{
  // Default is to add a simple aggregated message without author 
  // name and avatar
  let aggregate = true;
  
  // If previous message author is different or if elapsed time is 
  // greater than 1 houre, we create a new full message block
  if(prev) {
    const d = time - prev.getAttribute("time");
    if(d > XOWS_MESG_AGGR_THRESHOLD || prev.getAttribute("from") !== from)
      aggregate = false;
  } else {
    aggregate = false;
  }
  
  // Build new message from template
  if(aggregate) {
    // Create a simple aggregated message
    return xows_tpl_mesg_aggr_spawn(id, from, body, time, sent, recp);
  } else {
    // Create a new full message block with name and avatar
    return xows_tpl_mesg_full_spawn(id, from, body, time, sent, 
                                    recp, autor.name, autor.avat);
  }
}

/**
 * Callback function to add sent or received message to the history 
 * window
 * 
 * @param   {object}    peer    Message Peer.
 * @param   {string}    id      Message ID
 * @param   {string}    from    Sender JID
 * @param   {string}    body    Content string
 * @param   {string}    time    Time stamp
 * @param   {boolean}   sent    Message is sent by client.
 * @param   {boolean}   recp    Force receipt received.
 */
function xows_gui_hist_push(peer, id, from, body, time, sent, recp)
{
  // Get message author
  const autor = xows_cli_get_autor(peer, from);
  
  // Check whether message is from or to current chat contact, 
  // otherwise the message must be added off-screen
  const offscreen = (peer !== xows_gui_peer);
  
  // Add unread notification for this contact
  if(offscreen) xows_gui_unread_notify(peer, id);
  
  // Send browser notification popup
  if(!xows_gui_has_focus && !sent && peer.noti) 
    xows_gui_notify_new(autor.name, body, autor.avat);
  
  // Check whether end of history is croped, in this cas the new message
  // must not be appended, use will show it by qurying archives
  if(!sent && !hist_end.classList.contains(XOWS_CLS_HIDDEN)) {
    // Show the "new messages" warning
    xows_gui_peer_element(peer,"hist_new").classList.remove(XOWS_CLS_HIDDEN);
    // Do not append any message, return now
    return;
  }
  
  // Required elements, offscreen or from document
  const hist_ul = xows_gui_peer_element(peer,"hist_ul");
  
  // If message with id alread exists, return now to prevent double
  if(xows_doc_get_child(hist_ul, id))
    return;

  // get scroll bottom relative position before message insertion
  const scrl_bot = xows_gui_peer_scroll_bot(peer);

  // Create new message
  const li = xows_gui_hist_gen_mesg(hist_ul.lastChild, autor, id, 
                                    from, body, time, sent, recp);
                                      
  // Append message to history <ul>
  hist_ul.appendChild(li);
  
  // To prevent history to inflate infinitely we keep it to a maximum 
  // count of message and let user ability to query for archives
  if(hist_ul.childNodes.length > XOWS_GUI_HIST_SIZE) {
    hist_ul.removeChild(hist_ul.firstChild);
    xows_gui_peer_element(peer,"hist_beg").innerHTML = ""; //< Allow query history
  }
  
  // If it is an incomming message and client is consulting top of
  // history, we don't scroll at bottom but display a warning message
  if(!sent && (scrl_bot > 100)) {
    // Show the "new messages" warning
    xows_gui_peer_element(peer,"hist_new").classList.remove(XOWS_CLS_HIDDEN); //< show
  } else {
    // scroll history down
    xows_gui_peer_scroll_down(peer);
  }
  
  if(!offscreen) {
    // Add message medias to be monitored by lazy loader
    xows_doc_loader_monitor(li);
    xows_doc_loader_check();
  }

}

/**
 * Update avatar for chat history messages. Should be used carefully
 * to preserve resources.
 * 
 * @param   {object}    peer    Peer object.
 * @param   {string}    from    Message author JID to search.
 * @param   {string}    hash    Replacement avatar hash to set.
 */
function xows_gui_hist_avat_upd(peer, from, hash)
{
  if(!hash) return;

  // If incoming message is off-screen we get history <div> and <ul> of 
  // fragment history corresponding to contact
  const hist_ul = xows_gui_peer_element(peer,"hist_ul");
  
  const cls = "h-"+hash;
  
  let figure, li, i = hist_ul.childNodes.length;
  while(i--) {
    li = hist_ul.childNodes[i];
    if(li.getAttribute("from") === from) {
      figure = li.querySelector("FIGURE");
      if(figure) figure.className = cls;
    }
  }
}

/**
 * Handle incomming receipts from the server to update history message
 * element style.
 * 
 * @param   {object}    peer    Peer object.
 * @param   {string}    id      Receipt related message Id.
 */
function xows_gui_recv_receipt(peer, id)
{
  // Check whether message is from or to current chat contact
  const li = xows_gui_peer_element(peer,id);
  if(li) {
    li.querySelector("P").classList.add(XOWS_CLS_MESG_RECP);
  } else {
    xows_log(1,"gui_hist_set_receipt","message not found",id);
  }
}

/**
 * Handle incomming room subjec from MUC room
 * 
 * @param   {object}    peer    Peer object.
 * @param   {string}    subj    Subject string.
 */
function xows_gui_recv_subject(peer, subj)
{
  if(peer === xows_gui_peer) {
    xows_doc.head_meta.innerHTML = subj ? subj : "";
  }
}

/**
 * Reference to setTimeout sent fo temporize archive queries
 */
let xows_gui_mam_query_timeout = null;

/**
 * Query arvhived message for the current chat contact.
 * 
 * The 'after' parameter is used to choose to get either newers or 
 * older messages than the ones currently present in the history <div>
 * if 'after' parameter is true, the function will query for newer 
 * messages.
 * 
 * @param   {boolean}   after   Get archives beyond first of after last message.
 * @param   {number}    max     Maximum result to get, default is 20.
 * @param   {boolean}   delay   Delay to temporize query, default is 100 MS.
 */
function xows_gui_mam_query(after, max = 20, delay = 100)
{
  if(!xows_gui_mam_query_timeout) { //< One poll at a time...
    
    let start, end;
    // Get start or end time depending after parameter, we get time
    // always 25 MS after or before to prevent received the last or
    // first message already in history.
    if(after) {
      // Check whether we already got the latest message
      if(xows_doc_hidden("hist_end"))
        return;
      if(xows_doc.hist_ul.childNodes.length) 
        start = parseInt(xows_doc.hist_ul.lastChild.getAttribute("time"));
      xows_doc_cls_add("hist_end", "hist-loading");
    } else {
      // Check whether we already reached the first archived message
      if(xows_doc.hist_beg.innerHTML.length)
        return;
      if(xows_doc.hist_ul.childNodes.length) 
        end = parseInt(xows_doc.hist_ul.firstChild.getAttribute("time"));
      xows_doc_cls_add("hist_beg", "hist-loading");
    }
    // To prevent flood and increase ergonomy the archive query is
    // temporised with a fake loading time.
    xows_gui_mam_query_timeout = setTimeout(xows_cli_mam_query,
                                            delay, xows_gui_peer, 
                                            max, start, end, 
                                            xows_gui_mam_handle);
  }
}

/**
 * Callback function to handle the received archives for a contacts.
 * 
 * @param   {object}    peer        Archive related peer (Contact or Room)
 * @param   {object[]}  result      Received archived messages
 * @param   {boolean}   complete    Indicate results are complete (no remain) 
 */
function xows_gui_mam_handle(peer, result, complete)
{
  // Check whether message is from or to current chat contact, 
  // otherwise the message must be added off-screen
  const offscreen = (peer !== xows_gui_peer);
  
  // Get elements we need to interact with
  const hist_ul = xows_gui_peer_element(peer,"hist_ul");
  const hist_beg = xows_gui_peer_element(peer,"hist_beg");
  const hist_end = xows_gui_peer_element(peer,"hist_end");
  
  // Disable all spin loader
  hist_beg.classList.remove("hist-loading"); //< Allow query history
  hist_end.classList.remove("hist-loading"); //< Allow query history

  // Is this an initial query, with empty history ?
  const initial = (hist_ul.childNodes.length === 0);
  
  // Check whether we must append or prepend received archived messages
  let insert; 
  if(result.length && !initial) {
    // We compare time (unix epoch) to ensure last archived message is
    // older (or equal) than the first history message.
    if(hist_ul.firstChild.getAttribute("time") >= result[result.length-1].time) 
      insert = hist_ul.firstChild;
  }
  
  // To prevent history to inflate infinitely we keep it to a maximum 
  // count of message and let user ability to query for archives
  // Here we preventively cut the history as needed, either at top  
  // or bottom, depending the "direction" of the archive result.
  let crop = (hist_ul.childNodes.length-XOWS_GUI_HIST_SIZE)+result.length;
  if(crop > 0) {
    if(insert) {
      // Result are older messages, we delete messages at bottom of history
      while(crop--) hist_ul.removeChild(hist_ul.lastChild);
      hist_end.classList.remove(XOWS_CLS_HIDDEN); //< Allow query history
    } else {
      // Result are newer messages, we delete messages at top of history
      while(crop--) hist_ul.removeChild(hist_ul.firstChild);
      hist_beg.innerHTML = ""; //< Allow query history
    }
  }
  
  // Store scroll offset to restore it at its previous position
  const scroll_off = xows_gui_peer_scroll_off(peer);
    
  let autor, sent, new_li, pre_li;
  
  // Store the count of message actualy appened to the history <ul>
  let appended = 0;
  
  for(let i = 0, n = result.length; i < n; ++i) {
    
    // If message with id alread exists, skip to prevent double
    if(xows_doc_get_child(hist_ul, result[i].id))
      continue;

    // Get message author
    autor = xows_cli_get_autor(peer, result[i].from);

    // Create new message
    new_li = xows_gui_hist_gen_mesg(pre_li, autor, result[i].id, 
                                    result[i].from, result[i].body, 
                                    result[i].time, (autor === xows_cli_own), true);
    
    // Inserte or append, keep current as previous
    if(insert) {
      pre_li = hist_ul.insertBefore(new_li, insert);
    } else {
      pre_li = hist_ul.appendChild(new_li);
    }

    if(!offscreen) {
      // Add message medias to be monitored by lazy loader
      xows_doc_loader_monitor(new_li);
    }
    
    // Increase appended message
    appended++;
  }

  if(complete) {
    
    let beg = false;
  
    // If no message was appended, this mean query doubling or 
    // overlapped by already received messae (from MUC automatic 
    // history for example).
    // In this partiular case, we must ensure which  history bound 
    // was reached since "insert" will not necessarly be set
    if(result.length && appended === 0) {
      // compare id of the last result with the last history message
      if(result[0].id === hist_ul.firstChild.id) {
        beg = true;
      } else if (result[result.length-1].id !== hist_ul.lastChild.id) {
        // This is an unhandled situation
        xows_log(1,"gui_mam_handle","Complete MAM query exception",
                                    "bound messages ID mismatches");
      }
    } else {
      beg = (insert !== undefined || initial);
    }
    
    if(beg) {
      hist_beg.innerHTML = xows_l10n_get("Start of history");
    } else {
      hist_end.classList.add(XOWS_CLS_HIDDEN);
    }
  }

  if(!offscreen) {
    // Realign scroll to its previous position
    if(insert) xows_gui_peer_scroll_seek(peer,scroll_off);
    // For the first mam query, scroll down
    if(initial) xows_gui_peer_scroll_down(peer);
    // Launch lazy loader check routine
    xows_doc_loader_check();
  }
  
  xows_gui_mam_query_timeout = null; //< Allow a new archive query
}

/**
 * Variable to handle current room config form array
 */ 
let xows_gui_muc_cfg_form = null;

/**
 * Function to handle room config form to fulfill
 * 
 * @param   {object}  room    Room object to be configured
 * @param   {object}  form    Supplied form for config fields
 */ 
function xows_gui_muc_cfg_handle(room, form)
{
  // Store the current config form
  xows_gui_muc_cfg_form = form;
  
  // Fill page with received form data
  for(let i = 0, n = form.length; i < n; ++i) {
    switch(form[i]["var"])
    {
    case "muc#roomconfig_roomname":
      xows_doc.room_titl.value = form[i].value; break;
    case "muc#roomconfig_roomdesc":
      xows_doc.room_desc.value = form[i].value; break;
    case "muc#roomconfig_persistentroom":
      xows_doc.room_pers.checked = form[i].value; break;
    case "muc#roomconfig_publicroom":
      xows_doc.room_publ.checked = form[i].value; break;
    case "muc#roomconfig_roomsecret":
      //xows_doc.room_priv.checked = form[i].value.length;
      //xows_doc.room_pass.value = form[i].value; 
      break;
    case "muc#roomconfig_allowmemberinvites":
      //xows_doc.room_invt.checked = form[i].value; 
      break;
    case "muc#roomconfig_membersonly":
      xows_doc.room_mbon.checked = form[i].value; break;
    case "muc#roomconfig_changesubject":
    case "muc#roomconfig_moderatedroom":
      xows_doc.room_modo.checked = form[i].value; break;
    case "muc#roomconfig_whois":
      xows_doc.room_jids.value = form[i].value; break;
    case "muc#roomconfig_historylength":
      xows_doc.room_hmax.value = form[i].value; break;
    case "muc#roomconfig_defaulthistorymessages":
      xows_doc.room_hdef.value = form[i].value; break;
    case "muc#roomconfig_enablearchiving":
      xows_doc.room_arch.checked = form[i].value; break;
    }
  }
  
  // Show the room config div and hide subject div
  xows_doc_show("room_conf", true); //< show
  xows_doc_show("room_edit", false); //< hide
  
  // Show the room page
  xows_doc_show("page_room", true); //< show
}

/**
 * Callback function to handle click event on frames handles <li>.
 * 
 * @param   {object}  event   Event data
 */
function xows_gui_evt_click_hnd(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence
  
  const col_dv = (event.target === xows_doc.hnd_lside) ?
                    xows_doc.col_lside :
                    xows_doc.col_rside;
                    
  // Depending situation (media width) the frame must be forced to 
  // wide or forced to thin
  if(window.matchMedia("(min-width: 800px)").matches) {
    xows_doc_cls_rem(col_dv.id, "column-wide");
    xows_doc_cls_set(col_dv.id, "column-thin", (col_dv.clientWidth > 55));
  } else {
    xows_doc_cls_rem(col_dv.id, "column-thin");
    xows_doc_cls_set(col_dv.id, "column-wide", (col_dv.clientWidth < 55));
  }
}

/**
 * Callback function to handle click event on GUI Roster Tabs <li>.
 * 
 * @param   {object}  event   Event data
 */
function xows_gui_evt_click_rost_tabs(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence
  
  const bt = event.target.closest("button");
                
  if(bt) xows_gui_rost_switch(bt.getAttribute("id"));
}

/**
 * Callback function to handle click event on GUI 
 * Contact or Room list <li> element.
 * 
 * @param   {object}  event   Event data
 */
function xows_gui_evt_click_rost_ul(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  const li = event.target.closest("li");
  
  if(li) {
    // Check whether user clicked on button
    if(event.target.tagName === "IMG" || event.target.tagName === "BUTTON") {
      
      // Resend subscribe request
      xows_cli_subscribe_request(li.id);
      
      // Set info page content
      xows_doc.info_titl.innerHTML = xows_l10n_get("Resend authorization");
      const msg = "New authorization request was sent to contact.";
      xows_doc.info_text.innerHTML = xows_l10n_get(msg);
      
      // Show the info dialog
      xows_doc_show("page_info", true); //< show
      
    } else {
      // Select peer
      xows_gui_switch_peer(li.getAttribute("id"));
    }
  }
}

/**
 * Callback function to handle click event on GUI 
 * subscription list <li> element.
 * 
 * @param   {object}  event   Event data
 */
function xows_gui_evt_click_subs_ul(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence
  // We care only for click on buttons
  if(event.target.tagName !== "BUTTON")
    return;
  
  const button = event.target;
  const allow = (button.getAttribute("name") === "allow");
  
  // Retreive the parent <li> element of the event target
  const li = button.closest("li");
  const nick = li.hasAttribute("name") ? li.getAttribute("name") : null;
  
  // Send allow or deny subscription
  if(li) xows_cli_subscribe_allow(li.id, allow, nick);
}

/**
 * Function to handle click on roster add contact
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_cont_add(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence
  
  // Reset page content
  const msg = "Enter the JID address of the contact to add";
  xows_doc.cont_text.innerHTML = xows_l10n_get(msg);
  xows_doc.cont_text.classList.remove("dialog-text-error");
  
  xows_doc.cont_bare.value = "";
  xows_doc.cont_bare.readOnly = false;
  
  // Show up the upload dialog
  xows_doc_show("page_cont", true); //< show
}

/**
 * Function to handle click on roster add room
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_room_add(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Reset page content
  xows_doc.join_room.value = "";
  
  // Show up the upload dialog
  xows_doc_show("page_join", true); //< show
}

/**
 * Function to handle click on room occupant list
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_occu_list(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  if(event.target.tagName !== "IMG" && event.target.tagName !== "BUTTON")
    return;
  
  const li = event.target.closest("li");

  if(li) {
    const bare = xows_jid_to_bare(li.getAttribute("jid"));
    
    // Reset page content
    const msg = "Add this contact to your contact list ?";
    xows_doc.cont_text.innerHTML = xows_l10n_get(msg);
    xows_doc.cont_text.classList.remove("dialog-text-error");
    
    xows_doc.cont_bare.value = bare;
    xows_doc.cont_bare.readOnly = true;
    
    // Show up the upload dialog
    xows_doc_show("page_cont", true); //< show
  }
}

/**
 * Function to handle chat file button click by user
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_chat_upld(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Reset and enable Input value
  xows_doc.chat_file.value = "";

  // Open the file selector (emulate click)
  xows_doc.chat_file.click();
}

/**
 * Function to handle login button click by user
 * 
 * @param   {object}  event   Event object associated with trigger.
 */
function xows_gui_evt_click_page_auth(event)
{
  switch(event.target.id)
  {
  case "auth_cnct":
    // Hide login and show waiting page
    xows_doc_show("page_auth", false); //< hide
    xows_doc_show("page_wait", true); //< show
    xows_doc.wait_text.innerHTML = xows_l10n_get("Connecting...");
    xows_gui_auth = {};
    // Get login parameters from DOM
    xows_gui_auth.user = xows_doc.auth_user.value.toLowerCase();
    xows_gui_auth.pass = xows_doc.auth_pass.value;
    xows_gui_auth.cred = xows_doc.auth_cred.checked;
    // erase password from intput
    xows_doc.auth_pass.value = "";
    // Try connection
    xows_gui_connect();
    return;
  case "auth_regi":
    // Hide login and show register page
    xows_doc_show("page_auth", false); //< hide
    xows_doc_show("page_regi", true); //< show
  }
}

/**
 * Callback function to handle keyup event
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_key_page_auth(event)
{
  if(event.keyCode === 13)
      xows_doc.auth_cnct.click(); 
}

/**
 * Function to handle login button click by user
 * 
 * @param   {object}  event   Event object associated with trigger.
 */
function xows_gui_evt_click_page_regi(event)
{
  switch(event.target.id) 
  {
  case "regi_capt":
    xows_doc_cls_add("regi_capt", "captcha-checked"); //< show
    return;
  case "regi_subm":
    if(xows_doc_cls_has("regi_capt", "captcha-checked")) {
      // Hide login and show waiting page
      xows_doc_show("page_regi", false); //< hide
      xows_doc_show("page_wait", true); //< show
      xows_doc.wait_text.innerHTML = xows_l10n_get("Connecting...");
      // Get login parameters from DOM
      xows_gui_auth = {};
      xows_gui_auth.user = xows_doc.regi_user.value.toLowerCase();
      xows_gui_auth.pass = xows_doc.regi_pass.value;
      // erase password from intput
      xows_doc.regi_pass.value = "";
      // Try register
      xows_gui_register();
    }
    return;
  case "regi_canc": 
    // Hide register and show login page
    xows_doc_show("page_regi", false); //< hide
    xows_doc_show("page_auth", true); //< show
  }
}

/**
 * Callback function to handle keyup event
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_key_page_regi(event)
{
  if(event.keyCode === 13) 
      xows_doc.regi_subm.click();
}

/**
 * Function to handle upload Abort button click by user
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_page_upld(event)
{
  switch(event.target.id) 
  {
  case "upld_canc":
    // Disalbe the abort button
    xows_doc.upld_canc.disabled = true;
    // Abort the current upload
    xows_cli_upld_abort(); 
    // no break, to close page anyway
  case "upld_clos":
    // Close upload page
    xows_doc_show("page_upld", false);
  }
}

/**
 * Function to handle Contact Add button click by user
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_page_cont(event)
{
  switch(event.target.id) 
  {
  case "cont_subm": {
      // Get parameters from DOM
      let bare = xows_doc.cont_bare.value;
      
      // Check whether user entered a valid JID
      if(!xows_is_jid(bare)) {
        const er_msg = "Please enter a valid JID address in the form: user@domain.tld";
        xows_doc.cont_text.innerHTML = "<b>"+xows_l10n_get(er_msg)+"<b>";
        xows_doc.cont_text.classList.add("dialog-text-warn");
        return;
      }
      
      // Compose display name from JID
      const userid = bare.split("@")[0];
      const name = userid[0].toUpperCase() + userid.slice(1);
      
      // Request for roster add contact
      xows_cli_change_roster(bare, name);
    }
    // no break, to close page anyway 
  case "cont_canc":
    // Hide the dialog
    xows_doc_show("page_cont", false); //< hide
  }
}

/**
 * Callback function to handle keyup event
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_key_page_cont(event)
{
  if(event.keyCode === 13) 
      xows_doc.cont_subm.click(); 
}

/**
 * Function to handle User Parameters button click by user
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_page_card(event)
{
  switch(event.target.id) 
  {
  case "card_avat":
    // Emulate click on file input
    xows_doc.card_file.click();
    return; //< do not toggle the dialog
  case "card_subm": 
    let name, data, open;

    // Get parameters from DOM
    name = xows_doc.card_name.value;
    data = xows_doc.card_avat.data;
    open = xows_doc.card_open.checked;
    
    // Update user profile
    xows_cli_change_profile(name, data, open);
    // no break, to close page anyway 
  case "card_canc":
    // Hide the dialog
    xows_doc_show("page_card", false); //< hide
  }
}

/**
 * Callback function to handle keyup event
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_key_page_card(event)
{
  if(event.keyCode === 13) 
    xows_doc.card_subm.click();
}

/**
 * Function to handle avatar file dialog input change by user
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_change_card_file(event)
{
  if(xows_doc.card_file.files[0]) {
    // Create file reader to read image data
    const reader = new FileReader();
    reader.onload = function(event) {
      // Once data loaded, create new Image object
      const image = new Image();
      // Define onload function to handle loaded data
      image.onload = function(event) {
        // Set avatar data on background
        const url = xows_gen_avatar(XOWS_AVAT_SIZE, this);
        xows_doc.card_avat.data = url;
        xows_doc.card_avat.style.backgroundImage = "url(\""+url+"\")";
      };
      // Start image loading (should be quick)
      image.src = event.target.result;
    };
    // Launch file reading
    reader.readAsDataURL(xows_doc.card_file.files[0]);
  }
}

/**
 * Function to handle Room Config button click by user
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_page_room(event) 
{
  switch(event.target.id)
  {
  case "room_subm": 
    // Check which "tab" is displayed, either config or subject change
    if(xows_doc_hidden("room_conf")) {
      // This is a subject change
      xows_cli_send_subject(xows_gui_peer, xows_doc.room_subj.value);
    } else {
      // Get previously received form to fulfill
      const form = xows_gui_muc_cfg_form;
      // Fill from with page data
      for(let i = 0, n = form.length; i < n; ++i) {
        switch(form[i]["var"])
        {
        case "muc#roomconfig_roomname":
          form[i].value = xows_doc.room_titl.value; break;
        case "muc#roomconfig_roomdesc":
          form[i].value = xows_doc.room_desc.value; break;
        case "muc#roomconfig_persistentroom":
          form[i].value = xows_doc.room_pers.checked?"1":"0"; break;
        case "muc#roomconfig_publicroom":
          form[i].value = xows_doc.room_publ.checked?"1":"0"; break;
        /*
        case "muc#roomconfig_roomsecret":
          form[i].value = xows_doc.room_priv.checked ? 
                          xows_doc.room_pass.value : "";
          break;
        */
        case "muc#roomconfig_membersonly":
          form[i].value = xows_doc.room_mbon.checked?"1":"0"; break;
        case "muc#roomconfig_moderatedroom":
          form[i].value = xows_doc.room_modo.checked?"1":"0"; break;
        case "muc#roomconfig_whois":
          form[i].value = xows_doc.room_jids.value; break;
        case "muc#roomconfig_historylength":
          form[i].value = xows_doc.room_hmax.value; break;
        case "muc#roomconfig_defaulthistorymessages":
          form[i].value = xows_doc.room_hdef.value; break;
        case "muc#roomconfig_enablearchiving":
          form[i].value = xows_doc.room_arch.checked?"1":"0"; break;
        }
      }
      // Submit fulfilled form
      xows_cli_room_cfg_set(xows_gui_peer, form);
    }
    // no break, to close page anyway 
  case "room_canc":
    // Hide the dialog
    xows_doc_show("page_room", false); //< hide
  }
}

/**
 * Callback function to handle keyup event
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_key_page_room(event)
{
  if(event.keyCode === 13) 
    xows_doc.room_subm.click();
}

/**
 * Function to handle chat Room join dialog button click by user
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_page_join(event) 
{
  switch(event.target.id)
  {
  case "join_subm": {
      const name = xows_doc.join_room.value;
      const nick = xows_cli_own.name;
      // Create a new room
      const room = xows_cli_room_join(null, name, nick);
      if(room) {
        // Switch peer, this is needed for proper subsequent room config
        xows_gui_switch_peer(room.bare);
      }
    }
    // no break, to close page anyway 
  case "join_canc": 
    // Hide the dialog
    xows_doc_show("page_join", false); //< hide
  }
}

/**
 * Callback function to handle keyup event
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_key_page_join(event)
{
  if(event.keyCode === 13)
    xows_doc.join_subm.click();
}

/**
 * Callback function to handle click on info dialog button
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_page_info(event)
{
  // React only on button click
  if(event.target.tagName !== "BUTTON")
    return;
    
  // Remove the eventual opaque baclground
  xows_doc.page_info.classList.remove("dialog-background");
  // Close info dialog
  xows_doc_show("page_info", false); //< hide
}

/**
 * Function to handle chat emoji menu click by user
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_emoj_menu(event)
{
  // Retreive the parent <li> element of the event target
  const li = event.target.closest("li");
  
  // Check whether we got click from drop or button
  if(li) {
    xows_doc.send_edit.innerHTML += ":"+li.getAttribute("name")+":";
    // disable placeholder
    xows_doc.send_wrap.classList.remove("send-phld");
    //input.value += event.target.innerHTML;
    xows_doc.send_edit.focus();// inp.select();
  } 
  
  // Toggle menu drop
  xows_doc_cls_tog("drop_emoj", XOWS_CLS_HIDDEN); 
  
  xows_cli_activity_wakeup(); //< Wakeup presence
}

/**
 * Function to handle click on show menu button or drop panel.
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_show_menu(event)
{
  // Retreive the parent <li> element of the event target
  const li = event.target.closest("li");

  // Set presence as selected level
  if(li) {
    const show = parseInt(li.getAttribute("name"));
    if(show >= 0) {
      xows_cli_change_presence(show);
    } else {
      // Reset login page
      xows_doc.auth_text.innerHTML = xows_l10n_get("Please enter your username and password");
      xows_doc.auth_user.value = "";
      xows_doc.auth_pass.value = "";
      
      // Disable credentials (request again for login)
      if(navigator.credentials) 
        navigator.credentials.preventSilentAccess();
      
      // Disconnect
      xows_gui_disconnect();
      
      // Login page
      xows_init_login_user();
      
      return;
    }
  }

  // Toggle drop menu
  xows_doc_cls_tog("drop_show", XOWS_CLS_HIDDEN);
  
  xows_cli_activity_wakeup(); //< Wakeup presence
}

/**
 * Function to handle click on show menu button or drop panel.
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_user_menu(event)
{
  // Setup page informations
  xows_doc.card_name.value = xows_cli_own.name;

  // Get temps or cached avatar
  const url = xows_cli_cache_avat_get(xows_cli_own.avat);
  xows_doc.card_avat.style.width = XOWS_AVAT_SIZE + "px";
  xows_doc.card_avat.style.height = XOWS_AVAT_SIZE + "px";
  xows_doc.card_avat.style.backgroundImage = "url(\""+url+"\")";
  
  // custom property to store image data
  xows_doc.card_avat.data = xows_cli_cache_avat_get(xows_cli_own.avat);
  
  // Open the user page
  xows_doc_show("page_card", true); //< show
  
  xows_cli_activity_wakeup(); //< Wakeup presence
}

/**
 * Function to handle click on Room Config button or drop menu
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_room_menu(event)
{
  // Retreive the parent <li> element of the event target
  const li = event.target.closest("li");
  
  if(li) {
    // Get clicked menu name
    switch(li.getAttribute("name")) 
    {
    case "subject":
      // Set input value from current chat header element
      xows_doc.room_subj.value = xows_doc.head_meta.innerHTML;
      // Show the room page subject div, hide config
      xows_doc_show("room_conf", false); //< hide
      xows_doc_show("room_edit", true); //< show
      // Open the room page
      xows_doc_show("page_room", true); //< show
      break;
    case "config":
      // Get current room config to be modified, this will trigger
      // a callback to handle the received config
      xows_cli_room_cfg_get(xows_gui_peer, xows_gui_muc_cfg_handle);
      break;
    }
  }
  
  // Toggle drop menu
  xows_doc_cls_tog("drop_room",XOWS_CLS_HIDDEN);
  
  xows_cli_activity_wakeup(); //< Wakeup presence
}

/**
 * Function to handle click on Chat Notify button
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_chat_noti(event)
{
  if(event.target.id === "chat_noti") {
    xows_gui_notify_allow = 0;
    xows_doc_show("chat_mute", true);
    xows_doc_show("chat_noti", false);
    xows_gui_peer.noti = false;
  } else {
    xows_gui_notify_allow_query();
  }
}

/**
 * Table to store current down key
 */
const xows_gui_evt_keydown = new Array(256);

/**
 * Callback function to handle keydown & keyup event on chat send 
 * editable div
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_keyud_send_edit(event)
{
  // Enable key down according received event
  xows_gui_evt_keydown[event.keyCode] = (event.type === "keydown");

  // Check for key down event
  if(event.type === "keydown") {

    // Check for prend Enter
    if(event.keyCode === 13) {
  
      // Check whether shift key is press, meaning escaping to
      // add new line in input instead of send message.
      if(xows_gui_evt_keydown[16])
        return;
    
      // Prevent browser to append the new-line in the text-area
      event.preventDefault();
      // Send message
      if(xows_gui_peer) {
        let content = xows_doc.send_edit.innerText;
        if(content.length) { 
          xows_cli_send_message(xows_gui_peer, content);
          // Add CSS class to show placeholder
          xows_doc_cls_add("send_wrap", "send-phld");
          // Erase and disable edit area until enter keyup
          xows_doc.send_edit.innerHTML = "";
        }
        // Reset chatsate to active
        xows_cli_chatstate_set(xows_gui_peer, XOWS_CHAT_ACTI);
      }
    } else {
      // Set composing
      if(xows_gui_peer) 
        xows_cli_chatstate_set(xows_gui_peer, XOWS_CHAT_COMP);
    }
  }

  xows_cli_activity_wakeup(); //< Wakeup presence
}

/**
 * Callback function to handle input event on chat send editable div
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_input_send_edit(event)
{
  // Check inner text content to show placeholder
  if(xows_doc.send_edit.innerText.length < 2) {
    if(xows_doc.send_edit.innerText.trim().length === 0) {
      // Add CSS class to show placeholder
      xows_doc_cls_add("send_wrap", "send-phld");
      xows_doc.send_edit.innerHTML = ""; //< empty any residual <br>
      // Return now
      return;
    }
  }
  
  // Hide the placeholder text
  if(xows_doc_cls_has("send_wrap", "send-phld"))
    xows_doc_cls_rem("send_wrap", "send-phld");
}

/**
 * Callback function to handle keypress event on status input
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_keyp_user_stat(event)
{
  if(event.keyCode === 13) { //< Return key 
    
    // Get and reset value
    const stat = xows_doc.user_stat.value;
    xows_doc.user_stat.value = "";
    
    // Inform XMPP server of the new status
    xows_cli_change_status(stat);
    
    // Unfocus and set the placeholder as current status
    xows_doc.user_stat.placeholder = stat.length ? stat : xows_l10n_get("No status defined");
    xows_doc.user_stat.blur();
  }
  
  xows_cli_activity_wakeup(); //< Wakeup presence
}

/**
 * Callback function to handle user scroll the chat history window.
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_scroll_chat_main(event)
{ 
  // Shortcut to chat history <div>
  const dv = xows_doc.chat_main;
  
  // Switch from full to empty chat frame can generate a scroll equal 
  // to 0, the following condition prevent unwanted query triggering.
  if(dv.scrollHeight === dv.clientHeight) 
    return;

  // Check whether the scroll is a top of frame
  if(dv.scrollTop < 20) {
    // Query archive for current chat contact
    xows_gui_mam_query(false);
  }
  
  // Check whether the scroll is at bottom of frame
  if(((dv.scrollHeight - dv.scrollTop) - dv.clientHeight) < 20) {
    // Hide the "new messages" warning if displayed
    xows_doc_show("hist_new", false); //< hide
    // Check whether we have cropped history
    if(!xows_doc_hidden("hist_end")) {
      // Query archive for current chat contact
      xows_gui_mam_query(true);
    }
  }
}

/**
 * Callback function to handle user click into the chat history.
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_chat_main(event)
{ 
  // Check for click on New Message notification banner
  if(event.target.id === "hist_new") {
    
    //Check whether last message is reachable
    if(xows_doc_hidden("hist_end")) {
      
      // Scroll chat history to bottom
      xows_doc.chat_main.scrollTop = xows_doc.chat_main.scrollHeight;
      
    } else {
      // Last message is beyond the current history "window", 
      // we must query last archived messages
      
      // Reset the chat history to initial stat
      xows_doc.hist_ul.innerHTML = "";
      xows_doc.hist_beg.innerHTML = "";
      xows_doc_show("hist_end", false);
      
      // Query for the last archives, with no delay
      xows_gui_mam_query(false, XOWS_GUI_HIST_SIZE, 0);
    }
  }
}

/**
 * Function to handle upload dialog input change by user
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_change_chat_file(event)
{
  // Endable the upload button if input has value
  if(xows_gui_peer.bare && xows_doc.chat_file.files[0]) {
    
    // Reset dialog to its initial state
    xows_doc_cls_rem("upld_text", "dialog-text-error");
    xows_doc_show("upld_canc", true); //< show
    xows_doc_show("upld_clos", false); //< hide

    xows_doc.upld_pbar.parentNode.classList.remove(XOWS_CLS_HIDDEN);
    xows_doc.upld_pbar.style.width = "0%";

    // Set the upload dialog message
    xows_doc.upld_text.innerHTML = xows_l10n_get("Uploading") + " : ";
    xows_doc.upld_text.innerHTML += xows_doc.chat_file.files[0].name;
  
    // Send upload query
    xows_cli_upld_query(xows_doc.chat_file.files[0],
                                xows_gui_cli_upld_error,
                                xows_gui_cli_upld_success,
                                xows_gui_cli_upld_progress,
                                xows_gui_cli_upld_abort);
    
    // Show up the upload dialog
    xows_doc_show("page_upld", true); //< show
  }
}

/**
 * Handle the client/Web page focus change.
 */
function xows_gui_evt_focus()
{
  const old_focus = xows_gui_has_focus;
  xows_gui_has_focus = document.hasFocus();
  
  // Wakeup client activity
  if(xows_gui_has_focus && !old_focus)
    xows_cli_activity_wakeup();
}

/**
 * Handle mouse button up anywhere in the document.
 */
function xows_gui_evt_mouseup(event)
{
  // TODO: Soit repenser entièrement la gestion des click et menus
  // soit supprimer cette fonction. 
  
  // Retreive the parent <li> element of the event target
  const li = event.target.closest("li");
  
  // Retreive the parent <li> element of the event target
  const bt = event.target.closest("button");
                   
  if(li) console.warn("xows_gui_evt_mouseup: " + li.getAttribute("name"));
  if(bt) console.warn("xows_gui_evt_mouseup: " + bt.id);
}

/**
 * Callback function to handle user close or exit web page
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_unload(event)
{
  xows_log(2,"gui_evt_unload","Unload event from browser");
  xows_gui_disconnect();
}

/**
 * Store browser Notification authorization
 */
let xows_gui_notify_allow = 0;

/**
 * Store awaiting notification untile permission
 */
let xows_gui_notify_await = null;

/**
 * Handle received notification permission from user
 * 
 * @param   {string}  permit   Received permission
 */
function xows_gui_notify_allow_handle(permit)
{
  xows_gui_notify_allow = permit;
  
  if(permit === "granted") {
    
    if(xows_gui_peer) {
      xows_gui_peer.noti = true;
      xows_doc_show("chat_mute", false);
      xows_doc_show("chat_noti", true);
    }
    
    // Send an reset awaiting notification
    if(xows_gui_notify_await) {
      xows_gui_notify_new(xows_gui_notify_await.title, 
                          xows_gui_notify_await.body, 
                          xows_gui_notify_await.avat);
      xows_gui_notify_await = null;
    }
  }
}

/**
 * Query user for notification permission
 */
function xows_gui_notify_allow_query()
{
  // Reset notification permission
  xows_gui_notify_allow = 0;
  // Request permission to user
  Notification.requestPermission().then(xows_gui_notify_allow_handle);
}
  
/**
 * Pop a new browser Notification
 * 
 * @param   {string}  title   Notification title (peer name)
 * @param   {string}  body    Notification body (message body)
 * @param   {string}  avat    Optional Avatar hash
 */
function xows_gui_notify_new(title, body, avat)
{
  switch(xows_gui_notify_allow)
  {
  case "denied":
    return;
  case "granted":
    {
      // Sound is slower than light...
      xows_gui_notify_sound.play();
      
      // Retrieve the cached, actual or temporary, avatar dataUrl
      const icon = xows_cli_cache_avat_get(avat);
      let notif;
      if(icon) {
        notif = new Notification(title,{"body":body,"icon":icon});
      } else {
        notif = new Notification(title,{"body":body,"icon":"/" + xows_options.root + "/icon.svg"});
      }
    }
    break;
  default:
    xows_gui_notify_await = {"title":title,"body":body,"avat":avat};
    // Request permission to user for notifications
    xows_gui_notify_allow_query();
    break;
  }
}

/**
 * Function to disconnect.
 */
function xows_gui_reset()
{
  // Clean and reset GUI elements
  xows_gui_switch_peer(null);
  
  // All element to hide
  const hide = ["page_main", "page_upld", "page_cont", "page_card",
                "page_join", "page_room", "page_regi", "page_info",
                "page_auth", "page_wait", "drop_show", "chat_fram", 
                "hist_end", "chat_stat", "drop_emoj", "hist_new", 
                "room_list" ];
  
  let i = hide.length;
  while(i--) xows_doc_show(hide[i], false);
  
  xows_doc.cont_ul.innerHTML = "";
  xows_doc.room_ul.innerHTML = "";
  xows_doc.hist_ul.innerHTML = "";
  xows_doc.modo_ul.innerHTML = "";
  xows_doc.memb_ul.innerHTML = "";
  xows_doc.hist_beg.innerHTML = "";

  // Reset roster tabs
  xows_doc_cls_add("cont_tab", "tab-enabled");
  xows_doc_cls_rem("room_tab", "tab-enabled");
  xows_doc_show("cont_list", true);
  
  // Reset columns setup
  xows_doc_cls_rem("col_lside", "column-thin");
  xows_doc_cls_rem("col_lside", "column-wide");
  xows_doc_cls_rem("col_lside", "column-hide");
  xows_doc_cls_rem("col_rside", "column-thin");
  xows_doc_cls_rem("col_rside", "column-wide");
  xows_doc_cls_add("col_rside", "column-hide");
  
  // Delete all peer's offscreen fragment
  for(const peer in xows_doc_frag_db) {
    // we keep the "empty" fragment
    if(peer !== "empty") delete xows_doc_frag_db[peer];
  }
  
  xows_gui_error_page = "page_auth";
}

/**
 * Function to disconnect.
 */
function xows_gui_disconnect()
{
  xows_log(2,"gui_disconnect","Cleaning GUI session");
  
  // Send chat state to notify current user
  if(xows_gui_peer) 
    xows_cli_chatstate_set(xows_gui_peer, XOWS_CHAT_GONE);

  // Reset GUI elements
  xows_gui_reset();

  // Disconnect client
  xows_cli_disconnect();
}

/**
 * Function to handle file upload progression step
 * 
 * @param   {number}  percent   Data upload progression in percent
 */ 
function xows_gui_cli_upld_progress(percent) 
{
  // Update progress bar
  xows_doc.upld_pbar.style.width = percent + "%";
}

/**
 * Function to handle Http Upload error
 * 
 * @param   {string}  mesg    Reported error message with code
 */
function xows_gui_cli_upld_error(mesg) 
{
  // hide the abort button, show th close button
  xows_doc_show("upld_canc", false); //< hide
  xows_doc_show("upld_clos", true); //< show

  // Hide the progress bar
  xows_doc.upld_pbar.parentNode.classList.add(XOWS_CLS_HIDDEN);
  
  // Set the upload dialog message
  xows_doc_cls_add("upld_text","dialog-text-error");
  xows_doc.upld_text.innerHTML = "<b>"+xows_l10n_get("Upload failed")+"</b><br>"+mesg;
}

/**
 * Function to handle Http Upload error
 * 
 * @param   {object}  event     Error event object
 */
function xows_gui_cli_upld_abort() 
{
  // Hide the Upload page
  xows_doc_show("page_upld", false); //< hide
  
  // Do nothing elese...
}

/**
 * Function to handle file upload success
 * 
 * @param   {string}  url   Returned download URL of the uploaded file
 */
function xows_gui_cli_upld_success(url) 
{
  // Hide the Upload page
  xows_doc_show("page_upld", false); //< hide

  // Send a message to current selected contact with URL to download
  // We use small delay to let the HTTP server refreching its cache
  setTimeout(xows_cli_send_message, 400, xows_gui_peer, url);
}

/**
 * Function to display registration success and fallback to normal
 * login page.
 * 
 * @param   {string}  jid   Registered JID.
 */
function xows_gui_cli_register(jid)
{
  xows_log(2,"gui_cli_register","Show info page");
  
  xows_doc.info_titl.innerHTML = xows_l10n_get("Account creation");
  xows_doc.info_head.innerHTML = "<b>"+xows_l10n_get("Congratulation !")+"</b>";
  
  let mesg = xows_l10n_get("The account") + " <b>" + jid + "</b> ";
  mesg += xows_l10n_get("was successfully created.") + "<br><br>";
  mesg += xows_l10n_get("You can now login using") + " <b>";
  // If domain optio is not set, the login must be the full JID
  mesg += xows_options.domain ? jid.split("@")[0] : jid;
  mesg += "</b> " + xows_l10n_get("as username.");
  
  xows_doc.info_text.classList = "dialog-text";
  xows_doc.info_text.innerHTML = mesg;
  
  // Reset page and dialog to initial state
  xows_gui_error_page = "page_auth";
  xows_doc_show("page_regi", false); //< hide
  xows_doc_show("page_wait", false); //< hide
  xows_doc_show("page_upld", false); //< hide
  xows_doc_show("page_auth", true); //< show
  
  // Add opaque background to info dialog
  xows_doc.page_info.classList.add("dialog-background");
  
  // Display the info page
  xows_doc_show("page_info", true); //< show
}

/**
 * Function to display error dialog (login dialog with error message).
 *  
 * @parma {number}  code    Signal code for closing.
 * @param {string}  [mesg]  Optional information or error message.
 */
function xows_gui_cli_error(code, mesg)
{  
  let cls, title;
  
  switch(code) 
  {
  case 0:   // error
    title = xows_l10n_get("Error");
    cls = "dialog-text-error";
    break;
  case 1:   // warning
    title = xows_l10n_get("Warning");
    cls = "dialog-text-warn";
    break;
  case 2:   // success
    title = xows_l10n_get("Success");
    cls = "dialog-text-success";
    break;
  default:  // notice
    title = xows_l10n_get("Information");
    cls = "";
    break;
  }
  
  xows_doc.info_titl.innerHTML = title;
  xows_doc.info_text.classList = "dialog-text " + cls;
  xows_doc.info_text.innerHTML = "<b>"+xows_l10n_get(mesg)+"<b>";

  // Reset page and dialog to initial state
  xows_gui_error_page = "page_auth";
  xows_doc_show("page_regi", false); //< hide
  xows_doc_show("page_wait", false); //< hide
  xows_doc_show("page_upld", false); //< hide
  xows_doc_show("page_auth", true); //< show
  
  // Display the info page
  xows_doc_show("page_info", true); //< show
}

/**
 * Handle client connexion closed. 
 * 
 * @parma {number}  code    Signal code for closing.
 * @param {string}  [mesg]  Optional information or error message.
 */
function xows_gui_cli_close(code, mesg)
{
  let cls, title, page;
  
  switch(code) 
  {
  case XOWS_SIG_ERR:
    cls = "dialog-text-error";
    page = xows_gui_error_page;
    break;
  case XOWS_SIG_WRN:
    title = xows_l10n_get("Warning");
    cls = "dialog-text-warn";
    page = "page_info";
    break;
  case XOWS_SIG_LOG:
    title = xows_l10n_get("Success");
    cls = "dialog-text-success";
    page = "page_info";
    break;
  default:
    return;
  }
  
  if(page === "page_info") {
    xows_doc.info_titl.innerHTML = title;
  }
  
  const dlg_text = xows_doc[page].querySelector(".dialog-text");
  if(dlg_text) {
    dlg_text.innerHTML = "<b>"+xows_l10n_get(mesg)+"<b>";
    dlg_text.classList = "dialog-text " + cls;
  }
  
  // Reset page and dialog to initial state
  xows_gui_error_page = "page_auth";
  xows_doc_show("page_upld", false); //< hide
  xows_doc_show("page_regi", false); //< hide
  xows_doc_show("page_auth", true); //< show
  xows_doc_show("page_wait", false); //< hide
  
  // force Disconnect to clear GUI and client
  xows_gui_disconnect();
  
  // Display the info page
  xows_doc_show(page, true); //< show
}

/**
 * Stored application options.
 */
let xows_options = {
  root            : "xows",     //< Default Lib root folder
  url             : "ws://localhost/xmpp-websocket/", //< XMPP Websocket URL
  domain          : "localhost",                      //< XMPP server domain
  locale          : "en-US",    //< Default Locales
  theme           : "dark",     //< Them to load
  verbose         : 1,          //< Verbosity level
  uncache         : false,      //< Force uncache of loaded styles and templates
  allow_register  : false,      //< Allow user to access to account register dialog
  legacy_vcard    : false,      //< Force usage of legacy XEP-0054 vcard-temp instead of XEP-0292 vCard4 Over XMPP
  vcard4_notify   : true,       //< Request for Vcard4 PubSub notifications
  avatar_notify   : false       //< Request for User Avatar PubSub notifications
};

/**
 * Function that initialize the normal login process, by user, in 
 * opposition of the automatic login, via credentials
 */
function xows_init_login_user()
{
  xows_log(2,"xows_init_login_user","Normal login way");
  
  // Show or hide the "remember me" check box according browser
  // compatibility
  xows_doc_show("auth_save", (window.PasswordCredential));
  
  // Hide the loading page and show login page
  xows_doc_show("page_auth", true); //< show
  xows_doc_show("page_wait", false); //< hide
}

/**
 * Function to automatically login using browser saved credential
 * 
 * @param   {object}  cred   Found credential to login.
 */
function xows_init_login_auto(cred)
{
  if(cred) {
    
    xows_log(2,"xows_init_login_auto","Found credential","try audacious login way");
    
    // Hide login and show waiting page
    xows_doc_show("page_auth", false); //< hide
    xows_doc_show("page_wait", true); //< show
    xows_doc.wait_text.innerHTML = xows_l10n_get("Connecting...");
    
    xows_gui_auth = { "user"  : cred.id,
                      "pass"  : cred.password };

    // Try connect
    xows_gui_connect();
    
  } else {
    xows_log(2,"xows_init_login_auto","No credential found","Fallback to normal login");
    xows_init_login_user();
  }
}

/**
 * Private initialization function, used as callback, called once the
 * Doc (Document) module is successfully initialized.
 * 
 * This is the last initialization callback, loading process is  
 * completed and the application now effectlively start.
 */
function xows_init_ondoc()
{
  // Check whether credentials are available for auto-login
  if(window.PasswordCredential) {
    
    // Try to find credential for automatic login
    const options = { "password"    : true,
                      "mediation"   : "optional" };
                      
    // Promises... promise().you(unreadable => {code})...
    navigator.credentials.get(options).then(  xows_init_login_auto, 
                                              xows_init_login_user);
    
  } else {
  
    // Normal login with user interaction
    xows_init_login_user();
  }
}

/**
 * Private initialization function, used as callback, called once the
 * Tpl (template) module is successfully initialized.
 */
function xows_init_ontpl()
{
  // Continue the initialization process by initializing the DOM
  // interfacing module. This is the last initialization step.
  xows_doc_init(xows_init_ondoc);
}

/**
 * Private initialization function, used as callback, called once the
 * l10n module is successfully initialized.
 */
function xows_init_onl10n()
{
  // Continue the initialization process by loading the HTML templates
  // files used for client GUI.
  xows_tpl_init(xows_init_ontpl);
}

/**
 * Initialize and start the main_menucation using the specified parameters
 * and options.
 * 
 * @param   {string}  url       XMPP over WebSocket service URL
 * @param   {object}  options   Application option as dictionary object
 */
function xows_init(options)
{
  // Store options
  if(options) {
    if("root" in options)           xows_options.root = options.root;  
    if("url" in options)            xows_options.url = options.url;
    if("domain" in options)         xows_options.domain = options.domain; 
    if("locale" in options)         xows_options.locale = options.locale;
    if("theme" in options)          xows_options.theme = options.theme;
    if("verbose" in options)        xows_options.verbose = options.verbose;
    if("uncache" in options)        xows_options.uncache = options.uncache;
    if("allow_register" in options) xows_options.allow_register = options.allow_register;
    if("legacy_vcard" in options)   xows_options.legacy_vcard = options.legacy_vcard;
    if("vcard4_notify" in options)  xows_options.vcard4_notify = options.vcard4_notify;
    if("avatar_notify" in options)  xows_options.avatar_notify = options.avatar_notify;
  }
  // Start initialization process buy the l10n module, wchich will 
  // loading the desired local data base if available
  xows_l10n_select(xows_options.locale, xows_init_onl10n);
}
