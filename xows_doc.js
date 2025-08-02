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
 *                     DOM Managment API Module
 *
 * ------------------------------------------------------------------ */

/**
 * Get document element by Id (alias of getElementById)
 *
 * @param   {string}    id    Element id to get.
 */
function xows_doc(id)
{
  return document.getElementById(id);
}

/**
 * Add an event listener to the specified object with proper options
 *
 * @param   {element}   element   Element to add event listener to
 * @param   {string}    event     Event type to listen
 * @param   {function}  callback  Callback function for event listener
 * @param   {boolean}   [passive] Optional force enable or disable passive
 */
function xows_doc_listener_add(element, event, callback, passive = true)
{
  element.addEventListener(event,callback,{capture:false,passive:passive});
}

/**
 * Remove an event listener from the specified object
 *
 * @param   {element}   element   Element to add event listener to
 * @param   {string}    event     Event type to listen
 * @param   {function}  callback  Callback function for event listener
 * @param   {boolean}   [passive] Optional force enable or disable passive
 */
function xows_doc_listener_rem(element, event, callback, passive = true)
{
  element.removeEventListener(event,callback,{capture:false,passive:passive});
}

/**
 * Chechk whether element has class in its class list
 *
 * @param   {string}    id        Document element id
 * @param   {string}    clsname   Class name
 */
function xows_doc_cls_has(id, clsname)
{
  return document.getElementById(id).classList.contains(clsname);
}

/**
 * Toggle the specified class in element class list
 *
 * @param   {string}    id        Document element id
 * @param   {string}    clsname   Class name
 * @param   {string}    force     Force add or remove
 */
function xows_doc_cls_tog(id, clsname, force)
{
  return document.getElementById(id).classList.toggle(clsname, force);
}

/**
 * Add the specified class to element class list
 *
 * @param   {string}    id        Document element id
 * @param   {string}    clsname   Class name
 */
function xows_doc_cls_add(id, clsname)
{
  document.getElementById(id).classList.add(clsname);
}

/**
 * Remove the specified class to element class list
 *
 * @param   {string}    id        Document element id
 * @param   {string}    clsname   Class name
 */
function xows_doc_cls_rem(id, clsname)
{
  document.getElementById(id).classList.remove(clsname);
}

/**
 * Show the specified item, either element object or id
 *
 * @param   {string}    id        Document element id
 * @param   {boolean}   force     Force show or hide
 */
function xows_doc_show(id, force = true)
{
  document.getElementById(id).hidden = !force;
}

/**
 * Hide the specified item, either element object or id
 *
 * @param   {string}    id        Document element id
 * @param   {boolean}   force     Force hide or show
 */
function xows_doc_hide(id, force = false)
{
  document.getElementById(id).hidden = !force;
}

/**
 * Check whether the specified item, either element object or id is
 * hidden (has the .hidden class)
 *
 * @param   {string}    id        Document element id
 *
 * @return  {boolean}   True if element is visible, false otherwise
 */
function xows_doc_hidden(id)
{
  return document.getElementById(id).hidden;
}

/**
 * Object that stores offscreen Documents Fragments
 */
const xows_doc_frag_db = new Map();

/**
 * Clone specified element from source offscreen slot to
 * destination offscreen slot
 *
 * @param   {string}    dst       Destination offscreen slot identifier
 * @param   {string}    src       Source offscreen slot identifier
 */
function xows_doc_frag_clone(dst, src)
{
  // Create new destination DocumentFragment
  const d = document.createDocumentFragment();
  xows_doc_frag_db.set(dst, d);

  // Get source DocumentFragment
  const s = xows_doc_frag_db.get(src);

  // clone source nodes to destination
  for(let i = 0; i < s.children.length; ++i)
    d.appendChild(s.children[i].cloneNode(true));
}

/**
 * Backup specified element content to an offscreen document fragment
 *
 * @param   {string}    id        Source DOM element ID
 * @param   {string}    slot      Offscreen slot identifier
 * @param   {boolean}  [clone]    Indicate that nodes must be cloned
 */
function xows_doc_frag_export(id, slot, clone = false)
{
  // Create new destination DocumentFragment
  const d = document.createDocumentFragment();
  xows_doc_frag_db.set(slot, d);

  // Get source DOM element
  const s = document.getElementById(id);

  if(clone) {

    // clone children from document to fragment
    for(let i = 0; i < s.children.length; ++i)
      d.appendChild(s.children[i].cloneNode(true));

  } else {

    // move children from fragment to document
    while(s.children.length)
      d.appendChild(s.firstChild);

  }
}

/**
 * Import stored offscreen document fragment to current DOM
 *
 * @param   {string}    slot      Offscreen slot identifier
 * @param   {string}    id        Destination parent DOM element ID
 * @param   {boolean}  [clone]    Clone nodes
 */
function xows_doc_frag_import(slot, id, clone = false)
{
  if(!xows_doc_frag_db.has(slot))
    return;

  // Get source Fragment and destination DOM element
  const s = xows_doc_frag_db.get(slot);
  const d = document.getElementById(id);

  // empty destination
  d.innerText = "";

  if(clone) {

    // clone children from fragment to document
    for(let i = 0; i < s.children.length; ++i)
      d.appendChild(s.childNodes[i].cloneNode(true));

  } else {

    // move children from fragment to document
    while(s.children.length)
      d.appendChild(s.firstChild);
  }
}

/**
 * Delete specified offscreen document fragment
 *
 * @param   {string}    slot      Offscreen slot identifier
 */
function xows_doc_frag_delete(slot)
{
  xows_doc_frag_db.delete(slot);
}

/**
 * Get element within backed document fragment element
 *
 * @param   {string}    slot      Offscreen slot identifier
 * @param   {string}    id        Child element id to search
 */
function xows_doc_frag_find(slot, id)
{
  return xows_doc_frag_db.get(slot).getElementById(id);
}

/**
 * Global reference to document's Selection object
 */
const xows_doc_sel = document.getSelection();

/**
 * Set edition caret either before or after the specified node
 *
 * @param   {element}   node      Reference node to position caret
 * @param   {element}   before    Place caret before of node
 */
function xows_doc_sel_caret_around(node, before = false)
{
  // Create new selection range
  const rng = document.createRange();

  // Set selection range that includes the specified node:
  // =>|<n>..</n>|<=
  rng.setStartBefore(node);
  rng.setEndAfter(node);

  // Collapse selection either at start or end to go around the node:
  // =>|<=<n>..</n> or <n>..</n>=>|<=
  rng.collapse(before);

  // Replace current range with new one
  xows_doc_sel.removeAllRanges();
  xows_doc_sel.addRange(rng);
}

/**
 * Set edition caret in the specified node
 *
 * @param   {element}   node      Node to position caret in
 * @param   {boolean}   start     Place caret at beginning of content
 */
function xows_doc_sel_caret_within(node, start = false)
{
  // Create new selection range
  const rng = document.createRange();

  // Set selection range that includes specified node content:
  // <n>|<=..=>|</n>
  rng.selectNodeContents(node);

  // Collapse selection either at start or end within the node:
  // <n>=>|<=..</n> or <n>..=>|<=</n>
  rng.collapse(start);

  // Replace current range with new one
  xows_doc_sel.removeAllRanges();
  xows_doc_sel.addRange(rng);
}

/**
 * Pastes the specified node in the current selection range
 *
 * @param   {element}   node      Node to insert in current selection
 * @param   {number}   [index]    Optional zero-based index of range
 */
function xows_doc_sel_paste(node, index = 0)
{
  // Delete content of current selection range
  xows_doc_sel.deleteFromDocument();

  // Insert specified node at new collapsed position
  xows_doc_sel.getRangeAt(index).insertNode(node);

  // Collapse selection after inserted node
  xows_doc_sel.collapseToEnd();
}

/**
 * Initializes document manager and browser interactions
 *
 * This function cache the static document elements for fast access and
 * setup the nécessary listeners and the callbacks for user and client
 * interactions.
 *
 * @param   {object}    onready   Function to be called once document successfully initialized.
 */
function xows_doc_init(onready)
{
  // Check whether Registering option is enabled
  if(xows_options.gui_allow_register)
    xows_doc_show("auth_regi"); //< The link in Login Page

  // Page screen "scr_page" event listener
  xows_doc_listener_add(xows_doc("scr_page"),   "keyup",  xows_doc_page_onkeyu);
  // Close page button "page_exit" event listener
  xows_doc_listener_add(xows_doc("page_exit"),  "click",  xows_doc_page_onclose);

  // Modal screen "scr_void" event listener
  xows_doc_listener_add(xows_doc("scr_void"),   "click",  xows_doc_void_onclick);
  // Image viewer "over_view" event listener
  xows_doc_listener_add(xows_doc("over_view"),  "click",  xows_doc_view_onclick);

  // Set template callback
  xows_tpl_set_callback("embload",  xows_doc_media_onload);
  xows_tpl_set_callback("emberror", xows_doc_media_onerror);

  // Set application "About" content
  xows_doc("app_about").innerText = XOWS_APP_NAME.toUpperCase()+" v"+XOWS_APP_VERS;

  // Retrieve all SCROLLABLE elements to create custom scrollbar and
  // assing listeners
  const scrollable = document.querySelectorAll(".SCROLLABLE");
  for(let i = 0; i < scrollable.length; ++i) {
    // Create custom scrollbar elements
    xows_doc_scroll_create(scrollable[i]);
    // Assign listeners
    xows_doc_scroll_listen(scrollable[i]);
  }

  xows_log(2,"doc_init","document ready");

  // Finaly call onready callback
  if(xows_isfunc(onready)) onready();
}

/**
 * Common on-load callback function for loaded embeded medias
 *
 * @param   {object}    media     Media object that loaded
 */
function xows_doc_media_onload(media)
{
  // Remove the loading style
  media.parentNode.classList.remove("LOADPND");
  media.parentNode.classList.remove("LOADING");
}

/**
 * Common on-error callback function for embeded medias loadin error
 *
 * @param   {object}    media     Media object that loaded
 */
function xows_doc_media_onerror(media)
{
  // Remove the loading style
  media.parentNode.classList.remove("LOADPND");
  media.parentNode.classList.remove("LOADING");
  // Add loading error style
  media.parentNode.classList.add("LOADERR");

  // Body may be hidden due to alone link, we force to show it
  media.closest("MESG-MAIN").querySelector("MESG-BODY").hidden = false;
}

/**
 * Apply background blink animation to the specified object
 *
 * @param   {string}    id        Object ID to apply blink to
 * @param   {number}    duration  Blink duration in miliseconds
 */
function xows_doc_blink_bg(id, duration)
{
  if(duration === 0) {
    // remove blink animation class and clean stuff
    xows_doc_cls_rem(id, "BLINK-BG");
  } else {
    // add blink animation class and start timeout
    xows_doc_cls_add(id, "BLINK-BG");
    setTimeout(xows_doc_blink_bg,duration,id,0);
  }
}

/**
 * Apply foreground blink animation to the specified object
 *
 * @param   {string}    id        Object ID to apply blink to
 * @param   {number}    duration  Blink duration in miliseconds
 */
function xows_doc_blink_fg(id, duration)
{
  if(duration === 0) {
    // remove blink animation class and clean stuff
    xows_doc_cls_rem(id, "BLINK-FG");
  } else {
    // add blink animation class and start timeout
    xows_doc_cls_add(id, "BLINK-FG");
    setTimeout(xows_doc_blink_fg,duration,id,0);
  }
}

/* -------------------------------------------------------------------
 *
 * Message Dialog-Box routines and definitions
 *
 * -------------------------------------------------------------------*/

/**
 * Message Dialog-Box style codes definition
 */
const XOWS_STYL_ERR = -1; //< same as XOWS_SIG_ERR
const XOWS_STYL_WRN = 0;  //< same as XOWS_SIG_WRN
const XOWS_STYL_SCS = 1;
const XOWS_STYL_ASK = 2;

/**
 * Message Dialog-Box parameters
 */
const xows_doc_popu_param = {onabort:null,onvalid:null};

/**
 * Message Dialog-Box close.
 */
function xows_doc_popu_close()
{
  // Remove event listeners
  xows_doc_listener_rem(xows_doc("popu_close"), "click", xows_doc_popu_close);
  xows_doc_listener_rem(xows_doc("popu_abort"), "click", xows_doc_popu_onabort);
  xows_doc_listener_rem(xows_doc("popu_valid"), "click", xows_doc_popu_onvalid);

  // reset references
  xows_doc_popu_param.onabort = null;
  xows_doc_popu_param.onvalid = null;

  // hide message box stuff
  xows_doc_hide("over_popu");

  // remove 'dark' filter and hide 'void' screen
  xows_doc_cls_rem("scr_void", "VOID-DARK");
  xows_doc_hide("scr_void");
}

/**
 * Message Dialog-Box Abort (click on Abort button) callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_popu_onabort(event)
{
  if(xows_doc_popu_param.onabort)
    xows_doc_popu_param.onabort();

  xows_doc_popu_close(); //< Close message box dialog
}

/**
 * Message Dialog-Box Valid (click on valid button) callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_popu_onvalid(event)
{
  if(xows_doc_popu_param.onvalid)
    xows_doc_popu_param.onvalid();

  xows_doc_popu_close(); //< Close message box dialog
}

/**
 * Message Dialog-Box open
 *
 * @param   {number}    style     Message box style or null for default
 * @param   {string}    text      Message to display
 * @param   {function} [onvalid]  Optional callback function for valid/save
 * @param   {string}   [valid]    Optional valid button text or null to hide
 * @param   {function} [onabort]  Optional callback function for abort/reset
 * @param   {string}   [abort]    Optional abort button text or null to hide
 * @param   {boolean}  [modal]    Optional open in 'modal' dialog mode
 */
function xows_doc_popu_open(style, text, onvalid, valid, onabort, abort, modal)
{
  // Checks for already opened Message Box
  if(xows_doc_popu_modal()) {
    return; //< do not close modal ones
  } else {
    xows_doc_popu_close();
  }

  let cls;

  switch(style)
  {
  case XOWS_STYL_ERR: cls = "STYL-ERR"; break;
  case XOWS_STYL_WRN: cls = "STYL-WRN"; break;
  case XOWS_STYL_SCS: cls = "STYL-SCS"; break;
  case XOWS_STYL_ASK: cls = "STYL-ASK"; break;
  }

  xows_doc("over_popu").classList = cls;
  xows_doc("popu_text").innerHTML = xows_l10n_get(text);

  xows_doc_show("popu_close", (!onvalid && !onabort));
  xows_doc_show("popu_valid", Boolean(onvalid));
  xows_doc_show("popu_abort", Boolean(onabort));
  if(onvalid) xows_doc("popu_valid").innerText = xows_l10n_get(valid);
  if(onabort) xows_doc("popu_abort").innerText = xows_l10n_get(abort);

  // set callbacks
  xows_doc_popu_param.onabort = onabort;
  xows_doc_popu_param.onvalid = onvalid;

  // if 'modal' show the 'void screen' to catch mouse clicks
  if(modal) {
    // show the 'void' screen with dark filter
    xows_doc_cls_add("scr_void", "VOID-DARK");
    xows_doc_show("scr_void");
  }

  // Add event listeners
  xows_doc_listener_add(xows_doc("popu_close"), "click", xows_doc_popu_close);
  xows_doc_listener_add(xows_doc("popu_abort"), "click", xows_doc_popu_onabort);
  xows_doc_listener_add(xows_doc("popu_valid"), "click", xows_doc_popu_onvalid);

  // Show popup dialog
  xows_doc_show("over_popu");
}

/**
 * Message Dialog-Box open with predefined values for Save changes
 *
 * @param   {function} [onvalid]  Optional callback function for valid/save
 * @param   {function} [onabort]  Optional callback function for abort/reset
 */
function xows_doc_popu_open_for_save(onvalid, onabort)
{
  if(xows_doc_hidden("over_popu"))
    xows_doc_popu_open(null, "It remains unsaved changes",
                          onvalid, "Save changes",
                          onabort, "Reset");
}

/**
 * Message Dialog-Box modal check and blink
 *
 * This function is used in context where message box act as modal
 * or semi-modal dialog (eg. page cannot be closed without valid
 * or abort).
 *
 * If the message box is openned and have a valid onabort callback, it
 * is assumed that the dialog is at least semi-modal, then, the
 * message box blink, and the function returns true to tell the caller
 * that message box 'is' modal, and must deny user to continue.
 */
function xows_doc_popu_modal()
{
  if(!xows_doc_hidden("over_popu") && xows_doc_popu_param.onabort) {
    xows_doc_blink_bg("over_popu", 600); //< blinking Message box
    return true;
  }
  return false;
}

/* -------------------------------------------------------------------
 *
 * Input Dialog-Box routines and definitions
 *
 * -------------------------------------------------------------------*/
/**
 * Input Dialog-Box parameters
 */
const xows_doc_ibox_param = {onabort:null,onvalid:null,oninput:null,modal:false};

/**
 * Input Dialog-Box function or allow or deny validation
 *
 * @param   {boolean}   allow     Allow or deny validation
 */
function xows_doc_ibox_allow(allow)
{
  xows_doc("ibox_valid").disabled = !allow;
}

/**
 * Input Dialog-Box function to set error message
 *
 * @param   {string}    text     Error text to set or null to disable
 */
function xows_doc_ibox_error(text)
{
  xows_doc("ibox_error").innerText = xows_l10n_get(text);
  xows_doc_blink_fg("ibox_error",600);
}

/**
 * Input Dialog-Box close.
 */
function xows_doc_ibox_close()
{
  if(xows_doc_hidden("over_ibox"))
    return;

  // Remove event listeners
  xows_doc_listener_rem(xows_doc("ibox_close"), "click", xows_doc_ibox_close);
  xows_doc_listener_rem(xows_doc("ibox_abort"), "click", xows_doc_ibox_onabort);
  xows_doc_listener_rem(xows_doc("ibox_valid"), "click", xows_doc_ibox_onvalid);
  xows_doc_listener_rem(xows_doc("ibox_input"), "input", xows_doc_ibox_oninput);

  // reset references
  xows_doc_ibox_param.onabort = null;
  xows_doc_ibox_param.onvalid = null;
  xows_doc_ibox_param.oninput = null;

  if(xows_doc_ibox_param.modal) {
    // Remove keyboard input event listener
    xows_doc_listener_rem(document, "keyup", xows_doc_ibox_onkey);
  }

  // remove 'dark' filter and hide 'void' screen
  xows_doc_cls_rem("scr_void", "VOID-DARK");
  xows_doc_hide("scr_void");

  // hide message box stuff
  xows_doc_hide("over_ibox");

  // Disable modal routine
  xows_doc_ibox_param.modal = false;
}

/**
 * Input Dialog-Box Input callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_ibox_oninput(event)
{
  const value = xows_doc("ibox_input").value;

  if(xows_doc_ibox_param.oninput) {
    xows_doc_ibox_param.oninput(value);
  } else {
    // default behavior
    xows_doc("ibox_valid").disabled = !value.length;
  }
}

/**
 * Input Dialog-Box Abort (click on Abort button) callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_ibox_onabort(event)
{
  if(xows_doc_ibox_param.onabort)
    xows_doc_ibox_param.onabort();

  xows_doc_ibox_close();
}

/**
 * Input Dialog-Box Valid (click on valid button) callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_ibox_onvalid(event)
{
  if(xows_doc_ibox_param.onvalid)
    xows_doc_ibox_param.onvalid(xows_doc("ibox_input").value);

  xows_doc_ibox_close();
}

/**
 * Input Dialog-Box keyboard input callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_ibox_onkey(event)
{
  // Check for pressed Enter
  if(event.keyCode === 13)
    xows_doc_ibox_onvalid();

  // Check for pressed Esc
  if(event.keyCode === 27)
    xows_doc_ibox_onabort();
}

/**
 * Input Dialog-Box open
 *
 * @param   {string}    head      Dialog head title
 * @param   {string}    hint      Input hint text
 * @param   {string}    phold     Input placeholder text
 * @param   {string}    value     Input default value text
 * @param   {function} [onvalid]  Optional callback function for valid/save
 * @param   {string}   [valid]    Optional valid button text or null to hide
 * @param   {function} [onabort]  Optional callback function for abort/reset
 * @param   {string}   [abort]    Optional abort button text or null to hide
 * @param   {function} [oninput]  Optional callback function for input events
 * @param   {boolean}  [modal]    Optional open in 'modal' dialog mode
 */
function xows_doc_ibox_open(head, hint, phold, value, onvalid, valid, onabort, abort, oninput, modal = true)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  // Checks for already opened Input Box
  if(xows_doc_ibox_modal()) {
    return; //< do not close modal ones
  } else {
    xows_doc_ibox_close();
  }

  xows_doc("ibox_head").innerHTML = xows_l10n_get(head);
  xows_doc("ibox_hint").innerHTML = xows_l10n_get(hint);

  const ibox_input = xows_doc("ibox_input");
  ibox_input.placeholder = xows_l10n_get(phold);
  ibox_input.value = value ? value : "";

  // set callbacks
  xows_doc_ibox_param.onabort = onabort;
  xows_doc_ibox_param.onvalid = onvalid;
  xows_doc_ibox_param.oninput = oninput;

  // Set valid and abort button text
  if(!valid) valid = "Apply";
  if(!abort) abort = "Cancel";
  xows_doc("ibox_valid").innerText = xows_l10n_get(valid);
  xows_doc("ibox_abort").innerText = xows_l10n_get(abort);

  // Reset error text
  xows_doc("ibox_error").innerText = "";

  // enable or disable modal mode
  xows_doc_ibox_param.modal = modal;

  // if 'modal' show the 'void screen' to catch mouse clicks
  if(modal) {
    // Add event listener for keyboard input
    xows_doc_listener_add(document, "keyup", xows_doc_ibox_onkey);
    // show the 'void' screen with dark filter
    xows_doc_cls_add("scr_void", "VOID-DARK");
    xows_doc_show("scr_void");
  }

  //xows_doc_show("ibox_close", !modal);

  // Call to oninput to initialize button status
  xows_doc_ibox_oninput();

  // Add event listeners
  xows_doc_listener_add(xows_doc("ibox_close"), "click", xows_doc_ibox_onabort);
  xows_doc_listener_add(xows_doc("ibox_abort"), "click", xows_doc_ibox_onabort);
  xows_doc_listener_add(xows_doc("ibox_valid"), "click", xows_doc_ibox_onvalid);
  xows_doc_listener_add(xows_doc("ibox_input"), "input", xows_doc_ibox_oninput);

  xows_doc_show("over_ibox");

  // Set input focus
  ibox_input.focus();
}

/**
 * Input Dialog-Box modal check and blink
 *
 * This function is used in context where input box act as modal
 * or semi-modal dialog (eg. page cannot be closed without valid
 * or abort).
 *
 * If the input box is openned and have a valid onabort callback, it
 * is assumed that the dialog is at least semi-modal, then, the
 * input box blink, and the function returns true to tell the caller
 * that input box 'is' modal, and must deny user to continue.
 *
 * @return {boolean}    True if dialog 'is' modal, false otherwise
 */
function xows_doc_ibox_modal()
{
  if(!xows_doc_hidden("over_ibox")) {
    if(xows_doc_ibox_param.modal) {
      xows_doc_blink_bg("over_ibox", 600); //< blinking Message box
      return true;
    } else {
      xows_doc_ibox_close();
    }
  }

  return false;
}

/* -------------------------------------------------------------------
 *
 * Message Dialog-Box routines and definitions
 *
 * -------------------------------------------------------------------*/
/**
 * Message Dialog-Box parameters
 */
const xows_doc_mbox_param = {onvalid:null,onabort:null,modal:false};

/**
 * Message Dialog-Box close.
 */
function xows_doc_mbox_close()
{
  if(xows_doc_hidden("over_mbox"))
    return;

  // Remove event listeners
  xows_doc_listener_rem(xows_doc("mbox_close"), "click", xows_doc_mbox_onabort);
  xows_doc_listener_rem(xows_doc("mbox_abort"), "click", xows_doc_mbox_onabort);
  xows_doc_listener_rem(xows_doc("mbox_valid"), "click", xows_doc_mbox_onvalid);

  // reset callback functions
  xows_doc_mbox_param.onvalid = null;
  xows_doc_mbox_param.onabort = null;

  // Hide message box
  xows_doc_hide("over_mbox");

  // Remove 'dark' filter and hide 'void' screen
  xows_doc_cls_rem("scr_void", "VOID-DARK");
  xows_doc_hide("scr_void");

  // Disable modal routine
  xows_doc_mbox_param.modal = false;
}

/**
 * Message Dialog-Box on-Valid callback
 */
function xows_doc_mbox_onvalid()
{
  if(xows_doc_mbox_param.onvalid)
    xows_doc_mbox_param.onvalid();

  xows_doc_mbox_close();
}

/**
 * Message Dialog-Box on-Abort callback
 */
function xows_doc_mbox_onabort()
{
  if(xows_doc_mbox_param.onabort)
    xows_doc_mbox_param.onabort();

  xows_doc_mbox_close();
}

/**
 * Message Dialog-Box open
 *
 * @param   {number}    style     Message box style or null for default
 * @param   {string}    head      Dialog head title
 * @param   {string}    mesg      Dialog message text
 * @param   {function} [onvalid]  Optional callback function for valid/save
 * @param   {string}   [valid]    Optional valid button text or null to hide
 * @param   {function} [onabort]  Optional callback function for abort/reset
 * @param   {string}   [abort]    Optional abort button text or null to hide
 * @param   {boolean}  [modal]    Optional open in 'modal' dialog mode
 */
function xows_doc_mbox_open(style, head, mesg, onvalid, valid, onabort, abort, modal = true)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  // Checks for already opened Input Box
  if(xows_doc_mbox_modal()) {
    return; //< do not close modal ones
  } else {
    xows_doc_mbox_close();
  }

  let cls;
  switch(style)
  {
  case XOWS_STYL_ERR: cls = "STYL-ERR"; break;
  case XOWS_STYL_WRN: cls = "STYL-WRN"; break;
  case XOWS_STYL_SCS: cls = "STYL-SCS"; break;
  case XOWS_STYL_ASK: cls = "STYL-ASK"; break;
  }
  xows_doc("mbox_icon").classList = cls;

  xows_doc("mbox_head").innerHTML = xows_l10n_get(head);
  xows_doc("mbox_text").innerHTML = xows_l10n_get(mesg);

  // set callbacks
  xows_doc_mbox_param.onabort = onabort;
  xows_doc_mbox_param.onvalid = onvalid;

  // Set valid and abort button text
  if(!valid) valid = "OK";
  xows_doc("mbox_valid").innerText = xows_l10n_get(valid);
  if(onabort) {
    if(!abort) abort = "Cancel";
    xows_doc_show("mbox_abort");
    xows_doc("mbox_abort").innerText = xows_l10n_get(abort);
  } else {
    xows_doc_hide("mbox_abort");
  }

  // enable or disable modal mode
  xows_doc_mbox_param.modal = modal;

  if(modal) {
    // show the 'void' screen with dark filter
    xows_doc_cls_add("scr_void", "VOID-DARK");
    xows_doc_show("scr_void");
  }

  //xows_doc_show("mbox_close", !modal);

  // Add event listeners
  xows_doc_listener_add(xows_doc("mbox_close"), "click", xows_doc_mbox_close);
  xows_doc_listener_add(xows_doc("mbox_abort"), "click", xows_doc_mbox_onabort);
  xows_doc_listener_add(xows_doc("mbox_valid"), "click", xows_doc_mbox_onvalid);

  // show the Popup Dialog main frame
  xows_doc_show("over_mbox");
}

/**
 * Input Dialog-Box modal check and blink
 *
 * This function is used in context where input box act as modal
 * or semi-modal dialog (eg. page cannot be closed without valid
 * or abort).
 *
 * If the input box is openned and have a valid onabort callback, it
 * is assumed that the dialog is at least semi-modal, then, the
 * input box blink, and the function returns true to tell the caller
 * that input box 'is' modal, and must deny user to continue.
 *
 * @return {boolean}    True if dialog 'is' modal, false otherwise
 */
function xows_doc_mbox_modal()
{
  if(!xows_doc_hidden("over_mbox")) {
    if(xows_doc_mbox_param.modal) {
      xows_doc_blink_bg("over_mbox", 600); //< blinking Message box
      return true;
    } else {
      xows_doc_mbox_close();
    }
  }

  return false;
}
/* -------------------------------------------------------------------
 *
 * Dialog/Config Pages routines and definitions
 *
 * -------------------------------------------------------------------*/
/**
 * Dialog Page parameters
 */
const xows_doc_page_param = {pageid:null,onclose:null,oninput:null,onclick:null};

/**
 * Dialog Page on-input callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_page_oninput(event)
{
  xows_doc_page_param.oninput(event.target);
}

/**
 * Dialog Page on-click callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_page_onclick(event)
{
  xows_doc_page_param.onclick(event.target);
}

/**
 * Dialog Page Close (click on close button) callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_page_onclose(event)
{
  if(!xows_doc_popu_modal())
    xows_doc_page_close(); //< close dialog page
}

/**
 * Dialog Page Close
 *
 * @param   {boolean}   soft      Soft close, prepare for new page to open only.
 */
function xows_doc_page_close()
{
  if(!xows_doc_page_param.pageid)
    return;

  xows_log(2,"doc_page_close",xows_doc_page_param.pageid);

  const page = xows_doc(xows_doc_page_param.pageid);

  // Revert window title to previous one
  if(page.title) xows_gui_wnd_title_pop();

  // remove "input" event listener
  if(xows_doc_page_param.oninput) {
    xows_doc_listener_rem(page,"input",xows_doc_page_oninput);
    xows_doc_page_param.oninput = null;
  }

  // remove "click" event listener
  if(xows_doc_page_param.onclick) {
    xows_doc_listener_rem(page,"click",xows_doc_page_onclick);
    xows_doc_page_param.onclick = null;
  }

  // call exit callback
  if(xows_doc_page_param.onclose)
    xows_doc_page_param.onclose();

  // reset callback functions
  xows_doc_page_param.onclose = null;

  // hide close button Overlay
  xows_doc_hide("colr_exit");

  // hide the diloag
  xows_doc_hide(xows_doc_page_param.pageid);
  xows_doc_page_param.pageid = null;

  // also exit potentially opened message box
  xows_doc_popu_close();

  xows_doc_hide("scr_page");
}

/**
 * Dialog Page Open
 *
 * @param   {string}    id        Page ID to open
 * @param   {boolean}  [close]    Optional force display or hide close button
 * @param   {function} [onclose]  Optional callback function for page close
 * @param   {function} [oninput]  Optional callback function for input events
 * @param   {function} [onclick]  Optional callback function for click events
 */
function xows_doc_page_open(id, close, onclose, oninput, onclick)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  xows_doc_page_close(); //< close any opened dialog

  xows_log(2,"doc_page_open", id);

  xows_doc_show("scr_page");

  // show specific dialog
  xows_doc_show(id);
  xows_doc_page_param.pageid = id;

  if(close) xows_doc_show("colr_exit"); //< show close button

  // set callbacks
  xows_doc_page_param.onclose = onclose;

  const page = xows_doc(id);

  // add "input" event listener
  if(oninput) {
    xows_doc_page_param.oninput = oninput;
    xows_doc_listener_add(page,"input",xows_doc_page_oninput);
  }

  // add "click" event listener
  if(onclick) {
    xows_doc_page_param.onclick = onclick;
    xows_doc_listener_add(page,"click",xows_doc_page_onclick);
  }

  // Change window title accorging page title
  if(page.title)
    xows_gui_wnd_title_set(xows_l10n_get(page.title)+" - XOWS");

  // also exit potentially opened message box
  xows_doc_popu_close();
}

/**
 * Dialog Page on-keyup callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_doc_page_onkeyu(event)
{
  if(xows_doc_page_param.pageid && event.keyCode === 13) {
    // Emulate click on Valid button
    if(!xows_doc_hidden("over_popu") && !xows_doc_hidden("popu_valid")) {
     xows_doc("popu_valid").click();
   } else {
     // Emulate click on submit button
     const submit = xows_doc(xows_doc_page_param.pageid).querySelector("*[type='submit']");
     if(submit) submit.click();
   }
  }
}

/* -------------------------------------------------------------------
 *
 * Drop menus routines and definitions
 *
 * -------------------------------------------------------------------*/
/**
 * Currently opened menu elements
 */
const xows_doc_menu_param = {bttn:null,drop:null,onclick:null,onclose:null};

/**
 * Close current opened menu
 */
function xows_doc_menu_close()
{
  const param = xows_doc_menu_param;

  // Hide drop element
  if(param.drop)
    param.drop.hidden = true;

  // Remove event listener from menu drop element
  if(param.onclick)
    xows_doc_listener_rem(param.drop, "click", param.onclick);

  if(param.onclose)
    param.onclose();

  // Unfocus button element
  if(param.bttn)
    param.bttn.blur();

  // hide the 'void' screen
  xows_doc_hide("scr_void");

  // Reset parameters
  param.drop = null;
  param.bttn = null;
  param.onclick = null;
  param.onclose = null;
}

/**
 * Toggle menu drop
 *
 * This function toggle the specified menu and show the invisible menu
 * screen to gather click event outside menu.
 *
 * @param   {element}   button    Menu button element
 * @param   {string}    dropid    Menu drop-down element Id
 * @param   {function}  onclick   Menu on-click callback
 * @param   {function}  [onshow]  Optional Menu on-show callback
 * @param   {function}  [onclose] Optional Menu on-close callback
 */
function xows_doc_menu_toggle(button, dropid, onclick, onshow, onclose)
{
  const param = xows_doc_menu_param;

  // Check whether menu is already open
  if(param.bttn) {

    // Close openned menu
    xows_doc_menu_close();

  } else {

    // Save parameters
    const drop = xows_doc(dropid);

    if(!button || !drop)
      return;

    // Set parameters
    param.bttn = button;
    param.drop = drop;
    param.onclick = onclick;
    param.onclose = onclose;

    // Add event listener to menu drop element
    if(param.onclick)
      xows_doc_listener_add(param.drop, "click", param.onclick);

    // show the 'void' screen to catch clicks outside menu
    xows_doc_show("scr_void");

    // Show menu drop element (BEFORE onshow for correct placement !)
    param.drop.hidden = false;

    // Call optionnal onshow function
    if(xows_isfunc(onshow))
      onshow(param.bttn, param.drop);

    // Focus on button element
    param.bttn.focus();
  }
}

/* -------------------------------------------------------------------
 *
 * Image view routines and definitions
 *
 * -------------------------------------------------------------------*/
/**
 * Media Viewer screen open
 *
 * @param   {object}    media     DOM element that throwed event
 */
function xows_doc_view_open(media)
{
  // Check for image media to view
  if(media.tagName === "IMG") {

    // set proper link and references
    xows_doc("view_img").src = media.src;
    //xows_doc("view_open").href = media.src;

    // show the media overlay element
    xows_doc_show("over_view");

    // show the 'void' screen with dark filter
    xows_doc_cls_add("scr_void", "VOID-DARK");
    xows_doc_show("scr_void");
  }
}

/**
 * Media Viewer screen close
 */
function xows_doc_view_close()
{
  const over_view = xows_doc("over_view");

  if(over_view.hidden)
    return;

  // hide the media overlay element
  over_view.hidden = true;

  // reset image reference
  xows_doc("view_img").src = "";

  // remove 'dark' filter and hide 'void' screen
  xows_doc_cls_rem("scr_void", "VOID-DARK");
  xows_doc_hide("scr_void");
}

/**
 * Media Viewer screen on-click event callback
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_doc_view_onclick(event)
{
  switch(event.target.id)
  {
  case "view_optab":
    // Get the <img> element and open in new tab
    window.open(event.target.parentNode.querySelector("IMG").src, '_blank').focus();
    break;
  default:
    // Close image view
    xows_doc_view_close();
    break;
  }
}

/* -------------------------------------------------------------------
 *
 * Contact/Occupant profile Popup routines
 *
 * -------------------------------------------------------------------*/
/**
 * Contact Profile Popup parameters
 */
const xows_doc_prof_param = {peer:null,onclick:null};

/**
 * Contact Profile Popup on-click callback
 *
 * @param   {object}    event     Event object
 */
function xows_doc_prof_onclick(event)
{
  if(event.target.id == "prof_close") {
    xows_doc_prof_close();
    return;
  }

  if(xows_doc_prof_param.onclick)
    xows_doc_prof_param.onclick(xows_doc_prof_param.peer, event.target);
}

/**
 * Contact Profile Popup close
 */
function xows_doc_prof_close()
{
  const over_prof = xows_doc("over_prof");

  // Prevent hidding void-sreen
  if(over_prof.hidden)
    return;

  // Remove "click" event listener
  xows_doc_listener_rem(over_prof,"click",xows_doc_prof_onclick);

  // Reset parameters
  xows_doc_prof_param.peer = null;
  xows_doc_prof_param.onclick = null;

  // remove 'dark' filter and hide 'void' screen
  xows_doc_cls_rem("scr_void", "VOID-DARK");
  xows_doc_hide("scr_void");

  // hide popop
  over_prof.hidden = true;
}

/**
 * Contact Profile Popup Update
 */
function xows_doc_prof_update()
{
  const peer = xows_doc_prof_param.peer;

  const over_prof = xows_doc("over_prof");

  // Fill common peer informations
  over_prof.querySelector("PEER-NAME").innerText = peer.name;
  over_prof.querySelector("PEER-ADDR").innerText = peer.jbar ? peer.jbar : "";
  over_prof.querySelector("BADG-SHOW").dataset.show = peer.show || 0;
  // Set proper class for avatar
  over_prof.querySelector("PEER-AVAT").className = xows_tpl_spawn_avat_cls(peer);

  // Set State message or keep placeholder
  const peer_meta = over_prof.querySelector("PEER-META");
  peer_meta.innerText = peer.stat ? peer.stat : "";
  peer_meta.className = peer.stat ? "" : "PLACEHOLD";

  let cont;
  const prof_subs = xows_doc("prof_subs");
  const prof_addc = xows_doc("prof_addc");

  // Set Occupant informations
  if(peer.type === XOWS_PEER_OCCU) {

    if(peer.jbar)
      cont = xows_cli_cont_get(peer.jbar);

    let affi_txt;
    switch(peer.affi)
    {
    case XOWS_AFFI_OWNR: affi_txt = "Owner"; break;
    case XOWS_AFFI_ADMN: affi_txt = "Administrator"; break;
    case XOWS_AFFI_MEMB: affi_txt = "Member"; break;
    default: affi_txt = "Unaffiliated"; break;
    }

    const prof_affi = xows_doc("prof_affi");
    prof_affi.innerText = xows_l10n_get(affi_txt);
    prof_affi.dataset.affi = peer.affi;

    let role_txt;
    switch(peer.role)
    {
    case XOWS_ROLE_MODO: role_txt = "Moderator"; break;
    case XOWS_ROLE_PART: role_txt = "Participant"; break;
    default: role_txt = "Visitor"; break;
    }

    const prof_role = xows_doc("prof_role");
    prof_role.innerText = xows_l10n_get(role_txt);
    prof_role.dataset.role = peer.role;

    // Check if we can get Contact object
    if(peer.jbar)
      cont = xows_cli_cont_get(peer.jbar);

    xows_doc_show("prof_occu");

  } else {

    cont = peer;
    xows_doc_hide("prof_occu");
  }

  if(!peer.self) {

    let subs_txt;
    let subs_lvl = 0;

    if(cont) {
      prof_subs.hidden = false; //< Show subscription level
      prof_addc.hidden = true;  //< Hide subscribe button
      switch(cont.subs)
      {
      case XOWS_SUBS_BOTH: subs_txt = "Mutual"; break;
      default:             subs_txt = "Pending"; break;
      }
      subs_lvl = cont.subs;
    } else {
      const subs_stat = xows_cli_peer_subsste(peer);
      prof_subs.hidden = (subs_stat < 1); //< Show/hide subscription level
      prof_addc.hidden = (subs_stat > 0); //< Show/hide subscribe button
      switch(subs_stat)
      {
      case 1:
        subs_txt = "Pending";
        subs_lvl = 1;
        break;
      case 2:
        subs_txt = "Unavailable";
        subs_lvl = -1;
        break;
      }
    }

    prof_subs.innerText = xows_l10n_get(subs_txt);
    prof_subs.dataset.subs = subs_lvl;

    xows_doc_show("prof_cont");

  } else {

    xows_doc_hide("prof_cont");
  }
}

/**
 * Contact Profile Popup open
 *
 * @param   {object}    peer      Peer Object, either Contact or Occupant
 * @param   {function} [onclick]  Optional callback function for click events
 */
function xows_doc_prof_open(peer, onclick)
{
  const over_prof = xows_doc("over_prof");

  // Store Occupant object
  xows_doc_prof_param.peer = peer;
  xows_doc_prof_param.onclick = onclick;

  // show the 'void' screen with dark filter
  const src_void = xows_doc("scr_void");
  src_void.className = "VOID-DARK";
  src_void.hidden = false;

  // add "click" event listener
  xows_doc_listener_add(over_prof,"click",xows_doc_prof_onclick);

  // Update content according Peer state
  xows_doc_prof_update();

  // Show popop
  over_prof.hidden = false;
}

/* -------------------------------------------------------------------
 *
 * Void Screen routines and definitions
 *
 * -------------------------------------------------------------------*/
/**
 * Function to proceed click on void 'screen'
 *
 * This function is called when user click on the 'void screen', meaning
 * outside an opened menu or dialog.
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_doc_void_onclick(event)
{
  // check whether a menu is opened, and close it
  if(xows_doc_menu_param.bttn)
    xows_doc_menu_close();

  // Close potentially opened media viewer screen
  xows_doc_view_close();

  // Close potentially opened Contact profile popup
  xows_doc_prof_close();

  // Make potentially opened modal Dialog-Box blinking
  xows_doc_popu_modal();
  xows_doc_ibox_modal();
  xows_doc_mbox_modal();
}

/* -------------------------------------------------------------------
 *
 * Custom Scroll-Bars routines
 *
 * -------------------------------------------------------------------*/
/**
 * Export scrollBottom property value to dataset
 *
 * The 'scrollBottom' property is an ad-hoc property used to store
 * element's scroll position relative to client viewport bottom. It is
 * needed to store it since DocumentFragment operations do not keep
 * custom properties.
 *
 * For more details about 'scrollBottom' see inner comment of
 * the 'xows_doc_scroll_onscroll' function.
 *
 * @param   {string}    id  Element ID to import scroll
 */
function xows_doc_scroll_export(id)
{
  const element = document.getElementById(id);
  element.dataset.scrollbottom = element.scrollBottom || 0;
}

/**
 * Import scrollBottom property value from dataset
 *
 * The 'scrollBottom' property is an ad-hoc property used to store
 * element's scroll position relative to client viewport bottom. It is
 * needed to store it since DocumentFragment operations do not keep
 * custom properties.
 *
 * For more details about 'scrollBottom' see inner comment of
 * the 'xows_doc_scroll_onscroll' function.
 *
 * @param   {string}    id  Element ID to import scroll
 */
function xows_doc_scroll_import(id)
{
  const element = document.getElementById(id);
  element.scrollBottom = parseInt(element.dataset.scrollbottom);

  xows_doc_scroll_edit = true;
  element.scrollTop = element.scrollHeight - (element.clientHeight + element.scrollBottom);
}

/**
 * ResizeObserver object to track scrollables' viewport and content resizing
 */
const xows_doc_scroll_sizeobs = new ResizeObserver(xows_doc_scroll_onresize);

/**
 * Creates custom scrollbar elements for the specified scrollable element.
 *
 * @param   {element}   element   Scrollable DOM element
 */
function xows_doc_scroll_create(element)
{
  // Create scrollbar elements
  const bar = document.createElement("scroll-bar");

  // Assing ID to scrollbar element, we will use it to cross-reference
  // scrollable element and its related scrollbar
  bar.id = "scrollbar_" + xows_gen_nonce_asc(6);

  // If scrollable element doesn't have ID we create one because we
  // need it to track element.
  if(!element.id)
    element.id = "scrollable_" + xows_gen_nonce_asc(6);

  // We store scrollable element ID rather than direct reference since
  // elements may be moved from DOM to DocumentFragments and vice versa and
  // this process invalidate references to DOM elements.
  bar.dataset.scrollable = element.id;
  const hnd = document.createElement("scroll-hnd");
  hnd.hidden = true;
  bar.appendChild(hnd);

  // We parent scroll elements to scrollable's parent, we assume that scrollable
  // element is placed in properly configured 'container' element
  element.parentNode.appendChild(bar);

  // Store related scrollbar element ID, this is used to retrieve the proper
  // related scrollbar element from scrollable. Again, we cannot use direct
  // reference because of offscreen DocumentFragements.
  element.dataset.scrollbar = bar.id;

  if("scrollbottom" in element.dataset)
    element.scrollBottom = parseInt(element.dataset.scrollbottom);

  for(let i = 0; i < element.children.length; ++i)
    element.children[i].dataset.scrollable = element.id;

  xows_log(2,"doc_scroll_create","create scrollbar",bar.id+" <=> "+element.id);
}

/**
 * Setups custom scrollbar required event listeners for scrolling handling
 * and processing.
 *
 * @param   {element}   element     Scrollable DOM element
 * @param   {function} [onforward]  Optional callback to forward Event to.
 */
function xows_doc_scroll_listen(element)
{
  // Retreive scrollable related scrollbar element
  const bar = document.getElementById(element.dataset.scrollbar);

  // Add listener to scrollbar element
  bar.addEventListener("mousedown", xows_doc_scroll_onmousedn);

  // Add listener to scrollable element
  element.addEventListener("scroll", xows_doc_scroll_onscroll, {passive:true});

  // Keep informed of scrollable element resize
  xows_doc_scroll_sizeobs.observe(element);

  // Also observe scrollable' content to update on content resize
  for(let i = 0; i < element.children.length; ++i)
    xows_doc_scroll_sizeobs.observe(element.children[i]);
}

/**
 * Unobserves (from ResizeObserver) the specified the scrollable element
 * and its children.
 *
 * This function is mainly used to clean ResizeObserver to prevent bugs and
 * artifacts when elements are moved to DocumentFragement.
 *
 * @param   {element}   element     Scrollable DOM element
 */
function xows_doc_scroll_unobserv(element)
{
  // Unobserv elements
  xows_doc_scroll_sizeobs.unobserve(element);
  for(let i = 0; i < element.children.length; ++i)
    xows_doc_scroll_sizeobs.unobserve(element.children[i]);
}

/**
 * Flag to signal scroll was programatically edited
 */
let xows_doc_scroll_edit = false;

/**
 * Recalculates custom scrollbar size and position according scrollable
 * content size, client viewport and scroll position.
 *
 * @param   {element}     abl     Scrollable DOM element
 */
function xows_doc_scroll_adjust(abl)
{
  // Retrieve <scroll-bar> element
  const bar = document.getElementById(abl.dataset.scrollbar);

  if(!bar) {
    console.log(abl);
  }

  // Get scrollbar handle element
  const hnd = bar.firstElementChild;

  // Calculate client size ratio (for handle size)
  const cliRatio = abl.clientHeight / abl.scrollHeight;

  // Ratio of 1 mean no-overflow
  if(cliRatio < 1) {

    // Calculate scroll handle height
    let hndHeight = (bar.offsetHeight * cliRatio);

    // If scrollable content is very large compared to client height the
    // resulting ratio gives a very small handle and we want to keep it at
    // minimum size to be usable.
    if(hndHeight < 20) {
      // since we use scroll handle top position to compute the actual scroll
      // position while scrolling, changing handle height induce an offset
      // that makes the very bottom of content unreachable. So, we have to
      // store the proper offset value to do the required math on scrolling.
      hnd.scrollOff = 20 - hndHeight;
      hndHeight += hnd.scrollOff;
    } else {
      hnd.scrollOff = 0;
    }

    // Calcultate scroll position ratio (for handle position)
    const topRatio = (abl.scrollTop / abl.scrollHeight);
    hnd.style.height = hndHeight + "px";
    hnd.style.top = ((bar.offsetHeight - hnd.scrollOff) * topRatio) + "px";

    if(hnd.hidden)
      hnd.hidden = false;

  } else {

    // The entire page is visible, no need for scroll
    if(!hnd.hidden)
      hnd.hidden = true;
  }
}

/**
 * Handle scrollable viewport and content resing to adjust scrollbar size
 *
 * @param   {object[]}  entries   ResizeObserver entries
 * @param   {object}    observer  ResizeObserver object
 */
function xows_doc_scroll_onresize(entries, observer)
{
  // recalculate scrollbar for resized elements
  for(const entry of entries) {

    let abl;
    if("scrollable" in entry.target.dataset) {
      abl = document.getElementById(entry.target.dataset.scrollable);
      if(!abl) continue; //< this may occure because of DocumentFragment operations
    } else {
      abl = entry.target;
    }

    // Checks for presence of scrollbottom attribute, indicating scrollable
    // element must be handled as TOP-to-DOWN scrollable.
    if("scrollbottom" in abl.dataset) {

      // Prevent scrollBottom to be saved with shifted value
      xows_doc_scroll_edit = true;

      // As explained within 'xows_doc_scroll_adjust', when a scrollable
      // element has its content resized, browser engine keeps content position
      // relative to client viewport top (the meaning of 'scrollTop' property).
      //
      // For chat history, we need this behavior to be inverted, so content
      // position is conserved relative to client viewport bottom.
      //
      // In the bellow math, we use the custom 'scrollBottom' property that we
      // maintain as a counterpart of 'scrollTop' to recalculate the proper
      // value for 'scrollTop' to keep content position relative to client
      // viewport bottom.
      abl.scrollTop = abl.scrollHeight - (abl.clientHeight + abl.scrollBottom);

      // We skip scroll adjustement since scroll event is fired once
      // the scrollTop property is modified
      continue;
    }

    // Adjust scroll
    xows_doc_scroll_adjust(abl);
  }
}

/**
 * Handles scrollable element on-scroll event to move and resize
 * custom scrollbar's handle accordingly.
 *
 * @param   {object}    event     Event object
 */
function xows_doc_scroll_onscroll(event)
{
  const abl = event.target;

  // Adjust scroll
  xows_doc_scroll_adjust(abl);

  // DOM stock scroll parameters are designed in the perspective of TOP-to-DOWN
  // scroll, keeping the scroll position relative to the TOP of the scrollable
  // content in case of client area or scrollable content size changes.
  //
  // This is a problem in some contexts (for instance, in chat history), where
  // scroll mechanism is usually reversed (BOTTOM-to-UP) and where in case of
  // client area or scrollable content size change, the scroll position should
  // be kept reltative to the scrollable content's BOTTOM.
  //
  // As workaround, we create and maintain an ad-hoc "scrollBottom" property
  // in the scrollable element's parent, which is the calculated scroll position
  // relative to the BOTTOM of scrollable content. We then can use this
  // parameter to do the required math to counter the Browser defaut behavior.

  if(("scrollbottom" in abl.dataset)) {

    // Modifying scroll parameter programmatically triggers an "onscroll" event
    // the same as if user actually scrolled from Browser window. This produce
    // unwanted scroll position "save" whitch mess up all calculations.
    //
    // To prevent that, after each scroll adjustment on resize, we set a flag
    // to signal that the "onscroll" event was fired by automatic adjustement
    // so it is possible to ignore the event.
    if(xows_doc_scroll_edit) {
      xows_doc_scroll_edit = false;
    } else {
      abl.scrollBottom = abl.scrollHeight - (abl.clientHeight + abl.scrollTop);
    }
  }
}

/**
 * Custom scrollbar's scrolling processing data
 */
const xows_doc_scroll_data = {bar:null,hnd:null,abl:null,msy:0,top:0,max:0,off:0};

/**
 * Handles scrollable element on-scroll event to move and resize
 * custom scrollbar's handle accordingly.
 *
 * @param   {object}    event   Event object
 */
function xows_doc_scroll_onmousedn(event)
{
  // Prevent default event behavior, this is required to
  // avoid mouse to select content while moving around
  event.preventDefault();

  // Retrieve <scroll-bar> element
  const bar = event.target.closest("SCROLL-BAR");

  // Retrieve associated scrollable element
  const abl = document.getElementById(bar.dataset.scrollable);

  // Check whether click occurent on handle or track
  if(event.target.tagName === "SCROLL-HND") {

    // Get scrollbar handle
    const hnd = bar.firstElementChild;

    // Get reference to modal data
    const data = xows_doc_scroll_data;

    // Store related elements
    data.bar = bar;
    data.hnd = bar.firstElementChild;
    data.abl = abl;

    // Store contextual parameters
    data.msy = event.screenY; //< mouse initial position
    data.top = parseInt(bar.firstElementChild.style.top); //< scroll handle initial position
    data.max = (bar.offsetHeight - hnd.offsetHeight) ; //< scroll handle max position

    hnd.classList.add("SCROLLING");

    // Enter scrolling processing mode
    xows_doc_listener_add(window, "mousemove", xows_doc_scroll_onmousemv);
    xows_doc_listener_add(window, "mouseup",   xows_doc_scroll_onmouseup);

  } else {

    // Calculate relative click position on track
    const topRation = event.offsetY / bar.offsetHeight;

    // Apply position to scrollable
    abl.scrollTop = abl.scrollHeight * topRation;
  }
}

/**
 * Handles mouse motion for custom scrollbar's scrolling processing mode
 *
 * Moves the custom scrollbar handle and updates scrollable element
 * position according mouse motion.
 *
 * @param   {object}    event   Event object
 */
function xows_doc_scroll_onmousemv(event)
{
  // Get reference to scrolling processing data
  const data = xows_doc_scroll_data;

  // Calculate handle new position
  let top = (data.top + (event.screenY - data.msy));

  // Clamp to min and max positions
  if(top <        0) top = 0;
  if(top > data.max) top = data.max;

  // Move handle to new position
  data.hnd.style.top = top + "px";

  // The scroll handle height may be set at its minimum size, making it larger
  // than while the actual client to content ratio would require. In this case,
  // the 'scrollOff' value is greater than zero, indicating we need to do some
  // more math to compensate the induced offset.
  let topOffset;
  if(data.hnd.scrollOff) {
    // The idea here is to get an interpolation phase (0 to 1) of the scroll
    // handle position relative to motion range. When the handle is at the top
    // stop, we got 0.0. When at bottom stop, we got 1.0.
    const rng = data.bar.offsetHeight - data.hnd.offsetHeight;
    const bot = data.bar.offsetHeight - (top + data.hnd.offsetHeight);
    const t = (1.0 + ((top - bot) / rng)) * 0.5;
    // Once we have the handle "virtual" position on track (in a range from 0.0
    // to 1.0), we can proportionnaly add the required offset accordingly. This
    // way, when handle is at top of track, the offset value has not effect and
    // scrollable content start is properly reached. In contrary, whe, handle
    // is at bottom of track, the offset value is fully added, allowing to
    // reach the very end of scrollable content.
    topOffset = top + (t * data.hnd.scrollOff);
  } else {
    // No offset, we can use the actual handle top position as reference
    topOffset = top;
  }

  const topRatio = topOffset / data.bar.offsetHeight;
  data.abl.scrollTop = data.abl.scrollHeight * topRatio;
}

/**
 * Handles mouse button up for custom scrollbar scrolling processing mode
 *
 * Stop scrolling processing and releases the scrollbar handle by
 * removing related event listeners.
 *
 * @param   {object}    event   Event object
 */
function xows_doc_scroll_onmouseup(event)
{
  // Get reference to data
  const data = xows_doc_scroll_data;

  // Handle is no longer "captured"
  data.hnd.classList.remove("SCROLLING");

  // Remove scrolling processing event listeners
  xows_doc_listener_rem(window, "mousemove", xows_doc_scroll_onmousemv);
  xows_doc_listener_rem(window, "mouseup",   xows_doc_scroll_onmouseup);
}

/**
 * Moves the element's scroll to the bottom of the scrollable content.
 *
 * @param   {element|object}  element  DOM element or object to adjust
 * @param   {boolean}         smooth   Perform smooth scroll (DOM element only)
 */
function xows_doc_scroll_todown(element, smooth)
{
  // Signal scroll was edited so next "onscroll" event must be ignored
  xows_doc_scroll_edit = true;

  if(smooth) {
    element.scrollTo({top:(element.scrollHeight - element.clientHeight),behavior:"smooth"});
  } else {
    element.scrollTop = (element.scrollHeight - element.clientHeight);
  }

  element.dataset.scrollbottom = 0;
}
