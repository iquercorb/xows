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
 * L10N (Localization) Module
 *
 * ---------------------------------------------------------------------------*/

/**
 * Storage for string translation database
 */
let xows_l10n_db = {};

/**
 * Globale variable for current selected locale
 */
let xows_l10n_current = "en";

/**
 * Module Event-Forwarding callback for Module initialized and ready
 */
let xows_l10n_fw_onready = function() {};

/**
 * Select Locale to use.
 *
 * This loads the specified locale translation database. If the specified
 * locale is unavailable, the default "en" is used.
 *
 * @param   {string}    locale    Locale to select
 * @param   {function}  onready   Callback for Module Ready (Initialized) event
 */
function xows_l10n_select(locale, onready)
{
  // Set callback function
  if(xows_isfunc(onready))
    xows_l10n_fw_onready = onready;

  // We first load the available locale/lang list
  let path = xows_options.lib_path+"/locale/LC_list.json";

  // Forces browser to reload (uncache) templates files by adding a
  // random string to URL. This option is mainly for dev and debug
  if(xows_options.tpl_force_uncache)
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
        xows_init_failure(this.status, this.responseURL);
      }
    }
  };

  // Increase count of template remaining to load
  xows_log(2,"l10n_select","loading locale list",path);
  xhr.send();
}

/**
 * Downloads the translation JSON database for the specified Locale.
 *
 * The 'local' parameter must be an existing subfolder within the
 * library's "locale/" folder, where a 'LC_db.json' can be found. For instance,
 * the proper value to load French database would be "fr", resolving to the
 * "locale/fr/LC_db.json" download path.
 *
 * @param   {string}    locale    Locale database path
 * @param   {function}  onready   Callback to call once operation completed.
 */
function xows_l10n_db_load(locale, onready)
{
  // Set callback function
  if(xows_isfunc(onready))
    xows_l10n_fw_onready = onready;

  // build download path URL
  let path = xows_options.lib_path+"/locale/"+locale+"/LC_db.json";

  // Forces browser to reload (uncache) templates files by adding a
  // random string to URL. This option is mainly for dev and debug
  if(xows_options.tpl_force_uncache)
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
 * Returns the corresponding translation of the given text according
 * loaded Locale database.
 *
 * If the translated version of the given text is unavailable, the string
 * supplied in 'text' parameter is then returned.
 *
 * @param   {string}    text    Text to get translation
 *
 * @return  {string}    The text translation or initially supplied string.
 */
function xows_l10n_get(text)
{
  const str = xows_l10n_db[text];
  return str ? str : text;
}

/**
 * Static replacement routine (String.Replace) for translation process.
 *
 * This callback is used for the in-Place text translation function as
 * remplacement function for String.Replace(), it has not utility outside
 * this context.
 *
 * @param   {string}    corresp   Correspondance string
 * @param   {string}    match     Regexp extracted string to translate
 *
 * @return  {string}    Translated string or initial extractred string.
 */
function xows_l10n_parse_fn(corresp, match)
{
  const str = xows_l10n_db[match];
  return str ? str : match;
}

/**
 * Parse and translate the given HTML Asset according the current loaded
 * locale.
 *
 * This function scans for specific syntaxic patterns to identify strings to
 * be translated. It is mainly used to translate theme's HTML assets inner
 * static text, identified by the ${'...'} pattern.
 *
 * @param   {string}    data      Data string to be parsed and translated.
 */
function xows_l10n_parse(data)
{
  return data.replace(/\${['"](.*?)['"]}/g, xows_l10n_parse_fn);
}

/**
 * Check whether the specified locale is available.
 *
 * @param   {string}    locale    Locale ID string
 *
 * @return  {boolean}   True if locale is available, false otherwise
 */
function xows_l10n_has(locale)
{
  return (xows_l10n_db[locale] !== null && xows_l10n_db[locale] !== undefined);
}

/**
 * Creates properly formated date string from the supplied timestamp using
 * the currently selected locale.
 *
 * Notice that this function uses navigator's Date Standard built-in object.
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
 * Returns the formated houre string from the supplied timestamp using
 * the currently selected locale.
 *
 * The 'timestamp' parameter can be full date with year, only the houre
 * component will be extracted.
 *
 * Notice that this function uses navigator's Date Standard built-in object.
 *
 * @param   {string}    stamp     Standard formated timestamp
 * @param   {boolean}   short     Indicates to remove trailing PM/AM mention
 *
 * @return  {string}    Extracted houre string.
 */
function xows_l10n_houre(stamp, short)
{
  const date = new Date(stamp);
  const hour = date.toLocaleTimeString(xows_l10n_current,{hour:'2-digit',minute:'2-digit'});
  return short ? hour.replace(/AM|PM/,'') : hour;
}

