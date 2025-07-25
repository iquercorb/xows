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
 *                         Main "Public" API
 *
 * ------------------------------------------------------------------ */

/**
 * Stored default application options
 */
let xows_options = {
  lib_path            : "/xows",    //< Path to XOWS files (relative to HTTP base URL)
  lib_verbose         : 1,          //< Verbosity level

  tpl_load_mincss     : false,      //< Load minified CSS theme file (disable for theme edit or debug purpose)
  tpl_force_uncache   : false,      //< Prevent browser cache (force reload assets by appending URL suffix)

  xmpp_url            : "ws://localhost/xmpp-websocket/", //< XMPP server Websocket address

  login_force_domain  : "",         //< Optional domain to append to XMPP login username
  login_fail_delay    : 2,          //< Delay (in seconds) between registration and failed attempts
  resume_timeout      : 3,          //< Delay (in minutes) before definitely abort connection resumption
  resume_try_delay    : 10,         //< Delay (in seconds) between each connection resumption attempt

  gui_locale          : "en-US",    //< GUI Localization
  gui_theme           : "dark",     //< GUI theme (folder within /theme subdirectory)
  gui_allow_register  : false,      //< Enable XMPP account register (show proper link and dialog)

  cli_archive_count   : 50,         //< Maximum count of history message to fetch each query
  cli_archive_delay   : 500,        //< Temporization delay for older message fetch
  cli_pepnotify_bkms  : true,       //< Request for Native Bookmarks (XEP-0402) PEP notifications
  cli_pepnotify_nick  : true,       //< Request for User Nickname (XEP-0172) PEP notifications
  cli_avat_autopub    : true,       //< Auto-publish the default Avatar if none exists for user
  cli_pepnotify_avat  : true,       //< Request for User Avatar (XEP-0084) PEP notifications
  cli_extern_services : []          //< Additionnal External Services (as XEP-0215 replacement with same fashion)
};

/**
 * Function that initialize the normal login process, by user, in
 * opposition of the automatic login, via credentials
 */
function xows_init_login_user()
{
  xows_log(2,"init_login_user","normal login");

  // Show or hide the "remember me" check box according browser
  // compatibility
  (window.PasswordCredential) ? xows_doc_show("auth_save")
                              : xows_doc_hide("auth_save");

  // Open login screen
  xows_gui_page_auth_open();
}

/**
 * Function to automatically login using browser saved credential
 *
 * @param   {object}    cred      Found credential to login
 */
function xows_init_login_auto(cred)
{
  if(cred) {

    xows_log(2,"init_login_auto","found credential","try auto login");

    // Open wait screen
    xows_gui_page_wait_open("Connecting...");

    xows_gui_auth = { "user"  : cred.id,
                      "pass"  : cred.password };

    // Try connect
    xows_gui_connect();

  } else {
    xows_log(2,"init_login_auto","No credential found","Fallback to normal login");
    xows_init_login_user();
  }
}

/**
 * Initialization function, used as callback, called once the
 * Doc (Document) module is successfully initialized
 *
 * This is the last initialization callback, loading process is
 * completed and the application now effectlively start.
 */
function xows_init_ondoc()
{
  // Initialize Client
  xows_cli_init();

  // Initialize GUI
  xows_gui_init();

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
 * Tpl (template) module is successfully initialized
 */
function xows_init_ontpl()
{
  // Continue the initialization process by initializing the DOM
  // interfacing module. This is the last initialization step.
  xows_doc_init(xows_init_ondoc);
}

/**
 * Private initialization function, used as callback, called once the
 * l10n module is successfully initialized
 */
function xows_init_onl10n()
{
  // Continue the initialization process by loading the HTML templates
  // files used for client GUI.
  xows_tpl_init(xows_init_ontpl);
}

/**
 * Initialize and start the main_menucation using the specified parameters
 * and options
 *
 * @param   {string}    url       XMPP over WebSocket service URL
 * @param   {object}    options   Application option as dictionary object
 */
function xows_init(options)
{
  // Store options
  if(options) {
    if(options.hasOwnProperty("lib_path"))              xows_options.lib_path = options.lib_path;
    if(options.hasOwnProperty("lib_verbose"))           xows_options.lib_verbose = options.lib_verbose;

    if(options.hasOwnProperty("tpl_force_uncache"))     xows_options.tpl_force_uncache = options.tpl_force_uncache;
    if(options.hasOwnProperty("tpl_load_mincss"))       xows_options.tpl_load_mincss = options.tpl_load_mincss;

    if(options.hasOwnProperty("xmpp_url"))              xows_options.xmpp_url = options.xmpp_url;

    if(options.hasOwnProperty("login_force_domain"))    xows_options.login_force_domain = options.login_force_domain;
    if(options.hasOwnProperty("login_fail_delay"))      xows_options.login_fail_delay = options.login_fail_delay;
    if(options.hasOwnProperty("resume_timeout"))        xows_options.resume_timeout = options.resume_timeout;
    if(options.hasOwnProperty("resume_try_delay"))      xows_options.resume_try_delay = options.resume_try_delay;

    if(options.hasOwnProperty("gui_locale"))            xows_options.gui_locale = options.gui_locale;
    if(options.hasOwnProperty("gui_theme"))             xows_options.gui_theme = options.gui_theme;
    if(options.hasOwnProperty("gui_allow_register"))    xows_options.gui_allow_register = options.gui_allow_register;

    if(options.hasOwnProperty("cli_archive_count"))     xows_options.cli_archive_count = options.cli_archive_count;
    if(options.hasOwnProperty("cli_archive_delay"))     xows_options.cli_archive_delay = options.cli_archive_delay;
    if(options.hasOwnProperty("cli_pepnotify_bkms"))    xows_options.cli_pepnotify_bkms = options.cli_pepnotify_bkms;
    if(options.hasOwnProperty("cli_pepnotify_nick"))    xows_options.cli_pepnotify_nick = options.cli_pepnotify_nick;
    //if(options.hasOwnProperty("vcard4_notify"))    xows_options.vcard4_notify = options.vcard4_notify;
    if(options.hasOwnProperty("cli_avat_autopub"))      xows_options.cli_avat_autopub = options.cli_avat_autopub;
    if(options.hasOwnProperty("cli_pepnotify_avat"))    xows_options.cli_pepnotify_avat = options.cli_pepnotify_avat;
    if(options.hasOwnProperty("cli_extern_services"))   xows_options.cli_extern_services = options.cli_extern_services;
  }

  // If missing, add  a leading slash to root path to make it
  // absolute (i.e. relative to URL root)
  if(xows_options.lib_path.charAt(0) != "/")
    xows_options.lib_path = "/"+xows_options.lib_path;

  xows_log(2,"init","xows init start");

  // Start init by the l10n module, other init will follow
  xows_l10n_select(xows_options.gui_locale, xows_init_onl10n);
}

/**
 * Show initialization fatal error (due to asset loading error)
 *
 * @param   {number}    code      Loading error code (HTTP response code)
 * @param   {string}    path      URL/Path to related file.
 */
function xows_init_fatal(code, path)
{
  let html = "<h1>XOWS init failed</h1><h4>Asset file loading error ( HTTP error "+code+" )</h4>";
  html += "<big><code>"+path.match(/(.+?)(?:\?.*|$)/)[1]+"</code></big>";
  html += "<h5>Did you set the proper library/assets root path ?</h5>";
  document.body.style = "padding:20px;text-align:center;background:#1A1A1F;color:#FC8484";
  document.body.innerHTML = html;
}
