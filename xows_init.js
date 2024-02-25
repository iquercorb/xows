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
/* ------------------------------------------------------------------
 *
 *                         Main "Public" API
 *
 * ------------------------------------------------------------------ */

/**
 * Stored default application options
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
  avatar_notify   : true,       //< Request for User Avatar PubSub notifications
  login_delay     : 2000,       //< Delay (in milliseconds) between registration and failed attempts
  hist_size    : 256,        //< Size of message history "window" (history pull will gather half this value)
  extern_services : []          //< Additionnal External Services (as XEP-0215 replacement with same fashion)
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
 * Private initialization function, used as callback, called once the
 * Doc (Document) module is successfully initialized
 *
 * This is the last initialization callback, loading process is
 * completed and the application now effectlively start.
 */
function xows_init_ondoc()
{
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
    if(options.hasOwnProperty("root"))             xows_options.root = options.root;
    if(options.hasOwnProperty("url"))              xows_options.url = options.url;
    if(options.hasOwnProperty("domain"))           xows_options.domain = options.domain;
    if(options.hasOwnProperty("locale"))           xows_options.locale = options.locale;
    if(options.hasOwnProperty("theme"))            xows_options.theme = options.theme;
    if(options.hasOwnProperty("verbose"))          xows_options.verbose = options.verbose;
    if(options.hasOwnProperty("uncache"))          xows_options.uncache = options.uncache;
    if(options.hasOwnProperty("allow_register"))   xows_options.allow_register = options.allow_register;
    if(options.hasOwnProperty("legacy_vcard"))     xows_options.legacy_vcard = options.legacy_vcard;
    if(options.hasOwnProperty("vcard4_notify"))    xows_options.vcard4_notify = options.vcard4_notify;
    if(options.hasOwnProperty("avatar_notify"))    xows_options.avatar_notify = options.avatar_notify;
    if(options.hasOwnProperty("fail_delay"))       xows_options.fail_delay = options.fail_delay;
    if(options.hasOwnProperty("hist_size"))     xows_options.hist_size = options.hist_size;
    if(options.hasOwnProperty("extern_services"))  xows_options.extern_services = options.extern_services;
  }

  xows_log(2,"init","xows init start");

  // Start init by the l10n module, other init will follow
  xows_l10n_select(xows_options.locale, xows_init_onl10n);
}
