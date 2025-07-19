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
 *                     Copyright (c) 2022 Eric M.
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
 *                         l10n API Module
 *
 * ------------------------------------------------------------------ */

/**
 * Default empty database, to be loaded
 */
let xows_l10n_db = {};

/**
 * Current selected locale, this is used for javascript built-in
 * l18n functions
 */
let xows_l10n_current = "en";

/**
 * Callback function to call whene locale data is successfulluy
 * loaded and initialized
 */
let xows_l10n_fw_onready = function() {};

/**
 * Load the specified locale data to be used for translations. If
 * the specified locale is unavailable, the default one is used
 *
 * @param   {string}    locale    Local to select
 * @param   {string}    onready   Callback to call once operateion succeed
 */
function xows_l10n_select(locale, onready)
{
  // Set callback function
  if(xows_isfunc(onready))
    xows_l10n_fw_onready = onready;

  // We first load the available locale/lang list
  let path = xows_options.root+"/locale/LC_list.json";

  // Forces browser to reload (uncache) templates files by adding a
  // random string to URL. This option is mainly for dev and debug
  if(xows_options.uncache)
    path += "?" + xows_gen_nonce_asc(4);

  // Launch request to download locale/lang list file
  const xhr = new XMLHttpRequest();
  xhr.open("GET", path, true);
  xhr.onreadystatechange= function() {
    if(this.readyState === 4) {
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
        xows_init_fatal(this.status, this.responseURL);
      }
    }
  };

  // Increase count of template remaining to load
  xows_log(2,"l10n_select","loading locale list",path);
  xhr.send();
}

/**
 * Launch the download of the specified language DB json file
 *
 * @param   {string}    locale    Language DB subfolder to load
 * @param   {string}    onready   Callback to call once operateion succeed
 */
function xows_l10n_db_load(locale, onready)
{
  // Set callback function
  if(xows_isfunc(onready))
    xows_l10n_fw_onready = onready;

  // build download path URL
  let path = xows_options.root+"/locale/"+locale+"/LC_db.json";

  // Forces browser to reload (uncache) templates files by adding a
  // random string to URL. This option is mainly for dev and debug
  if(xows_options.uncache)
    path += "?" + xows_gen_nonce_asc(4);

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
 * selected locale
 *
 * @param   {string}    msgid     Template text to get translation
 *
 * @return  {string}    The translated text if available, the value of msgid otherwise
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
 * locale
 *
 * The function search for specific pattern to identify template texts
 * to substitute by corresponding translated text.
 *
 * @param   {string}    text      Text to be translated
 */
function xows_l10n_parse(text)
{
  return text.replace(/\${['"](.*?)['"]}/g, xows_l10n_parseFunc);
}

/**
 * Check whether the specified locale is available
 *
 * @param   {string}    locale    Locale ID string
 *
 * @return  {boolean}   True if locale is available, false otherwise
 */
function xows_l10n_hasLocale(locale)
{
  return (xows_l10n_db[locale] !== null && xows_l10n_db[locale] !== undefined);
}

/**
 * Create the properly formated date string from the supplied timestamp
 *
 * @param   {string}    stamp     Standard formated timestamp
 *
 * @return  {string}    Human readable and localized date and time string
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
 * Create the properly formated houre string from the supplied timestamp
 *
 * @param   {string}    stamp     Standard formated timestamp
 *
 * @return  {string}    Simple houre string extrated from fulle timestamp
 */
function xows_l10n_houre(stamp)
{
  const date = new Date(stamp);

  return date.toLocaleTimeString(xows_l10n_current,{hour:'2-digit',minute:'2-digit'}).replace(/AM|PM/,'');
}

