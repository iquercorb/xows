/*
 * @licstart
 *                    X.O.W.S - XMPP Over WebSocket
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
 *                  Copyright (c) 2019-2025 Eric M.
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
/* ---------------------------------------------------------------------------
 *
 * Caching and local Storage Management Module
 *
 * ---------------------------------------------------------------------------*/
/* ---------------------------------------------------------------------------
 * Avatar image data storage and caching routines
 * ---------------------------------------------------------------------------*/
/**
 * Map for cached avatar data, stored per SAH-1 hash
 */
const xows_cach_avat_db = new Map();

/**
 * Save avatar Data URI to localStorage and live DB
 *
 * The 'hash' value can be specified either to store data using an arbitrary
 * key or to bypass data hash computation in case the proper hash value is
 * already available.
 *
 * @param   {string}    data      Image Data URI to store
 * @param   {string}   [hash]     Optional precomputed hash to use as key
 * @param   {boolean}  [temp]     Optional flag indicating data must not be saved in localStorage
 *
 * @return  {string}    Avatar data SHA-1 hash used as key
 */
function xows_cach_avat_save(data, hash, temp)
{
  // Use the supplied ID or compute SHA-1 hash of data
  if(!hash) {
    const base64 = xows_uri_to_data(data);
    // The 'xows_hash_sha1' function takes strings as UTF-16 (2-bytes) encoded
    // to be converted to UTF-8, then to Uint8Array. On the other hand, atob()
    // produces an bytes array **ersatz** where each character is to be taken as
    // an unsigned byte. Of course, decoding this as an UTF-16 string results in
    // caca boudin. Thanks to the JavaScript nonsense typing for the journey...
    const binary = xows_b64_to_bytes(base64); //< This is REQUIRED to get proper Hash value
    hash = xows_bytes_to_hex(xows_hash_sha1(binary));
  }

  // Store in live DB and localStorage
  xows_cach_avat_db.set(hash, data);
  if(!temp) localStorage.setItem(hash, data);

  return hash;
}

/**
 * Checks whether avatar hash exists in localStorage or live DB
 *
 * @param   {string}    hash      Avatar data hash to search
 *
 * @return  {boolean}   True if exists, false otherwise
 */
function xows_cach_avat_has(hash)
{
  if(xows_cach_avat_db.has(hash)) {
    return true;
  } else if(localStorage.hasOwnProperty(hash)) {
    return true;
  }
  return false;
}

/**
 * Returns avatar Data URI corresponding to the given hash
 *
 * @param   {string}    hash      Avatar data hash to search
 *
 * @return  {string}    Avatar Data URI string
 */
function xows_cach_avat_get(hash)
{
  // Try in live DB
  if(xows_cach_avat_db.has(hash))
    return xows_cach_avat_db.get(hash);

  // Try in localStorage (and load to live DB)
  if(localStorage.hasOwnProperty(hash)) {
    xows_cach_avat_db.set(hash,localStorage.getItem(hash));
    return xows_cach_avat_db.get(hash);
  }

  return null;
}

/**
 * Obtain temporary avatar Data URI corresponding to the given seed
 *
 * The temporary-avatar image is either generated (then stored) or retrieved
 * from a previous generation based on the same 'iden' parameter.
 *
 * In order to make them clearly distinguishable from the true avatar images,
 * the temporary-avatar images data are not stored per computed image-data
 * SHA-1 hash, but per computed SDBM hash value (way shorter) from the 'iden'
 * parameter.
 *
 * @param   {string}    iden      Peer JID or Occupant UID
 * @param   {string}   [hash]     Optional precomputed hash to use as key
 *
 * @return  {string}    Avatar data-URL
 */
function xows_cach_avat_temp_data(iden, hash)
{
  // Generate 4-bytes SDBM hash from identity
  const sdbm = xows_hash_sdbm(iden);

  // Create hex-string version of hash number
  if(!hash) hash = xows_bytes_to_hex(sdbm);

  // Check whether temp avatar already exist
  if(xows_cach_avat_db.has(hash)) {

    return xows_cach_avat_db.get(hash);

  } else {

    // Generate dummy avatar using SDBM number as seed
    const data = xows_gen_avatar(XOWS_AVAT_SIZE, null, xows_bytes_to_int(sdbm));

    // Store in live DB and localStorage
    xows_cach_avat_db.set(hash, data);

    return data;
  }
}

/**
 * Obtain hash string for temporary avatar storage from the specified
 * Peer identity (or any other string).
 *
 * Use this function to keep consistency accross generated temporary avatars
 * in conjonction with xows_cach_avat_temp_data()
 *
 * @param   {string}    iden      Peer JID or Occupant UID
 *
 * @return  {string}    SDBM Hash value as hexadecimal string
 */
function xows_cach_avat_temp_hash(iden)
{
  return xows_bytes_to_hex(xows_hash_sdbm(iden));
}

/* ---------------------------------------------------------------------------
 * Peer informations storage and caching routines
 * ---------------------------------------------------------------------------*/
/**
 * Map for cached Peer informations
 */
const xows_cach_peer_db = new Map();

/**
 * Returns the most suitable identifier for Peer, it can be either
 * Peer JID or Occupant Unique ID if available.
 *
 * @param   {object}    peer      Peer object
 *
 * @return  {string}    Peer identifier (JID or Occupant-UID)
 */
function xows_cach_peer_iden(peer)
{
  if(peer.type === XOWS_PEER_OCCU && peer.ocid)
    return peer.ocid;

  return peer.addr;
}

/**
 * Stores Self or Peer informations to localStorage and live DB
 *
 * @param   {object}    peer      Peer Object
 */
function xows_cach_peer_save(peer)
{
  const iden = xows_cach_peer_iden(peer);

  let cach;

  // Get existing cached data (Local Storage)
  try {
    cach = JSON.parse(localStorage.getItem(iden));
  } catch(e) {
    xows_log(1,"cach_peer_save","JSON parse error",iden);
  }

  if(cach) {

    // Update cached data
    cach.name = peer.name;
    cach.avat = peer.avat;
    cach.noti = peer.noti;
    // Special behavior for status, null or undefined value
    // this mean it was set by client process.
    if(typeof peer.stat === "string") {
      cach.stat = peer.stat;
    }

  } else {

    // Create new cach data
    cach = {"name":peer.name,
            "avat":peer.avat,
            "stat":peer.stat,
            "noti":peer.noti};
  }

  // Store in live DB and localStorage
  xows_cach_peer_db.set(iden, cach);
  localStorage.setItem(iden, JSON.stringify(cach));
}

/**
 * Checks whether Peer informations exists in localStorage or live DB
 *
 * @param   {string}    iden      Peer JID or Occupant UID
 *
 * @return  {string}    True if cached data exists, false otherwise
 */
function xows_cach_peer_has(iden)
{
  if(xows_cach_peer_db.has(iden)) {
    return true;
  } else if(localStorage.hasOwnProperty(iden)) {
    return true;
  }
  return false;
}

/**
 * Retrieve Self or Peer informations stored in localStorage or live DB
 *
 * @param   {string}    iden      Peer JID or Occupant UID
 *
 * @return  {object}    Peer informations or null if not found
 */
function xows_cach_peer_get(iden)
{
  // Try in live DB
  if(xows_cach_peer_db.has(iden))
    return xows_cach_peer_db.get(iden);

  // Try in localStorage (and load to live DB)
  if(localStorage.hasOwnProperty(iden)) {
    try {
      xows_cach_peer_db.set(iden, JSON.parse(localStorage.getItem(iden)));
    } catch(e) {
      // malformed data
      xows_log(1,"cach_peer_get","JSON parse error",iden);
      localStorage.removeItem(iden);
      return null;
    }
    return xows_cach_peer_db.get(iden);
  }

  return null;
}

/**
 * Updates the given Peer's informations from its stored data if available
 *
 * @param   {object}    peer      Peer object to update
 */
function xows_cach_peer_fetch(peer)
{
  const cach = xows_cach_peer_get(xows_cach_peer_iden(peer));
  if(cach) {
    if(cach.name) peer.name = cach.name;
    if(cach.avat) peer.avat = cach.avat;
    if(cach.stat) peer.stat = cach.stat;
    if(cach.noti) peer.noti = cach.noti;
  }
}

/* ---------------------------------------------------------------------------
 * Entity Capabilities (XEP-0115) storage and caching routines
 * ---------------------------------------------------------------------------*/
/**
 * Array to store discovered entities's capabilities (XEP-0115)
 */
const xows_cach_caps_db = new Map();

/**
 * Stores the given entity-capabilities (features)
 *
 * @param   {string}    node      Entity caps node (url)
 * @param   {string[]}  feat      Entity caps feature list
 */
function xows_cach_caps_save(node, feat)
{
  // Store in live DB and localStorage
  xows_cach_caps_db.set(node, feat);
  localStorage.setItem(node, JSON.stringify(feat));
}

/**
 * Check whether stored entity-capabilities is available
 *
 * @param   {string}    node      Entity caps node (url) to check
 *
 * @return  {boolean}   True if entity was found, false otherwise
 */
function xows_cach_caps_has(node)
{
  if(xows_cach_caps_db.has(node)) {
    return true;
  } else if(localStorage.hasOwnProperty(node)) {
    return true;
  }
  return false;
}

/**
 * Retrieve stored entity-capabilities (features)
 *
 * @param   {string}    node      Entity caps node (url)
 *
 * @return  {string[]}  Entity caps feature list
 */
function xows_cach_caps_get(node)
{
  if(xows_cach_caps_db.has(node))
    return xows_cach_caps_db.get(node);

  // Try in localStorage (and load to live DB)
  if(localStorage.hasOwnProperty(node)) {
    try {
      xows_cach_caps_db.set(node,JSON.parse(localStorage.getItem(node)));
    } catch(e) {
      // malformed data
      xows_log(1,"cach_caps_get","JSON parse error",e);
      localStorage.removeItem(node);
      return null;
    }
    return xows_cach_caps_db.get(node);
  }

  return null;
}

/* ---------------------------------------------------------------------------
 * SASL Auth storage and caching routines
 * ---------------------------------------------------------------------------*/
/**
 * Stores SASL auth parameters.
 *
 * @param   {object}    data      Authentication data
 */
function xows_cach_auth_save(data)
{
  if(!xows_options.login_sasl_store)
    return; //< You Shall Not Save !

  // Store in live DB and localStorage
  try {
    localStorage.setItem("auth_data", JSON.stringify(data));
  } catch(e) {
    xows_log(1,"cach_auth_save","storage error",e);
  }
}

/**
 * Check whether stored SASL auth parameters is available
 *
 * @return  {boolean}   True if username was found, false otherwise
 */
function xows_cach_auth_has()
{
  return localStorage.hasOwnProperty("auth_data");
}

/**
 * Retrieve stored SASL auth parameters.
 *
 * @return  {object}  Authentication data
 */
function xows_cach_auth_get()
{
  // Try in localStorage (and load to live DB)
  if(!localStorage.hasOwnProperty("auth_data"))
    return null;

  let data = null;
  try {
    data = JSON.parse(localStorage.getItem("auth_data"));
  } catch(e) {
    xows_log(1,"cach_auth_get","JSON parse error",e);
  }

  return data;
}

/**
 * Deletes stored SASL auth parameters.
 */
function xows_cach_auth_reset()
{
  localStorage.removeItem("auth_data");
}
